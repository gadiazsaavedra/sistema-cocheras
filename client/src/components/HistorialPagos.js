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
import { Close, Print, Delete } from '@mui/icons-material';
import { pagosFirestore } from '../services/firestore';
import moment from 'moment';

const HistorialPagos = ({ open, onClose, cliente, AlertaAdelanto }) => {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (open && cliente) {
      cargarHistorial();
    }
  }, [open, cliente]);

  const [clienteActualizado, setClienteActualizado] = useState(cliente);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      // Recargar datos del cliente
      const { clientesFirestore } = await import('../services/firestore');
      const clienteResponse = await clientesFirestore.obtener();
      const todosClientes = clienteResponse.datos || clienteResponse;
      const clienteActual = todosClientes.find(c => c.id === cliente.id);
      if (clienteActual) {
        setClienteActualizado(clienteActual);
      }
      
      // Forzar recarga de pagos sin cache con límite alto
      const response = await pagosFirestore.obtener({ 
        limite: 500,
        timestamp: Date.now() // Evitar cache
      });
      const todosPagos = response.datos || response;
      
      console.log('Total pagos cargados:', todosPagos.length);
      console.log('Buscando pagos para cliente:', cliente.id);
      
      // Debug específico para Horacio
      if (cliente.nombre?.includes('Horacio')) {
        console.log('🔍 DEBUG HORACIO HISTORIAL:');
        console.log('Cliente ID:', cliente.id);
        const pagosHoracio = todosPagos.filter(p => p.clienteId === cliente.id);
        console.log('Pagos encontrados para Horacio:', pagosHoracio.length);
        pagosHoracio.forEach((p, i) => {
          console.log(`Pago ${i+1}: ${p.fechaRegistro} - $${p.monto} - Estado: ${p.estado}`);
        });
      }
      
      // Asegurar que todosPagos es un array
      if (!Array.isArray(todosPagos)) {
        console.error('Los datos no son un array:', todosPagos);
        setPagos([]);
        return;
      }
      
      const pagosCliente = todosPagos
        .filter(pago => {
          const esDelCliente = pago.clienteId === cliente.id;
          if (esDelCliente) {
            console.log('Pago encontrado:', pago.id, pago.monto, pago.fechaRegistro);
          }
          return esDelCliente;
        })
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
      
      console.log('Pagos del cliente final:', pagosCliente.length);
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
              <h4>$${Math.round(stats.totalMonto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h4>
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
                  <td>$${Math.round(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
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
            <button 
              onClick={async () => {
                if (!window.confirm('¿Eliminar el adelanto de este cliente?')) return;
                
                try {
                  const { getAuth } = await import('firebase/auth');
                  const auth = getAuth();
                  const user = auth.currentUser;
                  const token = await user.getIdToken();
                  
                  const apiUrl = window.location.hostname.includes('netlify.app') 
                    ? 'https://sistema-cocheras-backend.onrender.com/api'
                    : 'http://localhost:3000/api';
                  
                  const response = await fetch(`${apiUrl}/clientes/${cliente.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      mesesAdelantados: null,
                      fechaVencimientoAdelanto: null,
                      ultimoPagoAdelantado: null
                    })
                  });
                  
                  if (response.ok) {
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error:', error);
                }
              }}
              style={{ 
                background: '#ff4444', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                marginRight: '8px'
              }}
            >
              ❌ ELIMINAR ADELANTO
            </button>
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

        
        {/* Alerta de Adelanto */}
        {AlertaAdelanto && clienteActualizado?.mesesAdelantados && clienteActualizado?.fechaVencimientoAdelanto && (
          <AlertaAdelanto cliente={clienteActualizado} />
        )}
        {/* Estadísticas */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{stats.totalPagos}</Typography>
            <Typography variant="body2">Pagos Confirmados</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">${Math.round(stats.totalMonto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Typography>
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
                  <TableCell>Observaciones</TableCell>
                  <TableCell>Confirmado Por</TableCell>
                  <TableCell>Acciones</TableCell>
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
                        ${Math.round(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                      {pago.observaciones ? (
                        <Typography variant="caption" sx={{ 
                          fontStyle: 'italic',
                          color: 'text.secondary',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}>
                          📝 {pago.observaciones}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {pago.fechaConfirmacion ? 
                        `${moment(pago.fechaConfirmacion).format('DD/MM HH:mm')}` : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={async () => {
                          if (window.confirm(`¿Eliminar pago de $${Math.round(pago.monto).toLocaleString()} del ${moment(pago.fechaRegistro).format('DD/MM/YYYY')}?`)) {
                            try {
                              const { getAuth } = await import('firebase/auth');
                              const auth = getAuth();
                              const user = auth.currentUser;
                              const token = await user.getIdToken();
                              
                              const apiUrl = window.location.hostname.includes('netlify.app') 
                                ? 'https://sistema-cocheras-backend.onrender.com/api'
                                : 'http://localhost:3000/api';
                              
                              const response = await fetch(`${apiUrl}/pagos/${pago.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (response.ok) {
                                cargarHistorial(); // Recargar historial
                              } else {
                                alert('Error eliminando pago');
                              }
                            } catch (error) {
                              console.error('Error:', error);
                              alert('Error eliminando pago');
                            }
                          }
                        }}
                      >
                        Eliminar
                      </Button>
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