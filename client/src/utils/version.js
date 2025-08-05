// Sistema de versionado
export const VERSION = "1.0.18";
export const BUILD_DATE = process.env.REACT_APP_BUILD_DATE || new Date().toISOString().split('T')[0];
export const VERSION_INFO = {
  version: VERSION,
  buildDate: BUILD_DATE,
  changelog: {
    "1.0.1": [
      "✅ Sistema de notificaciones por email implementado",
      "🔧 Optimización de Firebase polling",
      "📱 Mejoras en interfaz móvil",
      "⚡ Fecha de build automática implementada",
      "🔢 Auto-incremento de versión implementado"
    ],
    "1.0.0": [
      "🎉 Lanzamiento inicial del sistema",
      "👥 Gestión completa de clientes y empleados", 
      "💰 Sistema de pagos con anti-fraude",
      "📊 Dashboard y reportes"
    ]
  }
};

export const getVersionDisplay = () => {
  return `v${VERSION} (${BUILD_DATE})`;
};