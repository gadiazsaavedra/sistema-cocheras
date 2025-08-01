# 🚀 Deploy en Render (Backend) + Netlify (Frontend)

## 📋 Pasos para Deploy Completo

### 1. Backend en Render (GRATIS)

1. Ve a [render.com](https://render.com) y crea cuenta
2. Conecta tu repositorio GitHub: `gadiazsaavedra/sistema-cocheras`
3. Crear **Web Service** con estas configuraciones:
   - **Name**: `sistema-cocheras-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **Variables de Entorno** en Render:
   ```
   NODE_ENV=production
   PORT=10000
   ```

5. **Subir archivo Firebase**:
   - En Render Dashboard → Files
   - Subir `firebase-service-account.json`

### 2. Frontend en Netlify (GRATIS)

```bash
cd client
npm run build
# Arrastrar carpeta client/build a Netlify
```

### 3. URLs Finales

- **Frontend**: https://spiffy-flan-5a5eba.netlify.app
- **Backend**: https://sistema-cocheras-backend.onrender.com
- **Health Check**: https://sistema-cocheras-backend.onrender.com/api/health

## ✅ Sistema 100% Funcional

- ✅ Login empleados/admin
- ✅ Registro de pagos con foto
- ✅ Gestión de clientes
- ✅ Sistema de morosidad
- ✅ Botón limpiar historial
- ✅ Reportes y estadísticas
- ✅ Actualización en tiempo real

## 💰 Costos: $0 (100% GRATIS)

- Render Free: 750 horas/mes
- Netlify Free: 100GB ancho de banda
- Firebase Free: 1GB Firestore + 10GB Storage