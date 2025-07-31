#!/bin/bash

echo "🔥 Desplegando a Firebase (Gratuito)"
echo "===================================="

# 1. Instalar Firebase CLI si no existe
if ! command -v firebase &> /dev/null; then
    echo "📦 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

# 2. Login a Firebase
echo "🔐 Iniciando sesión en Firebase..."
firebase login

# 3. Inicializar proyecto si no existe
if [ ! -f ".firebaserc" ]; then
    echo "🚀 Inicializando proyecto Firebase..."
    firebase init
fi

# 4. Instalar dependencias de Functions
echo "📦 Instalando dependencias..."
cd functions
npm install
cd ..

# 5. Build del frontend
echo "📦 Creando build optimizado..."
cd client
npm run build
cd ..

# 6. Desplegar todo
echo "🚀 Desplegando a Firebase..."
firebase deploy

echo ""
echo "✅ DESPLIEGUE COMPLETO"
echo "===================="
echo "🌐 Frontend: https://TU_PROJECT_ID.web.app"
echo "🔧 Backend: https://us-central1-TU_PROJECT_ID.cloudfunctions.net/api"
echo "💰 Costo: $0 (100% gratuito)"
echo "🔒 HTTPS: ✅ (cámara y GPS funcionan)"
echo ""
echo "📱 Comparte la URL con tus empleados"