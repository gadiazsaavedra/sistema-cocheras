import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Button,
  IconButton
} from '@mui/material';
import { Close, Print } from '@mui/icons-material';
import { pagosFirestore } from '../services/firestore';
import moment from 'moment';

const HistorialPagos = ({ open, onClose, cliente }) => {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (open && cliente) {
      cargarHistorial();
    }
  }, [open, cliente]);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const response = await pagosFirestore.obtener({ limite: 100 });
      const todosPagos = response.datos || response;
      
      // Asegurar que todosPagos es un array
      if (!Array.isArray(todosPagos)) {
        console.error('Los datos no son un array:', todosPagos);
        setPagos([]);
        return;
      }
      
      const pagosCliente = todosPagos
        .filter(pago => pago.clienteId === cliente.id)
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
      console.log('Pagos del cliente:', pagosCliente);
      setPagos(pagosCliente);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setPagos([]);
    }
    setCargando(false);
  };

  const getColorEstado = (estado) => {
    const colores = {
      'confirmado': 'success',
      'pendiente': 'warning',
      'rechazado': 'error'
    };
    return colores[estado] || 'default';
  };

  const calcularEstadisticas = () => {
    const confirmados = pagos.filter(p => p.estado === 'confirmado');
    const totalPagado = confirmados.reduce((sum, p) => sum + p.monto, 0);
    const ultimoPago = confirmados[0];
    
    return {
      totalPagos: confirmados.length,
      totalMonto: totalPagado,
      ultimoPago: ultimoPago ? moment(ultimoPago.fechaRegistro).format('DD/MM/YYYY') : 'Nunca',
      pendientes: pagos.filter(p => p.estado === 'pendiente').length
    };
  };

  const imprimirHistorial = () => {
    const stats = calcularEstadisticas();
    const contenido = `
      <html>
        <head>
          <title>Historial de Pagos - ${cliente.nombre} ${cliente.apellido}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .confirmado { background-color: #e8f5e8; }
            .pendiente { background-color: #fff3cd; }
            .rechazado { background-color: #f8d7da; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Historial de Pagos</h2>
            <h3>${cliente.nombre} ${cliente.apellido}</h3>
            <p>Teléfono: ${cliente.telefono} | Vehículo: ${cliente.tipoVehiculo}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h4>${stats.totalPagos}</h4>
              <p>Pagos Confirmados</p>
            </div>
            <div class="stat-box">
              <h4>$${stats.totalMonto.toLocaleString()}</h4>
              <p>Total Pagado</p>
            </div>
            <div class="stat-box">
              <h4>${stats.ultimoPago}</h4>
              <p>Último Pago</p>
            </div>
            <div class="stat-box">
              <h4>${stats.pendientes}</h4>
              <p>Pagos Pendientes</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Empleado</th>
              </tr>
            </thead>
            <tbody>
              ${pagos.map(pago => `
                <tr class="${pago.estado}">
                  <td>${moment(pago.fechaRegistro).format('DD/MM/YYYY HH:mm')}</td>
                  <td>$${pago.monto.toLocaleString()}</td>
                  <td>${pago.tipoPago}</td>
                  <td>${pago.estado.toUpperCase()}</td>
                  <td>${pago.empleadoNombre || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Reporte generado el ${moment().format('DD/MM/YYYY HH:mm')}
          </p>
        </body>
      </html>
    `;

    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  if (!cliente) return null;

  const stats = calcularEstadisticas();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Historial de Pagos - {cliente.nombre} {cliente.apellido}
          </Typography>
          <Box>
            <Button
              startIcon={<Print />}
              onClick={imprimirHistorial}
              sx={{ mr: 1 }}
              size="small"
            >
              Imprimir
            </Button>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Estadísticas */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{stats.totalPagos}</Typography>
            <Typography variant="body2">Pagos Confirmados</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">${stats.totalMonto.toLocaleString()}</Typography>
            <Typography variant="body2">Total Pagado</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">{stats.ultimoPago}</Typography>
            <Typography variant="body2">Último Pago</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.pendientes}</Typography>
            <Typography variant="body2">Pendientes</Typography>
          </Paper>
        </Box>

        {/* Tabla de pagos */}
        {cargando ? (
          <Typography>Cargando historial...</Typography>
        ) : pagos.length === 0 ? (
          <Typography>No hay pagos registrados para este cliente.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha y Hora</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Confirmado Por</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>
                      {moment(pago.fechaRegistro).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${pago.monto.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={pago.tipoPago} 
                        size="small"
                        color={pago.tipoPago === 'efectivo' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={pago.estado.toUpperCase()} 
                        color={getColorEstado(pago.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{pago.empleadoNombre || 'N/A'}</TableCell>
                    <TableCell>
                      {pago.fechaConfirmacion ? 
                        `${moment(pago.fechaConfirmacion).format('DD/MM HH:mm')}` : 
                        '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistorialPagos;