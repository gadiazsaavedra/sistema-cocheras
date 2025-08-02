// Utilidad para detectar y mostrar enlaces de índices faltantes
export const handleFirebaseIndexError = (error) => {
  if (error.message && error.message.includes('index')) {
    // Extraer URL del índice del mensaje de error
    const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    
    if (urlMatch) {
      const indexUrl = urlMatch[0];
      
      console.group('🔥 Firebase Index Required');
      console.warn('Query requires an index. Click the link below to create it:');
      console.log('📊 Create Index:', indexUrl);
      console.groupEnd();
      
      // Mostrar notificación al usuario (opcional)
      if (window.confirm('Esta consulta requiere un índice Firebase para funcionar correctamente. ¿Quieres abrir el enlace para crearlo?')) {
        window.open(indexUrl, '_blank');
      }
    }
  }
  
  return error;
};

// Lista de índices requeridos para referencia
export const REQUIRED_INDEXES = [
  {
    collection: 'clientes',
    fields: ['empleadoAsignado', 'fechaCreacion'],
    description: 'Clientes por empleado ordenados por fecha'
  },
  {
    collection: 'pagos',
    fields: ['estado', 'fechaRegistro'],
    description: 'Pagos por estado ordenados por fecha'
  },
  {
    collection: 'pagos',
    fields: ['empleadoId', 'fechaRegistro'],
    description: 'Pagos por empleado ordenados por fecha'
  },
  {
    collection: 'pagos',
    fields: ['clienteId', 'fechaRegistro'],
    description: 'Pagos por cliente ordenados por fecha'
  },
  {
    collection: 'pagos',
    fields: ['clienteId', 'estado', 'fechaRegistro'],
    description: 'Pagos por cliente y estado ordenados por fecha'
  }
];

// Función para verificar si los índices están activos
export const checkIndexesStatus = async () => {
  console.log('🔍 Verificando estado de índices Firebase...');
  console.table(REQUIRED_INDEXES);
  console.log('💡 Si ves errores de índices, usa las URLs que aparecen en la consola para crearlos.');
};