const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const clientesPrueba = [
  {
    nombre: 'Juan Pérez',
    numeroCochera: 'A-001',
    modalidadTiempo: 'Diurna',
    modalidadTecho: 'Bajo techo',
    precio: 15000,
    telefono: '11-1234-5678',
    vehiculo: 'Auto',
    estado: 'activo'
  },
  {
    nombre: 'María García',
    numeroCochera: 'B-002',
    modalidadTiempo: 'Nocturna',
    modalidadTecho: 'Bajo carpa',
    precio: 12000,
    telefono: '11-8765-4321',
    vehiculo: 'Moto',
    estado: 'activo'
  },
  {
    nombre: 'Carlos López',
    numeroCochera: 'C-003',
    modalidadTiempo: '24hs',
    modalidadTecho: 'Bajo techo',
    precio: 20000,
    telefono: '11-5555-6666',
    vehiculo: 'Camioneta',
    estado: 'activo'
  }
];

async function crearClientes() {
  console.log('🏠 Creando clientes de prueba...\n');
  
  try {
    for (const cliente of clientesPrueba) {
      const clienteData = {
        ...cliente,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaVencimiento: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('clientes').add(clienteData);
      console.log(`✅ ${cliente.nombre} - Cochera: ${cliente.numeroCochera}`);
    }
    
    console.log('\n🎉 Clientes creados exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando clientes:', error);
    process.exit(1);
  }
}

crearClientes();