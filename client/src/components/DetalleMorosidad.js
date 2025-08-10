import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { calcularPeriodosMensuales, calcularEstadoPeriodos } from '../utils/morosidad';
import moment from 'moment';

const DetalleMorosidad = ({ open, onClose, cliente, pagos: pagosProps = [] }) => {
  const [periodos, setPeriodos] = useState([]);
  const [pagosCliente, setPagosCliente] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  
  // Cargar pagos específicos del cliente
  useEffect(() => {
    if (open && cliente) {
      cargarPagosCliente();
    }
  }, [open, cliente]);
  
  // Recargar cada vez que se abre el dialog
  useEffect(() => {
    if (open) {
      setPagosCliente([]);
      setPeriodos([]);
    }
  }, [open]);
  
  const cargarPagosCliente = async () => {
    setCargandoPagos(true);
    try {
      const { pagosFirestore } = await import('../services/firestore');
      const response = await pagosFirestore.obtener({ limite: 200 });
      const todosPagos = response.datos || response;
      
      const pagosDelCliente = todosPagos.filter(p => p.clienteId === cliente.id);
      console.log(`Pagos cargados para ${cliente.nombre}:`, pagosDelCliente.length);
      
      // Debug específico para Armando
      if (cliente.nombre?.includes('Armando')) {
        console.log('=== DEBUG PAGOS ARMANDO DETALLE ===');
        console.log('ID del cliente:', cliente.id);
        console.log('Total pagos en sistema:', todosPagos.length);
        console.log('Pagos del cliente encontrados:', pagosDelCliente.length);
        pagosDelCliente.forEach((p, i) => {
          console.log(`Pago ${i+1}: ${p.fechaRegistro} - Estado: ${p.estado} - Monto: ${p.monto}`);
        });
        console.log('=== FIN DEBUG PAGOS ARMANDO ===');
      }
      
      setPagosCliente(pagosDelCliente);
    } catch (error) {
      console.error('Error cargando pagos del cliente:', error);
      setPagosCliente([]);
    }
    setCargandoPagos(false);
  };

  useEffect(() => {
    if (cliente && cliente.fechaIngreso && pagosCliente.length >= 0) {
      const diasVencimiento = cliente.diasVencimiento || 30;
      const periodosCalculados = calcularPeriodosMensuales(cliente.fechaIngreso, diasVencimiento);
      const periodosConEstado = calcularEstadoPeriodos(periodosCalculados, pagosCliente);
      setPeriodos(periodosConEstado);
    }
  }, [cliente, pagosCliente]);

  if (!cliente) return null;

  const periodosSinPago = periodos.filter(p => p.estado === 'SIN_PAGO' && p.vencido);
  const deudaTotal = periodosSinPago.length * (cliente.precio || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        📊 Detalle de Morosidad Mes a Mes - {cliente.nombre} {cliente.apellido}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Resumen */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Resumen del Sistema Mes a Mes
          </Typography>
          <Typography variant="body2">
            • <strong>Fecha de ingreso:</strong> {moment(cliente.fechaIngreso).format('DD/MM/YYYY')}<br/>
            • <strong>Período de pago:</strong> Cada {cliente.diasVencimiento || 30} días<br/>
            • <strong>Precio mensual:</strong> ${(cliente.precio || 0).toLocaleString()}<br/>
            • <strong>Períodos sin pago:</strong> {periodosSinPago.length}<br/>
            • <strong>Deuda total:</strong> ${deudaTotal.toLocaleString()}
          </Typography>
        </Alert>

        {/* Tabla de períodos */}
        <Typography variant="h6" gutterBottom>
          📅 Períodos Mensuales desde Fecha de Ingreso
        </Typography>
        
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Período</strong></TableCell>
                <TableCell><strong>Fecha Inicio</strong></TableCell>
                <TableCell><strong>Fecha Fin</strong></TableCell>
                <TableCell><strong>Vencimiento</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Días Vencido</strong></TableCell>
                <TableCell><strong>Pago Registrado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periodos.map((periodo) => (
                <TableRow 
                  key={periodo.numero}
                  sx={{
                    backgroundColor: 
                      periodo.estado === 'SIN_PAGO' && periodo.vencido ? 'rgba(244, 67, 54, 0.1)' :
                      periodo.estado === 'CON_PAGO' ? 'rgba(76, 175, 80, 0.1)' :
                      'inherit'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Mes {periodo.numero}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {periodo.fechaInicio.format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>
                    {periodo.fechaFin.format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>
                    {periodo.fechaVencimiento.format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={periodo.estado === 'CON_PAGO' ? '✅ CON PAGO' : '❌ SIN PAGO'}
                      color={periodo.estado === 'CON_PAGO' ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    {periodo.vencido ? (
                      <Typography color="error" sx={{ fontWeight: 'bold' }}>
                        {periodo.diasVencido} días
                      </Typography>
                    ) : (
                      <Typography color="success.main">
                        No vencido
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {periodo.pago ? (
                      <Box>
                        <Typography variant="body2">
                          ${periodo.pago.monto.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moment(periodo.pago.fechaRegistro).format('DD/MM/YYYY')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin pago
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Explicación del sistema */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 Cómo Funciona el Sistema Mes a Mes
          </Typography>
          <Typography variant="body2" component="div">
            <strong>1. Períodos Mensuales:</strong><br/>
            • Se calculan desde la fecha de ingreso inicial<br/>
            • Cada período dura {cliente.diasVencimiento || 30} días<br/>
            • Los períodos son consecutivos sin superposición<br/><br/>
            
            <strong>2. Estados por Período:</strong><br/>
            • <span style={{color: '#4caf50'}}>✅ CON PAGO</span>: El cliente pagó en ese período específico<br/>
            • <span style={{color: '#f44336'}}>❌ SIN PAGO</span>: El cliente NO pagó en ese período<br/><br/>
            
            <strong>3. Cálculo de Morosidad:</strong><br/>
            • Solo se cuentan períodos SIN PAGO que ya vencieron<br/>
            • Cada período sin pago = 1 mes adeudado<br/>
            • Deuda total = Períodos sin pago × Precio mensual<br/>
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button variant="contained" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleMorosidad;