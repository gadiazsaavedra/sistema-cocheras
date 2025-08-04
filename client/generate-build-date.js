// Script para generar fecha de build y auto-incrementar versión
const fs = require('fs');
const path = require('path');

const buildDate = new Date().toISOString().split('T')[0];
const envPath = path.join(__dirname, '.env.local');
const versionPath = path.join(__dirname, 'src', 'utils', 'version.js');

// Leer versión actual
let versionContent = fs.readFileSync(versionPath, 'utf8');
const versionMatch = versionContent.match(/export const VERSION = "([^"]+)";/);

if (versionMatch) {
  const currentVersion = versionMatch[1];
  const versionParts = currentVersion.split('.');
  
  // Incrementar el último número (patch version)
  const major = parseInt(versionParts[0]);
  const minor = parseInt(versionParts[1]);
  const patch = parseInt(versionParts[2]) + 1;
  
  const newVersion = `${major}.${minor}.${patch}`;
  
  // Actualizar version.js
  versionContent = versionContent.replace(
    /export const VERSION = "[^"]+";/,
    `export const VERSION = "${newVersion}";`
  );
  
  fs.writeFileSync(versionPath, versionContent);
  console.log(`🔢 Versión incrementada: ${currentVersion} → ${newVersion}`);
}

// Crear o actualizar .env.local con la fecha de build
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Remover línea existente de BUILD_DATE si existe
envContent = envContent.replace(/^REACT_APP_BUILD_DATE=.*$/m, '');

// Agregar nueva fecha de build
envContent = envContent.trim() + `\nREACT_APP_BUILD_DATE=${buildDate}\n`;

fs.writeFileSync(envPath, envContent);
console.log(`✅ Fecha de build generada: ${buildDate}`);