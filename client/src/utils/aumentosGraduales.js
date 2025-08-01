import { clientesFirestore } from '../services/firestore';

export const procesarAumentosGraduales = async () => {
  try {
    const clientes = await clientesFirestore.obtener();
    const hoy = new Date();
    const clientesActualizados = [];

    for (const cliente of clientes) {
      if (cliente.esClienteAntiguo && cliente.proximoAumento) {
        const fechaAumento = new Date(cliente.proximoAumento);
        
        // Si llegó la fecha del aumento
        if (fechaAumento <= hoy) {
          const precioActual = parseFloat(cliente.precioBase || cliente.precio || 0);
          const precioObjetivo = parseFloat(cliente.precioObjetivo || 0);
          const aumentoMensual = parseFloat(cliente.aumentoMensual || 0);
          
          // Calcular nuevo precio
          let nuevoPrecio = precioActual + aumentoMensual;
          
          // No superar el precio objetivo
          if (nuevoPrecio >= precioObjetivo) {
            nuevoPrecio = precioObjetivo;
          }
          
          // Calcular próxima fecha de aumento (si no alcanzó el objetivo)
          let proximoAumento = null;
          if (nuevoPrecio < precioObjetivo) {
            const proximaFecha = new Date(fechaAumento);
            proximaFecha.setMonth(proximaFecha.getMonth() + 1);
            proximoAumento = proximaFecha.toISOString().split('T')[0];
          }
          
          // Actualizar cliente
          const datosActualizados = {
            precio: nuevoPrecio,
            precioBase: nuevoPrecio,
            proximoAumento: proximoAumento,
            // Si alcanzó el objetivo, ya no es cliente antiguo
            esClienteAntiguo: nuevoPrecio < precioObjetivo,
            fechaUltimoAumento: hoy.toISOString()
          };
          
          await clientesFirestore.actualizar(cliente.id, datosActualizados);
          
          clientesActualizados.push({
            id: cliente.id,
            nombre: `${cliente.nombre} ${cliente.apellido}`,
            precioAnterior: precioActual,
            precioNuevo: nuevoPrecio,
            alcanzóObjetivo: nuevoPrecio >= precioObjetivo
          });
        }
      }
    }
    
    return {
      success: true,
      clientesActualizados,
      mensaje: `${clientesActualizados.length} clientes actualizados con aumentos graduales`
    };
    
  } catch (error) {
    console.error('Error procesando aumentos graduales:', error);
    return {
      success: false,
      error: error.message,
      clientesActualizados: []
    };
  }
};

export const obtenerClientesConAumentoPendiente = async () => {
  try {
    const clientes = await clientesFirestore.obtener();
    const hoy = new Date();
    
    return clientes.filter(cliente => {
      if (!cliente.esClienteAntiguo || !cliente.proximoAumento) return false;
      
      const fechaAumento = new Date(cliente.proximoAumento);
      return fechaAumento <= hoy;
    });
    
  } catch (error) {
    console.error('Error obteniendo clientes con aumento pendiente:', error);
    return [];
  }
};

export const simularAumentoGradual = (precioBase, precioObjetivo, aumentoMensual) => {
  const base = parseFloat(precioBase || 0);
  const objetivo = parseFloat(precioObjetivo || 0);
  const aumento = parseFloat(aumentoMensual || 0);
  
  if (base >= objetivo || aumento <= 0) {
    return {
      mesesNecesarios: 0,
      aumentoTotal: 0,
      cronograma: []
    };
  }
  
  const diferencia = objetivo - base;
  const mesesNecesarios = Math.ceil(diferencia / aumento);
  const cronograma = [];
  
  let precioActual = base;
  const fechaInicio = new Date();
  
  for (let mes = 1; mes <= mesesNecesarios; mes++) {
    precioActual += aumento;
    if (precioActual > objetivo) precioActual = objetivo;
    
    const fechaAumento = new Date(fechaInicio);
    fechaAumento.setMonth(fechaAumento.getMonth() + mes);
    
    cronograma.push({
      mes,
      fecha: fechaAumento.toLocaleDateString(),
      precio: precioActual,
      aumento: aumento,
      esUltimo: precioActual >= objetivo
    });
    
    if (precioActual >= objetivo) break;
  }
  
  return {
    mesesNecesarios,
    aumentoTotal: diferencia,
    cronograma
  };
};