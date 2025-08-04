const cron = require('node-cron');
const { createFullBackup } = require('./backup-system');

// Configuración de horarios
const BACKUP_SCHEDULES = {
  // Backup diario a las 2:00 AM
  daily: '0 2 * * *',
  
  // Backup cada 6 horas
  frequent: '0 */6 * * *',
  
  // Backup semanal (domingos a las 1:00 AM)
  weekly: '0 1 * * 0'
};

// Función para enviar notificaciones (email, webhook, etc.)
async function sendNotification(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  
  console.log(`📧 [${timestamp}] ${type.toUpperCase()}: ${message}`);
  
  // Aquí puedes agregar integración con:
  // - Email (nodemailer)
  // - Slack webhook
  // - Discord webhook
  // - SMS (Twilio)
  
  // Ejemplo básico de log
  const logEntry = {
    timestamp,
    type,
    message,
    data
  };
  
  // Guardar en log file
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, 'backup-logs.json');
  
  let logs = [];
  if (fs.existsSync(logFile)) {
    logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  }
  
  logs.push(logEntry);
  
  // Mantener solo últimos 100 logs
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
  
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

// Función principal de backup programado
async function scheduledBackup(type = 'manual') {
  console.log(`🔄 Iniciando backup programado (${type})`);
  
  try {
    const result = await createFullBackup();
    
    if (result.success) {
      const message = `Backup ${type} completado exitosamente`;
      await sendNotification('success', message, {
        file: result.file,
        size: result.size,
        collections: result.collections,
        documents: result.totalDocuments
      });
      
      console.log(`✅ ${message}`);
    } else {
      const message = `Error en backup ${type}: ${result.error}`;
      await sendNotification('error', message, result);
      
      console.error(`❌ ${message}`);
    }
    
    return result;
    
  } catch (error) {
    const message = `Error crítico en backup ${type}: ${error.message}`;
    await sendNotification('critical', message, { error: error.stack });
    
    console.error(`💥 ${message}`);
    return { success: false, error: error.message };
  }
}

// Configurar tareas programadas
function startScheduler() {
  console.log('🕐 Iniciando programador de backups...');
  
  // Backup diario a las 2:00 AM
  cron.schedule(BACKUP_SCHEDULES.daily, () => {
    scheduledBackup('daily');
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
  
  // Backup frecuente cada 6 horas
  cron.schedule(BACKUP_SCHEDULES.frequent, () => {
    scheduledBackup('frequent');
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
  
  console.log('✅ Programador de backups iniciado');
  console.log('📅 Backup diario: 2:00 AM');
  console.log('📅 Backup frecuente: cada 6 horas');
  
  // Enviar notificación de inicio
  sendNotification('info', 'Sistema de backup automático iniciado');
}

// Función para backup manual
async function manualBackup() {
  console.log('🔄 Ejecutando backup manual...');
  return await scheduledBackup('manual');
}

// Función para obtener estado del sistema
function getBackupStatus() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const logFile = path.join(__dirname, 'backup-logs.json');
    
    if (!fs.existsSync(logFile)) {
      return { status: 'no_logs', message: 'No hay logs de backup disponibles' };
    }
    
    const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    const lastLog = logs[logs.length - 1];
    
    if (!lastLog) {
      return { status: 'no_logs', message: 'No hay logs de backup' };
    }
    
    const lastBackupTime = new Date(lastLog.timestamp);
    const now = new Date();
    const hoursSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60);
    
    return {
      status: lastLog.type === 'success' ? 'healthy' : 'error',
      lastBackup: lastLog.timestamp,
      hoursSince: Math.round(hoursSinceLastBackup * 100) / 100,
      lastResult: lastLog,
      totalLogs: logs.length
    };
    
  } catch (error) {
    return { 
      status: 'error', 
      message: 'Error obteniendo estado de backup',
      error: error.message 
    };
  }
}

module.exports = {
  startScheduler,
  manualBackup,
  scheduledBackup,
  getBackupStatus,
  sendNotification
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      startScheduler();
      // Mantener el proceso corriendo
      process.on('SIGINT', () => {
        console.log('\n🛑 Deteniendo programador de backups...');
        process.exit(0);
      });
      break;
      
    case 'manual':
      manualBackup().then(result => {
        console.log('Resultado:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;
      
    case 'status':
      const status = getBackupStatus();
      console.log('📊 Estado del sistema de backup:');
      console.log(JSON.stringify(status, null, 2));
      break;
      
    default:
      console.log(`
🔄 Programador de Backups

Uso:
  node backup-scheduler.js start    # Iniciar programador automático
  node backup-scheduler.js manual   # Ejecutar backup manual
  node backup-scheduler.js status   # Ver estado del sistema

El programador ejecuta:
  - Backup diario a las 2:00 AM
  - Backup cada 6 horas
  - Limpieza automática (mantiene últimos 7)
  - Notificaciones de estado
      `);
  }
}