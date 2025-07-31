import moment from 'moment';

export const calcularEstadoCliente = (cliente, pagos = []) => {
  if (!cliente.fechaProximoVencimiento) {
    return { estado: 'sin_fecha', diasVencido: 0, color: 'warning' };
  }

  const fechaVencimiento = moment(cliente.fechaProximoVencimiento);
  const hoy = moment();
  const diasVencido = hoy.diff(fechaVencimiento, 'days');

  // Verificar si tiene pagos recientes
  const pagoReciente = pagos.find(pago => 
    pago.clienteId === cliente.id && 
    pago.estado === 'confirmado' &&
    moment(pago.fechaRegistro).isAfter(fechaVencimiento.subtract(5, 'days'))
  );

  if (pagoReciente) {
    return { estado: 'al_dia', diasVencido: 0, color: 'success' };
  }

  if (diasVencido <= 0) {
    return { estado: 'al_dia', diasVencido, color: 'success' };
  } else if (diasVencido <= 5) {
    return { estado: 'por_vencer', diasVencido, color: 'warning' };
  } else if (diasVencido <= 15) {
    return { estado: 'vencido', diasVencido, color: 'error' };
  } else {
    return { estado: 'moroso', diasVencido, color: 'error' };
  }
};

export const getEstadoTexto = (estadoInfo) => {
  const textos = {
    al_dia: 'Al día',
    por_vencer: `Vence en ${Math.abs(estadoInfo.diasVencido)} días`,
    vencido: `Vencido ${estadoInfo.diasVencido} días`,
    moroso: `Moroso ${estadoInfo.diasVencido} días`,
    sin_fecha: 'Sin fecha'
  };
  return textos[estadoInfo.estado] || 'Desconocido';
};