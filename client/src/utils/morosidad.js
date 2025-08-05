import moment from 'moment';

// Configurar moment en español
moment.locale('es');

// Calcular períodos mensuales desde fecha de ingreso
export const calcularPeriodosMensuales = (fechaIngreso, diasVencimiento = 30) => {
  const inicio = moment(fechaIngreso);
  const hoy = moment();
  const periodos = [];
  
  let fechaInicioPeriodo = inicio.clone();
  let numeroPeriodo = 1;
  
  while (fechaInicioPeriodo.isBefore(hoy) || fechaInicioPeriodo.isSame(hoy, 'day')) {
    const fechaFinPeriodo = fechaInicioPeriodo.clone().add(diasVencimiento, 'days');
    
    periodos.push({
      numero: numeroPeriodo,
      fechaInicio: fechaInicioPeriodo.clone(),
      fechaFin: fechaFinPeriodo.clone(),
      fechaVencimiento: fechaFinPeriodo.clone(),
      vencido: fechaFinPeriodo.isBefore(hoy)
    });
    
    fechaInicioPeriodo = fechaFinPeriodo.clone();
    numeroPeriodo++;
  }
  
  return periodos;
};

// Determinar estado de cada período (CON PAGO / SIN PAGO)
export const calcularEstadoPeriodos = (periodos, pagos = []) => {
  const pagosConfirmados = pagos
    .filter(pago => pago.estado === 'confirmado')
    .map(pago => ({
      ...pago,
      fecha: moment(pago.fechaRegistro)
    }));
  
  return periodos.map(periodo => {
    // Buscar pago que cubra este período
    const pagoDelPeriodo = pagosConfirmados.find(pago => 
      pago.fecha.isBetween(periodo.fechaInicio, periodo.fechaFin, null, '[]') ||
      pago.fecha.isSame(periodo.fechaInicio, 'day') ||
      pago.fecha.isSame(periodo.fechaFin, 'day')
    );
    
    return {
      ...periodo,
      estado: pagoDelPeriodo ? 'CON_PAGO' : 'SIN_PAGO',
      pago: pagoDelPeriodo || null,
      diasVencido: periodo.vencido ? moment().diff(periodo.fechaVencimiento, 'days') : 0
    };
  });
};

// Calcular estado general del cliente
export const calcularEstadoCliente = (cliente, pagos = []) => {
  if (!cliente.fechaIngreso) {
    return { estado: 'sin_fecha', diasVencido: 0, color: 'warning', mesesAdeudados: 0, deudaTotal: 0 };
  }
  
  const diasVencimiento = cliente.diasVencimiento || 30;
  const periodos = calcularPeriodosMensuales(cliente.fechaIngreso, diasVencimiento);
  const periodosConEstado = calcularEstadoPeriodos(periodos, pagos.filter(p => p.clienteId === cliente.id));
  
  // Contar períodos sin pago
  const periodosSinPago = periodosConEstado.filter(p => p.estado === 'SIN_PAGO' && p.vencido);
  const mesesAdeudados = periodosSinPago.length;
  const deudaTotal = mesesAdeudados * (cliente.precio || 0);
  
  // Determinar estado general
  if (mesesAdeudados === 0) {
    return { estado: 'al_dia', diasVencido: 0, color: 'success', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  }
  
  const ultimoPeriodoVencido = periodosSinPago[periodosSinPago.length - 1];
  const diasVencido = ultimoPeriodoVencido ? ultimoPeriodoVencido.diasVencido : 0;
  
  if (mesesAdeudados === 1 && diasVencido <= 5) {
    return { estado: 'por_vencer', diasVencido, color: 'warning', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  } else if (mesesAdeudados <= 2) {
    return { estado: 'vencido', diasVencido, color: 'error', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  } else {
    return { estado: 'moroso', diasVencido, color: 'error', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  }
};

export const getEstadoTexto = (estadoInfo) => {
  const { estado, mesesAdeudados, diasVencido, deudaTotal } = estadoInfo;
  
  const textos = {
    al_dia: 'Al día',
    por_vencer: `Por vencer (${diasVencido} días)`,
    vencido: `${mesesAdeudados} mes${mesesAdeudados > 1 ? 'es' : ''} adeudado${mesesAdeudados > 1 ? 's' : ''} - $${deudaTotal.toLocaleString()}`,
    moroso: `MOROSO: ${mesesAdeudados} meses - $${deudaTotal.toLocaleString()}`,
    sin_fecha: 'Sin fecha de ingreso'
  };
  
  return textos[estado] || 'Desconocido';
};

// Función para calcular próximo vencimiento
export const calcularProximoVencimiento = (fechaIngreso, diasVencimiento = 30, ultimoPago = null) => {
  const fechaBase = ultimoPago ? moment(ultimoPago) : moment(fechaIngreso);
  return fechaBase.clone().add(diasVencimiento, 'days').toDate();
};