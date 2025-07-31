import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Fab,
  Snackbar
} from '@mui/material';
import { 
  Camera, 
  Logout, 
  LocationOn, 
  Payment,
  Person,
  Add
} from '@mui/icons-material';
import { clientesAPI, pagosAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CameraCapture from '../components/CameraCapture';

const EmpleadoDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [openPago, setOpenPago] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [pagoData, setPagoData] = useState({
    monto: '',
    tipoPago: 'efectivo',
    foto: null
  });
  const [ubicacion, setUbicacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    cargarClientes();
    obtenerUbicacion();
  }, []);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const response = await clientesAPI.obtener();
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setMensaje('Error cargando clientes');
      setSnackbarOpen(true);
    } finally {
      setLoadingClientes(false);
    }
  };

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacion({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          // Para desarrollo, usar ubicación simulada
          if (window.location.hostname !== 'localhost') {
            setUbicacion({
              lat: -34.6037,
              lng: -58.3816,
              timestamp: Date.now(),
              simulada: true
            });
            setMensaje('📍 Usando ubicación simulada (Buenos Aires)');
          } else {
            setMensaje('No se pudo obtener la ubicación. Verifique los permisos.');
          }
          setSnackbarOpen(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setMensaje('Geolocalización no disponible en este dispositivo');
      setSnackbarOpen(true);
    }
  };

  const handleRegistrarPago = (cliente) => {
    setSelectedCliente(cliente);
    setPagoData({ monto: cliente.precio || '', tipoPago: 'efectivo', foto: null });
    setOpenPago(true);
  };

  const handleSubmitPago = async () => {
    if (!pagoData.foto) {
      setMensaje('Debe tomar una foto del comprobante');
      setSnackbarOpen(true);
      return;
    }

    if (!ubicacion) {
      setMensaje('Obteniendo ubicación...');
      setSnackbarOpen(true);
      obtenerUbicacion();
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('clienteId', selectedCliente.id);
      formData.append('monto', pagoData.monto);
      formData.append('tipoPago', pagoData.tipoPago);
      formData.append('ubicacion', JSON.stringify(ubicacion));
      formData.append('comprobante', pagoData.foto);

      await pagosAPI.crear(formData);
      setMensaje('✅ Pago registrado exitosamente. Pendiente de confirmación.');
      setSnackbarOpen(true);
      setOpenPago(false);
      setPagoData({ monto: '', tipoPago: 'efectivo', foto: null });
    } catch (error) {
      setMensaje('❌ Error registrando pago. Intente nuevamente.');
      setSnackbarOpen(true);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      setMensaje('Error al cerrar sesión');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header con logout */}
      <AppBar position="sticky" sx={{ mb: 2 }}>
        <Toolbar>
          <Person sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.email?.split('@')[0] || 'Empleado'}
          </Typography>
          {ubicacion && (
            <Chip 
              icon={<LocationOn />} 
              label="GPS" 
              color="success" 
              size="small" 
              sx={{ mr: 1 }}
            />
          )}
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth={isMobile ? 'sm' : 'lg'} sx={{ pb: 10 }}>
        <Typography 
          variant={isMobile ? 'h5' : 'h4'} 
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 3 }}
        >
          💰 Panel de Empleado
        </Typography>

        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Clientes Asignados ({clientes.length})
                  </Typography>
                </Box>
                
                {loadingClientes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <List sx={{ maxHeight: isMobile ? 400 : 500, overflow: 'auto' }}>
                    {clientes.map((cliente) => (
                      <ListItem 
                        key={cliente.id}
                        sx={{ 
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          mb: 1,
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'stretch' : 'center'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {cliente.nombre}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                🏠 Cochera: {cliente.numeroCochera}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                🕰️ {cliente.modalidadTiempo} {cliente.modalidadTecho}
                              </Typography>
                              {cliente.precio && (
                                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                  💵 ${cliente.precio}
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{ mb: isMobile ? 2 : 0 }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleRegistrarPago(cliente)}
                          startIcon={<Add />}
                          fullWidth={isMobile}
                          sx={{ 
                            minWidth: isMobile ? 'auto' : 140,
                            height: 40
                          }}
                        >
                          {isMobile ? 'Registrar Pago' : 'Pago'}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Dialog optimizado para móvil */}
      <Dialog 
        open={openPago} 
        onClose={() => setOpenPago(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Payment sx={{ mr: 1 }} />
          Registrar Pago - {selectedCliente?.nombre}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Monto ($)"
              type="number"
              value={pagoData.monto}
              onChange={(e) => setPagoData({...pagoData, monto: e.target.value})}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
              size={isMobile ? 'medium' : 'medium'}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Pago</InputLabel>
              <Select
                value={pagoData.tipoPago}
                onChange={(e) => setPagoData({...pagoData, tipoPago: e.target.value})}
                size={isMobile ? 'medium' : 'medium'}
              >
                <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
                <MenuItem value="tarjeta">💳 Tarjeta</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                📷 Foto del Comprobante *
              </Typography>
              <CameraCapture
                onCapture={(foto) => setPagoData({...pagoData, foto})}
                captured={!!pagoData.foto}
              />
            </Box>

            {ubicacion && (
              <Alert severity="success" sx={{ mt: 2 }}>
                📍 Ubicación {ubicacion.simulada ? 'simulada' : 'GPS'} capturada
              </Alert>
            )}

            <Box sx={{ 
              mt: 3, 
              display: 'flex', 
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <Button
                variant="contained"
                onClick={handleSubmitPago}
                disabled={loading || !pagoData.foto || !pagoData.monto}
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
              >
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenPago(false)}
                fullWidth
                size="large"
                disabled={loading}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={mensaje.includes('❌') || mensaje.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmpleadoDashboard;