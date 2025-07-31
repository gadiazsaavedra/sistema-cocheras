#!/bin/bash

echo "🆓 Despliegue Gratuito - GitHub Pages + Firebase"
echo "==============================================="

# 1. Instalar Firebase CLI si no existe
if ! command -v firebase &> /dev/null; then
    echo "📦 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

# 2. Build optimizado
echo "📦 Creando build..."
cd client
npm run build
cd ..

# 3. Configurar GitHub Pages
echo "🌐 Configurando GitHub Pages..."
cp -r client/build/* docs/
echo "cocheras-sistema.github.io" > docs/CNAME

# 4. Desplegar a Firebase Functions
echo "🔥 Desplegando backend a Firebase..."
firebase deploy --only functions

# 5. Subir a GitHub
echo "📤 Subiendo a GitHub..."
git add .
git commit -m "Deploy gratuito: $(date)"
git push origin main

echo ""
echo "✅ DESPLIEGUE GRATUITO COMPLETO"
echo "=============================="
echo "🌐 Frontend: https://tu-usuario.github.io/sistema-cocheras"
echo "🔥 Backend: https://tu-proyecto.web.app"
echo "💰 Costo: $0 (100% gratuito)"
echo "🔒 HTTPS: ✅ (cámara y GPS funcionan)"
echo ""
echo "📱 Comparte la URL con tus empleados"