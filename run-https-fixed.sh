#!/bin/bash

echo "🔒 Sistema HTTPS para Cámara Real"
echo "================================"

# Limpiar procesos y caché
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
rm -rf client/node_modules/.cache client/build
sleep 2

# Crear .env para HTTPS
cat > client/.env.local << 'EOF'
HTTPS=true
SSL_CRT_FILE=../localhost+3.pem
SSL_KEY_FILE=../localhost+3-key.pem
HOST=0.0.0.0
PORT=3001
EOF

# Iniciar backend HTTP con CORS permisivo
echo "🚀 Iniciando backend HTTP (puerto 3000)..."
CORS_ORIGIN="https://192.168.1.66:3001,https://localhost:3001" node server.js &
BACKEND_PID=$!
sleep 3

# Iniciar frontend HTTPS
echo "🔒 Iniciando frontend HTTPS (puerto 3001)..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ SISTEMA HTTPS LISTO"
echo "====================="
echo "🔒 Mac:     https://localhost:3001"
echo "🔒 Celular: https://192.168.1.66:3001"
echo ""
echo "📱 INSTRUCCIONES PARA CELULAR:"
echo "1. Ve a https://192.168.1.66:3001"
echo "2. Acepta certificado (Avanzado → Continuar)"
echo "3. Login como Victor"
echo "4. Permite cámara y ubicación cuando lo pida"
echo ""
echo "Presiona Ctrl+C para detener"

trap 'echo "\n🛑 Deteniendo..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait