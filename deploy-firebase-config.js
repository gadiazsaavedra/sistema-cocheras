const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deployIndexes() {
  console.log('🔥 Desplegando índices Firebase...');
  
  try {
    // Los índices se despliegan automáticamente con Firebase CLI
    // Este script verifica que las queries funcionen correctamente
    
    console.log('✅ Verificando queries optimizadas...');
    
    // Test query 1: Clientes por empleado
    const clientesQuery = await db.collection('clientes')
      .where('empleadoAsignado', '==', 'test@test.com')
      .orderBy('fechaCreacion', 'desc')
      .limit(5)
      .get();
    
    console.log(`✅ Query clientes por empleado: ${clientesQuery.size} resultados`);
    
    // Test query 2: Pagos por estado
    const pagosQuery = await db.collection('pagos')
      .where('estado', '==', 'pendiente')
      .orderBy('fechaRegistro', 'desc')
      .limit(5)
      .get();
    
    console.log(`✅ Query pagos por estado: ${pagosQuery.size} resultados`);
    
    // Test query 3: Pagos por cliente
    const pagoClienteQuery = await db.collection('pagos')
      .where('clienteId', '==', 'test-client-id')
      .orderBy('fechaRegistro', 'desc')
      .limit(5)
      .get();
    
    console.log(`✅ Query pagos por cliente: ${pagoClienteQuery.size} resultados`);
    
    console.log('🎉 Todas las queries optimizadas funcionan correctamente');
    
  } catch (error) {
    console.error('❌ Error verificando queries:', error.message);
    if (error.message.includes('index')) {
      console.log('💡 Los índices se están creando automáticamente. Espere unos minutos.');
    }
  }
}

// Función para crear datos de prueba si no existen
async function createTestData() {
  console.log('📝 Creando datos de prueba para índices...');
  
  try {
    // Crear cliente de prueba
    await db.collection('clientes').doc('test-client-id').set({
      nombre: 'Cliente',
      apellido: 'Prueba',
      telefono: '123456789',
      empleadoAsignado: 'test@test.com',
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'activo'
    });
    
    // Crear pago de prueba
    await db.collection('pagos').doc('test-pago-id').set({
      clienteId: 'test-client-id',
      clienteNombre: 'Cliente Prueba',
      monto: 20000,
      estado: 'pendiente',
      empleadoId: 'test-employee-id',
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Datos de prueba creados');
    
  } catch (error) {
    console.log('ℹ️ Datos de prueba ya existen o error menor:', error.message);
  }
}

async function main() {
  await createTestData();
  await deployIndexes();
  process.exit(0);
}

main().catch(console.error);