import { db, auth, storage } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// CLIENTES
// Función auxiliar para calcular distancia de Levenshtein
const calcularDistanciaLevenshtein = (str1, str2) => {
  const matriz = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matriz[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matriz[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matriz[i][j] = matriz[i - 1][j - 1];
      } else {
        matriz[i][j] = Math.min(
          matriz[i - 1][j - 1] + 1,
          matriz[i][j - 1] + 1,
          matriz[i - 1][j] + 1
        );
      }
    }
  }
  
  return matriz[str2.length][str1.length];
};

export const clientesFirestore = {
  obtener: async () => {
    const snapshot = await getDocs(collection(db, 'clientes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Función para verificar duplicados
  verificarDuplicados: async (nombre, apellido, telefono, clienteId = null) => {
    try {
      const todosClientes = await clientesFirestore.obtener();
      
      // Filtrar el cliente actual si estamos editando
      const clientesFiltrados = clienteId ? 
        todosClientes.filter(c => c.id !== clienteId) : 
        todosClientes;
      
      // Normalizar texto para comparación
      const normalizar = (texto) => {
        return texto?.toString().toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
          .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
          .trim();
      };
      
      const nombreNormalizado = normalizar(nombre);
      const apellidoNormalizado = normalizar(apellido);
      const nombreCompleto = `${nombreNormalizado} ${apellidoNormalizado}`;
      
      // Verificar teléfono exacto
      const duplicadoTelefono = clientesFiltrados.find(cliente => 
        cliente.telefono && telefono && 
        cliente.telefono.replace(/[^0-9]/g, '') === telefono.replace(/[^0-9]/g, '')
      );
      
      // Verificar nombre completo similar
      const duplicadosNombre = clientesFiltrados.filter(cliente => {
        const clienteNombreCompleto = `${normalizar(cliente.nombre)} ${normalizar(cliente.apellido)}`;
        return clienteNombreCompleto === nombreCompleto;
      });
      
      // Verificar nombres muy similares (diferencia de 1-2 caracteres)
      const similares = clientesFiltrados.filter(cliente => {
        const clienteNombreCompleto = `${normalizar(cliente.nombre)} ${normalizar(cliente.apellido)}`;
        
        // Calcular similitud simple
        const distancia = calcularDistanciaLevenshtein(nombreCompleto, clienteNombreCompleto);
        const longitudMaxima = Math.max(nombreCompleto.length, clienteNombreCompleto.length);
        const similitud = 1 - (distancia / longitudMaxima);
        
        return similitud > 0.8 && similitud < 1; // 80% similar pero no idéntico
      });
      
      return {
        duplicadoTelefono,
        duplicadosNombre,
        similares,
        hayDuplicados: !!duplicadoTelefono || duplicadosNombre.length > 0
      };
    } catch (error) {
      console.error('Error verificando duplicados:', error);
      return {
        duplicadoTelefono: null,
        duplicadosNombre: [],
        similares: [],
        hayDuplicados: false
      };
    }
  },

  crear: async (clienteData) => {
    const docRef = await addDoc(collection(db, 'clientes'), {
      ...clienteData,
      fechaCreacion: serverTimestamp(),
      estado: 'activo'
    });
    return { id: docRef.id, ...clienteData };
  },

  actualizar: async (id, clienteData) => {
    await updateDoc(doc(db, 'clientes', id), clienteData);
    return { id, ...clienteData };
  },

  eliminar: async (id) => {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'clientes', id));
    return { success: true };
  }
};

// PAGOS
// Función para comprimir imágenes
const comprimirImagen = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones (máximo 800px)
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a base64 con calidad reducida
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedBase64);
    };
    
    // Cargar imagen desde archivo
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const pagosFirestore = {
  // Función para verificar duplicados
  verificarDuplicados: async (clienteId, monto, fechaRegistro) => {
    try {
      const todosPagos = await pagosFirestore.obtener();
      const pagosCliente = todosPagos.filter(pago => pago.clienteId === clienteId);
      
      const hoy = new Date(fechaRegistro || new Date());
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
      
      // Verificar pagos del mismo día
      const pagosHoy = pagosCliente.filter(pago => {
        const fechaPago = new Date(pago.fechaRegistro);
        return fechaPago >= inicioHoy && fechaPago < finHoy;
      });
      
      // Verificar pagos recientes (últimos 7 días)
      const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
      const pagosRecientes = pagosCliente.filter(pago => {
        const fechaPago = new Date(pago.fechaRegistro);
        return fechaPago >= hace7Dias;
      });
      
      // Verificar mismo monto en últimos 30 días
      const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pagosMismoMonto = pagosCliente.filter(pago => {
        const fechaPago = new Date(pago.fechaRegistro);
        return fechaPago >= hace30Dias && parseFloat(pago.monto) === parseFloat(monto);
      });
      
      return {
        pagosHoy,
        pagosRecientes,
        pagosMismoMonto,
        ultimosPagos: pagosCliente.slice(0, 3).sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
      };
    } catch (error) {
      console.error('Error verificando duplicados:', error);
      return { pagosHoy: [], pagosRecientes: [], pagosMismoMonto: [], ultimosPagos: [] };
    }
  },

  obtener: async (filtros = {}) => {
    const snapshot = await getDocs(collection(db, 'pagos'));
    let pagos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaRegistro: data.fechaRegistro?.toDate?.()?.toISOString() || data.fechaRegistro,
        fechaConfirmacion: data.fechaConfirmacion?.toDate?.()?.toISOString() || data.fechaConfirmacion
      };
    });
    
    // Filtrar en memoria para evitar índices
    if (filtros.estado) {
      pagos = pagos.filter(pago => pago.estado === filtros.estado);
    }
    
    if (filtros.empleado) {
      pagos = pagos.filter(pago => pago.empleadoId === filtros.empleado);
    }
    
    // Ordenar por fecha
    pagos.sort((a, b) => {
      const fechaA = new Date(a.fechaRegistro || 0);
      const fechaB = new Date(b.fechaRegistro || 0);
      return fechaB - fechaA;
    });
    
    return pagos;
  },

  crear: async (pagoData) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    console.log('Creando pago:', pagoData);

    // Comprimir y guardar foto como base64
    let fotoBase64 = null;
    if (pagoData.foto) {
      try {
        fotoBase64 = await comprimirImagen(pagoData.foto);
      } catch (error) {
        console.error('Error procesando foto:', error);
        fotoBase64 = null;
      }
    }

    try {
      const docRef = await addDoc(collection(db, 'pagos'), {
        clienteId: pagoData.clienteId,
        clienteNombre: pagoData.clienteNombre,
        monto: parseFloat(pagoData.monto) || 0,
        tipoPago: pagoData.tipoPago || 'efectivo',
        ubicacion: pagoData.ubicacion || { lat: 0, lng: 0 },
        fotoBase64: fotoBase64 || null,
        empleadoId: user.uid,
        empleadoNombre: user.email,
        fechaRegistro: serverTimestamp(),
        estado: 'pendiente'
      });
      
      console.log('Pago creado exitosamente:', docRef.id);
      return { id: docRef.id, ...pagoData };
    } catch (firestoreError) {
      console.error('Error guardando en Firestore:', firestoreError);
      throw new Error('Error guardando pago: ' + firestoreError.message);
    }

    console.log('Pago creado:', docRef.id);
    return { id: docRef.id, ...pagoData };
  },

  confirmar: async (id, accion) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    await updateDoc(doc(db, 'pagos', id), {
      estado: accion === 'aprobar' ? 'confirmado' : 'rechazado',
      fechaConfirmacion: serverTimestamp(),
      confirmadoPor: user.uid
    });

    return { message: `Pago ${accion}do` };
  }
};

// REPORTES
export const reportesFirestore = {
  clientes: async (filtros = {}) => {
    const clientes = await clientesFirestore.obtener();
    const pagos = await pagosFirestore.obtener();
    
    return clientes.map(cliente => {
      const pagoReciente = pagos.find(p => 
        p.clienteId === cliente.id && p.estado === 'confirmado'
      );
      
      return {
        nombre: `${cliente.nombre} ${cliente.apellido}`,
        tipoCochera: `${cliente.tipoVehiculo} - ${cliente.modalidadTiempo}`,
        montoPagado: pagoReciente?.monto || null,
        fechaPago: pagoReciente?.fechaRegistro || null,
        estado: pagoReciente ? 'Al día' : 'Pendiente'
      };
    });
  }
};