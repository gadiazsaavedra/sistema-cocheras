const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class BackupSystem {
  constructor() {
    this.db = admin.firestore();
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `./backups/${timestamp}`;
    
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
    }
    fs.mkdirSync(backupDir);

    console.log(`📦 Creando backup: ${timestamp}`);

    // Backup clientes
    const clientesSnapshot = await this.db.collection('clientes').get();
    const clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    fs.writeFileSync(path.join(backupDir, 'clientes.json'), JSON.stringify(clientes, null, 2));

    // Backup pagos
    const pagosSnapshot = await this.db.collection('pagos').get();
    const pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    fs.writeFileSync(path.join(backupDir, 'pagos.json'), JSON.stringify(pagos, null, 2));

    // Backup configuración
    const configSnapshot = await this.db.collection('system').get();
    const config = configSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    fs.writeFileSync(path.join(backupDir, 'system.json'), JSON.stringify(config, null, 2));

    console.log(`✅ Backup completado: ${backupDir}`);
    return backupDir;
  }

  async restoreBackup(backupPath) {
    console.log(`🔄 Restaurando backup: ${backupPath}`);
    
    // Restaurar clientes
    if (fs.existsSync(path.join(backupPath, 'clientes.json'))) {
      const clientes = JSON.parse(fs.readFileSync(path.join(backupPath, 'clientes.json')));
      const batch = this.db.batch();
      
      clientes.forEach(cliente => {
        const { id, ...data } = cliente;
        batch.set(this.db.collection('clientes').doc(id), data);
      });
      
      await batch.commit();
      console.log('✅ Clientes restaurados');
    }

    console.log('✅ Backup restaurado exitosamente');
  }
}

module.exports = BackupSystem;