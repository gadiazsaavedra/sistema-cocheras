#!/bin/bash

echo "🚀 Sistema de Despliegue Seguro - Cocheras"
echo "=========================================="

# 1. Crear backup antes del despliegue
echo "📦 Creando backup de seguridad..."
node -e "
const admin = require('firebase-admin');
const BackupSystem = require('./backup-system');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

(async () => {
  const backup = new BackupSystem();
  await backup.createBackup();
  console.log('✅ Backup completado');
  process.exit(0);
})();
"

# 2. Ejecutar migraciones
echo "🔄 Ejecutando migraciones de base de datos..."
node migrations/run-migrations.js

if [ $? -ne 0 ]; then
  echo "❌ Error en migraciones. Despliegue cancelado."
  exit 1
fi

# 3. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install
cd client && npm install && cd ..

# 4. Build del frontend
echo "🏗️ Construyendo frontend..."
cd client && npm run build && cd ..

# 5. Verificar que el servidor funciona
echo "🔍 Verificando servidor..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
  echo "✅ Servidor funcionando correctamente"
  kill $SERVER_PID
else
  echo "❌ Error en el servidor. Despliegue cancelado."
  exit 1
fi

echo "🎉 Despliegue completado exitosamente!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend: http://localhost:3000"