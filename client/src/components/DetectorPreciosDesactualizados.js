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
          
          // Obtener pagos confirmados del cliente ordenados por fecha
          const pagosCliente = pagos
            .filter(pago => pago.clienteId === cliente.id && pago.estado === 'confirmado')
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
          
          const ultimoPago = pagosCliente[0];
          const ultimoMontoPagado = ultimoPago ? ultimoPago.monto : 0;
          
          // Verificar si lleva 3+ meses pagando el mismo precio
          const hace3Meses = new Date();
          hace3Meses.setMonth(hace3Meses.getMonth() - 3);
          
          const pagosUltimos3Meses = pagosCliente.filter(pago => 
            new Date(pago.fechaRegistro) >= hace3Meses
          );
          
          const mismoPrecioPor3Meses = pagosUltimos3Meses.length >= 3 && 
            pagosUltimos3Meses.every(pago => pago.monto === ultimoMontoPagado);
          
          // Debug específico para Rosa Germano
          if (cliente.nombre?.toLowerCase().includes('rosa') || cliente.apellido?.toLowerCase().includes('germano')) {
            console.log('🌹 DEBUG ROSA GERMANO:');
            console.log('  - Total pagos cliente:', pagosCliente.length);
            console.log('  - Pagos últimos 3 meses:', pagosUltimos3Meses.length);
            console.log('  - Último monto pagado:', ultimoMontoPagado);
            console.log('  - Fecha hace 3 meses:', hace3Meses.toISOString());
            console.log('  - Mismo precio por 3 meses:', mismoPrecioPor3Meses);
            console.log('  - Pagos últimos 3 meses:', pagosUltimos3Meses.map(p => ({
              fecha: p.fechaRegistro,
              monto: p.monto,
              estado: p.estado
            })));
          }
          
          const diferencia = precioConfigurado - ultimoMontoPagado;
          
          return {
            ...cliente,
            precioConfigurado,
            ultimoMontoPagado,
            ultimaFechaPago: ultimoPago ? ultimoPago.fechaRegistro : null,
            diferencia,
            porcentajeDiferencia: precioConfigurado > 0 ? ((diferencia / precioConfigurado) * 100) : 0,
            necesitaAjuste: diferencia > 0,
            mismoPrecioPor3Meses,
            cantidadPagosUltimos3Meses: pagosUltimos3Meses.length,
            alertaPrecioEstancado: mismoPrecioPor3Meses && diferencia >= 0 // Cambiar > 0 a >= 0 para incluir casos sin diferencia de precio configurado
          };
        })
        .filter(cliente => {
          // Debug para Rosa
          if (cliente.nombre?.toLowerCase().includes('rosa') || cliente.apellido?.toLowerCase().includes('germano')) {
            console.log('🌹 FILTRO ROSA:', {
              necesitaAjuste: cliente.necesitaAjuste,
              alertaPrecioEstancado: cliente.alertaPrecioEstancado,
              pasaFiltro: cliente.necesitaAjuste || cliente.alertaPrecioEstancado
            });
          }
          return cliente.necesitaAjuste || cliente.alertaPrecioEstancado;
        })
        .sort((a, b) => {
          // Priorizar alertas de precio estancado
          if (a.alertaPrecioEstancado && !b.alertaPrecioEstancado) return -1;
          if (!a.alertaPrecioEstancado && b.alertaPrecioEstancado) return 1;
          return b.diferencia - a.diferencia;
        });

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
                  {clientesDesactualizados.filter(c => c.alertaPrecioEstancado).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ⚠️ Precio estancado 3+ meses
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
                          <TableCell>Estado</TableCell>
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
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Chip 
                                  label={`${cliente.porcentajeDiferencia.toFixed(1)}%`}
                                  color={getSeveridad(cliente.porcentajeDiferencia)}
                                  size="small"
                                />
                                {cliente.alertaPrecioEstancado && (
                                  <Chip 
                                    label="🚨 3+ meses mismo precio"
                                    color="error"
                                    size="small"
                                    sx={{ 
                                      animation: 'pulse 2s infinite',
                                      '@keyframes pulse': {
                                        '0%': { opacity: 1 },
                                        '50%': { opacity: 0.7 },
                                        '100%': { opacity: 1 }
                                      }
                                    }}
                                  />
                                )}
                              </Box>
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