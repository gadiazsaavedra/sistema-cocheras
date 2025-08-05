const admin = require('firebase-admin');

// Configuración Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verificarObservaciones() {
  try {
    console.log('🔍 Buscando pagos de Nicolas Seigert...');
    
    // Buscar todos los pagos
    const pagosSnapshot = await db.collection('pagos').get();
    const pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Buscar pagos que contengan "Nicolas" o "Seigert"
    const pagosNicolas = pagos.filter(pago => 
      pago.clienteNombre && 
      (pago.clienteNombre.toLowerCase().includes('nicolas') || 
       pago.clienteNombre.toLowerCase().includes('seigert'))
    );
    
    console.log('📋 Pagos encontrados:', pagosNicolas.length);
    
    for (const pago of pagosNicolas) {
      console.log(`💰 Pago ID: ${pago.id}`);
      console.log(`👤 Cliente: ${pago.clienteNombre}`);
      console.log(`💵 Monto: ${pago.monto}`);
      console.log(`📝 Observaciones: ${pago.observaciones || 'SIN OBSERVACIONES'}`);
      console.log(`📅 Fecha: ${pago.fechaRegistro ? new Date(pago.fechaRegistro).toLocaleString() : 'Sin fecha'}`);
      console.log('---');
    }
    
    console.log('🎉 Verificación completada');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarObservaciones();