#!/bin/bash

echo "🚀 Despliegue a Producción"
echo "========================="

# 1. Build optimizado
echo "📦 Creando build de producción..."
cd client
npm run build
cd ..

# 2. Configurar variables de producción
cat > .env.production << 'EOF'
NODE_ENV=production
REACT_APP_API_URL=https://tu-backend.railway.app/api
EOF

# 3. Subir a repositorio
echo "📤 Subiendo cambios..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

echo "✅ LISTO PARA PRODUCCIÓN"
echo "======================="
echo "🌐 Frontend: Se despliega automáticamente en Netlify"
echo "🔧 Backend: Se despliega automáticamente en Railway"
echo "📱 URL final: https://cocheras-tuempresa.netlify.app"
echo ""
echo "🔒 HTTPS automático = Cámara y GPS funcionan"