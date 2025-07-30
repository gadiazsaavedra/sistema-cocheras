const admin = require('firebase-admin');

// Configurar Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const empleados = [
  { email: 'victor.cocheras@sistema.local', password: '123456', nombre: 'Victor' },
  { email: 'raul.cocheras@sistema.local', password: '123456', nombre: 'Raul' },
  { email: 'carlos.cocheras@sistema.local', password: '123456', nombre: 'Carlos' },
  { email: 'fernando.cocheras@sistema.local', password: '123456', nombre: 'Fernando' }
];

async function crearEmpleados() {
  console.log('🔧 Creando usuarios empleados...');
  
  for (const empleado of empleados) {
    try {
      const userRecord = await admin.auth().createUser({
        email: empleado.email,
        password: empleado.password,
        displayName: empleado.nombre,
        emailVerified: true
      });
      
      await admin.auth().setCustomUserClaims(userRecord.uid, { 
        role: 'empleado',
        nombre: empleado.nombre 
      });
      
      console.log(`✅ ${empleado.nombre}: ${empleado.email} / ${empleado.password}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  ${empleado.nombre}: Ya existe`);
      } else {
        console.error(`❌ Error creando ${empleado.nombre}:`, error.message);
      }
    }
  }
  
  console.log('\n📋 CREDENCIALES DE EMPLEADOS:');
  console.log('================================');
  empleados.forEach(emp => {
    console.log(`${emp.nombre}: ${emp.email} / ${emp.password}`);
  });
  
  process.exit(0);
}

crearEmpleados();