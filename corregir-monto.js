const admin = require('firebase-admin');

// Configuración Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function corregirMonto() {
  try {
    console.log('🔍 Buscando pagos de Luis Martearena...');
    
    // Buscar todos los pagos
    const pagosSnapshot = await db.collection('pagos').get();
    const pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Buscar pagos que contengan "Luis" o "Martearena"
    const pagosLuis = pagos.filter(pago => 
      pago.clienteNombre && 
      (pago.clienteNombre.toLowerCase().includes('luis') || 
       pago.clienteNombre.toLowerCase().includes('martearena'))
    );
    
    console.log('📋 Pagos encontrados:', pagosLuis.length);
    
    for (const pago of pagosLuis) {
      console.log(`💰 Pago ID: ${pago.id}`);
      console.log(`👤 Cliente: ${pago.clienteNombre}`);
      console.log(`💵 Monto actual: ${pago.monto}`);
      console.log(`📅 Fecha: ${pago.fechaRegistro ? new Date(pago.fechaRegistro).toLocaleString() : 'Sin fecha'}`);
      
      // Si el monto es 49994, corregirlo a 50000
      if (pago.monto === 49994) {
        console.log('🔧 Corrigiendo monto de 49994 a 50000...');
        
        await db.collection('pagos').doc(pago.id).update({
          monto: 50000
        });
        
        console.log('✅ Monto corregido exitosamente');
      }
      
      console.log('---');
    }
    
    console.log('🎉 Proceso completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirMonto();