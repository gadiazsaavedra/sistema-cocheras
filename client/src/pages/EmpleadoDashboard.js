import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
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
  DialogActions,
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
import { clientesFirestore, pagosFirestore } from '../services/firestore';
import { useAuth } from '../hooks/useAuth';
import { calcularEstadoCliente, getEstadoTexto } from '../utils/morosidad';
import ClienteItem from '../components/MemoizedClienteItem';

// Lazy loading del componente de cámara
const CameraCapture = lazy(() => import('../components/CameraCapture'));

const EmpleadoDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [todosLosPagos, setTodosLosPagos] = useState([]);
  const [openPago, setOpenPago] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [pagoData, setPagoData] = useState({
    monto: '',
    tipoPago: 'efectivo',
    foto: null,
    esMoroso: false,
    montoMinimo: 0,
    diasVencido: 0
  });
  const [ubicacion, setUbicacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openClienteForm, setOpenClienteForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    tipoVehiculo: 'auto',
    modalidadTiempo: 'diurna',
    modalidadTecho: 'bajo_techo',
    precio: ''
  });
  const [busquedaCliente, setBusquedaCliente] = useState('');

  useEffect(() => {
    cargarClientes();
    cargarPagos();
    obtenerUbicacion();
    
    // Recargar datos cada 10 segundos para mantener actualizado
    const interval = setInterval(() => {
      cargarClientes();
      cargarPagos();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [cargarClientes, cargarPagos]);

  const cargarClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const response = await clientesFirestore.obtener({ 
        empleadoId: user?.uid,
        limite: 100 
      });
      const clientesData = response.datos || response;
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setMensaje('Error cargando clientes');
      setSnackbarOpen(true);
    } finally {
      setLoadingClientes(false);
    }
  }, [user?.uid]);

  const cargarPagos = useCallback(async () => {
    try {
      const response = await pagosFirestore.obtener({ 
        empleadoId: user?.uid,
        limite: 50 
      });
      const pagosData = response.datos || response;
      setTodosLosPagos(pagosData);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  }, [user?.uid]);

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

  const handleRegistrarPago = useCallback((cliente) => {
    const estadoMorosidad = calcularEstadoCliente(cliente, todosLosPagos);
    const esMoroso = estadoMorosidad.estado === 'moroso' || estadoMorosidad.estado === 'vencido';
    
    setSelectedCliente(cliente);
    
    // Si es moroso, calcular deuda total + mes actual
    let montoRequerido = cliente.precio || 0;
    if (esMoroso) {
      // Deuda acumulada + mes actual
      const mesesVencidos = Math.ceil(estadoMorosidad.diasVencido / 30);
      montoRequerido = (cliente.precio || 0) * (mesesVencidos + 1);
    }
    
    setPagoData({ 
      monto: montoRequerido.toString(), 
      tipoPago: 'efectivo', 
      foto: null,
      esMoroso,
      montoMinimo: montoRequerido,
      diasVencido: estadoMorosidad.diasVencido
    });
    setOpenPago(true);
  }, [todosLosPagos]);

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
    
    // Validar monto mínimo para clientes morosos
    if (pagoData.esMoroso && parseFloat(pagoData.monto) < pagoData.montoMinimo) {
      setMensaje(`❌ Cliente moroso debe pagar mínimo $${pagoData.montoMinimo.toLocaleString()} (deuda + mes actual)`);
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const pagoDataFirestore = {
        clienteId: selectedCliente.id,
        clienteNombre: `${selectedCliente.nombre} ${selectedCliente.apellido}`,
        monto: pagoData.monto,
        tipoPago: pagoData.tipoPago,
        ubicacion,
        foto: pagoData.foto
      };

      await pagosFirestore.crear(pagoDataFirestore);
      setMensaje('✅ Pago registrado exitosamente. Pendiente de confirmación.');
      setSnackbarOpen(true);
      setOpenPago(false);
      setPagoData({ monto: '', tipoPago: 'efectivo', foto: null, esMoroso: false, montoMinimo: 0, diasVencido: 0 });
      
      // Recargar datos inmediatamente para actualizar estados
      await Promise.all([cargarClientes(), cargarPagos()]);
      
      // Recargar nuevamente después de 2 segundos por si hay delay en el servidor
      setTimeout(() => {
        cargarClientes();
        cargarPagos();
      }, 2000);
    } catch (error) {
      console.error('Error completo:', error);
      setMensaje(`❌ Error: ${error.message || 'Error registrando pago. Intente nuevamente.'}`);
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

  const handleSaveNuevoCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.apellido || !nuevoCliente.telefono) {
      setMensaje('Complete todos los campos obligatorios');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const clienteData = {
        ...nuevoCliente,
        empleadoAsignado: user.email,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo'
      };
      
      const clienteCreado = await clientesFirestore.crear(clienteData);
      
      // Recargar datos para obtener información actualizada
      await Promise.all([cargarClientes(), cargarPagos()]);
      
      setMensaje('✅ Cliente creado exitosamente');
      setSnackbarOpen(true);
      setOpenClienteForm(false);
      
      // Limpiar formulario
      setNuevoCliente({
        nombre: '',
        apellido: '',
        telefono: '',
        tipoVehiculo: 'auto',
        modalidadTiempo: 'diurna',
        modalidadTecho: 'bajo_techo',
        precio: ''
      });
      
    } catch (error) {
      console.error('Error creando cliente:', error);
      setMensaje('❌ Error creando cliente');
      setSnackbarOpen(true);
    }
    setLoading(false);
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

        {/* Sección de Clientes Morosos */}
        {(() => {
          const clientesConEstado = clientes.map(cliente => ({
            ...cliente,
            estadoMorosidad: calcularEstadoCliente(cliente, todosLosPagos)
          }));
          const clientesMorosos = clientesConEstado.filter(c => 
            c.estadoMorosidad.estado === 'moroso' || c.estadoMorosidad.estado === 'vencido'
          );
          
          if (clientesMorosos.length === 0) return null;
          
          return (
            <Card elevation={3} sx={{ mb: 3, border: '2px solid #f44336' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    🚨 CLIENTES MOROSOS ({clientesMorosos.length})
                  </Typography>
                </Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    💡 <strong>Importante:</strong> Estos clientes tienen pagos vencidos. 
                    Reclame el pago cuando los vea en el negocio.
                  </Typography>
                </Alert>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {clientesMorosos.map((cliente) => (
                    <ListItem 
                      key={cliente.id}
                      sx={{ 
                        border: '1px solid #f44336',
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'stretch' : 'center'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                              {cliente.nombre} {cliente.apellido}
                            </Typography>
                            <Chip 
                              label={getEstadoTexto(cliente.estadoMorosidad)}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              📞 {cliente.telefono}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              🚗 {cliente.tipoVehiculo} - 🏠 {cliente.numeroCochera}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                              💰 Debe: ${cliente.precio?.toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        sx={{ mb: isMobile ? 2 : 0 }}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleRegistrarPago(cliente)}
                        startIcon={<Payment />}
                        fullWidth={isMobile}
                        sx={{ 
                          minWidth: isMobile ? 'auto' : 140,
                          height: 40,
                          fontWeight: 'bold'
                        }}
                      >
                        {isMobile ? 'Cobrar Deuda' : 'COBRAR'}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          );
        })()
        }

        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Payment sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Clientes Asignados ({clientes.length})
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Add />}
                    onClick={() => setOpenClienteForm(true)}
                    size="small"
                  >
                    Nuevo Cliente
                  </Button>
                </Box>
                
                {loadingClientes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                  {/* Barra de búsqueda */}
                  <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="🔍 Buscar cliente por nombre, teléfono o vehículo..."
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    sx={{ 
                      bgcolor: 'white',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  {busquedaCliente && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {(() => {
                        const filtrados = clientes.filter(cliente => 
                          `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                          cliente.telefono?.includes(busquedaCliente) ||
                          cliente.tipoVehiculo?.toLowerCase().includes(busquedaCliente.toLowerCase())
                        );
                        return `${filtrados.length} de ${clientes.length} clientes`;
                      })()
                      }
                    </Typography>
                  )}
                </Box>
                
                <List sx={{ maxHeight: isMobile ? 400 : 500, overflow: 'auto' }}>
                    {clientes
                      .filter(cliente => {
                        if (!busquedaCliente.trim()) return true;
                        const busqueda = busquedaCliente.toLowerCase();
                        return (
                          `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busqueda) ||
                          cliente.telefono?.includes(busqueda) ||
                          cliente.tipoVehiculo?.toLowerCase().includes(busqueda)
                        );
                      })
                      .map((cliente) => {
                      const estadoMorosidad = calcularEstadoCliente(cliente, todosLosPagos);
                      const esMoroso = estadoMorosidad.estado === 'moroso' || estadoMorosidad.estado === 'vencido';
                      
                      return (
                        <ClienteItem
                          key={cliente.id}
                          cliente={cliente}
                          estadoMorosidad={estadoMorosidad}
                          esMoroso={esMoroso}
                          isMobile={isMobile}
                          onRegistrarPago={handleRegistrarPago}
                        />
                      );
                    })}
                    
                    {/* Mensaje cuando no hay resultados */}
                    {busquedaCliente && clientes.filter(cliente => {
                      const busqueda = busquedaCliente.toLowerCase();
                      return (
                        `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busqueda) ||
                        cliente.telefono?.includes(busqueda) ||
                        cliente.tipoVehiculo?.toLowerCase().includes(busqueda)
                      );
                    }).length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                              🔍 No se encontraron clientes con "{busquedaCliente}"
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                  </>
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
          Registrar Pago - {selectedCliente?.nombre} {selectedCliente?.apellido}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box sx={{ pt: 2 }}>
            {pagoData.esMoroso && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  🚨 CLIENTE MOROSO - {pagoData.diasVencido} días vencido
                </Typography>
                <Typography variant="body2">
                  💰 Debe pagar deuda completa + mes actual: <strong>${pagoData.montoMinimo.toLocaleString()}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  No se permite pago parcial hasta regularizar situación
                </Typography>
              </Alert>
            )}
            
            <TextField
              fullWidth
              label={pagoData.esMoroso ? "Monto Mínimo Requerido ($)" : "Monto ($)"}
              type="number"
              value={pagoData.monto}
              onChange={(e) => {
                const valor = parseFloat(e.target.value) || 0;
                if (pagoData.esMoroso && valor < pagoData.montoMinimo) {
                  // Permitir escribir pero mostrar error
                  setPagoData({...pagoData, monto: e.target.value});
                } else {
                  setPagoData({...pagoData, monto: e.target.value});
                }
              }}
              margin="normal"
              inputProps={{ 
                min: pagoData.esMoroso ? pagoData.montoMinimo : 0, 
                step: 0.01 
              }}
              size={isMobile ? 'medium' : 'medium'}
              error={pagoData.esMoroso && parseFloat(pagoData.monto) < pagoData.montoMinimo}
              helperText={
                pagoData.esMoroso 
                  ? `Monto mínimo: $${pagoData.montoMinimo.toLocaleString()} - ${parseFloat(pagoData.monto) < pagoData.montoMinimo ? '❌ Insuficiente' : '✅ Válido'}`
                  : `Precio sugerido: $${selectedCliente?.precio?.toLocaleString() || 0}`
              }
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
              <Suspense fallback={<CircularProgress />}>
                <CameraCapture
                  onCapture={(foto) => setPagoData({...pagoData, foto})}
                  captured={!!pagoData.foto}
                />
              </Suspense>
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
                disabled={
                  loading || 
                  !pagoData.foto || 
                  !pagoData.monto ||
                  (pagoData.esMoroso && parseFloat(pagoData.monto) < pagoData.montoMinimo)
                }
                fullWidth
                size="large"
                color={pagoData.esMoroso ? 'error' : 'primary'}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
              >
                {loading ? 'Registrando...' : 
                 pagoData.esMoroso ? `💰 Registrar Pago de Deuda ($${pagoData.montoMinimo.toLocaleString()})` : 
                 'Registrar Pago'
                }
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

      {/* Dialog para crear nuevo cliente */}
      <Dialog 
        open={openClienteForm} 
        onClose={() => setOpenClienteForm(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>
          🆕 Registrar Nuevo Cliente
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre *"
              value={nuevoCliente.nombre}
              onChange={(e) => {
                const valor = e.target.value;
                const nombreCapitalizado = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
                setNuevoCliente({...nuevoCliente, nombre: nombreCapitalizado});
              }}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Apellido *"
              value={nuevoCliente.apellido}
              onChange={(e) => {
                const valor = e.target.value;
                const apellidoCapitalizado = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
                setNuevoCliente({...nuevoCliente, apellido: apellidoCapitalizado});
              }}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Teléfono *"
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Vehículo</InputLabel>
              <Select
                value={nuevoCliente.tipoVehiculo}
                onChange={(e) => setNuevoCliente({...nuevoCliente, tipoVehiculo: e.target.value})}
              >
                <MenuItem value="moto">🏍️ Moto</MenuItem>
                <MenuItem value="auto">🚗 Auto</MenuItem>
                <MenuItem value="camioneta">🚙 Camioneta</MenuItem>
                <MenuItem value="furgon">🚐 Furgón</MenuItem>
                <MenuItem value="camion">🚚 Camión</MenuItem>
                <MenuItem value="trailer">🚛 Trailer</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Modalidad de Tiempo</InputLabel>
              <Select
                value={nuevoCliente.modalidadTiempo}
                onChange={(e) => setNuevoCliente({...nuevoCliente, modalidadTiempo: e.target.value})}
              >
                <MenuItem value="diurna">☀️ Diurna (8-17hs)</MenuItem>
                <MenuItem value="nocturna">🌙 Nocturna (17-8hs)</MenuItem>
                <MenuItem value="24hs">🔄 24 Horas</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Cobertura</InputLabel>
              <Select
                value={nuevoCliente.modalidadTecho}
                onChange={(e) => setNuevoCliente({...nuevoCliente, modalidadTecho: e.target.value})}
              >
                <MenuItem value="bajo_techo">🏠 Bajo Techo</MenuItem>
                <MenuItem value="bajo_carpa">⛺ Bajo Carpa</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Precio Mensual ($)"
              type="number"
              value={nuevoCliente.precio}
              onChange={(e) => setNuevoCliente({...nuevoCliente, precio: e.target.value})}
              margin="normal"
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            onClick={handleSaveNuevoCliente}
            disabled={loading}
            fullWidth
            size="large"
          >
            {loading ? 'Creando...' : '✅ Crear Cliente'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenClienteForm(false)}
            disabled={loading}
            fullWidth
            size="large"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmpleadoDashboard;