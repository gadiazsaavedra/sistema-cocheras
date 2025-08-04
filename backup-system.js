const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Crear directorio de backups si no existe
const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para crear backup completo
async function createFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
  
  console.log(`🔄 Iniciando backup completo: ${timestamp}`);
  
  try {
    const backup = {
      timestamp,
      version: '1.0',
      collections: {}
    };
    
    // Colecciones a respaldar
    const collections = ['clientes', 'pagos', 'configuracion', 'aumentos'];
    
    for (const collectionName of collections) {
      console.log(`📦 Respaldando colección: ${collectionName}`);
      
      const snapshot = await db.collection(collectionName).get();
      backup.collections[collectionName] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Convertir timestamps a strings para JSON
        const processedData = processTimestamps(data);
        
        backup.collections[collectionName].push({
          id: doc.id,
          data: processedData
        });
      });
      
      console.log(`✅ ${collectionName}: ${backup.collections[collectionName].length} documentos`);
    }
    
    // Guardar backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    // Estadísticas
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Backup completado: ${backupFile}`);
    console.log(`📊 Tamaño: ${sizeMB} MB`);
    
    // Limpiar backups antiguos (mantener últimos 7)
    await cleanOldBackups();
    
    return {
      success: true,
      file: backupFile,
      size: sizeMB,
      collections: Object.keys(backup.collections).length,
      totalDocuments: Object.values(backup.collections).reduce((sum, docs) => sum + docs.length, 0)
    };
    
  } catch (error) {
    console.error('❌ Error creando backup:', error);
    return { success: false, error: error.message };
  }
}

// Función para restaurar backup
async function restoreBackup(backupFile) {
  console.log(`🔄 Restaurando backup: ${backupFile}`);
  
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error('Archivo de backup no encontrado');
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
      console.log(`📥 Restaurando colección: ${collectionName}`);
      
      const batch = db.batch();
      let batchCount = 0;
      
      for (const doc of documents) {
        const docRef = db.collection(collectionName).doc(doc.id);
        const processedData = restoreTimestamps(doc.data);
        batch.set(docRef, processedData);
        
        batchCount++;
        
        // Firestore batch limit is 500
        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ ${collectionName}: ${documents.length} documentos restaurados`);
    }
    
    console.log(`✅ Backup restaurado exitosamente`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error restaurando backup:', error);
    return { success: false, error: error.message };
  }
}

// Procesar timestamps para JSON
function processTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const processed = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value.toDate === 'function') {
      // Es un Firestore Timestamp
      processed[key] = {
        _timestamp: true,
        _seconds: value._seconds,
        _nanoseconds: value._nanoseconds
      };
    } else if (value && typeof value === 'object') {
      processed[key] = processTimestamps(value);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
}

// Restaurar timestamps desde JSON
function restoreTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const restored = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value && value._timestamp === true) {
      // Restaurar Firestore Timestamp
      restored[key] = admin.firestore.Timestamp.fromMillis(
        value._seconds * 1000 + Math.floor(value._nanoseconds / 1000000)
      );
    } else if (value && typeof value === 'object') {
      restored[key] = restoreTimestamps(value);
    } else {
      restored[key] = value;
    }
  }
  
  return restored;
}

// Limpiar backups antiguos
async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Mantener solo los últimos 7 backups
    const toDelete = files.slice(7);
    
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Backup antiguo eliminado: ${file.name}`);
    }
    
  } catch (error) {
    console.error('⚠️ Error limpiando backups antiguos:', error);
  }
}

// Listar backups disponibles
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          created: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return files;
  } catch (error) {
    console.error('Error listando backups:', error);
    return [];
  }
}

module.exports = {
  createFullBackup,
  restoreBackup,
  listBackups,
  cleanOldBackups
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      createFullBackup().then(result => {
        console.log('Resultado:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;
      
    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('❌ Especifica el archivo de backup');
        process.exit(1);
      }
      restoreBackup(backupFile).then(result => {
        console.log('Resultado:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;
      
    case 'list':
      const backups = listBackups();
      console.log('📋 Backups disponibles:');
      backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.name} (${backup.size}) - ${backup.created}`);
      });
      break;
      
    default:
      console.log(`
🔄 Sistema de Backup Firebase

Uso:
  node backup-system.js backup          # Crear backup completo
  node backup-system.js restore <file>  # Restaurar backup
  node backup-system.js list           # Listar backups

Ejemplos:
  node backup-system.js backup
  node backup-system.js restore backups/backup-2024-01-15T10-30-00-000Z.json
  node backup-system.js list
      `);
  }
}