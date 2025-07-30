import React, { useState, useEffect } from 'react';
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
  Box,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { CheckCircle, Cancel, Print, Add, Edit, History } from '@mui/icons-material';
import { pagosAPI, clientesAPI, reportesAPI } from '../services/api';
import ClienteForm from '../components/ClienteForm';
import TablaPreciosConfig from '../components/TablaPreciosConfig';
import ReportesAvanzados from '../components/ReportesAvanzados';
import HistorialPagos from '../components/HistorialPagos';
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

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar clientes siempre
      const clientesRes = await clientesAPI.obtener();
      setClientes(clientesRes.data);
      
      // Cargar pagos solo si hay clientes
      if (clientesRes.data.length > 0) {
        try {
          const [pagosPendientesRes, todosPagosRes] = await Promise.all([
            pagosAPI.obtener({ estado: 'pendiente' }),
            pagosAPI.obtener()
          ]);
          setPagosPendientes(pagosPendientesRes.data);
          setTodosLosPagos(todosPagosRes.data);
        } catch (pagosError) {
          console.log('No hay pagos pendientes');
          setPagosPendientes([]);
          setTodosLosPagos([]);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleConfirmarPago = async (pagoId, accion) => {
    try {
      await pagosAPI.confirmar(pagoId, accion);
      setMensaje(`Pago ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`);
      cargarDatos();
      setSelectedPago(null);
    } catch (error) {
      setMensaje('Error procesando pago');
    }
  };

  const generarReporte = async () => {
    try {
      const response = await reportesAPI.clientes({
        periodo: moment().format('YYYY-MM')
      });
      setReporteData(response.data);
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  const handleSaveCliente = async (clienteData) => {
    try {
      console.log('Enviando cliente:', clienteData);
      if (clienteEditar) {
        await clientesAPI.actualizar(clienteEditar.id, clienteData);
        setMensaje('Cliente actualizado exitosamente');
      } else {
        const response = await clientesAPI.crear(clienteData);
        console.log('Respuesta:', response);
        setMensaje('Cliente agregado exitosamente');
      }
      cargarDatos();
      setClienteEditar(null);
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response?.data);
      setMensaje(`Error guardando cliente: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditarCliente = (cliente) => {
    setClienteEditar(cliente);
    setOpenClienteForm(true);
  };

  const handleVerHistorial = (cliente) => {
    setClienteHistorial(cliente);
    setOpenHistorial(true);
  };

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

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Pagos Pendientes" />
          <Tab label="Gestión de Clientes" />
          <Tab label="Configuración de Precios" />
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
                        {moment(pago.fechaRegistro?.toDate()).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell>
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
              Gestión de Clientes ({clientes.length})
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => setOpenClienteForm(true)}
              >
                Agregar Cliente
              </Button>
              <Button 
                variant="outlined"
                onClick={cargarDatos}
              >
                Recargar
              </Button>
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
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
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
                        {(() => {
                          const estadoInfo = calcularEstadoCliente(cliente, todosLosPagos);
                          return (
                            <Chip 
                              label={getEstadoTexto(estadoInfo)}
                              color={estadoInfo.color}
                              size="small"
                            />
                          );
                        })()}
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
                          startIcon={<History />}
                          onClick={() => handleVerHistorial(cliente)}
                          variant="outlined"
                        >
                          Historial
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
        <TablaPreciosConfig />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ReportesAvanzados />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
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
      />
    </Container>
  );
};

export default AdminDashboard;