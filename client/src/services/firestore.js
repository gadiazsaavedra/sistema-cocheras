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
  limit,
  startAfter,
  serverTimestamp,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { handleFirebaseIndexError } from '../utils/firebaseIndexes';
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
  obtener: async (opciones = {}) => {
    const { limite = 100, ultimoDoc = null, empleadoId = null } = opciones;
    
    let q = query(
      collection(db, 'clientes'),
      orderBy('fechaCreacion', 'desc'),
      limit(limite)
    );
    
    // Filtrar por empleado si se especifica
    if (empleadoId) {
      try {
        // Primero intentar buscar por empleadoAsignado (email)
        const user = auth.currentUser;
        const empleadoEmail = user?.email;
        
        q = query(
          collection(db, 'clientes'),
          where('empleadoAsignado', '==', empleadoEmail),
          orderBy('fechaCreacion', 'desc'),
          limit(limite)
        );
      } catch (error) {
        console.error('Error creando query de empleado:', error);
        // Fallback: obtener todos los clientes
        q = query(
          collection(db, 'clientes'),
          orderBy('fechaCreacion', 'desc'),
          limit(limite)
        );
      }
    }
    
    // Paginación
    if (ultimoDoc) {
      q = query(q, startAfter(ultimoDoc));
    }
    
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      datos: docs,
      ultimoDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hayMas: snapshot.docs.length === limite
    };
  },

  // Función para verificar duplicados
  verificarDuplicados: async (nombre, apellido, telefono, clienteId = null) => {
    try {
      // Query optimizada por teléfono
      const qTelefono = query(
        collection(db, 'clientes'),
        where('telefono', '==', telefono),
        limit(5)
      );
      const snapshotTelefono = await getDocs(qTelefono);
      const clientesTelefono = snapshotTelefono.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrar el cliente actual si estamos editando
      const clientesFiltrados = clienteId ? 
        clientesTelefono.filter(c => c.id !== clienteId) : 
        clientesTelefono;
      
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
      handleFirebaseIndexError(error);
      console.error('Error verificando duplicados');
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
      // Query optimizada por cliente
      const qCliente = query(
        collection(db, 'pagos'),
        where('clienteId', '==', clienteId),
        orderBy('fechaRegistro', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(qCliente);
      const pagosCliente = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
      console.error('Error verificando duplicados de pagos');
      return { pagosHoy: [], pagosRecientes: [], pagosMismoMonto: [], ultimosPagos: [] };
    }
  },

  obtener: async (filtros = {}) => {
    const { limite = 200, ultimoDoc = null, estado = null, empleadoId = null } = filtros;
    
    let q = query(
      collection(db, 'pagos'),
      orderBy('fechaRegistro', 'desc'),
      limit(limite)
    );
    
    // Filtros optimizados
    if (estado) {
      q = query(
        collection(db, 'pagos'),
        where('estado', '==', estado),
        orderBy('fechaRegistro', 'desc'),
        limit(limite)
      );
    }
    
    if (empleadoId) {
      q = query(
        collection(db, 'pagos'),
        where('empleadoId', '==', empleadoId),
        orderBy('fechaRegistro', 'desc'),
        limit(limite)
      );
    }
    
    // Paginación
    if (ultimoDoc) {
      q = query(q, startAfter(ultimoDoc));
    }
    
    const snapshot = await getDocs(q);
    const pagos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaRegistro: data.fechaRegistro?.toDate?.()?.toISOString() || data.fechaRegistro,
        fechaConfirmacion: data.fechaConfirmacion?.toDate?.()?.toISOString() || data.fechaConfirmacion
      };
    });
    
    return {
      datos: pagos,
      ultimoDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hayMas: snapshot.docs.length === limite
    };
  },

  crear: async (pagoData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar datos requeridos
      if (!pagoData.clienteId) {
        throw new Error('ID de cliente requerido');
      }
      
      if (!pagoData.monto || parseFloat(pagoData.monto) <= 0) {
        throw new Error('Monto inválido');
      }

      // Usar foto directamente como base64 si ya viene procesada
      let fotoBase64 = pagoData.fotoBase64 || pagoData.foto;
      
      // Si es un archivo, convertir a base64 simple
      if (pagoData.foto && typeof pagoData.foto === 'object' && pagoData.foto.constructor === File) {
        try {
          fotoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(pagoData.foto);
          });
        } catch (error) {
          console.warn('Error procesando foto, continuando sin foto');
          fotoBase64 = null;
        }
      }

      const pagoFirestore = {
        clienteId: pagoData.clienteId,
        clienteNombre: pagoData.clienteNombre || 'Cliente',
        monto: parseFloat(pagoData.monto),
        tipoPago: pagoData.tipoPago || 'efectivo',
        ubicacion: pagoData.ubicacion || { lat: 0, lng: 0, error: 'Sin GPS' },
        fotoBase64: fotoBase64,
        empleadoId: pagoData.empleadoId || user.uid,
        empleadoNombre: pagoData.empleadoNombre || user.email,
        fechaRegistro: serverTimestamp(),
        estado: 'pendiente'
      };

      console.log('Creando pago en Firestore...');
      const docRef = await addDoc(collection(db, 'pagos'), pagoFirestore);
      
      console.log('Pago creado con ID:', docRef.id);
      return { 
        id: docRef.id, 
        ...pagoFirestore,
        fechaRegistro: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error en pagosFirestore.crear:', error);
      
      // Mensajes de error más específicos
      if (error.code === 'permission-denied') {
        throw new Error('Sin permisos para crear pagos');
      } else if (error.code === 'unavailable') {
        throw new Error('Servicio no disponible. Verifique su conexión');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Error desconocido al crear pago');
      }
    }
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

// Constante con precios por defecto para evitar duplicación
const PRECIOS_DEFECTO = {
  moto: { diurna: { 'bajo techo': 15000, 'bajo carpa': 12000 }, nocturna: { 'bajo techo': 18000, 'bajo carpa': 15000 }, '24hs': { 'bajo techo': 25000, 'bajo carpa': 20000 } },
  auto: { diurna: { 'bajo techo': 20000, 'bajo carpa': 17000 }, nocturna: { 'bajo techo': 23000, 'bajo carpa': 20000 }, '24hs': { 'bajo techo': 35000, 'bajo carpa': 30000 } },
  camioneta: { diurna: { 'bajo techo': 25000, 'bajo carpa': 22000 }, nocturna: { 'bajo techo': 28000, 'bajo carpa': 25000 }, '24hs': { 'bajo techo': 40000, 'bajo carpa': 35000 } },
  furgon: { diurna: { 'bajo techo': 30000, 'bajo carpa': 27000 }, nocturna: { 'bajo techo': 33000, 'bajo carpa': 30000 }, '24hs': { 'bajo techo': 45000, 'bajo carpa': 40000 } },
  camion: { diurna: { 'bajo techo': 40000, 'bajo carpa': 35000 }, nocturna: { 'bajo techo': 45000, 'bajo carpa': 40000 }, '24hs': { 'bajo techo': 60000, 'bajo carpa': 55000 } },
  trailer: { diurna: { 'bajo techo': 50000, 'bajo carpa': 45000 }, nocturna: { 'bajo techo': 55000, 'bajo carpa': 50000 }, '24hs': { 'bajo techo': 75000, 'bajo carpa': 70000 } }
};

// CONFIGURACIÓN DE PRECIOS
export const preciosFirestore = {
  obtener: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'configuracion'));
      const configDoc = snapshot.docs.find(doc => doc.id === 'precios');
      
      if (configDoc) {
        return configDoc.data().tabla;
      }
      
      await preciosFirestore.guardar(PRECIOS_DEFECTO);
      return PRECIOS_DEFECTO;
    } catch (error) {
      console.error('Error obteniendo precios');
      return PRECIOS_DEFECTO;
    }
  },
  
  guardar: async (tablaPrecios) => {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'configuracion', 'precios'), {
      tabla: tablaPrecios,
      fechaActualizacion: serverTimestamp()
    });
    return tablaPrecios;
  },
  
  migrarDesdeLocalStorage: async () => {
    try {
      const preciosLocal = localStorage.getItem('tablaPreciosCocheras');
      if (preciosLocal) {
        const tabla = JSON.parse(preciosLocal);
        await preciosFirestore.guardar(tabla);
        // Precios migrados exitosamente
        return tabla;
      }
      return null;
    } catch (error) {
      console.error('Error migrando precios');
      return null;
    }
  }
};

// AUMENTOS DE PRECIOS
export const aumentosFirestore = {
  crear: async (aumentoData) => {
    const docRef = await addDoc(collection(db, 'aumentos'), {
      ...aumentoData,
      fechaCreacion: serverTimestamp()
    });
    return { id: docRef.id, ...aumentoData };
  },
  
  obtener: async (limite = 20) => {
    const q = query(
      collection(db, 'aumentos'), 
      orderBy('fechaCreacion', 'desc'),
      limit(limite)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate?.()?.toISOString() || doc.data().fechaCreacion
    }));
  }
};