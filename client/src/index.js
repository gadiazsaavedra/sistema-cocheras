import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSentryFrontend } from './utils/errorMonitoring';

// Inicializar Sentry
initSentryFrontend();

// Service Worker desactivado temporalmente para evitar recargas
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registrado: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW falló: ', registrationError);
//       });
//   });
// }

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);