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
export const clientesFirestore = {
  obtener: async () => {
    const snapshot = await getDocs(collection(db, 'clientes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
export const pagosFirestore = {
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

    // Por ahora guardar foto como base64 para evitar problemas de Storage
    let fotoBase64 = null;
    if (pagoData.foto) {
      // Convertir File a base64
      const reader = new FileReader();
      fotoBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(pagoData.foto);
      });
    }

    const docRef = await addDoc(collection(db, 'pagos'), {
      clienteId: pagoData.clienteId,
      clienteNombre: pagoData.clienteNombre,
      monto: parseFloat(pagoData.monto),
      tipoPago: pagoData.tipoPago,
      ubicacion: pagoData.ubicacion,
      fotoBase64,
      empleadoId: user.uid,
      empleadoNombre: user.email,
      fechaRegistro: serverTimestamp(),
      estado: 'pendiente'
    });

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