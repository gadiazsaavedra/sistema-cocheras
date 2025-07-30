const admin = require('firebase-admin');
const MigrationSystem = require('./migration-system');

// Configurar Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function runMigrations() {
  console.log('🔄 Iniciando migraciones...');
  
  const migrationSystem = new MigrationSystem();
  
  try {
    await migrationSystem.runAllMigrations();
    console.log('✅ Todas las migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigrations();