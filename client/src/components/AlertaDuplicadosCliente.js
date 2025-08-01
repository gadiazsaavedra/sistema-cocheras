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
import { Block, Warning, Person, Phone } from '@mui/icons-material';

const AlertaDuplicadosCliente = ({ 
  open, 
  onClose, 
  onConfirm, 
  clienteData,
  duplicados 
}) => {
  const { duplicadoTelefono, duplicadosNombre, similares } = duplicados || {};

  const hayDuplicadoTelefono = !!duplicadoTelefono;
  const hayDuplicadoNombre = (duplicadosNombre || []).length > 0;
  const haySimilares = (similares || []).length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        bgcolor: hayDuplicadoTelefono || hayDuplicadoNombre ? 'error.main' : 'warning.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center'
      }}>
        {hayDuplicadoTelefono || hayDuplicadoNombre ? 
          <Block sx={{ mr: 1 }} /> : 
          <Warning sx={{ mr: 1 }} />
        }
        {hayDuplicadoTelefono || hayDuplicadoNombre ? 
          '🚫 CLIENTE DUPLICADO DETECTADO' : 
          '⚠️ POSIBLES CLIENTES SIMILARES'
        }
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Información del cliente a crear */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="h6" color="info.contrastText">
            👤 Cliente a Registrar:
          </Typography>
          <Typography variant="body1" color="info.contrastText">
            <strong>{clienteData?.nombre} {clienteData?.apellido}</strong><br/>
            📞 {clienteData?.telefono || 'Sin teléfono'}
          </Typography>
        </Box>

        {/* Alerta de teléfono duplicado */}
        {hayDuplicadoTelefono && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              📞 TELÉFONO YA REGISTRADO
            </Typography>
            <Typography variant="body2">
              Ya existe un cliente con el teléfono: <strong>{clienteData.telefono}</strong>
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.contrastText">
                <strong>Cliente existente:</strong><br/>
                👤 {duplicadoTelefono.nombre} {duplicadoTelefono.apellido}<br/>
                📞 {duplicadoTelefono.telefono}<br/>
                🚗 {duplicadoTelefono.tipoVehiculo}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Alerta de nombre duplicado */}
        {hayDuplicadoNombre && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              👤 NOMBRE COMPLETO YA REGISTRADO
            </Typography>
            <Typography variant="body2">
              Ya existe un cliente con el mismo nombre completo.
            </Typography>
          </Alert>
        )}

        {/* Tabla de clientes duplicados por nombre */}
        {(duplicadosNombre || []).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="error">
              🚫 Clientes con Nombre Idéntico:
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'error.light' }}>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Teléfono</strong></TableCell>
                    <TableCell><strong>Vehículo</strong></TableCell>
                    <TableCell><strong>Empleado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(duplicadosNombre || []).map((cliente) => (
                    <TableRow key={cliente.id} sx={{ bgcolor: 'error.lighter' }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {cliente.nombre} {cliente.apellido}
                        </Typography>
                      </TableCell>
                      <TableCell>{cliente.telefono || 'Sin teléfono'}</TableCell>
                      <TableCell>{cliente.tipoVehiculo}</TableCell>
                      <TableCell>
                        {cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tabla de clientes similares */}
        {haySimilares && !hayDuplicadoTelefono && !hayDuplicadoNombre && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              ⚠️ Clientes con Nombres Similares:
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Encontramos clientes con nombres parecidos. Verifique si es la misma persona.
              </Typography>
            </Alert>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'warning.light' }}>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Teléfono</strong></TableCell>
                    <TableCell><strong>Vehículo</strong></TableCell>
                    <TableCell><strong>Empleado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(similares || []).map((cliente) => (
                    <TableRow key={cliente.id} sx={{ bgcolor: 'warning.lighter' }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {cliente.nombre} {cliente.apellido}
                        </Typography>
                      </TableCell>
                      <TableCell>{cliente.telefono || 'Sin teléfono'}</TableCell>
                      <TableCell>{cliente.tipoVehiculo}</TableCell>
                      <TableCell>
                        {cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Resumen de verificaciones */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>🔍 Verificaciones realizadas:</strong><br/>
            • Teléfono duplicado: {hayDuplicadoTelefono ? '❌ Encontrado' : '✅ OK'}<br/>
            • Nombre duplicado: {hayDuplicadoNombre ? '❌ Encontrado' : '✅ OK'}<br/>
            • Nombres similares: {haySimilares ? `⚠️ ${(similares || []).length} encontrados` : '✅ Ninguno'}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {hayDuplicadoTelefono || hayDuplicadoNombre ? (
          // Si hay duplicado exacto, solo permitir cancelar
          <Button
            variant="contained"
            color="error"
            onClick={onClose}
            size="large"
          >
            🚫 No Registrar (Duplicado)
          </Button>
        ) : (
          // Si solo hay similares, permitir continuar con advertencia
          <>
            <Button
              variant="contained"
              color={haySimilares ? 'warning' : 'primary'}
              onClick={onConfirm}
              size="large"
            >
              {haySimilares ? '⚠️ Registrar de Todas Formas' : '✅ Continuar'}
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

export default AlertaDuplicadosCliente;