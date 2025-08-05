import moment from 'moment';

// Configurar moment en español
moment.locale('es');

export const calcularEstadoCliente = (cliente, pagos = []) => {
  // Si no tiene fecha de ingreso, usar el sistema anterior
  if (!cliente.fechaIngreso && !cliente.fechaProximoVencimiento) {
    return { estado: 'sin_fecha', diasVencido: 0, color: 'warning' };
  }

  let fechaVencimiento;
  
  // Calcular vencimiento basado en fecha de ingreso y pagos
  if (cliente.fechaIngreso) {
    const fechaIngreso = moment(cliente.fechaIngreso);
    const diasVencimiento = cliente.diasVencimiento || 30;
    
    // Obtener pagos confirmados del cliente ordenados por fecha
    const pagosConfirmados = pagos
      .filter(pago => pago.clienteId === cliente.id && pago.estado === 'confirmado')
      .sort((a, b) => moment(b.fechaRegistro) - moment(a.fechaRegistro));
    
    if (pagosConfirmados.length === 0) {
      // Sin pagos: vencimiento = fecha ingreso + días vencimiento
      fechaVencimiento = fechaIngreso.clone().add(diasVencimiento, 'days');
    } else {
      // Con pagos: vencimiento = último pago + días vencimiento
      const ultimoPago = moment(pagosConfirmados[0].fechaRegistro);
      fechaVencimiento = ultimoPago.clone().add(diasVencimiento, 'days');
    }
  } else {
    // Fallback al sistema anterior
    fechaVencimiento = moment(cliente.fechaProximoVencimiento);
  }

  const hoy = moment();
  const diasVencido = hoy.diff(fechaVencimiento, 'days');

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
    al_dia: estadoInfo.diasVencido < 0 ? `Al día (vence en ${Math.abs(estadoInfo.diasVencido)} días)` : 'Al día',
    por_vencer: `Vence en ${Math.abs(estadoInfo.diasVencido)} días`,
    vencido: `Vencido ${estadoInfo.diasVencido} días`,
    moroso: `Moroso ${estadoInfo.diasVencido} días`,
    sin_fecha: 'Sin fecha de ingreso'
  };
  return textos[estadoInfo.estado] || 'Desconocido';
};

// Función para calcular próximo vencimiento basado en fecha de ingreso
export const calcularProximoVencimiento = (fechaIngreso, diasVencimiento = 30, ultimoPago = null) => {
  const fechaBase = ultimoPago ? moment(ultimoPago) : moment(fechaIngreso);
  return fechaBase.clone().add(diasVencimiento, 'days').toDate();
};