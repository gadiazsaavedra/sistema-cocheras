import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { Warning, TrendingUp } from '@mui/icons-material';
import { clientesFirestore, preciosFirestore, pagosFirestore } from '../services/firestore';

const DetectorPreciosDesactualizados = () => {
  const [clientesDesactualizados, setClientesDesactualizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [precios, setPrecios] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar precios configurados
      const preciosData = await preciosFirestore.obtener();
      setPrecios(preciosData);

      // Cargar clientes
      const clientesRes = await clientesFirestore.obtener({ limite: 200 });
      const clientes = clientesRes.datos || clientesRes;

      // Cargar pagos para obtener último pago de cada cliente
      const pagosRes = await pagosFirestore.obtener({ limite: 500 });
      const pagos = pagosRes.datos || pagosRes;

      // Detectar clientes con precios desactualizados
      const desactualizados = clientes
        .filter(cliente => cliente.estado === 'activo')
        .map(cliente => {
          const precioConfigurado = preciosData[cliente.tipoVehiculo]?.[cliente.modalidadTiempo]?.[cliente.modalidadTecho] || 0;
          
          // Obtener último pago confirmado del cliente
          const pagosCliente = pagos
            .filter(pago => pago.clienteId === cliente.id && pago.estado === 'confirmado')
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
          
          const ultimoPago = pagosCliente[0];
          const ultimoMontoPagado = ultimoPago ? ultimoPago.monto : 0;
          
          const diferencia = precioConfigurado - ultimoMontoPagado;
          
          return {
            ...cliente,
            precioConfigurado,
            ultimoMontoPagado,
            ultimaFechaPago: ultimoPago ? ultimoPago.fechaRegistro : null,
            diferencia,
            porcentajeDiferencia: precioConfigurado > 0 ? ((diferencia / precioConfigurado) * 100) : 0,
            necesitaAjuste: diferencia > 0
          };
        })
        .filter(cliente => cliente.necesitaAjuste)
        .sort((a, b) => b.diferencia - a.diferencia);

      setClientesDesactualizados(desactualizados);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeveridad = (porcentaje) => {
    if (porcentaje >= 30) return 'error';
    if (porcentaje >= 15) return 'warning';
    return 'info';
  };

  const getTotalPerdida = () => {
    return clientesDesactualizados.reduce((total, cliente) => total + cliente.diferencia, 0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Warning sx={{ mr: 1 }} />
        ⚠️ Detector de Precios Desactualizados
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Resumen */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h4" color="error.main">
                  {clientesDesactualizados.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clientes con precios desactualizados
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  ${getTotalPerdida().toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pérdida mensual potencial
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {clientesDesactualizados.length === 0 ? (
            <Alert severity="success">
              ✅ Todos los clientes tienen precios actualizados según la configuración
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  📊 Se encontraron {clientesDesactualizados.length} clientes con precios por debajo de la configuración actual.
                  Pérdida mensual estimada: <strong>${getTotalPerdida().toLocaleString()}</strong>
                </Typography>
              </Alert>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Clientes que Necesitan Ajuste de Precio
                  </Typography>
                  
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Configuración</TableCell>
                          <TableCell>Último Pago</TableCell>
                          <TableCell>Precio Configurado</TableCell>
                          <TableCell>Diferencia</TableCell>
                          <TableCell>% Diferencia</TableCell>
                          <TableCell>Empleado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientesDesactualizados.map((cliente) => (
                          <TableRow key={cliente.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {cliente.nombre} {cliente.apellido}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {cliente.telefono}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {cliente.tipoVehiculo} - {cliente.modalidadTiempo} - {cliente.modalidadTecho}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                                ${cliente.ultimoMontoPagado.toLocaleString()}
                              </Typography>
                              {cliente.ultimaFechaPago && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {new Date(cliente.ultimaFechaPago).toLocaleDateString('es-AR')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                ${cliente.precioConfigurado.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                +${cliente.diferencia.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${cliente.porcentajeDiferencia.toFixed(1)}%`}
                                color={getSeveridad(cliente.porcentajeDiferencia)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default DetectorPreciosDesactualizados;