import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { TrendingUp, Preview, History, Check, Cancel } from '@mui/icons-material';
import { clientesFirestore, aumentosFirestore } from '../services/firestore';

const GestionPrecios = () => {
  const [clientes, setClientes] = useState([]);
  const [aumentoConfig, setAumentoConfig] = useState({
    monto: '',
    periodo: 30,
    categoria: 'todos',
    subcategoria: '',
    fechaEfectiva: new Date().toISOString().split('T')[0]
  });
  const [clientesAfectados, setClientesAfectados] = useState([]);
  const [openPreview, setOpenPreview] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [historialAumentos, setHistorialAumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarClientes();
    cargarHistorial();
  }, []);

  useEffect(() => {
    calcularClientesAfectados();
  }, [aumentoConfig, clientes]);

  const cargarClientes = async () => {
    try {
      const response = await clientesFirestore.obtener();
      const clientesData = response.datos || response || [];
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setClientes([]);
    }
  };

  const cargarHistorial = async () => {
    try {
      const response = await aumentosFirestore.obtener();
      const historialData = response.datos || response || [];
      setHistorialAumentos(historialData);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setHistorialAumentos([]);
    }
  };

  const calcularClientesAfectados = () => {
    let filtrados = [...(clientes || [])];

    // Filtrar por categoría
    if (aumentoConfig.categoria === 'vehiculo' && aumentoConfig.subcategoria) {
      filtrados = filtrados.filter(c => c.tipoVehiculo === aumentoConfig.subcategoria);
    } else if (aumentoConfig.categoria === 'empleado' && aumentoConfig.subcategoria) {
      filtrados = filtrados.filter(c => c.empleadoAsignado === aumentoConfig.subcategoria);
    } else if (aumentoConfig.categoria === 'modalidad' && aumentoConfig.subcategoria) {
      filtrados = filtrados.filter(c => c.modalidadTiempo === aumentoConfig.subcategoria);
    } else if (aumentoConfig.categoria === 'cobertura' && aumentoConfig.subcategoria) {
      filtrados = filtrados.filter(c => c.modalidadTecho === aumentoConfig.subcategoria);
    }

    // Calcular nuevos precios
    const conAumento = filtrados.map(cliente => ({
      ...cliente,
      precioAnterior: cliente.precio || 0,
      precioNuevo: (cliente.precio || 0) + parseFloat(aumentoConfig.monto || 0),
      diferencia: parseFloat(aumentoConfig.monto || 0)
    }));

    setClientesAfectados(conAumento);
  };

  const handlePreview = () => {
    if (!aumentoConfig.monto || parseFloat(aumentoConfig.monto) <= 0) {
      setMensaje('❌ Ingrese un monto válido');
      return;
    }
    setOpenPreview(true);
  };

  const handleAplicarAumento = async () => {
    setLoading(true);
    try {
      // Crear registro del aumento
      const aumentoData = {
        fecha: new Date().toISOString(),
        monto: parseFloat(aumentoConfig.monto),
        periodo: aumentoConfig.periodo,
        categoria: aumentoConfig.categoria,
        subcategoria: aumentoConfig.subcategoria,
        fechaEfectiva: aumentoConfig.fechaEfectiva,
        clientesAfectados: clientesAfectados.length,
        aplicadoPor: 'admin',
        detalles: clientesAfectados.map(c => ({
          clienteId: c.id,
          nombre: `${c.nombre} ${c.apellido}`,
          precioAnterior: c.precioAnterior,
          precioNuevo: c.precioNuevo
        }))
      };

      // Actualizar precios de clientes
      const updatePromises = clientesAfectados.map(cliente =>
        clientesFirestore.actualizar(cliente.id, { precio: cliente.precioNuevo })
      );

      await Promise.all(updatePromises);

      // Guardar historial
      await aumentosFirestore.crear(aumentoData);

      setMensaje(`✅ Aumento aplicado a ${clientesAfectados.length} clientes`);
      setOpenConfirm(false);
      setOpenPreview(false);
      
      // Limpiar formulario
      setAumentoConfig({
        monto: '',
        periodo: 30,
        categoria: 'todos',
        subcategoria: '',
        fechaEfectiva: new Date().toISOString().split('T')[0]
      });

      // Recargar datos
      cargarClientes();
      cargarHistorial();

    } catch (error) {
      console.error('Error aplicando aumento:', error);
      setMensaje('❌ Error aplicando aumento');
    }
    setLoading(false);
  };

  const getSubcategorias = () => {
    switch (aumentoConfig.categoria) {
      case 'vehiculo':
        return ['moto', 'auto', 'camioneta', 'furgon', 'camion', 'trailer'];
      case 'empleado':
        return ['victor.cocheras@sistema.local', 'raul.cocheras@sistema.local', 'carlos.cocheras@sistema.local', 'fernando.cocheras@sistema.local'];
      case 'modalidad':
        return ['diurna', 'nocturna', '24hs'];
      case 'cobertura':
        return ['bajo_techo', 'bajo_carpa'];
      default:
        return [];
    }
  };

  const totalAumentoMensual = clientesAfectados.reduce((sum, c) => sum + c.diferencia, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUp sx={{ mr: 1 }} />
        💰 Gestión de Precios
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

      <Grid container spacing={3}>
        {/* Configuración del Aumento */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Configurar Aumento
              </Typography>

              <TextField
                fullWidth
                label="Monto del Aumento ($)"
                type="number"
                value={aumentoConfig.monto}
                onChange={(e) => setAumentoConfig({...aumentoConfig, monto: e.target.value})}
                margin="normal"
                inputProps={{ min: 0, step: 100 }}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Período de Aplicación</InputLabel>
                <Select
                  value={aumentoConfig.periodo}
                  onChange={(e) => setAumentoConfig({...aumentoConfig, periodo: e.target.value})}
                >
                  <MenuItem value={30}>30 días</MenuItem>
                  <MenuItem value={60}>60 días</MenuItem>
                  <MenuItem value={90}>90 días</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Aplicar a</InputLabel>
                <Select
                  value={aumentoConfig.categoria}
                  onChange={(e) => setAumentoConfig({...aumentoConfig, categoria: e.target.value, subcategoria: ''})}
                >
                  <MenuItem value="todos">🌐 Todos los clientes</MenuItem>
                  <MenuItem value="vehiculo">🚗 Por tipo de vehículo</MenuItem>
                  <MenuItem value="empleado">👤 Por empleado</MenuItem>
                  <MenuItem value="modalidad">🕐 Por modalidad de tiempo</MenuItem>
                  <MenuItem value="cobertura">🏠 Por tipo de cobertura</MenuItem>
                </Select>
              </FormControl>

              {aumentoConfig.categoria !== 'todos' && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Seleccionar</InputLabel>
                  <Select
                    value={aumentoConfig.subcategoria}
                    onChange={(e) => setAumentoConfig({...aumentoConfig, subcategoria: e.target.value})}
                  >
                    {getSubcategorias().map(sub => (
                      <MenuItem key={sub} value={sub}>
                        {sub.charAt(0).toUpperCase() + sub.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                label="Fecha Efectiva"
                type="date"
                value={aumentoConfig.fechaEfectiva}
                onChange={(e) => setAumentoConfig({...aumentoConfig, fechaEfectiva: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Preview />}
                  onClick={handlePreview}
                  disabled={!aumentoConfig.monto || clientesAfectados.length === 0}
                >
                  Vista Previa
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Resumen del Aumento
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Clientes afectados:</Typography>
                <Typography variant="h4" color="primary.main">
                  {clientesAfectados.length}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Aumento por cliente:</Typography>
                <Typography variant="h5" color="success.main">
                  ${parseFloat(aumentoConfig.monto || 0).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Aumento mensual total:</Typography>
                <Typography variant="h5" color="success.main">
                  ${totalAumentoMensual.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Categoría:</Typography>
                <Chip 
                  label={
                    aumentoConfig.categoria === 'todos' ? 'Todos los clientes' :
                    `${aumentoConfig.categoria}: ${aumentoConfig.subcategoria}`
                  }
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Historial de Aumentos */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} />
                📋 Historial de Aumentos
              </Typography>
              
              {historialAumentos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No hay aumentos registrados
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Monto</TableCell>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Clientes Afectados</TableCell>
                        <TableCell>Total Mensual</TableCell>
                        <TableCell>Aplicado Por</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historialAumentos.slice(0, 10).map((aumento) => (
                        <TableRow key={aumento.id}>
                          <TableCell>
                            {new Date(aumento.fechaCreacion).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            +${aumento.monto?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                aumento.categoria === 'todos' ? 'Todos' :
                                `${aumento.categoria}: ${aumento.subcategoria}`
                              }
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>{aumento.clientesAfectados}</TableCell>
                          <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            ${(aumento.monto * aumento.clientesAfectados)?.toLocaleString()}
                          </TableCell>
                          <TableCell>{aumento.aplicadoPor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Vista Previa */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          👀 Vista Previa del Aumento
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se aplicará un aumento de <strong>${parseFloat(aumentoConfig.monto || 0).toLocaleString()}</strong> a <strong>{clientesAfectados.length} clientes</strong>
          </Alert>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Precio Actual</TableCell>
                  <TableCell>Precio Nuevo</TableCell>
                  <TableCell>Diferencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesAfectados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
                    <TableCell>${cliente.precioAnterior.toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      ${cliente.precioNuevo.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main' }}>
                      +${cliente.diferencia.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            startIcon={<Check />}
            onClick={() => {
              setOpenPreview(false);
              setOpenConfirm(true);
            }}
          >
            Aplicar Aumento
          </Button>
          <Button variant="outlined" onClick={() => setOpenPreview(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmación */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          ⚠️ Confirmar Aumento Masivo
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Esta acción NO se puede deshacer
            </Typography>
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            ¿Está seguro de aplicar un aumento de <strong>${parseFloat(aumentoConfig.monto || 0).toLocaleString()}</strong> a <strong>{clientesAfectados.length} clientes</strong>?
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            • Aumento mensual total: ${totalAumentoMensual.toLocaleString()}<br/>
            • Fecha efectiva: {aumentoConfig.fechaEfectiva}<br/>
            • Los precios se actualizarán inmediatamente
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={handleAplicarAumento}
            disabled={loading}
            startIcon={<Check />}
          >
            {loading ? 'Aplicando...' : 'SÍ, Aplicar Aumento'}
          </Button>
          <Button variant="outlined" onClick={() => setOpenConfirm(false)} disabled={loading}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionPrecios;