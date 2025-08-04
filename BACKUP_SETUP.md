# 🔄 Sistema de Backup Automático - Configuración

## 🚀 **Sistema Implementado**

Tu sistema ahora tiene **backup automático completo** con:

### ✅ **Características**
- **Backup diario** a las 2:00 AM
- **Backup cada 6 horas** para mayor seguridad
- **Limpieza automática** (mantiene últimos 7 backups)
- **API REST** para gestión desde frontend
- **Notificaciones** de estado
- **Restauración completa** de datos

## 🛠️ **Comandos Disponibles**

### **Backup Manual**
```bash
npm run backup                # Crear backup ahora
npm run backup-list          # Ver backups disponibles
npm run backup-status        # Estado del sistema
```

### **Programador Automático**
```bash
npm run backup-scheduler     # Iniciar backups automáticos
npm run backup-manual        # Backup manual via scheduler
```

### **Restauración**
```bash
npm run backup-restore backups/backup-2024-01-15T10-30-00-000Z.json
```

## 🔧 **Configuración de Producción**

### **1. Variables de Entorno**
Agregar a tu servidor de producción:
```bash
BACKUP_TOKEN=tu-token-super-secreto-aqui
NODE_ENV=production
```

### **2. Iniciar Backup Automático**
En tu servidor de producción:
```bash
# Opción 1: PM2 (recomendado)
pm2 start backup-scheduler.js --name "backup-scheduler"

# Opción 2: Screen/tmux
screen -S backup
npm run backup-scheduler

# Opción 3: Systemd service
sudo systemctl enable backup-cocheras
sudo systemctl start backup-cocheras
```

## 📊 **API Endpoints**

### **GET /api/backup/status**
```json
{
  "success": true,
  "status": {
    "status": "healthy",
    "lastBackup": "2024-01-15T02:00:00.000Z",
    "hoursSince": 2.5
  }
}
```

### **POST /api/backup/create**
```json
{
  "success": true,
  "backup": {
    "file": "backup-2024-01-15T10-30-00-000Z.json",
    "size": "2.5 MB",
    "collections": 4,
    "documents": 1250
  }
}
```

### **GET /api/backup/list**
```json
{
  "success": true,
  "backups": [
    {
      "name": "backup-2024-01-15T02-00-00-000Z.json",
      "size": "2.5 MB",
      "created": "2024-01-15T02:00:00.000Z"
    }
  ]
}
```

## 🔒 **Seguridad**

- **Token de autenticación** requerido
- **Solo administradores** pueden gestionar backups
- **Archivos encriptados** (opcional)
- **Logs de auditoría** completos

## 📁 **Estructura de Backup**

```json
{
  "timestamp": "2024-01-15T02:00:00.000Z",
  "version": "1.0",
  "collections": {
    "clientes": [
      {
        "id": "cliente123",
        "data": { "nombre": "Juan", "apellido": "Pérez" }
      }
    ],
    "pagos": [...],
    "configuracion": [...],
    "aumentos": [...]
  }
}
```

## 🚨 **Monitoreo**

### **Logs de Backup**
```bash
tail -f backup-logs.json     # Ver logs en tiempo real
```

### **Alertas Automáticas**
- ✅ Backup exitoso
- ❌ Error en backup
- ⚠️ Backup no ejecutado en 24h

## 🎯 **Próximos Pasos**

1. **Configurar variables de entorno** en producción
2. **Iniciar backup scheduler** en servidor
3. **Probar restauración** con datos de prueba
4. **Configurar alertas** (email/Slack)

## 📞 **Soporte**

Si necesitas ayuda:
1. Revisar logs: `backup-logs.json`
2. Estado del sistema: `npm run backup-status`
3. Backup manual: `npm run backup`

**Tu sistema ahora es enterprise-grade con backup automático completo.**