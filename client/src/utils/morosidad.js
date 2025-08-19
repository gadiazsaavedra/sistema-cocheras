import moment from 'moment';

// Configurar moment en español
moment.locale('es');

// Calcular períodos mensuales desde fecha de ingreso
export const calcularPeriodosMensuales = (fechaIngreso, diasVencimiento = 30) => {
  const inicio = moment(fechaIngreso);
  const hoy = moment();
  const periodos = [];
  
  // Debug para Armando
  if (inicio.format('DD/MM/YYYY') === '07/06/2025') {
    console.log('=== DEBUG ARMANDO PERÍODOS ===');
    console.log('Fecha ingreso:', inicio.format('DD/MM/YYYY'));
    console.log('Hoy:', hoy.format('DD/MM/YYYY'));
    console.log('Días vencimiento:', diasVencimiento);
  }
  
  let fechaInicioPeriodo = inicio.clone();
  let numeroPeriodo = 1;
  
  // Generar períodos hasta hoy + 1 mes adicional para cubrir pagos futuros
  const fechaLimite = hoy.clone().add(1, 'month');
  
  while (fechaInicioPeriodo.isBefore(fechaLimite)) {
    const fechaFinPeriodo = fechaInicioPeriodo.clone().add(diasVencimiento - 1, 'days'); // Fin del período
    
    // Debug para Armando
    if (inicio.format('DD/MM/YYYY') === '07/06/2025') {
      console.log(`Período ${numeroPeriodo}: ${fechaInicioPeriodo.format('DD/MM/YYYY')} - ${fechaFinPeriodo.format('DD/MM/YYYY')}`);
      console.log('Vencido:', fechaFinPeriodo.isBefore(hoy));
    }
    
    periodos.push({
      numero: numeroPeriodo,
      fechaInicio: fechaInicioPeriodo.clone(),
      fechaFin: fechaFinPeriodo.clone(),
      fechaVencimiento: fechaFinPeriodo.clone(),
      vencido: fechaFinPeriodo.isBefore(hoy)
    });
    
    fechaInicioPeriodo = fechaInicioPeriodo.clone().add(diasVencimiento, 'days'); // Siguiente período
    numeroPeriodo++;
  }
  
  // Debug para Armando
  if (inicio.format('DD/MM/YYYY') === '07/06/2025') {
    console.log('Total períodos generados:', periodos.length);
    console.log('=== FIN DEBUG ARMANDO ===');
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
    }))
    .sort((a, b) => a.fecha - b.fecha); // Ordenar por fecha
  
  // Debug para Armando
  const esArmando = pagos.length > 0 && (pagos[0].clienteNombre?.includes('Armando') || pagos.some(p => p.clienteNombre?.includes('Armando')));
  if (esArmando) {
    console.log('=== DEBUG ASIGNACIÓN ARMANDO ===');
    console.log('Total pagos recibidos:', pagos.length);
    console.log('Pagos confirmados:', pagosConfirmados.length);
    pagosConfirmados.forEach((p, i) => {
      console.log(`Pago ${i+1}: ${p.fecha.format('DD/MM/YYYY')} - $${p.monto} - Estado: ${p.estado}`);
    });
    console.log('Períodos disponibles:', periodos.length);
    periodos.forEach((p, i) => {
      console.log(`Período ${i+1}: ${p.fechaInicio.format('DD/MM/YYYY')} - ${p.fechaFin.format('DD/MM/YYYY')} (Vence: ${p.fechaVencimiento.format('DD/MM/YYYY')})`);
    });
  }
  
  // Inicializar períodos
  const periodosConEstado = periodos.map(periodo => ({
    ...periodo,
    estado: 'SIN_PAGO',
    pago: null,
    diasVencido: periodo.vencido ? moment().diff(periodo.fechaVencimiento, 'days') : 0
  }));
  
  // Asignar pagos secuencialmente a períodos
  // Cada pago se asigna al primer período disponible
  pagosConfirmados.forEach((pago, index) => {
    const periodoDisponible = periodosConEstado.find(p => p.estado === 'SIN_PAGO');
    
    // Debug para Armando
    if (esArmando) {
      console.log(`\n--- Asignando pago ${index+1} ---`);
      console.log(`Pago: ${pago.fecha.format('DD/MM/YYYY')} - $${pago.monto}`);
      console.log(`Período disponible: ${periodoDisponible ? `${periodoDisponible.numero} (${periodoDisponible.fechaInicio.format('DD/MM/YYYY')} - ${periodoDisponible.fechaFin.format('DD/MM/YYYY')})` : 'NINGUNO'}`);
      
      if (!periodoDisponible) {
        console.log('ERROR: No hay períodos disponibles para este pago!');
        console.log('Períodos actuales:');
        periodosConEstado.forEach(p => {
          console.log(`  Período ${p.numero}: ${p.estado} - ${p.fechaInicio.format('DD/MM/YYYY')} a ${p.fechaFin.format('DD/MM/YYYY')}`);
        });
      }
    }
    
    if (periodoDisponible) {
      periodoDisponible.estado = 'CON_PAGO';
      periodoDisponible.pago = pago;
    }
  });
  
  // Debug final para Armando
  if (esArmando) {
    console.log('\n=== RESULTADO FINAL ASIGNACIÓN ===');
    periodosConEstado.forEach(p => {
      console.log(`Período ${p.numero} (${p.fechaInicio.format('DD/MM/YYYY')} - ${p.fechaFin.format('DD/MM/YYYY')}): ${p.estado}${p.pago ? ` - Pago: ${p.pago.fecha.format('DD/MM/YYYY')} $${p.pago.monto}` : ''}`);
    });
    
    const periodosConPago = periodosConEstado.filter(p => p.estado === 'CON_PAGO');
    const periodosSinPago = periodosConEstado.filter(p => p.estado === 'SIN_PAGO');
    console.log(`\nResumen: ${periodosConPago.length} períodos con pago, ${periodosSinPago.length} sin pago`);
    console.log('=== FIN DEBUG ASIGNACIÓN ===\n');
  }
  
  if (esArmando) {
    console.log('\n=== RESULTADO FINAL ASIGNACIÓN ===');
    periodosConEstado.forEach(p => {
      console.log(`Período ${p.numero} (${p.fechaInicio.format('DD/MM/YYYY')} - ${p.fechaFin.format('DD/MM/YYYY')}): ${p.estado}${p.pago ? ` - Pago: ${p.pago.fecha.format('DD/MM/YYYY')} $${p.pago.monto}` : ''}`);
    });
    
    const periodosConPago = periodosConEstado.filter(p => p.estado === 'CON_PAGO');
    const periodosSinPago = periodosConEstado.filter(p => p.estado === 'SIN_PAGO');
    console.log(`\nResumen: ${periodosConPago.length} períodos con pago, ${periodosSinPago.length} sin pago`);
    console.log('=== FIN DEBUG ASIGNACIÓN ===\n');
  }
  
  return periodosConEstado;
};

// Calcular estado general del cliente
export const calcularEstadoCliente = (cliente, pagos = []) => {
  if (!cliente.fechaIngreso) {
    return { estado: 'sin_fecha', diasVencido: 0, color: 'warning', mesesAdeudados: 0, deudaTotal: 0 };
  }
  
  // Debug específico para Laura García
  const esLaura = cliente.nombre?.toLowerCase().includes('laura') && cliente.apellido?.toLowerCase().includes('garcia');
  if (esLaura) {
    console.log('👩👩👩 DEBUG LAURA GARCÍA - MOROSIDAD:');
    console.log('  - Fecha ingreso:', cliente.fechaIngreso);
    console.log('  - Días vencimiento:', cliente.diasVencimiento || 30);
    console.log('  - Precio cliente:', cliente.precio);
    console.log('  - Es cliente antiguo:', cliente.esClienteAntiguo);
    console.log('  - Precio base:', cliente.precioBase);
    console.log('  - Total pagos recibidos:', pagos.filter(p => p.clienteId === cliente.id).length);
    console.log('  - Hoy:', moment().format('DD/MM/YYYY'));
  }
  
  const diasVencimiento = cliente.diasVencimiento || 30;
  const periodos = calcularPeriodosMensuales(cliente.fechaIngreso, diasVencimiento);
  const periodosConEstado = calcularEstadoPeriodos(periodos, pagos.filter(p => p.clienteId === cliente.id));
  
  // Contar SOLO períodos sin pago que ya vencieron (no los que tienen pago)
  const periodosSinPagoVencidos = periodosConEstado.filter(p => 
    p.estado === 'SIN_PAGO' && p.vencido
  );
  const mesesAdeudados = periodosSinPagoVencidos.length;
  
  // Usar precio personalizado si es cliente antiguo, sino precio normal
  const precioAUsar = cliente.esClienteAntiguo && cliente.precioBase ? 
    parseFloat(cliente.precioBase) : 
    (cliente.precio || 0);
  
  const deudaTotal = mesesAdeudados * precioAUsar;
  
  // Debug para Laura
  if (esLaura) {
    console.log('  - TODOS LOS PERÍODOS:');
    periodosConEstado.forEach((p, i) => {
      console.log(`    Período ${i+1}: ${p.fechaInicio.format('DD/MM/YYYY')} - ${p.fechaFin.format('DD/MM/YYYY')} | Estado: ${p.estado} | Vencido: ${p.vencido} | Días: ${p.diasVencido}`);
    });
    console.log('  - Meses adeudados (SIN PAGO + VENCIDOS):', mesesAdeudados);
    console.log('  - Deuda total:', deudaTotal);
    console.log('  - Períodos sin pago vencidos:', periodosSinPagoVencidos.length);
    periodosSinPagoVencidos.forEach((p, i) => {
      console.log(`    ❌ Período SIN PAGO: ${p.fechaInicio.format('DD/MM/YYYY')} - ${p.fechaFin.format('DD/MM/YYYY')} (${p.diasVencido} días vencido)`);
    });
  }
  
  // Si no hay períodos vencidos sin pago, está al día
  if (mesesAdeudados === 0) {
    if (esLaura) console.log('  - RESULTADO: Al día');
    return { estado: 'al_dia', diasVencido: 0, color: 'success', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  }
  
  // Encontrar el período más antiguo sin pago Y vencido (el primero en la lista)
  const primerPeriodoSinPago = periodosSinPagoVencidos[0];
  const diasAtraso = primerPeriodoSinPago ? primerPeriodoSinPago.diasVencido : 0;
  
  if (esLaura) {
    console.log('  - Primer período sin pago:', primerPeriodoSinPago ? `${primerPeriodoSinPago.fechaInicio.format('DD/MM/YYYY')} - ${primerPeriodoSinPago.fechaFin.format('DD/MM/YYYY')}` : 'Ninguno');
    console.log('  - Días de atraso:', diasAtraso);
  }
  
  // Nuevo criterio basado en días de atraso
  let resultado;
  if (diasAtraso <= 5) {
    resultado = { estado: 'al_dia', diasVencido: diasAtraso, color: 'success', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  } else if (diasAtraso <= 15) {
    resultado = { estado: 'advertencia', diasVencido: diasAtraso, color: 'warning', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  } else if (diasAtraso <= 30) {
    resultado = { estado: 'vencido', diasVencido: diasAtraso, color: 'error', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  } else if (diasAtraso <= 60) {
    resultado = { estado: 'moroso', diasVencido: diasAtraso, color: 'error', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  } else {
    resultado = { estado: 'critico', diasVencido: diasAtraso, color: 'error', mesesAdeudados, deudaTotal, periodos: periodosConEstado };
  }
  
  if (esLaura) {
    console.log('  - RESULTADO FINAL:', resultado.estado, `(${resultado.diasVencido} días, $${resultado.deudaTotal})`);
  }
  
  return resultado;
};

export const getEstadoTexto = (estadoInfo) => {
  if (!estadoInfo) {
    return 'Sin información';
  }
  
  const { estado, mesesAdeudados = 0, diasVencido = 0, deudaTotal = 0 } = estadoInfo;
  
  const textos = {
    al_dia: diasVencido > 0 ? `Al día (${diasVencido} días)` : 'Al día',
    advertencia: `Advertencia: ${diasVencido} días de atraso - $${deudaTotal.toLocaleString()}`,
    vencido: `Vencido: ${diasVencido} días de atraso - $${deudaTotal.toLocaleString()}`,
    moroso: `MOROSO: ${diasVencido} días de atraso - $${deudaTotal.toLocaleString()}`,
    critico: `CRÍTICO: ${diasVencido} días de atraso - $${deudaTotal.toLocaleString()}`,
    sin_fecha: 'Sin fecha de ingreso'
  };
  
  return textos[estado] || 'Desconocido';
};

// Función para calcular próximo vencimiento
export const calcularProximoVencimiento = (fechaIngreso, diasVencimiento = 30, ultimoPago = null) => {
  const fechaBase = ultimoPago ? moment(ultimoPago) : moment(fechaIngreso);
  return fechaBase.clone().add(diasVencimiento, 'days').toDate();
};