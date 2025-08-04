// Versión offline de Firestore para evitar polling automático
let clientesCache = [];
let pagosCache = [];

// Simular datos para evitar Firebase completamente
export const clientesFirestore = {
  obtener: async (opciones = {}) => {
    const { empleadoId = null } = opciones;
    
    // Datos simulados para empleado
    const clientesSimulados = [
      {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1234567890',
        tipoVehiculo: 'auto',
        modalidadTiempo: 'diurna',
        modalidadTecho: 'bajo_techo',
        precio: 25000,
        empleadoAsignado: empleadoId,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo'
      },
      {
        id: '2',
        nombre: 'María',
        apellido: 'González',
        telefono: '0987654321',
        tipoVehiculo: 'moto',
        modalidadTiempo: 'nocturna',
        modalidadTecho: 'bajo_carpa',
        precio: 15000,
        empleadoAsignado: empleadoId,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo'
      }
    ];
    
    return {
      datos: clientesSimulados,
      ultimoDoc: null,
      hayMas: false
    };
  },

  crear: async (clienteData) => {
    const nuevoCliente = {
      id: Date.now().toString(),
      ...clienteData,
      fechaCreacion: new Date().toISOString(),
      estado: 'activo'
    };
    clientesCache.push(nuevoCliente);
    return nuevoCliente;
  },

  actualizar: async (id, clienteData) => {
    return { id, ...clienteData };
  },

  eliminar: async (id) => {
    return { success: true };
  }
};

export const pagosFirestore = {
  obtener: async (filtros = {}) => {
    const { empleadoId = null } = filtros;
    
    // Datos simulados de pagos
    const pagosSimulados = [
      {
        id: '1',
        clienteId: '1',
        clienteNombre: 'Juan Pérez',
        monto: 25000,
        tipoPago: 'efectivo',
        empleadoId: empleadoId,
        empleadoNombre: 'empleado@test.com',
        fechaRegistro: new Date().toISOString(),
        estado: 'pendiente'
      }
    ];
    
    return {
      datos: pagosSimulados,
      ultimoDoc: null,
      hayMas: false
    };
  },

  crear: async (pagoData) => {
    const nuevoPago = {
      id: Date.now().toString(),
      ...pagoData,
      fechaRegistro: new Date().toISOString(),
      estado: 'pendiente'
    };
    pagosCache.push(nuevoPago);
    
    // Simular éxito sin Firebase
    console.log('✅ Pago simulado creado (sin Firebase):', nuevoPago);
    return nuevoPago;
  },

  confirmar: async (id, accion) => {
    console.log(`✅ Pago simulado ${accion}do (sin Firebase)`);
    return { message: `Pago ${accion}do` };
  }
};

export const reportesFirestore = {
  clientes: async () => {
    return [];
  }
};

export const preciosFirestore = {
  obtener: async () => {
    return {
      moto: { diurna: { 'bajo_techo': 15000, 'bajo_carpa': 12000 } },
      auto: { diurna: { 'bajo_techo': 25000, 'bajo_carpa': 20000 } }
    };
  },
  
  guardar: async (tablaPrecios) => {
    return tablaPrecios;
  }
};

export const aumentosFirestore = {
  crear: async (aumentoData) => {
    return { id: Date.now().toString(), ...aumentoData };
  },
  
  obtener: async () => {
    return [];
  }
};