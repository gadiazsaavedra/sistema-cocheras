const express = require('express');
const { createFullBackup, restoreBackup, listBackups } = require('./backup-system');
const { manualBackup, getBackupStatus } = require('./backup-scheduler');
const path = require('path');

const router = express.Router();

// Middleware de autenticación para backups
const authenticateBackup = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // Aquí deberías validar el token de admin
  // Por ahora, verificación básica
  if (!token || token !== process.env.BACKUP_TOKEN) {
    return res.status(401).json({ error: 'No autorizado para operaciones de backup' });
  }
  
  next();
};

// GET /api/backup/status - Estado del sistema de backup
router.get('/status', authenticateBackup, (req, res) => {
  try {
    const status = getBackupStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado de backup',
      details: error.message
    });
  }
});

// GET /api/backup/list - Listar backups disponibles
router.get('/list', authenticateBackup, (req, res) => {
  try {
    const backups = listBackups();
    res.json({
      success: true,
      backups,
      count: backups.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error listando backups',
      details: error.message
    });
  }
});

// POST /api/backup/create - Crear backup manual
router.post('/create', authenticateBackup, async (req, res) => {
  try {
    console.log('🔄 Backup manual solicitado via API');
    
    const result = await manualBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        backup: {
          file: path.basename(result.file),
          size: result.size,
          collections: result.collections,
          documents: result.totalDocuments
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error creando backup',
        details: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno creando backup',
      details: error.message
    });
  }
});

// POST /api/backup/restore - Restaurar backup
router.post('/restore', authenticateBackup, async (req, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo de backup requerido'
      });
    }
    
    console.log(`🔄 Restauración solicitada via API: ${backupFile}`);
    
    // Construir ruta completa del backup
    const backupPath = path.join(__dirname, 'backups', backupFile);
    
    const result = await restoreBackup(backupPath);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restaurado exitosamente',
        backupFile
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error restaurando backup',
        details: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno restaurando backup',
      details: error.message
    });
  }
});

// GET /api/backup/download/:filename - Descargar backup
router.get('/download/:filename', authenticateBackup, (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'backups', filename);
    
    // Verificar que el archivo existe y es un backup válido
    if (!filename.startsWith('backup-') || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo de backup inválido'
      });
    }
    
    // Enviar archivo para descarga
    res.download(backupPath, filename, (err) => {
      if (err) {
        console.error('Error descargando backup:', err);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            error: 'Archivo de backup no encontrado'
          });
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error descargando backup',
      details: error.message
    });
  }
});

// DELETE /api/backup/:filename - Eliminar backup
router.delete('/:filename', authenticateBackup, (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'backups', filename);
    
    // Verificar que el archivo existe y es un backup válido
    if (!filename.startsWith('backup-') || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo de backup inválido'
      });
    }
    
    const fs = require('fs');
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo de backup no encontrado'
      });
    }
    
    fs.unlinkSync(backupPath);
    
    res.json({
      success: true,
      message: 'Backup eliminado exitosamente',
      filename
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error eliminando backup',
      details: error.message
    });
  }
});

module.exports = router;