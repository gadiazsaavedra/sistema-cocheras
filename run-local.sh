#!/bin/bash

echo "🏠 Sistema de Cocheras - Inicio Local"
echo "===================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Instala Node.js 16+"
    exit 1
fi

# Verificar archivo de configuración Firebase
if [ ! -f "firebase-service-account.json" ]; then
    echo "⚠️  firebase-service-account.json no encontrado"
    echo "   Descárgalo desde Firebase Console"
fi

# Limpiar procesos previos
echo "🧹 Limpiando procesos..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias backend..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Instalando dependencias frontend..."
    cd client && npm install && cd ..
fi

# Iniciar backend
echo "🚀 Iniciando backend (puerto 3000)..."
node server.js &
BACKEND_PID=$!
sleep 2

# Verificar que el backend esté corriendo
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Error iniciando backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando frontend (puerto 3001)..."
cd client
PORT=3001 HOST=0.0.0.0 npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ SISTEMA EJECUTÁNDOSE"
echo "========================"
echo "📱 App Principal: http://localhost:3001"
echo "🔧 API Backend:   http://localhost:3000"
echo ""
echo "👥 Credenciales de prueba:"
echo "   Admin: gadiazsaavedra@gmail.com"
echo "   Empleado: victor.cocheras@sistema.local / 123456"
echo ""
echo "Presiona Ctrl+C para detener"

# Cleanup al salir
trap 'echo "\n🛑 Deteniendo sistema..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Esperar
wait