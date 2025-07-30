const admin = require('firebase-admin');

class MigrationSystem {
  constructor() {
    this.db = admin.firestore();
  }

  async getCurrentVersion() {
    try {
      const doc = await this.db.collection('system').doc('version').get();
      return doc.exists ? doc.data().version : 0;
    } catch (error) {
      return 0;
    }
  }

  async setVersion(version) {
    await this.db.collection('system').doc('version').set({ 
      version, 
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
  }

  async runMigration(migrationNumber, migrationFunction) {
    const currentVersion = await this.getCurrentVersion();
    
    if (currentVersion >= migrationNumber) {
      console.log(`Migration ${migrationNumber} already applied`);
      return;
    }

    console.log(`Running migration ${migrationNumber}...`);
    
    try {
      await migrationFunction(this.db);
      await this.setVersion(migrationNumber);
      console.log(`Migration ${migrationNumber} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migrationNumber} failed:`, error);
      throw error;
    }
  }

  async runAllMigrations() {
    // Migration 1: Agregar campos de fecha a clientes existentes
    await this.runMigration(1, async (db) => {
      const clientesSnapshot = await db.collection('clientes').get();
      const batch = db.batch();
      
      clientesSnapshot.docs.forEach(doc => {
        const cliente = doc.data();
        if (!cliente.fechaIngreso) {
          batch.update(doc.ref, {
            fechaIngreso: new Date().toISOString(),
            diasVencimiento: 30,
            fechaProximoVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      });
      
      await batch.commit();
    });

    // Migration 2: Agregar empleado asignado a clientes existentes
    await this.runMigration(2, async (db) => {
      const clientesSnapshot = await db.collection('clientes').get();
      const batch = db.batch();
      
      clientesSnapshot.docs.forEach(doc => {
        const cliente = doc.data();
        if (!cliente.empleadoAsignado) {
          batch.update(doc.ref, {
            empleadoAsignado: ''
          });
        }
      });
      
      await batch.commit();
    });
  }
}

module.exports = MigrationSystem;