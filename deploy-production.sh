#!/bin/bash

echo "🚀 DESPLIEGUE A PRODUCCIÓN - GitHub Pages"
echo "========================================"

# 1. Crear backup de la rama actual
echo "📦 Creando backup de desarrollo..."
git branch backup-dev-$(date +%Y%m%d-%H%M%S)

# 2. Crear build optimizado
echo "🔨 Creando build de producción..."
cd client
npm run build
cd ..

# 3. Copiar a docs (GitHub Pages)
echo "📁 Copiando archivos a docs/..."
cp -r client/build/* docs/

# 4. Commit solo de producción
echo "💾 Guardando cambios de producción..."
git add docs/
git add client/build/
git commit -m "🚀 Deploy producción v$(date +%Y%m%d-%H%M%S)"

# 5. Push a GitHub
echo "📤 Subiendo a GitHub..."
git push origin main

echo ""
echo "✅ DESPLIEGUE COMPLETADO"
echo "======================="
echo "🌐 URL Producción: https://tu-usuario.github.io/sistema-cocheras"
echo "🔒 Datos seguros: Firestore mantiene todos los datos"
echo "💻 Desarrollo: Continúa trabajando en local"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Configura GitHub Pages en Settings → Pages"
echo "2. Source: Deploy from branch → main → /docs"
echo "3. Comparte la URL con tus empleados"