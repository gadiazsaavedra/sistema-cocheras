#!/bin/bash

echo "🛑 Deteniendo Sistema de Cocheras..."

# Matar todos los procesos relacionados
pkill -f "node server.js"
pkill -f "react-scripts start"
pkill -f "npm start"

echo "✅ Sistema detenido completamente"