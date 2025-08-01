import { preciosFirestore } from '../services/firestore';

/**
 * Función para migrar precios de localStorage a Firebase
 * Se ejecuta automáticamente cuando se carga la configuración de precios
 */
export const migrarPreciosAFirebase = async () => {
  try {
    console.log('🔄 Iniciando migración de precios a Firebase...');
    
    // Verificar si ya existen precios en Firebase
    const preciosExistentes = await preciosFirestore.obtener();
    
    // Si ya hay precios en Firebase, no migrar
    if (preciosExistentes && Object.keys(preciosExistentes).length > 0) {
      console.log('✅ Los precios ya están en Firebase, no es necesario migrar');
      return preciosExistentes;
    }
    
    // Intentar obtener precios de localStorage
    const preciosLocal = localStorage.getItem('tablaPreciosCocheras');
    
    if (preciosLocal) {
      const tabla = JSON.parse(preciosLocal);
      console.log('📦 Precios encontrados en localStorage:', tabla);
      
      // Guardar en Firebase
      await preciosFirestore.guardar(tabla);
      console.log('✅ Precios migrados exitosamente a Firebase');
      
      // Opcional: limpiar localStorage después de migrar
      // localStorage.removeItem('tablaPreciosCocheras');
      // console.log('🧹 localStorage limpiado');
      
      return tabla;
    } else {
      console.log('ℹ️ No se encontraron precios en localStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
};

/**
 * Función para verificar el estado de la migración
 */
export const verificarEstadoMigracion = async () => {
  try {
    const preciosFirebase = await preciosFirestore.obtener();
    const preciosLocal = localStorage.getItem('tablaPreciosCocheras');
    
    return {
      firebaseDisponible: preciosFirebase && Object.keys(preciosFirebase).length > 0,
      localStorageDisponible: !!preciosLocal,
      necesitaMigracion: !!preciosLocal && (!preciosFirebase || Object.keys(preciosFirebase).length === 0)
    };
  } catch (error) {
    console.error('Error verificando estado de migración:', error);
    return {
      firebaseDisponible: false,
      localStorageDisponible: !!localStorage.getItem('tablaPreciosCocheras'),
      necesitaMigracion: false
    };
  }
};