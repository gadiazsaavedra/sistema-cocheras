# 🚀 Guía de Despliegue Seguro - Sistema de Cocheras

## Comandos Principales

### Despliegue Completo
```bash
npm run deploy
```

### Comandos Individuales
```bash
# Crear backup manual
npm run backup

# Ejecutar migraciones
npm run migrate

# Build del frontend
npm run build
```

## Proceso de Despliegue Seguro

### 1. Pre-Despliegue
- ✅ Backup automático de datos
- ✅ Verificación de dependencias
- ✅ Ejecución de migraciones

### 2. Durante el Despliegue
- ✅ Build del frontend
- ✅ Verificación del servidor
- ✅ Pruebas de conectividad

### 3. Post-Despliegue
- ✅ Confirmación de funcionamiento
- ✅ URLs de acceso mostradas

## Estructura de Backups

```
backups/
├── 2024-01-15T10-30-00-000Z/
│   ├── clientes.json
│   ├── pagos.json
│   └── system.json
```

## Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente y son:
- **Seguras**: No borran datos existentes
- **Versionadas**: Se ejecutan solo una vez
- **Reversibles**: Pueden deshacerse si es necesario

## Entornos

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## Monitoreo Post-Despliegue

Después de cada despliegue, verificar:
- [ ] Login de usuarios funciona
- [ ] Registro de pagos funciona
- [ ] Confirmación de pagos funciona
- [ ] Reportes se generan correctamente

## Rollback de Emergencia

Si algo falla:
1. Detener el servidor
2. Restaurar backup más reciente
3. Volver a versión anterior del código
4. Reiniciar sistema

## URLs de Producción
- **App Principal**: http://localhost:3001
- **API Backend**: http://localhost:3000