#!/bin/bash

echo "🔒 Sistema de Cocheras - HTTPS Local"
echo "==================================="

# Verificar certificados (pueden tener nombres diferentes)
if [ ! -f "localhost.pem" ] && [ ! -f "localhost+3.pem" ]; then
    echo "❌ Certificados no encontrados. Ejecuta: ./setup-https.sh"
    exit 1
fi

# Usar el certificado que existe
if [ -f "localhost+3.pem" ]; then
    CERT_FILE="localhost+3.pem"
    KEY_FILE="localhost+3-key.pem"
else
    CERT_FILE="localhost.pem"
    KEY_FILE="localhost-key.pem"
fi

# Limpiar procesos previos
echo "🧹 Limpiando procesos..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Iniciar backend HTTP (mixed content permitido en desarrollo)
echo "🚀 Iniciando backend HTTP (puerto 3000)..."
node server.js &
BACKEND_PID=$!
sleep 2

# Iniciar frontend con HTTPS
echo "🔒 Iniciando frontend HTTPS (puerto 3001)..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ SISTEMA HTTPS EJECUTÁNDOSE"
echo "============================="
echo "🔒 App Principal: https://localhost:3001"
echo "🔒 Red Celular:   https://192.168.1.66:3001"
echo "🔧 API Backend:   http://localhost:3000"
echo ""
echo "📱 Ahora la cámara y GPS funcionarán en celular"
echo ""
echo "Presiona Ctrl+C para detener"

# Cleanup al salir
trap 'echo "\n🛑 Deteniendo sistema..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Esperar
wait