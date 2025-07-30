#!/bin/bash

echo "🔥 Sistema de Cocheras"
echo "====================="

# Limpiar procesos previos
echo "🛑 Limpiando procesos..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null
sleep 2

# Backend
echo "🚀 Backend iniciando..."
node server.js &
BACKEND_PID=$!
sleep 2

# Frontend
echo "🎨 Frontend iniciando..."
cd client
PORT=3001 npm start &
FRONTEND_PID=$!

echo ""
echo "✅ SISTEMA LISTO"
echo "📱 App: http://localhost:3001"
echo "🔧 API: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener"

# Cleanup al salir
trap 'echo "\n🛑 Deteniendo..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Esperar
wait