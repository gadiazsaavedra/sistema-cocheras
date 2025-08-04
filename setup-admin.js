const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'sistema-cocheras'
});

async function createAdminUser() {
  try {
    // Crear usuario administrador
    const userRecord = await admin.auth().createUser({
      email: 'gadiazsaavedra@gmail.com',
      password: 'playa123',
      displayName: 'Administrador Principal',
      emailVerified: true
    });

    console.log('✅ Usuario administrador creado:', userRecord.uid);
    
    // Crear usuario co-administrador
    const coAdminRecord = await admin.auth().createUser({
      email: 'c.andrea.lopez@hotmail.com', 
      password: 'playa123',
      displayName: 'Co-Administrador',
      emailVerified: true
    });

    console.log('✅ Usuario co-administrador creado:', coAdminRecord.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Usuario ya existe, intentando actualizar contraseña...');
      
      // Actualizar contraseña si el usuario ya existe
      const user = await admin.auth().getUserByEmail('gadiazsaavedra@gmail.com');
      await admin.auth().updateUser(user.uid, {
        password: 'playa123'
      });
      
      console.log('✅ Contraseña actualizada para:', user.email);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  process.exit(0);
}

createAdminUser();