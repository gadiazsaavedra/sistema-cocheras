# 📁 Configuración OneDrive para Sistema Cocheras

## ⚠️ IMPORTANTE: Configurar ANTES de mover a OneDrive

### 1. Carpetas a EXCLUIR de sincronización OneDrive:

**Clic derecho en cada carpeta → "Liberar espacio" o "No sincronizar":**

```
sistema-cocheras/
├── node_modules/           ❌ EXCLUIR (100k+ archivos)
├── client/node_modules/    ❌ EXCLUIR (100k+ archivos)  
├── client/build/           ❌ EXCLUIR (archivos generados)
├── uploads/                ❌ EXCLUIR (fotos de pagos)
├── backups/                ❌ EXCLUIR (archivos temporales)
├── .git/                   ❌ EXCLUIR (historial git)
└── .netlify/               ❌ EXCLUIR (cache netlify)
```

### 2. Archivos importantes que SÍ se sincronizan:

```
✅ package.json
✅ server.js  
✅ netlify.toml
✅ client/src/ (todo el código)
✅ client/public/
✅ client/package.json
✅ README.md
✅ migrations/
✅ email-notifications.js
```

### 3. Pasos para mover:

1. **ANTES de mover**: Configura exclusiones en OneDrive
2. **Mueve** la carpeta sistema-cocheras a OneDrive
3. **Después de mover**: Ejecuta en la nueva ubicación:
   ```bash
   npm install
   cd client && npm install
   ```

### 4. Verificar que funciona:

```bash
# En la nueva ubicación OneDrive
npm start          # Backend
cd client && npm start  # Frontend
```

### 5. Git seguirá funcionando normal:

```bash
git add .
git commit -m "mensaje"
git push origin main
```

## 🎯 Beneficios:

- ✅ Backup automático del código
- ✅ Acceso desde múltiples PCs
- ✅ Historial de versiones OneDrive
- ✅ Sincronización solo de archivos necesarios
- ✅ Git y desarrollo funcionan igual

## ⚡ Tamaño optimizado:

- **Sin exclusiones**: ~500MB + 200k archivos
- **Con exclusiones**: ~50MB + 2k archivos