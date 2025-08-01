import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const limpiarClientesPrueba = async () => {
  // Función para normalizar texto (quitar tildes, espacios, mayúsculas)
  const normalizar = (texto) => {
    return texto?.toString().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };

  const clientesPruebaNormalizados = [
    'carlos lopez',
    'juan perez', 
    'maria garcia'
  ];

  try {
    const snapshot = await getDocs(collection(db, 'clientes'));
    const clientesAEliminar = [];

    snapshot.docs.forEach(docSnap => {
      const cliente = docSnap.data();
      const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`;
      const nombreNormalizado = normalizar(nombreCompleto);
      
      console.log(`Comparando: "${nombreNormalizado}" con clientes de prueba`);
      
      if (clientesPruebaNormalizados.includes(nombreNormalizado)) {
        clientesAEliminar.push({
          id: docSnap.id,
          nombre: nombreCompleto,
          normalizado: nombreNormalizado
        });
      }
    });

    console.log('Clientes de prueba encontrados:', clientesAEliminar);

    if (clientesAEliminar.length === 0) {
      return '⚠️ No se encontraron clientes de prueba para eliminar';
    }

    for (const cliente of clientesAEliminar) {
      await deleteDoc(doc(db, 'clientes', cliente.id));
      console.log(`Eliminado: ${cliente.nombre}`);
    }

    return `✅ Eliminados ${clientesAEliminar.length} clientes de prueba: ${clientesAEliminar.map(c => c.nombre).join(', ')}`;
  } catch (error) {
    console.error('Error eliminando clientes de prueba:', error);
    return `❌ Error: ${error.message}`;
  }
};