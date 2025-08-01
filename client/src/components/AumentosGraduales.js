import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { TrendingUp, Schedule, PlayArrow, Visibility } from '@mui/icons-material';
import { procesarAumentosGraduales, obtenerClientesConAumentoPendiente } from '../utils/aumentosGraduales';
import { clientesFirestore } from '../services/firestore';

const AumentosGraduales = () => {
  const [clientesConAumentos, setClientesConAumentos] = useState([]);
  const [clientesPendientes, setClientesPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [ultimoProceso, setUltimoProceso] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const clientes = await clientesFirestore.obtener();
      const hoy = new Date();
      
      // Filtrar clientes con aumentos graduales
      const conAumentos = clientes.filter(c => c.esClienteAntiguo);
      setClientesConAumentos(conAumentos);
      
      // Filtrar clientes con aumentos pendientes
      const pendientes = await obtenerClientesConAumentoPendiente();
      setClientesPendientes(pendientes);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('❌ Error cargando datos');
    }
  };

  const handleProcesarAumentos = async () => {
    setLoading(true);
    try {
      const resultado = await procesarAumentosGraduales();
      
      if (resultado.success) {
        setMensaje(`✅ ${resultado.mensaje}`);
        setUltimoProceso(resultado.clientesActualizados);
        cargarDatos(); // Recargar datos
      } else {
        setMensaje(`❌ Error: ${resultado.error}`);
      }
      
      setOpenConfirm(false);
    } catch (error) {
      console.error('Error procesando aumentos:', error);
      setMensaje('❌ Error procesando aumentos');
    }
    setLoading(false);
  };

  const calcularProximoAumento = (cliente) => {
    if (!cliente.proximoAumento) return 'No programado';
    
    const fecha = new Date(cliente.proximoAumento);
    const hoy = new Date();
    const diferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    
    if (diferencia < 0) return 'Vencido';
    if (diferencia === 0) return 'Hoy';
    if (diferencia === 1) return 'Mañana';
    return `En ${diferencia} días`;
  };

  const getEstadoColor = (cliente) => {
    if (!cliente.proximoAumento) return 'default';
    
    const fecha = new Date(cliente.proximoAumento);
    const hoy = new Date();
    const diferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    
    if (diferencia < 0) return 'error';
    if (diferencia <= 7) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUp sx={{ mr: 1 }} />
        📈 Aumentos Graduales
      </Typography>

      {mensaje && (
        <Alert 
          severity={mensaje.includes('❌') ? 'error' : 'success'} 
          sx={{ mb: 3 }}
          onClose={() => setMensaje('')}
        >
          {mensaje}
        </Alert>
      )}

      {/* Resumen */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="primary.main">
              {clientesConAumentos.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clientes con aumentos graduales
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="warning.main">
              {clientesPendientes.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aumentos pendientes de procesar
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => setOpenConfirm(true)}
              disabled={clientesPendientes.length === 0 || loading}
              color="success"
              fullWidth
            >
              {loading ? 'Procesando...' : 'Procesar Aumentos'}
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Clientes con Aumentos Graduales */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Clientes con Aumentos Graduales
          </Typography>
          
          {clientesConAumentos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No hay clientes configurados con aumentos graduales
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Precio Actual</TableCell>
                    <TableCell>Precio Objetivo</TableCell>
                    <TableCell>Aumento Mensual</TableCell>
                    <TableCell>Próximo Aumento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Progreso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesConAumentos.map((cliente) => {
                    const precioActual = parseFloat(cliente.precioBase || cliente.precio || 0);
                    const precioObjetivo = parseFloat(cliente.precioObjetivo || 0);
                    const progreso = precioObjetivo > 0 ? (precioActual / precioObjetivo) * 100 : 0;
                    
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {cliente.nombre} {cliente.apellido}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary.main">
                            ${precioActual.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main">
                            ${precioObjetivo.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            +${parseFloat(cliente.aumentoMensual || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {cliente.proximoAumento ? 
                              new Date(cliente.proximoAumento).toLocaleDateString() : 
                              'No programado'
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {calcularProximoAumento(cliente)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              progreso >= 100 ? 'Completado' :
                              calcularProximoAumento(cliente) === 'Vencido' ? 'Pendiente' :
                              'En progreso'
                            }
                            color={getEstadoColor(cliente)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 60, 
                                height: 8, 
                                bgcolor: 'grey.300', 
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: `${Math.min(progreso, 100)}%`, 
                                  height: '100%', 
                                  bgcolor: progreso >= 100 ? 'success.main' : 'primary.main',
                                  transition: 'width 0.3s'
                                }}
                              />
                            </Box>
                            <Typography variant="caption">
                              {Math.round(progreso)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmación */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>
          🚀 Procesar Aumentos Graduales
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Está seguro de procesar los aumentos graduales?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Se aplicarán aumentos a <strong>{clientesPendientes.length} clientes</strong> que tienen fechas de aumento vencidas o programadas para hoy.
          </Typography>
          
          {clientesPendientes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Clientes a procesar:
              </Typography>
              {clientesPendientes.slice(0, 5).map(cliente => (
                <Typography key={cliente.id} variant="body2" color="text.secondary">
                  • {cliente.nombre} {cliente.apellido}
                </Typography>
              ))}
              {clientesPendientes.length > 5 && (
                <Typography variant="body2" color="text.secondary">
                  ... y {clientesPendientes.length - 5} más
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleProcesarAumentos}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {loading ? 'Procesando...' : 'Procesar Aumentos'}
          </Button>
          <Button variant="outlined" onClick={() => setOpenConfirm(false)} disabled={loading}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resultado del último proceso */}
      {ultimoProceso && ultimoProceso.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              ✅ Último Proceso Completado
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Precio Anterior</TableCell>
                    <TableCell>Precio Nuevo</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ultimoProceso.map((cliente, index) => (
                    <TableRow key={index}>
                      <TableCell>{cliente.nombre}</TableCell>
                      <TableCell>${cliente.precioAnterior.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        ${cliente.precioNuevo.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cliente.alcanzóObjetivo ? 'Objetivo Alcanzado' : 'En Progreso'}
                          color={cliente.alcanzóObjetivo ? 'success' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AumentosGraduales;