#!/bin/bash

echo "🔒 Configurando HTTPS Local para Cámara/GPS"
echo "=========================================="

# Crear certificados SSL locales
if [ ! -f "localhost.pem" ]; then
    echo "📜 Creando certificados SSL..."
    
    # Instalar mkcert si no existe
    if ! command -v mkcert &> /dev/null; then
        echo "📦 Instalando mkcert..."
        brew install mkcert
        mkcert -install
    fi
    
    # Crear certificados para localhost y tu IP
    mkcert localhost 192.168.1.66 127.0.0.1 ::1
    
    echo "✅ Certificados creados"
else
    echo "✅ Certificados ya existen"
fi

# Crear archivo .env para React
cat > client/.env.local << EOF
HTTPS=true
SSL_CRT_FILE=../localhost+3.pem
SSL_KEY_FILE=../localhost+3-key.pem
HOST=0.0.0.0
PORT=3001
EOF

echo "✅ Configuración HTTPS lista"
echo ""
echo "🚀 Para iniciar con HTTPS:"
echo "   ./run-https.sh"
echo ""
echo "📱 URLs de acceso:"
echo "   Mac:     https://localhost:3001"
echo "   Celular: https://192.168.1.66:3001"