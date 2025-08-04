import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Refresh, Home, DirectionsCar, Settings, Save, Cancel } from '@mui/icons-material';
import { clientesFirestore } from '../services/firestore';

const ReporteDisponibilidad = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({});
  const [editandoCapacidades, setEditandoCapacidades] = useState(false);
  const [capacidadesTemp, setCapacidadesTemp] = useState({});

  // Obtener capacidades guardadas o usar valores por defecto
  const getCapacidadesGuardadas = () => {
    const guardadas = localStorage.getItem('capacidadesCocheras');
    if (guardadas) {
      return JSON.parse(guardadas);
    }
    return {
      'bajo_techo': { diurna: 50, nocturna: 30, '24hs': 20 },
      'bajo_carpa': { diurna: 40, nocturna: 25, '24hs': 15 }
    };
  };
  
  const [capacidadesActuales, setCapacidadesActuales] = useState(getCapacidadesGuardadas());

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    if (editandoCapacidades) return; // No recargar si está editando
    
    setLoading(true);
    try {
      const clientesResponse = await clientesFirestore.obtener();
      const clientesData = clientesResponse.datos || clientesResponse || [];
      setClientes(clientesData);
      calcularEstadisticas(clientesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
    setLoading(false);
  };
  
  const iniciarEdicionCapacidades = () => {
    setCapacidadesTemp(JSON.parse(JSON.stringify(capacidadesActuales)));
    setEditandoCapacidades(true);
  };
  
  const guardarCapacidades = () => {
    // Guardar en localStorage
    localStorage.setItem('capacidadesCocheras', JSON.stringify(capacidadesTemp));
    // Actualizar estado actual
    setCapacidadesActuales(capacidadesTemp);
    // Cerrar modal
    setEditandoCapacidades(false);
    // Recalcular estadísticas con nuevas capacidades
    calcularEstadisticas(clientes);
  };
  
  const cancelarEdicion = () => {
    setEditandoCapacidades(false);
    setCapacidadesTemp({});
  };
  
  const actualizarCapacidad = (techo, tiempo, valor) => {
    setCapacidadesTemp(prev => ({
      ...prev,
      [techo]: {
        ...prev[techo],
        [tiempo]: parseInt(valor) || 0
      }
    }));
  };

  const calcularEstadisticas = (clientesData) => {
    const stats = {
      'bajo_techo': { diurna: 0, nocturna: 0, '24hs': 0 },
      'bajo_carpa': { diurna: 0, nocturna: 0, '24hs': 0 }
    };

    (clientesData || []).forEach(cliente => {
      if (cliente.estado === 'activo') {
        const techo = cliente.modalidadTecho?.replace(' ', '_') || 'bajo_techo';
        const tiempo = cliente.modalidadTiempo || 'diurna';
        
        if (stats[techo] && stats[techo][tiempo] !== undefined) {
          stats[techo][tiempo]++;
        }
      }
    });

    setEstadisticas(stats);
  };

  const getDisponibilidad = (techo, tiempo) => {
    const ocupadas = estadisticas[techo]?.[tiempo] || 0;
    const capacidad = capacidadesActuales[techo]?.[tiempo] || 0;
    const disponibles = capacidad - ocupadas;
    const porcentaje = capacidad > 0 ? (ocupadas / capacidad) * 100 : 0;

    return {
      ocupadas,
      disponibles,
      capacidad,
      porcentaje: Math.round(porcentaje)
    };
  };

  const getColorEstado = (porcentaje) => {
    if (porcentaje >= 90) return 'error';
    if (porcentaje >= 70) return 'warning';
    return 'success';
  };

  const getTextoEstado = (disponibles, porcentaje) => {
    if (disponibles <= 0) return '🔴 COMPLETO';
    if (porcentaje >= 90) return '🟡 CRÍTICO';
    if (porcentaje >= 70) return '🟠 LIMITADO';
    return '🟢 DISPONIBLE';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📊 Disponibilidad de Cocheras
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={iniciarEdicionCapacidades}
            color="secondary"
          >
            Configurar Capacidades
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={cargarDatos}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Capacidades configuradas:</strong> Bajo Techo (Diurna: {capacidadesActuales.bajo_techo?.diurna}, Nocturna: {capacidadesActuales.bajo_techo?.nocturna}, 24hs: {capacidadesActuales.bajo_techo?.['24hs']}) | 
          Bajo Carpa (Diurna: {capacidadesActuales.bajo_carpa?.diurna}, Nocturna: {capacidadesActuales.bajo_carpa?.nocturna}, 24hs: {capacidadesActuales.bajo_carpa?.['24hs']})
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Resumen General */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCar sx={{ mr: 1 }} />
                Resumen General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="h4" color="white">
                      {(clientes || []).filter(c => c.estado === 'activo').length}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Total Ocupadas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h4" color="white">
                      {Object.values(capacidadesActuales).reduce((total, techo) => 
                        total + Object.values(techo).reduce((sum, cap) => sum + cap, 0), 0) - 
                       (clientes || []).filter(c => c.estado === 'activo').length}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Total Disponibles
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="h4" color="white">
                      {Object.values(capacidadesActuales).reduce((total, techo) => 
                        total + Object.values(techo).reduce((sum, cap) => sum + cap, 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Capacidad Total
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h4" color="white">
                      {Math.round(((clientes || []).filter(c => c.estado === 'activo').length / 
                        Object.values(capacidadesActuales).reduce((total, techo) => 
                          total + Object.values(techo).reduce((sum, cap) => sum + cap, 0), 0)) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="white">
                      Ocupación General
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Detalle por Modalidad */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Home sx={{ mr: 1 }} />
                Disponibilidad Detallada
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><strong>Tipo de Cobertura</strong></TableCell>
                      <TableCell><strong>Modalidad</strong></TableCell>
                      <TableCell><strong>Ocupadas</strong></TableCell>
                      <TableCell><strong>Disponibles</strong></TableCell>
                      <TableCell><strong>Capacidad</strong></TableCell>
                      <TableCell><strong>% Ocupación</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(capacidadesActuales).map(([techo, modalidades]) =>
                      Object.entries(modalidades).map(([tiempo, capacidad]) => {
                        const disponibilidad = getDisponibilidad(techo, tiempo);
                        return (
                          <TableRow key={`${techo}-${tiempo}`}>
                            <TableCell>
                              {techo === 'bajo_techo' ? '🏠 Bajo Techo' : '⛺ Bajo Carpa'}
                            </TableCell>
                            <TableCell>
                              {tiempo === 'diurna' ? '☀️ Diurna (8-17hs)' : 
                               tiempo === 'nocturna' ? '🌙 Nocturna (17-8hs)' : 
                               '🔄 24 Horas'}
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" color="primary">
                                {disponibilidad.ocupadas}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="h6" 
                                color={disponibilidad.disponibles > 0 ? 'success.main' : 'error.main'}
                              >
                                {disponibilidad.disponibles}
                              </Typography>
                            </TableCell>
                            <TableCell>{disponibilidad.capacidad}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${disponibilidad.porcentaje}%`}
                                color={getColorEstado(disponibilidad.porcentaje)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {getTextoEstado(disponibilidad.disponibles, disponibilidad.porcentaje)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Dialog para configurar capacidades */}
      <Dialog 
        open={editandoCapacidades} 
        onClose={() => setEditandoCapacidades(false)} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>
          ⚙️ Configurar Capacidades de Cocheras
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Configure la cantidad máxima de cocheras disponibles para cada modalidad.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    🏠 Bajo Techo
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="☀️ Diurna (8-17hs)"
                        type="number"
                        value={capacidadesTemp.bajo_techo?.diurna || ''}
                        onChange={(e) => actualizarCapacidad('bajo_techo', 'diurna', e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="🌙 Nocturna (17-8hs)"
                        type="number"
                        value={capacidadesTemp.bajo_techo?.nocturna || ''}
                        onChange={(e) => actualizarCapacidad('bajo_techo', 'nocturna', e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="🔄 24 Horas"
                        type="number"
                        value={capacidadesTemp.bajo_techo?.['24hs'] || ''}
                        onChange={(e) => actualizarCapacidad('bajo_techo', '24hs', e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="secondary">
                    ⛺ Bajo Carpa
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="☀️ Diurna (8-17hs)"
                        type="number"
                        value={capacidadesTemp.bajo_carpa?.diurna || ''}
                        onChange={(e) => actualizarCapacidad('bajo_carpa', 'diurna', e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="🌙 Nocturna (17-8hs)"
                        type="number"
                        value={capacidadesTemp.bajo_carpa?.nocturna || ''}
                        onChange={(e) => actualizarCapacidad('bajo_carpa', 'nocturna', e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="🔄 24 Horas"
                        type="number"
                        value={capacidadesTemp.bajo_carpa?.['24hs'] || ''}
                        onChange={(e) => actualizarCapacidad('bajo_carpa', '24hs', e.target.value)}
                        inputProps={{ min: 0, max: 999 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={guardarCapacidades}
            size="large"
          >
            💾 Guardar Configuración
          </Button>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={cancelarEdicion}
            size="large"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReporteDisponibilidad;