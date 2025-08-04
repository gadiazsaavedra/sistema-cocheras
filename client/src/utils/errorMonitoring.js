import * as Sentry from '@sentry/react';

// Configuración de Sentry para frontend
export function initSentryFrontend() {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN || 'https://your-sentry-dsn-here',
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Integración básica sin dependencias complejas
    ],
    
    // Filtros para frontend
    beforeSend(event) {
      // No enviar en desarrollo
      if (process.env.NODE_ENV !== 'production') {
        console.log('Sentry Event (dev):', event.exception?.values?.[0]?.value);
        return null;
      }
      
      // Filtrar errores irrelevantes
      const errorMessage = event.exception?.values?.[0]?.value || '';
      
      if (errorMessage.includes('Network Error') || 
          errorMessage.includes('ChunkLoadError') ||
          errorMessage.includes('Loading chunk')) {
        return null;
      }
      
      return event;
    }
  });
  
  console.log('✅ Sentry frontend inicializado');
}

// Error Boundary personalizado
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Hook para capturar errores en componentes
export function useErrorHandler() {
  return (error, errorInfo = {}) => {
    Sentry.withScope((scope) => {
      scope.setTag('component', errorInfo.component || 'unknown');
      scope.setContext('errorInfo', errorInfo);
      Sentry.captureException(error);
    });
    
    console.error('Error en componente:', error, errorInfo);
  };
}

// Función para capturar errores de API
export function captureApiError(error, endpoint, method = 'GET') {
  Sentry.withScope((scope) => {
    scope.setTag('api_endpoint', endpoint);
    scope.setTag('http_method', method);
    scope.setTag('error_type', 'api_error');
    
    if (error.response) {
      scope.setTag('status_code', error.response.status);
      scope.setContext('response', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    Sentry.captureException(error);
  });
}

// Función para capturar errores de Firebase
export function captureFirebaseError(error, operation) {
  Sentry.withScope((scope) => {
    scope.setTag('firebase_operation', operation);
    scope.setTag('error_type', 'firebase_error');
    
    if (error.code) {
      scope.setTag('firebase_code', error.code);
    }
    
    Sentry.captureException(error);
  });
}

// Función para tracking de usuario
export function setUserContext(user) {
  Sentry.setUser({
    id: user.uid,
    email: user.email,
    role: user.role || 'unknown'
  });
}

// Limpiar contexto de usuario
export function clearUserContext() {
  Sentry.setUser(null);
}

// Capturar eventos personalizados
export function captureUserAction(action, data = {}) {
  Sentry.addBreadcrumb({
    message: action,
    category: 'user_action',
    data,
    level: 'info'
  });
}

// Performance monitoring para operaciones críticas
export function measurePerformance(name, operation) {
  // Simplificado para compatibilidad
  console.log(`Performance: ${name} - ${operation}`);
  
  return {
    finish: () => console.log(`Finished: ${name}`),
    setTag: (key, value) => console.log(`Tag: ${key}=${value}`),
    setData: (key, value) => console.log(`Data: ${key}=${value}`)
  };
}