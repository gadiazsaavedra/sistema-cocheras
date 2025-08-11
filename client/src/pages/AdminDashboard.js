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
import { CheckCircle, Cancel, Print, Add, Edit, History, Delete, Warning, Visibility, PhotoCamera, Payment, Upload, Schedule, EditNote } from '@mui/icons-material';
import { pagosFirestore, clientesFirestore, reportesFirestore } from '../services/firestore';
import ClienteForm from '../components/ClienteForm';
import HistorialPagos from '../components/HistorialPagos';
import AlertaDuplicados from '../components/AlertaDuplicados';
import PagoAdelantado from '../components/PagoAdelantado';
import AlertaAdelanto from '../components/AlertaAdelanto';
import DetalleMorosidad from '../components/DetalleMorosidad';

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
const CalculadoraAlquilerTemporal = lazy(() => import('../components/CalculadoraAlquilerTemporal'));
const DetectorPreciosDesactualizados = lazy(() => import('../components/DetectorPreciosDesactualizados'));
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
  const [editandoMonto, setEditandoMonto] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [clientePagoDirecto, setClientePagoDirecto] = useState(null);
  const [openPagoDirecto, setOpenPagoDirecto] = useState(false);
  const [openImportarClientes, setOpenImportarClientes] = useState(false);
  const [pagoDirectoData, setPagoDirectoData] = useState({
    monto: '',
    tipoPago: 'efectivo',
    observaciones: '',
    fechaPago: new Date().toISOString().split('T')[0] // Fecha actual por defecto
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
  const [clienteDetalleMorosidad, setClienteDetalleMorosidad] = useState(null);
  const [openDetalleMorosidad, setOpenDetalleMorosidad] = useState(false);

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
        // Obtener todos los pagos con límite alto
        const todosPagosRes = await pagosFirestore.obtener({ limite: 300 });
        const todosPagos = todosPagosRes.datos || todosPagosRes;
        
        // Filtrar pagos pendientes localmente
        const pagosPendientes = todosPagos.filter(pago => pago.estado === 'pendiente');
        
        console.log('🔥 ADMIN DASHBOARD - Pagos pendientes cargados:', pagosPendientes.length);
        console.log('🔥 ADMIN DASHBOARD - Todos los pagos cargados:', todosPagos.length);
        console.log('🔥 ADMIN DASHBOARD - Últimos 3 pagos:', todosPagos.slice(0, 3));
        
        // Debug específico para Armando - FORZADO
        const pagosArmando = todosPagos.filter(p => p.clienteNombre?.includes('Armando'));
        console.log('🚨🚨🚨 DEBUG ARMANDO ADMIN DASHBOARD 🚨🚨🚨');
        console.log('🔍 Pagos de Armando encontrados:', pagosArmando.length);
        pagosArmando.forEach((p, i) => {
          console.log(`🎯 Pago Armando ${i+1}: ${p.fechaRegistro} - Estado: ${p.estado} - Monto: ${p.monto}`);
        });
        console.log('🚨🚨🚨 FIN DEBUG ARMANDO ADMIN 🚨🚨🚨');
        todosPagos.forEach(pago => {
          if (pago.clienteNombre?.includes('Juan') || pago.clienteNombre?.includes('Edgardo')) {
            console.log('PAGO ENCONTRADO:', pago.clienteNombre, 'ID:', pago.clienteId, 'Monto:', pago.monto);
          }
        });
        const pagosJuan = todosPagos.filter(p => p.clienteNombre?.includes('Juan'));
        const pagosEdgardo = todosPagos.filter(p => p.clienteNombre?.includes('Edgardo'));
        console.log('PAGOS JUAN:', pagosJuan);
        console.log('PAGOS EDGARDO:', pagosEdgardo);
        console.log('Todos los pagos para debug Edgardo:', todosPagos.filter(p => p.clienteNombre?.includes('Edgardo')));
        console.log('ID de Edgardo buscado:', clientes.find(c => c.nombre?.includes('Edgardo'))?.id);
        
        console.log('=== DEBUG PAGOS ===');
        todosPagos.forEach((pago, index) => {
          if (index < 5) { // Solo los primeros 5
            console.log(`Pago ${index + 1}:`, {
              clienteId: pago.clienteId,
              clienteNombre: pago.clienteNombre,
              monto: pago.monto,
              estado: pago.estado
            });
          }
        });
        console.log('=== FIN DEBUG ===');
        
        setPagosPendientes(pagosPendientes);
        setTodosLosPagos(todosPagos);
        
        // Debug fuera del try-catch
        setTimeout(() => {
          console.log('PAGOS JUAN:', todosPagos.filter(p => p.clienteNombre?.includes('Juan')));
          console.log('PAGOS EDGARDO:', todosPagos.filter(p => p.clienteNombre?.includes('Edgardo')));
        }, 100);
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
    console.log('🔍 FRONTEND - Cliente para historial:', cliente.id, cliente.nombre, cliente.apellido);
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
    try {
      console.log('🎯 FRONTEND - Iniciando handlePagoDirecto, forzarRegistro:', forzarRegistro);
      
      if (!pagoDirectoData.monto || parseFloat(pagoDirectoData.monto) <= 0) {
        setMensaje('❌ Ingrese un monto válido');
        return;
      }
      
      // Verificar duplicados solo si no es un registro forzado
      if (!forzarRegistro) {
        console.log('🔍 FRONTEND - Verificando duplicados...');
        const puedeRegistrar = await verificarYRegistrarPago(
          clientePagoDirecto,
          pagoDirectoData.monto,
          () => handlePagoDirecto(true) // Callback para forzar registro
        );
        
        console.log('🔍 FRONTEND - Puede registrar:', puedeRegistrar);
        if (!puedeRegistrar) {
          console.log('🛑 FRONTEND - Detenido por duplicados');
          return; // Mostrar alerta, no continuar
        }
      }
      
      console.log('✅ FRONTEND - Pasó verificación de duplicados');
      
      setLoading(true);
    } catch (outerError) {
      console.log('💥 FRONTEND - Error en inicio de handlePagoDirecto:', outerError);
      setMensaje('❌ Error inesperado al iniciar el pago');
      return;
    }
    
    try {
      console.log('💰 FRONTEND - Monto original:', pagoDirectoData.monto, 'tipo:', typeof pagoDirectoData.monto);
      console.log('💰 FRONTEND - Monto parseado:', parseFloat(pagoDirectoData.monto));
      
      // BUGFIX: Capturar cliente actual para evitar estado stale
      const clienteActual = clientePagoDirecto;
      console.log('🔍 FRONTEND - Cliente actual para pago:', clienteActual?.id, clienteActual?.nombre);
      
      if (!clienteActual || !clienteActual.id) {
        throw new Error('No hay cliente seleccionado para el pago');
      }
      
      const pagoData = {
        clienteId: clienteActual.id,
        clienteNombre: `${clienteActual.nombre} ${clienteActual.apellido}`,
        monto: parseFloat(pagoDirectoData.monto),
        tipoPago: pagoDirectoData.tipoPago,
        observaciones: pagoDirectoData.observaciones || 'Pago directo - Admin',
        ubicacion: { lat: 0, lng: 0, admin: true },
        fotoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        empleadoNombre: 'ADMIN - Pago Directo',
        fechaRegistro: new Date(pagoDirectoData.fechaPago).toISOString() // Usar fecha seleccionada
      };
      
      console.log('📦 FRONTEND - Datos a enviar:', pagoData);
      
      // Usar API del backend para consistencia
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? 'https://sistema-cocheras-backend.onrender.com/api'
        : 'http://localhost:3000/api';
      
      console.log('🌐 FRONTEND - API URL:', apiUrl);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      console.log('🔥 FRONTEND - User autenticado:', !!user);
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      const token = await user.getIdToken();
      console.log('🔑 FRONTEND - Token obtenido, iniciando fetch...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch(`${apiUrl}/pagos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(pagoData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('🌐 FRONTEND - Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('❌ FRONTEND - Error response:', errorText);
          throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ FRONTEND - Response data:', result);
        
        setMensaje('✅ Pago directo registrado y aprobado exitosamente');
        setOpenPagoDirecto(false);
        setClientePagoDirecto(null);
        setPagoDirectoData({ 
          monto: '', 
          tipoPago: 'efectivo', 
          observaciones: '',
          fechaPago: new Date().toISOString().split('T')[0]
        });
        setAlertaDuplicados({ open: false, cliente: null, monto: '', duplicados: {}, onConfirm: null });
        
        // Recargar datos
        await cargarDatos();
        

        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.log('💥 FRONTEND - Fetch error:', fetchError);
        throw fetchError;
      }
      
    } catch (error) {
      console.error('Error registrando pago directo:', error);
      if (error.name === 'AbortError') {
        setMensaje('⏱️ El servidor está iniciando (Render se duerme por inactividad). Espere 30 segundos e intente nuevamente.');
      } else {
        setMensaje('❌ Error registrando pago directo: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
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
      const prioridadEstado = { critico: 0, moroso: 1, vencido: 2, advertencia: 3, al_dia: 4, sin_fecha: 5 };
      const prioridadA = prioridadEstado[a.estadoMorosidad.estado] || 6;
      const prioridadB = prioridadEstado[b.estadoMorosidad.estado] || 6;
      
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
          <Tab label="Calculadora Temporal" />
          <Tab label="Precios Desactualizados" />
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
                      <TableCell>${Math.round(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
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
                  color="info"
                  onClick={() => {
                    console.log('=== TODOS LOS CLIENTES ===');
                    clientes.forEach(c => {
                      console.log(`${c.nombre} ${c.apellido}: ${c.id}`);
                    });
                    console.log('=== FIN CLIENTES ===');
                  }}
                >
                  Debug IDs
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
                    const criticos = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'critico').length;
                    const morosos = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'moroso').length;
                    const vencidos = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'vencido').length;
                    const advertencias = clientesFiltrados.filter(c => c.estadoMorosidad.estado === 'advertencia').length;
                    
                    return (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {criticos > 0 && (
                          <Chip label={`${criticos} Críticos`} sx={{ bgcolor: '#8B0000', color: 'white' }} size="small" />
                        )}
                        {morosos > 0 && (
                          <Chip label={`${morosos} Morosos`} color="error" size="small" />
                        )}
                        {vencidos > 0 && (
                          <Chip label={`${vencidos} Vencidos`} color="warning" size="small" />
                        )}
                        {advertencias > 0 && (
                          <Chip label={`${advertencias} Advertencias`} color="warning" size="small" variant="outlined" />
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
                          cliente.estadoMorosidad.estado === 'critico' ? 'rgba(139, 0, 0, 0.15)' :
                          cliente.estadoMorosidad.estado === 'moroso' ? 'rgba(244, 67, 54, 0.1)' :
                          cliente.estadoMorosidad.estado === 'vencido' ? 'rgba(255, 152, 0, 0.1)' :
                          cliente.estadoMorosidad.estado === 'advertencia' ? 'rgba(255, 193, 7, 0.1)' :
                          'inherit',
                        '&:hover': {
                          backgroundColor: 
                            cliente.estadoMorosidad.estado === 'critico' ? 'rgba(139, 0, 0, 0.25)' :
                            cliente.estadoMorosidad.estado === 'moroso' ? 'rgba(244, 67, 54, 0.2)' :
                            cliente.estadoMorosidad.estado === 'vencido' ? 'rgba(255, 152, 0, 0.2)' :
                            cliente.estadoMorosidad.estado === 'advertencia' ? 'rgba(255, 193, 7, 0.2)' :
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
                      <TableCell>${Math.round(cliente.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / {cliente.diasVencimiento || 30}d</TableCell>
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
                              ...((cliente.estadoMorosidad.estado === 'moroso' || cliente.estadoMorosidad.estado === 'critico') && {
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
                          onClick={() => {
                            if (cliente.nombre?.includes('Juan')) {
                              console.log('🆔 ID DE JUAN JOSÉ:', cliente.id);
                            }
                            handleEditarCliente(cliente);
                          }}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<Payment />}
                          onClick={() => {
                            console.log('🔍 FRONTEND - Cliente para pago directo:', cliente.id, cliente.nombre, cliente.apellido);
                            setClientePagoDirecto(cliente);
                            setPagoDirectoData({ 
                              monto: '', 
                              tipoPago: 'efectivo', 
                              observaciones: '',
                              fechaPago: new Date().toISOString().split('T')[0]
                            });
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
                        {cliente.fechaIngreso && (
                          <Button 
                            size="small" 
                            startIcon={<Warning />}
                            onClick={() => {
                              setClienteDetalleMorosidad(cliente);
                              setOpenDetalleMorosidad(true);
                            }}
                            variant="outlined"
                            color="info"
                            sx={{ mr: 1 }}
                          >
                            Ver Períodos
                          </Button>
                        )}
                        {cliente.mesesAdelantados && (
                          <Button 
                            size="small" 
                            startIcon={<Delete />}
                            onClick={async () => {
                              if (window.confirm(`¿Eliminar el adelanto de ${cliente.mesesAdelantados} meses de ${cliente.nombre} ${cliente.apellido}?`)) {
                                try {
                                  const { getAuth } = await import('firebase/auth');
                                  const auth = getAuth();
                                  const user = auth.currentUser;
                                  const token = await user.getIdToken();
                                  
                                  const apiUrl = window.location.hostname.includes('netlify.app') 
                                    ? 'https://sistema-cocheras-backend.onrender.com/api'
                                    : 'http://localhost:3000/api';
                                  
                                  const response = await fetch(`${apiUrl}/clientes/${cliente.id}/adelanto`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    }
                                  });
                                  
                                  if (response.ok) {
                                    setMensaje('✅ Adelanto eliminado exitosamente');
                                    await cargarDatos();
                                  } else {
                                    setMensaje('❌ Error eliminando adelanto');
                                  }
                                } catch (error) {
                                  console.error('Error:', error);
                                  setMensaje('❌ Error de conexión');
                                }
                              }
                            }}
                            variant="outlined"
                            color="warning"
                            sx={{ mr: 1 }}
                          >
                            Eliminar Adelanto
                          </Button>
                        )}
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
        <CalculadoraAlquilerTemporal />
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <DetectorPreciosDesactualizados />
      </TabPanel>

      <TabPanel value={tabValue} index={10}>
        <ReportesAvanzados />
      </TabPanel>

      <TabPanel value={tabValue} index={11}>
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
                      ${Math.round(pagoDetalle.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                  {pagoDetalle.observaciones && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Observaciones:</Typography>
                      <Typography variant="body1" sx={{ 
                        fontStyle: 'italic',
                        bgcolor: 'info.light',
                        p: 1,
                        borderRadius: 1,
                        color: 'info.contrastText'
                      }}>
                        📝 {pagoDetalle.observaciones}
                      </Typography>
                    </Grid>
                  )}
                  
                  {/* Sección de edición de monto */}
                  {pagoDetalle.estado === 'pendiente' && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          💰 Editar Monto del Pago
                        </Typography>
                        {!editandoMonto ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditNote />}
                            onClick={() => {
                              setEditandoMonto(true);
                              setNuevoMonto(pagoDetalle.monto.toString());
                              setMotivoEdicion('');
                            }}
                          >
                            Corregir Monto
                          </Button>
                        ) : (
                          <Box>
                            <TextField
                              label="Nuevo Monto ($)"
                              type="number"
                              value={nuevoMonto}
                              onChange={(e) => setNuevoMonto(e.target.value)}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                              inputProps={{ min: 0 }}
                            />
                            <TextField
                              label="Motivo de la corrección"
                              value={motivoEdicion}
                              onChange={(e) => setMotivoEdicion(e.target.value)}
                              size="small"
                              sx={{ mr: 1, mb: 1, minWidth: 200 }}
                              placeholder="Ej: Cliente pagó monto diferente"
                            />
                            <Box sx={{ mt: 1 }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={async () => {
                                  if (!nuevoMonto || parseFloat(nuevoMonto) <= 0) {
                                    setMensaje('❌ Ingrese un monto válido');
                                    return;
                                  }
                                  if (!motivoEdicion.trim()) {
                                    setMensaje('❌ Ingrese el motivo de la corrección');
                                    return;
                                  }
                                  
                                  try {
                                    const apiUrl = window.location.hostname.includes('netlify.app') 
                                      ? 'https://sistema-cocheras-backend.onrender.com/api'
                                      : 'http://localhost:3000/api';
                                    
                                    const { getAuth } = await import('firebase/auth');
                                    const auth = getAuth();
                                    const user = auth.currentUser;
                                    const token = await user.getIdToken();
                                    
                                    const response = await fetch(`${apiUrl}/pagos/${pagoDetalle.id}/editar-monto`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: JSON.stringify({
                                        nuevoMonto: parseFloat(nuevoMonto),
                                        motivoEdicion: motivoEdicion,
                                        montoOriginal: pagoDetalle.monto
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      setMensaje('✅ Monto corregido exitosamente');
                                      setEditandoMonto(false);
                                      setPagoDetalle({...pagoDetalle, monto: parseFloat(nuevoMonto)});
                                      await cargarDatos();
                                    } else {
                                      throw new Error('Error del servidor');
                                    }
                                  } catch (error) {
                                    setMensaje('❌ Error corrigiendo monto');
                                  }
                                }}
                                sx={{ mr: 1 }}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setEditandoMonto(false);
                                  setNuevoMonto('');
                                  setMotivoEdicion('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}
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
                  Precio mensual: ${Math.round(clientePagoDirecto.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Fecha del Pago *"
                type="date"
                value={pagoDirectoData.fechaPago}
                onChange={(e) => setPagoDirectoData({...pagoDirectoData, fechaPago: e.target.value})}
                InputLabelProps={{ shrink: true }}
                helperText="Fecha en que se realizó el pago"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Monto del Pago *"
                type="text"
                value={pagoDirectoData.monto}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^0-9]/g, ''); // Solo números
                  console.log('💰 FRONTEND - Monto cambiado a:', valor);
                  setPagoDirectoData({...pagoDirectoData, monto: valor});
                }}
                placeholder={clientePagoDirecto.precio?.toString()}
                helperText={`Precio sugerido: $${Math.round(clientePagoDirecto.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                sx={{ mb: 2 }}
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
            onClick={() => {
              console.log('🔘 FRONTEND - Botón clickeado');
              console.log('🔘 FRONTEND - pagoDirectoData.monto:', pagoDirectoData.monto);
              console.log('🔘 FRONTEND - loading:', loading);
              console.log('🔘 FRONTEND - disabled:', !pagoDirectoData.monto || loading);
              handlePagoDirecto();
            }}
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
              setPagoDirectoData({ 
                monto: '', 
                tipoPago: 'efectivo', 
                observaciones: '',
                fechaPago: new Date().toISOString().split('T')[0]
              });
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
      
      {/* Dialog para Detalle de Morosidad */}
      <DetalleMorosidad
        open={openDetalleMorosidad}
        onClose={() => {
          setOpenDetalleMorosidad(false);
          setClienteDetalleMorosidad(null);
        }}
        cliente={clienteDetalleMorosidad}
        pagos={todosLosPagos}
      />
    </Container>
  );
};

export default AdminDashboard;