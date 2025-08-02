// Preload de componentes críticos para mejorar UX
export const preloadAdminComponents = () => {
  // Precargar componentes que se usan frecuentemente
  import('../components/TablaPreciosConfig');
  import('../components/GestionPrecios');
};

export const preloadEmpleadoComponents = () => {
  // Precargar cámara cuando el empleado inicia sesión
  import('../components/CameraCapture');
};

// Preload condicional basado en rol
export const preloadByRole = (role) => {
  if (role === 'admin' || role === 'co-admin') {
    preloadAdminComponents();
  } else if (role === 'empleado') {
    preloadEmpleadoComponents();
  }
};