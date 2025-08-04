const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Configuración de Sentry para backend
function initSentryBackend() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://your-sentry-dsn-here',
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      nodeProfilingIntegration(),
    ],
    
    // Filtros para evitar spam
    beforeSend(event) {
      // No enviar errores de desarrollo
      if (process.env.NODE_ENV !== 'production') {
        console.log('Sentry Event (dev):', event.exception?.values?.[0]?.value);
        return null;
      }
      
      // Filtrar errores conocidos/irrelevantes
      const errorMessage = event.exception?.values?.[0]?.value || '';
      
      if (errorMessage.includes('ECONNRESET') || 
          errorMessage.includes('socket hang up') ||
          errorMessage.includes('Request timeout')) {
        return null; // No enviar errores de red temporales
      }
      
      return event;
    }
  });
  
  console.log('✅ Sentry backend inicializado');
}

// Middleware para capturar errores de Express
function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Solo manejar errores 4xx y 5xx
      return error.status >= 400;
    }
  });
}

// Middleware para requests
function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email'],
    request: ['method', 'url', 'headers'],
    serverName: false
  });
}

// Función para capturar errores personalizados
function captureError(error, context = {}) {
  Sentry.withScope((scope) => {
    // Agregar contexto adicional
    Object.keys(context).forEach(key => {
      scope.setTag(key, context[key]);
    });
    
    // Capturar el error
    Sentry.captureException(error);
  });
  
  // También log local para desarrollo
  console.error('Error capturado:', error.message, context);
}

// Función para capturar mensajes informativos
function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    
    Object.keys(context).forEach(key => {
      scope.setTag(key, context[key]);
    });
    
    Sentry.captureMessage(message);
  });
}

// Función para monitorear performance
function startTransaction(name, operation = 'http') {
  return Sentry.startTransaction({
    name,
    op: operation
  });
}

// Configurar usuario para tracking
function setUser(user) {
  Sentry.setUser({
    id: user.uid,
    email: user.email,
    role: user.role || 'unknown'
  });
}

// Limpiar usuario al logout
function clearUser() {
  Sentry.setUser(null);
}

module.exports = {
  initSentryBackend,
  sentryErrorHandler,
  sentryRequestHandler,
  captureError,
  captureMessage,
  startTransaction,
  setUser,
  clearUser,
  Sentry
};