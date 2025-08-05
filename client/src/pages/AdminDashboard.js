import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import {
  Container,
  Grid,
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { CheckCircle, Cancel, Print, Add, Edit, History, Delete, Warning, Visibility, PhotoCamera, Payment, Upload, Schedule } from '@mui/icons-material';
import { pagosFirestore, clientesFirestore, reportesFirestore } from '../services/firestore';
import ClienteForm from '../components/ClienteForm';
import HistorialPagos from '../components/HistorialPagos';
import AlertaDuplicados from '../components/AlertaDuplicados';
import PagoAdelantado from '../components/PagoAdelantado';
import AlertaAdelanto from '../components/AlertaAdelanto';

// Lazy loading de componentes pesados
const TablaPreciosConfig = lazy(() => import('../components/TablaPreciosConfig'));
const ReportesAvanzados = lazy(() => import('../components/ReportesAvanzados'));
const ReporteDisponibilidad = lazy(() => import('../components/ReporteDisponibilidad'));
const PagosSinIdentificar = lazy(() => import('../components/PagosSinIdentificar'));
const ImportarClientes = lazy(() => import('../components/ImportarClientes'));
const GestionPrecios = lazy(() => import('../components/GestionPrecios'));
const ExportarClientes = lazy(() => import('../components/ExportarClientes'));
const AumentosGraduales = lazy(() => import('../components/AumentosGraduales'));
const AumentosTrimestrales = lazy(() => import('../components/AumentosTrimestrales'));
// import { limpiarClientesPrueba } from '../utils/limpiarDatosPrueba'; // Removido
import { calcularEstadoCliente, getEstadoTexto } from '../utils/morosidad';
import moment from 'moment';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reporteData, setReporteData] = useState([]);
  const [todosLosPagos, setTodosLosPagos] = useState([]);
  const [selectedPago, setSelectedPago] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [openClienteForm, setOpenClienteForm] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [clienteHistorial, setClienteHistorial] = useState(null);
  const [clienteEliminar, setClienteEliminar] = useState(null);
  const [confirmacionEliminar, setConfirmacionEliminar] = useState('');
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [pagoDetalle, setPagoDetalle] = useState(null);
  const [openPagoDetalle, setOpenPagoDetalle] = useState(false);
  const [clientePagoDirecto, setClientePagoDirecto] = useState(null);
  const [openPagoDirecto, setOpenPagoDirecto] = useState(false);
  const [openImportarClientes, setOpenImportarClientes] = useState(false);
  const [pagoDirectoData, setPagoDirectoData] = useState({
    monto: '',
    tipoPago: 'efectivo',
    observaciones: ''
  });
  const [alertaDuplicados, setAlertaDuplicados] = useState({
    open: false,
    cliente: null,
    monto: '',
    duplicados: {},
    onConfirm: null
  });
  const [loading, setLoading] = useState(false);
  const [filtroOrden, setFiltroOrden] = useState('nombre');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  
  // Callback estable para evitar re-renders del TextField
  const handleBusquedaChange = useCallback((e) => {
    setBusquedaCliente(e.target.value);
  }, []);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [openExportarClientes, setOpenExportarClientes] = useState(false);
  const [clientePagoAdelantado, setClientePagoAdelantado] = useState(null);
  const [openPagoAdelantado, setOpenPagoAdelantado] = useState(false);

  useEffect(() => {
    cargarDatos();
    // Solo recargar en tab de pagos pendientes
    let interval;
    if (tabValue === 0) {
      // Auto-refresh desactivado para evitar flickering
      // interval = setInterval(cargarDatos, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tabValue]);

  const cargarDatos = useCallback(async () => {
    try {
      // Cargar clientes con paginación
      const clientesRes = await clientesFirestore.obtener({ limite: 200 });
      setClientes(clientesRes.datos || clientesRes); // Compatibilidad
      
      // Cargar pagos con límites
      try {
        // Obtener todos los pagos y filtrar localmente
        const todosPagosRes = await pagosFirestore.obtener({ limite: 100 });
        const todosPagos = todosPagosRes.datos || todosPagosRes;
        
        // Filtrar pagos pendientes localmente
        const pagosPendientes = todosPagos.filter(pago => pago.estado === 'pendiente');
        
        console.log('Pagos pendientes cargados:', pagosPendientes.length);
        console.log('Todos los pagos cargados:', todosPagos.length);
        console.log('Últimos 3 pagos:', todosPagos.slice(0, 3));
        
        setPagosPendientes(pagosPendientes);
        setTodosLosPagos(todosPagos);
      } catch (pagosError) {
        console.error('Error cargando pagos:', pagosError);
        setPagosPendientes([]);
        setTodosLosPagos([]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, []);

  const handleConfirmarPago = async (pagoId, accion) => {
    try {
      await pagosFirestore.confirmar(pagoId, accion);
      setMensaje(`Pago ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`);
      
      // Recargar datos inmediatamente
      await cargarDatos();
      
      // Recargar nuevamente después de 2 segundos para asegurar actualización
      // setTimeout desactivado para evitar flickering
      // setTimeout(cargarDatos, 2000);
      
      setSelectedPago(null);
    } catch (error) {
      setMensaje('Error procesando pago');
    }
  };

  const generarReporte = async () => {
    try {
      const response = await reportesFirestore.clientes({
        periodo: moment().format('YYYY-MM')
      });
      setReporteData(response);
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  const handleSaveCliente = useCallback(async (clienteData) => {
    try {
      console.log('Enviando cliente:', clienteData);
      if (clienteEditar) {
        await clientesFirestore.actualizar(clienteEditar.id, clienteData);
        setMensaje('Cliente actualizado exitosamente');
      } else {
        const response = await clientesFirestore.crear(clienteData);
        console.log('Respuesta:', response);
        setMensaje('Cliente agregado exitosamente');
      }
      
      // Recargar datos inmediatamente
      await cargarDatos();
      
      setClienteEditar(null);
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response?.data);
      setMensaje(`Error guardando cliente: ${error.response?.data?.error || error.message}`);
    }
  }, [cargarDatos, clienteEditar]);

  const handleEditarCliente = (cliente) => {
    setClienteEditar(cliente);
    setOpenClienteForm(true);
  };

  const handleVerHistorial = (cliente) => {
    setClienteHistorial(cliente);
    setOpenHistorial(true);
  };

  const handleEliminarCliente = (cliente) => {
    setClienteEliminar(cliente);
    setConfirmacionEliminar('');
    setOpenEliminarDialog(true);
  };

  const confirmarEliminacion = async () => {
    const textoConfirmacion = `${clienteEliminar.nombre} ${clienteEliminar.apellido}`;
    
    if (confirmacionEliminar !== textoConfirmacion) {
      setMensaje('❌ Debe escribir el nombre completo exacto para confirmar');
      return;
    }

    try {
      await clientesFirestore.eliminar(clienteEliminar.id);
      setMensaje(`✅ Cliente ${textoConfirmacion} eliminado exitosamente`);
      cargarDatos();
      setOpenEliminarDialog(false);
      setClienteEliminar(null);
      setConfirmacionEliminar('');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      setMensaje('❌ Error eliminando cliente');
    }
  };
  
  const verificarYRegistrarPago = async (clienteData, montoData, onConfirmCallback) => {
    try {
      const duplicados = await pagosFirestore.verificarDuplicados(
        clienteData.id, 
        montoData, 
        new Date()
      );
      
      // Si hay pagos del mismo día, mostrar alerta bloqueante
      if (duplicados.pagosHoy.length > 0 || 
          duplicados.pagosRecientes.length > 0 || 
          duplicados.pagosMismoMonto.length > 0) {
        
        setAlertaDuplicados({
          open: true,
          cliente: clienteData,
          monto: montoData,
          duplicados,
          onConfirm: onConfirmCallback
        });
        return false; // No continuar con el registro
      }
      
      // Si no hay duplicados, continuar
      return true;
    } catch (error) {
      console.error('Error verificando duplicados:', error);
      return true; // En caso de error, permitir continuar
    }
  };
  
  const handlePagoDirecto = async (forzarRegistro = false) => {
    if (!pagoDirectoData.monto || parseFloat(pagoDirectoData.monto) <= 0) {
      setMensaje('❌ Ingrese un monto válido');
      return;
    }
    
    // Verificar duplicados solo si no es un registro forzado
    if (!forzarRegistro) {
      const puedeRegistrar = await verificarYRegistrarPago(
        clientePagoDirecto,
        pagoDirectoData.monto,
        () => handlePagoDirecto(true) // Callback para forzar registro
      );
      
      if (!puedeRegistrar) return; // Mostrar alerta, no continuar
    }
    
    setLoading(true);
    try {
      console.log('💰 FRONTEND - Monto original:', pagoDirectoData.monto, 'tipo:', typeof pagoDirectoData.monto);
      console.log('💰 FRONTEND - Monto parseado:', parseFloat(pagoDirectoData.monto));
      
      const pagoData = {
        clienteId: clientePagoDirecto.id,
        clienteNombre: `${clientePagoDirecto.nombre} ${clientePagoDirecto.apellido}`,
        monto: parseFloat(pagoDirectoData.monto),
        tipoPago: pagoDirectoData.tipoPago,
        observaciones: pagoDirectoData.observaciones || 'Pago directo - Admin',
        ubicacion: { lat: 0, lng: 0, admin: true },
        fotoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        empleadoNombre: 'ADMIN - Pago Directo'
      };
      
      console.log('📦 FRONTEND - Datos a enviar:', pagoData);
      
      // Usar API del backend para consistencia
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? 'https://sistema-cocheras-backend.onrender.com/api'
        : 'http://localhost:3000/api';
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch(`${apiUrl}/pagos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pagoData)
      });
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      await response.json();
      
      setMensaje('✅ Pago directo registrado y aprobado exitosamente');
      setOpenPagoDirecto(false);
      setClientePagoDirecto(null);
      setPagoDirectoData({ monto: '', tipoPago: 'efectivo', observaciones: '' });
      setAlertaDuplicados({ open: false, cliente: null, monto: '', duplicados: {}, onConfirm: null });
      
      // Recargar datos inmediatamente
      await cargarDatos();
      
    } catch (error) {
      console.error('Error registrando pago directo:', error);
      setMensaje('❌ Error registrando pago directo');
    }
    setLoading(false);
  };
  
  // Función para filtrar y ordenar clientes - Memoizada para evitar re-cálculos
  const clientesFiltrados = useMemo(() => {
    let clientesFiltrados = [...clientes];
    
    // Aplicar búsqueda
    if (busquedaCliente.trim()) {
      const busqueda = busquedaCliente.toLowerCase();
      clientesFiltrados = clientesFiltrados.filter(cliente => 
        `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busqueda) ||
        cliente.telefono?.includes(busqueda) ||
        cliente.tipoVehiculo?.toLowerCase().includes(busqueda)
      );
    }
    
    // Calcular estado de morosidad para cada cliente
    clientesFiltrados = clientesFiltrados.map(cliente => ({
      ...cliente,
      estadoMorosidad: calcularEstadoCliente(cliente, todosLosPagos)
    }));
    
    // Aplicar ordenamiento
    clientesFiltrados.sort((a, b) => {
      // Si se seleccionó ordenamiento por morosidad, usar solo ese criterio
      if (filtroOrden === 'morosidad') {
        return (b.estadoMorosidad?.diasVencido || 0) - (a.estadoMorosidad?.diasVencido || 0);
      }
      
      // Para otros ordenamientos, mantener prioridad de morosos primero
      const prioridadEstado = { moroso: 0, vencido: 1, por_vencer: 2, al_dia: 3, sin_fecha: 4 };
      const prioridadA = prioridadEstado[a.estadoMorosidad.estado] || 5;
      const prioridadB = prioridadEstado[b.estadoMorosidad.estado] || 5;
      
      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }
      
      // Si tienen el mismo estado, aplicar ordenamiento secundario
      switch (filtroOrden) {
        case 'nombre':
          return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
        case 'apellido':
          return (a.apellido || '').localeCompare(b.apellido || '');
        case 'telefono':
          return (a.telefono || '').localeCompare(b.telefono || '');
        case 'vehiculo':
          return (a.tipoVehiculo || '').localeCompare(b.tipoVehiculo || '');
        case 'precio':
          return (b.precio || 0) - (a.precio || 0);
        case 'vencimiento':
          return new Date(a.fechaProximoVencimiento || 0) - new Date(b.fechaProximoVencimiento || 0);
        default:
          return 0;
      }
    });
    
    return clientesFiltrados;
  }, [clientes, busquedaCliente, filtroOrden, todosLosPagos]);

  const imprimirReporte = () => {
    const printContent = `
      <html>
        <head>
          <title>Reporte de Clientes</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Reporte de Clientes - ${moment().format('MMMM YYYY')}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo de Cochera</th>
                <th>Monto Pagado</th>
                <th>Fecha de Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${reporteData.map(item => `
                <tr>
                  <td>${item.nombre}</td>
                  <td>${item.tipoCochera}</td>
                  <td>$${item.montoPagado || '_______'}</td>
                  <td>${item.fechaPago || '_______'}</td>
                  <td>${item.estado}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const TabLoadingFallback = () => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '300px',
      flexDirection: 'column'
    }}>
      <CircularProgress size={40} />
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Cargando módulo...
      </Typography>
    </Box>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Suspense fallback={<TabLoadingFallback />}>
            {children}
          </Suspense>
        </Box>
      )}
    </div>
  );

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Panel de Administración
      </Typography>

      {mensaje && (
        <Alert 
          severity={mensaje.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 2 }}
          onClose={() => setMensaje('')}
        >
          {mensaje}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Pagos Pendientes" />
          <Tab label="Gestión de Clientes" />
          <Tab label="Pagos Sin Identificar" />
          <Tab label="Disponibilidad" />
          <Tab label="Configuración de Precios" />
          <Tab label="Gestión de Precios" />
          <Tab label="Aumentos Graduales" />
          <Tab label="Aumentos Trimestrales" />
          <Tab label="Reportes Avanzados" />
          <Tab label="Reportes Básicos" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pagos Pendientes de Confirmación ({pagosPendientes.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosPendientes.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{pago.clienteNombre}</TableCell>
                      <TableCell>${pago.monto}</TableCell>
                      <TableCell>
                        <Chip 
                          label={pago.tipoPago} 
                          size="small" 
                          color={pago.tipoPago === 'efectivo' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>{pago.empleadoNombre}</TableCell>
                      <TableCell>
                        {pago.fechaRegistro ? 
                          moment(pago.fechaRegistro).format('DD/MM/YYYY HH:mm') :
                          'Sin fecha'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          variant="outlined"
                          onClick={() => {
                            setPagoDetalle(pago);
                            setOpenPagoDetalle(true);
                          }}
                          sx={{ mr: 1 }}
                        >
                          Ver Detalle
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CheckCircle />}
                          color="success"
                          onClick={() => handleConfirmarPago(pago.id, 'aprobar')}
                          sx={{ mr: 1 }}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Cancel />}
                          color="error"
                          onClick={() => handleConfirmarPago(pago.id, 'rechazar')}
                        >
                          Rechazar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gestión de Clientes ({clientesFiltrados.length}/{clientes.length})
            </Typography>
            <Box sx={{ mb: 3 }}>
              {/* Botones principales */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setOpenClienteForm(true)}
                >
                  Agregar Cliente
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => setOpenImportarClientes(true)}
                  color="secondary"
                >
                  📊 Importar desde Excel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={() => setOpenExportarClientes(true)}
                  color="primary"
                >
                  📋 Exportar Lista
                </Button>
                <Button 
                  variant="outlined"
                  onClick={cargarDatos}
                >
                  Recargar
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={async () => {
                    if (window.confirm('⚠️ ¿Eliminar TODO el historial de pagos? Esta acción NO se puede deshacer.\n\nEsto eliminará:\n- Todos los pagos registrados\n- Historial de todos los clientes\n- Estados de morosidad se resetearán')) {
                      try {
                        setLoading(true);
                        
                        // Obtener token de Firebase Auth
                        const { getAuth } = await import('firebase/auth');
                        const auth = getAuth();
                        const user = auth.currentUser;
                        
                        if (!user) {
                          setMensaje('❌ Error: No hay sesión activa');
                          setLoading(false);
                          return;
                        }
                        
                        const token = await user.getIdToken();
                        
                        // Usar la misma lógica de detección de API
                        const getApiUrl = () => {
                          if (window.location.hostname.includes('netlify.app')) {
                            return 'https://sistema-cocheras-backend.onrender.com/api';
                          }
                          return 'http://localhost:3000/api';
                        };
                        
                        const response = await fetch(`${getApiUrl()}/admin/limpiar-historial`, {
                          method: 'DELETE',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok) {
                          setMensaje('✅ Historial de pagos eliminado exitosamente');
                          // Recargar datos inmediatamente
                          await cargarDatos();
                          // Recargar nuevamente después de 1 segundo
                          // setTimeout desactivado para evitar flickering
                          // setTimeout(cargarDatos, 1000);
                        } else {
                          setMensaje(`❌ Error: ${result.error || 'Error eliminando historial'}`);
                        }
                      } catch (error) {
                        console.error('Error limpiando historial:', error);
                        setMensaje('❌ Error de conexión eliminando historial');
                      }
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Limpiando...' : '🗑️ Limpiar Historial'}
                </Button>
              </Box>
              
              {/* Filtros y búsqueda */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Buscar cliente..."
                  value={busquedaCliente}
                  onChange={handleBusquedaChange}
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>🔍</Typography>
                  }}
                  autoComplete="off"
                  id="busqueda-cliente-field"
                  key="search-field-stable"
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={filtroOrden}
                    onChange={(e) => setFiltroOrden(e.target.value)}
                    label="Ordenar por"
                  >
                    <MenuItem value="nombre">Nombre</MenuItem>
                    <MenuItem value="apellido">Apellido</MenuItem>
                    <MenuItem value="telefono">Teléfono</MenuItem>
                    <MenuItem value="vehiculo">Vehículo</MenuItem>
                    <MenuItem value="precio">Precio (Mayor a Menor)</MenuItem>
                    <MenuItem value="vencimiento">Próximo Vencimiento</MenuItem>
                    <MenuItem value="morosidad">Días de Morosidad (Mayor a Menor)</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {clientesFiltrados.length} de {clientes.length} clientes
                  </Typography>
                  {(() => {
                    const morosos = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'moroso').length;
                    const vencidos = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'vencido').length;
                    const porVencer = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'por_vencer').length;
                    
                    return (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {morosos > 0 && (
                          <Chip label={`${morosos} Morosos`} color="error" size="small" />
                        )}
                        {vencidos > 0 && (
                          <Chip label={`${vencidos} Vencidos`} color="warning" size="small" />
                        )}
                        {porVencer > 0 && (
                          <Chip label={`${porVencer} Por vencer`} color="warning" size="small" variant="outlined" />
                        )}
                      </Box>
                    );
                  })()
                  }
                </Box>
              </Box>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre Completo</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Vehículo</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Próximo Vencimiento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow 
                      key={cliente.id}
                      sx={{
                        backgroundColor: 
                          cliente.estadoMorosidad.estado === 'moroso' ? 'rgba(244, 67, 54, 0.1)' :
                          cliente.estadoMorosidad.estado === 'vencido' ? 'rgba(255, 152, 0, 0.1)' :
                          cliente.estadoMorosidad.estado === 'por_vencer' ? 'rgba(255, 193, 7, 0.1)' :
                          'inherit',
                        '&:hover': {
                          backgroundColor: 
                            cliente.estadoMorosidad.estado === 'moroso' ? 'rgba(244, 67, 54, 0.2)' :
                            cliente.estadoMorosidad.estado === 'vencido' ? 'rgba(255, 152, 0, 0.2)' :
                            cliente.estadoMorosidad.estado === 'por_vencer' ? 'rgba(255, 193, 7, 0.2)' :
                            'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
                      <TableCell>{cliente.telefono}</TableCell>
                      <TableCell>{cliente.tipoVehiculo}</TableCell>
                      <TableCell>
                        {cliente.empleadoAsignado ? 
                          cliente.empleadoAsignado.split('@')[0].charAt(0).toUpperCase() + cliente.empleadoAsignado.split('@')[0].slice(1) :
                          'Sin asignar'
                        }
                      </TableCell>
                      <TableCell>${cliente.precio?.toLocaleString()} / {cliente.diasVencimiento || 30}d</TableCell>
                      <TableCell>
                        {cliente.fechaProximoVencimiento ? 
                          moment(cliente.fechaProximoVencimiento).format('DD/MM/YYYY') : 
                          'No definido'
                        }
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip 
                            label={getEstadoTexto(cliente.estadoMorosidad)}
                            color={cliente.estadoMorosidad.color}
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              ...(cliente.estadoMorosidad.estado === 'moroso' && {
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 }
                                }
                              })
                            }}
                          />
                          {cliente.mesesAdelantados && (
                            <Chip 
                              label={`📅 ${cliente.mesesAdelantados}m adelantado`}
                              color="info"
                              size="small"
                              sx={{ ml: 0.5, mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<Edit />}
                          onClick={() => handleEditarCliente(cliente)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<Payment />}
                          onClick={() => {
                            setClientePagoDirecto(cliente);
                            setPagoDirectoData({ monto: '', tipoPago: 'efectivo', observaciones: '' });
                            setOpenPagoDirecto(true);
                          }}
                          color="success"
                          variant="contained"
                          sx={{ mr: 1 }}
                        >
                          Pago Directo
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<Schedule />}
                          onClick={() => {
                            setClientePagoAdelantado(cliente);
                            setOpenPagoAdelantado(true);
                          }}
                          color="info"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        >
                          Pago Adelantado
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<History />}
                          onClick={() => handleVerHistorial(cliente)}
                          variant="outlined"
                          sx={{ mr: 1 }}
                        >
                          Historial
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<Delete />}
                          onClick={() => handleEliminarCliente(cliente)}
                          color="error"
                          variant="outlined"
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PagosSinIdentificar />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ReporteDisponibilidad />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <TablaPreciosConfig />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <GestionPrecios />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <AumentosGraduales />
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <AumentosTrimestrales />
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        <ReportesAvanzados />
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Reportes e Impresión
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="contained" 
                onClick={generarReporte}
                sx={{ mr: 2 }}
              >
                Generar Reporte Mensual
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Print />}
                onClick={imprimirReporte}
                disabled={reporteData.length === 0}
              >
                Imprimir Reporte
              </Button>
            </Box>
            
            {reporteData.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Tipo de Cochera</TableCell>
                      <TableCell>Monto Pagado</TableCell>
                      <TableCell>Fecha de Pago</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporteData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.tipoCochera}</TableCell>
                        <TableCell>${item.montoPagado || '______'}</TableCell>
                        <TableCell>{item.fechaPago || '______'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.estado} 
                            color={item.estado === 'Al día' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>
      
      <ClienteForm
        open={openClienteForm}
        onClose={() => {
          setOpenClienteForm(false);
          setClienteEditar(null);
        }}
        onSave={handleSaveCliente}
        cliente={clienteEditar}
      />
      
      <HistorialPagos
        open={openHistorial}
        onClose={() => {
          setOpenHistorial(false);
          setClienteHistorial(null);
        }}
        cliente={clienteHistorial}
        AlertaAdelanto={AlertaAdelanto}
      />
      
      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={openEliminarDialog}
        onClose={() => setOpenEliminarDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', display: 'flex', alignItems: 'center' }}>
          <Warning sx={{ mr: 1 }} />
          ⚠️ ELIMINAR CLIENTE - ACCIÓN IRREVERSIBLE
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🚨 ADVERTENCIA: Esta acción NO se puede deshacer
            </Typography>
            <Typography variant="body2">
              • Se eliminará permanentemente el cliente<br/>
              • Se perderá todo su historial de pagos<br/>
              • No podrá recuperar esta información
            </Typography>
          </Alert>
          
          {clienteEliminar && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" color="error">
                Cliente a eliminar:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {clienteEliminar.nombre} {clienteEliminar.apellido}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Teléfono: {clienteEliminar.telefono}<br/>
                Vehículo: {clienteEliminar.tipoVehiculo}<br/>
                Empleado: {clienteEliminar.empleadoAsignado?.split('@')[0]}
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Para confirmar, escriba el nombre completo exacto:
          </Typography>
          <Typography variant="body2" color="primary" sx={{ mb: 2, fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            {clienteEliminar?.nombre} {clienteEliminar?.apellido}
          </Typography>
          
          <TextField
            fullWidth
            label="Escriba el nombre completo para confirmar"
            value={confirmacionEliminar}
            onChange={(e) => setConfirmacionEliminar(e.target.value)}
            error={confirmacionEliminar && confirmacionEliminar !== `${clienteEliminar?.nombre} ${clienteEliminar?.apellido}`}
            helperText={confirmacionEliminar && confirmacionEliminar !== `${clienteEliminar?.nombre} ${clienteEliminar?.apellido}` ? 'El nombre no coincide exactamente' : ''}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarEliminacion}
            disabled={!confirmacionEliminar || confirmacionEliminar !== `${clienteEliminar?.nombre} ${clienteEliminar?.apellido}`}
            startIcon={<Delete />}
            size="large"
          >
            🗑️ ELIMINAR PERMANENTEMENTE
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenEliminarDialog(false);
              setClienteEliminar(null);
              setConfirmacionEliminar('');
            }}
            size="large"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog para ver detalle del pago */}
      <Dialog
        open={openPagoDetalle}
        onClose={() => {
          setOpenPagoDetalle(false);
          setPagoDetalle(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          📝 Detalle del Pago - {pagoDetalle?.clienteNombre}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {pagoDetalle && (
            <Box>
              {/* Información del pago */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  💰 Información del Pago
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {pagoDetalle.clienteNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Monto:</Typography>
                    <Typography variant="h6" color="success.main">
                      ${pagoDetalle.monto?.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Tipo de Pago:</Typography>
                    <Chip 
                      label={pagoDetalle.tipoPago} 
                      size="small" 
                      color={pagoDetalle.tipoPago === 'efectivo' ? 'primary' : 'secondary'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Empleado:</Typography>
                    <Typography variant="body1">
                      {pagoDetalle.empleadoNombre?.split('@')[0]?.charAt(0).toUpperCase() + 
                       pagoDetalle.empleadoNombre?.split('@')[0]?.slice(1) || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Fecha de Registro:</Typography>
                    <Typography variant="body1">
                      {pagoDetalle.fechaRegistro ? 
                        moment(pagoDetalle.fechaRegistro).format('DD/MM/YYYY HH:mm:ss') :
                        'Sin fecha'
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Foto del comprobante */}
              {pagoDetalle.fotoBase64 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhotoCamera sx={{ mr: 1 }} />
                    📷 Comprobante de Pago
                  </Typography>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }}>
                    <img 
                      src={pagoDetalle.fotoBase64} 
                      alt="Comprobante de pago"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      📄 Comprobante enviado por el empleado
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {!pagoDetalle.fotoBase64 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  📷 No se adjuntó foto del comprobante
                </Alert>
              )}
              
              {/* Ubicación GPS con Mapa */}
              {pagoDetalle.ubicacion && pagoDetalle.ubicacion.lat && pagoDetalle.ubicacion.lng && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ mr: 1 }}>📍</Box>
                    Ubicación GPS del Registro
                  </Typography>
                  
                  {/* Coordenadas */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      <strong>Coordenadas:</strong><br/>
                      Latitud: {pagoDetalle.ubicacion.lat}<br/>
                      Longitud: {pagoDetalle.ubicacion.lng}
                    </Typography>
                  </Box>
                  
                  {/* Mapa embebido - OpenStreetMap */}
                  <Box sx={{ 
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: 300
                  }}>
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${pagoDetalle.ubicacion.lng-0.01},${pagoDetalle.ubicacion.lat-0.01},${pagoDetalle.ubicacion.lng+0.01},${pagoDetalle.ubicacion.lat+0.01}&layer=mapnik&marker=${pagoDetalle.ubicacion.lat},${pagoDetalle.ubicacion.lng}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      title="Ubicación del registro de pago"
                    />
                  </Box>
                  
                  {/* Enlace para abrir en Google Maps */}
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`https://www.google.com/maps?q=${pagoDetalle.ubicacion.lat},${pagoDetalle.ubicacion.lng}`, '_blank')}
                      sx={{ mr: 1 }}
                    >
                      🗺️ Abrir en Google Maps
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${pagoDetalle.ubicacion.lat}&mlon=${pagoDetalle.ubicacion.lng}&zoom=16`, '_blank')}
                    >
                      🌍 Ver en OpenStreetMap
                    </Button>
                  </Box>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                    🗺️ Ubicación donde el empleado registró el pago
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => {
              handleConfirmarPago(pagoDetalle.id, 'aprobar');
              setOpenPagoDetalle(false);
            }}
            size="large"
          >
            ✅ Aprobar Pago
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={() => {
              handleConfirmarPago(pagoDetalle.id, 'rechazar');
              setOpenPagoDetalle(false);
            }}
            size="large"
          >
            ❌ Rechazar Pago
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenPagoDetalle(false);
              setPagoDetalle(null);
            }}
            size="large"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog para Pago Directo */}
      <Dialog
        open={openPagoDirecto}
        onClose={() => {
          setOpenPagoDirecto(false);
          setClientePagoDirecto(null);
          setPagoDirectoData({ monto: '', tipoPago: 'efectivo', observaciones: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center' }}>
          <Payment sx={{ mr: 1 }} />
          💰 Registrar Pago Directo
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {clientePagoDirecto && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  💵 <strong>Pago directo al administrador</strong><br/>
                  Se registrará y aprobará automáticamente sin pasar por empleados.
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" color="primary">
                  Cliente: {clientePagoDirecto.nombre} {clientePagoDirecto.apellido}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teléfono: {clientePagoDirecto.telefono}<br/>
                  Vehículo: {clientePagoDirecto.tipoVehiculo}<br/>
                  Precio mensual: ${clientePagoDirecto.precio?.toLocaleString()}
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Monto del Pago *"
                type="number"
                value={pagoDirectoData.monto}
                onChange={(e) => {
                  setPagoDirectoData({...pagoDirectoData, monto: e.target.value});
                }}
                placeholder={clientePagoDirecto.precio?.toString()}
                helperText={`Precio sugerido: $${clientePagoDirecto.precio?.toLocaleString()}`}
                sx={{ mb: 2 }}
                inputProps={{ min: 0, step: 1 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tipo de Pago</InputLabel>
                <Select
                  value={pagoDirectoData.tipoPago}
                  onChange={(e) => setPagoDirectoData({...pagoDirectoData, tipoPago: e.target.value})}
                >
                  <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                  <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
                  <MenuItem value="tarjeta">💳 Tarjeta</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Observaciones (Opcional)"
                multiline
                rows={2}
                value={pagoDirectoData.observaciones}
                onChange={(e) => setPagoDirectoData({...pagoDirectoData, observaciones: e.target.value})}
                placeholder="Ej: Pago en oficina, descuento aplicado, etc."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handlePagoDirecto}
            disabled={!pagoDirectoData.monto || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
            size="large"
            sx={{
              minWidth: 220,
              position: 'relative'
            }}
          >
            {loading ? 'Procesando...' : '💰 Registrar y Aprobar Pago'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenPagoDirecto(false);
              setClientePagoDirecto(null);
              setPagoDirectoData({ monto: '', tipoPago: 'efectivo', observaciones: '' });
            }}
            size="large"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Alerta de Duplicados */}
      <AlertaDuplicados
        open={alertaDuplicados.open}
        onClose={() => setAlertaDuplicados({ open: false, cliente: null, monto: '', duplicados: {}, onConfirm: null })}
        onConfirm={() => {
          if (alertaDuplicados.onConfirm) {
            alertaDuplicados.onConfirm();
          }
          setAlertaDuplicados({ open: false, cliente: null, monto: '', duplicados: {}, onConfirm: null });
        }}
        cliente={alertaDuplicados.cliente}
        monto={alertaDuplicados.monto}
        duplicados={alertaDuplicados.duplicados}
      />
      
      {/* Dialog para Importar Clientes */}
      <ImportarClientes
        open={openImportarClientes}
        onClose={() => setOpenImportarClientes(false)}
        onSuccess={() => {
          cargarDatos();
          setMensaje('✅ Clientes importados exitosamente');
        }}
      />
      
      {/* Dialog para Exportar Clientes */}
      <ExportarClientes
        open={openExportarClientes}
        onClose={() => setOpenExportarClientes(false)}
        clientes={clientesFiltrados}
        todosLosPagos={todosLosPagos}
        ordenamiento={{
          nombre: 'Nombre',
          apellido: 'Apellido',
          telefono: 'Teléfono',
          vehiculo: 'Vehículo',
          precio: 'Precio (Mayor a Menor)',
          vencimiento: 'Próximo Vencimiento',
          morosidad: 'Días de Morosidad (Mayor a Menor)'
        }[filtroOrden] || 'Nombre'}
      />
      
      {/* Dialog para Pago Adelantado */}
      <PagoAdelantado
        open={openPagoAdelantado}
        onClose={() => {
          setOpenPagoAdelantado(false);
          setClientePagoAdelantado(null);
        }}
        cliente={clientePagoAdelantado}
        onSuccess={() => {
          setMensaje('✅ Pago adelantado registrado exitosamente');
          cargarDatos();
        }}
      />
    </Container>
  );
};

export default AdminDashboard;