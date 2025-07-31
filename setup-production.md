# 🚀 Setup Producción en 30 Minutos

## 1. Netlify (Frontend)
1. Conectar GitHub repo
2. Build: `cd client && npm run build`
3. Publish: `client/build`
4. ✅ HTTPS automático

## 2. Railway (Backend)
1. Conectar GitHub repo
2. Variables: `FIREBASE_PROJECT_ID`
3. ✅ HTTPS automático

## 3. Dominio Personalizado (Opcional)
- Comprar: cocheras-tuempresa.com
- Apuntar a Netlify
- SSL automático

## 4. Configurar Empleados
```
URL Producción: https://cocheras-tuempresa.netlify.app
- Instalar como PWA
- Permitir cámara/GPS
- ✅ Funciona como app nativa
```

## 5. Desarrollo Paralelo
```bash
# Rama producción
git checkout -b production
git push origin production

# Rama desarrollo  
git checkout -b development
# Hacer cambios aquí
# Merge a production cuando esté listo
```

**Costo Total: ~$10/mes**
**Tiempo Setup: 30 minutos**
**Resultado: App profesional con HTTPS**