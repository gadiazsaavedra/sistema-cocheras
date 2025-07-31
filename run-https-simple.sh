#!/bin/bash

echo "🔒 Sistema HTTPS Simple (sin certificados)"
echo "========================================="

# Limpiar procesos previos
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 1

# Crear .env temporal para HTTPS
cat > client/.env.local << EOF
HTTPS=true
HOST=0.0.0.0
PORT=3001
EOF

# Iniciar backend
echo "🚀 Iniciando backend..."
node server.js &
BACKEND_PID=$!
sleep 2

# Iniciar frontend con HTTPS
echo "🔒 Iniciando frontend HTTPS..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ SISTEMA HTTPS EJECUTÁNDOSE"
echo "🔒 Celular: https://192.168.1.66:3001"
echo "⚠️  Acepta el certificado auto-firmado"
echo ""
echo "Presiona Ctrl+C para detener"

trap 'echo "\n🛑 Deteniendo..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait