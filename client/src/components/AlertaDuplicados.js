import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { Warning, Block, Info } from '@mui/icons-material';
import moment from 'moment';

const AlertaDuplicados = ({ 
  open, 
  onClose, 
  onConfirm, 
  cliente, 
  monto, 
  duplicados 
}) => {
  const { pagosHoy, pagosRecientes, pagosMismoMonto, ultimosPagos } = duplicados || {};

  const hayDuplicadosHoy = (pagosHoy || []).length > 0;
  const hayPagosRecientes = (pagosRecientes || []).length > 0;
  const hayMismoMonto = (pagosMismoMonto || []).length > 0;

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'confirmado': return 'success';
      case 'pendiente': return 'warning';
      case 'rechazado': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        bgcolor: hayDuplicadosHoy ? 'error.main' : 'warning.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center'
      }}>
        {hayDuplicadosHoy ? <Block sx={{ mr: 1 }} /> : <Warning sx={{ mr: 1 }} />}
        {hayDuplicadosHoy ? '🚫 PAGO DUPLICADO DETECTADO' : '⚠️ POSIBLE DUPLICADO'}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Información del pago a registrar */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="h6" color="info.contrastText">
            📝 Pago a Registrar:
          </Typography>
          <Typography variant="body1" color="info.contrastText">
            <strong>{cliente?.nombre} {cliente?.apellido}</strong> - ${parseFloat(monto).toLocaleString()}
          </Typography>
        </Box>

        {/* Alerta de duplicado del mismo día */}
        {hayDuplicadosHoy && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              🚫 YA EXISTE UN PAGO DE ESTE CLIENTE HOY
            </Typography>
            <Typography variant="body2">
              No se permite registrar más de un pago por cliente por día.
            </Typography>
          </Alert>
        )}

        {/* Alerta de pagos recientes */}
        {hayPagosRecientes && !hayDuplicadosHoy && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              ⚠️ PAGOS RECIENTES DETECTADOS (últimos 7 días)
            </Typography>
            <Typography variant="body2">
              Este cliente tiene pagos registrados recientemente.
            </Typography>
          </Alert>
        )}

        {/* Alerta de mismo monto */}
        {hayMismoMonto && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              💰 MISMO MONTO DETECTADO (últimos 30 días)
            </Typography>
            <Typography variant="body2">
              Ya hay pagos registrados con el mismo monto: ${parseFloat(monto).toLocaleString()}
            </Typography>
          </Alert>
        )}

        {/* Tabla de últimos pagos */}
        {(ultimosPagos || []).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Últimos Pagos del Cliente:
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Monto</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Empleado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(ultimosPagos || []).map((pago, index) => (
                    <TableRow 
                      key={pago.id} 
                      sx={{ 
                        bgcolor: parseFloat(pago.monto) === parseFloat(monto) ? 'warning.light' : 'inherit'
                      }}
                    >
                      <TableCell>
                        {moment(pago.fechaRegistro).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: parseFloat(pago.monto) === parseFloat(monto) ? 'bold' : 'normal',
                            color: parseFloat(pago.monto) === parseFloat(monto) ? 'warning.main' : 'inherit'
                          }}
                        >
                          ${parseFloat(pago.monto).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={pago.estado.toUpperCase()} 
                          size="small"
                          color={getEstadoColor(pago.estado)}
                        />
                      </TableCell>
                      <TableCell>
                        {pago.empleadoNombre?.includes('ADMIN') ? 
                          '👤 Admin' : 
                          pago.empleadoNombre?.split('@')[0] || 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Resumen de alertas */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>🔍 Verificaciones realizadas:</strong><br/>
            • Pagos del mismo día: {(pagosHoy || []).length}<br/>
            • Pagos recientes (7 días): {(pagosRecientes || []).length}<br/>
            • Mismo monto (30 días): {(pagosMismoMonto || []).length}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {hayDuplicadosHoy ? (
          // Si hay duplicado del mismo día, solo permitir cancelar
          <Button
            variant="contained"
            color="error"
            onClick={onClose}
            size="large"
          >
            🚫 No Registrar (Duplicado)
          </Button>
        ) : (
          // Si no hay duplicado del mismo día, permitir continuar con advertencia
          <>
            <Button
              variant="contained"
              color="warning"
              onClick={onConfirm}
              size="large"
            >
              ⚠️ Registrar de Todas Formas
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              size="large"
            >
              Cancelar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AlertaDuplicados;