import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { Print, FilterList } from '@mui/icons-material';
import { pagosFirestore, clientesFirestore } from '../services/firestore';
import { calcularEstadoCliente, getEstadoTexto } from '../utils/morosidad';
import moment from 'moment';

const ReportesAvanzados = () => {
  const [tipoReporte, setTipoReporte] = useState('');
  const [filtros, setFiltros] = useState({
    fecha: moment().format('YYYY-MM-DD'),
    empleado: '',
    estado: ''
  });
  const [datosReporte, setDatosReporte] = useState([]);
  const [cargando, setCargando] = useState(false);

  const empleados = [
    { email: 'victor@empresa.com', nombre: 'Victor' },
    { email: 'raul@empresa.com', nombre: 'Raul' },
    { email: 'carlos@empresa.com', nombre: 'Carlos' },
    { email: 'fernando@empresa.com', nombre: 'Fernando' }
  ];

  const generarReporte = async () => {
    setCargando(true);
    try {
      const [clientesRes, pagosRes] = await Promise.all([
        clientesFirestore.obtener(),
        pagosFirestore.obtener()
      ]);

      const clientes = clientesRes.datos || clientesRes || [];
      const pagos = pagosRes.datos || pagosRes || [];

      let datos = [];

      switch (tipoReporte) {
        case 'cobros_dia':
          datos = generarCobrosDia(pagos, filtros.fecha);
          break;
        case 'morosos':
          datos = generarListaMorosos(clientes, pagos);
          break;
        case 'por_empleado':
          datos = generarReportePorEmpleado(clientes, pagos, filtros.empleado);
          break;
        case 'con_filtros':
          datos = generarReporteConFiltros(clientes, pagos, filtros);
          break;
        default:
          datos = [];
      }

      setDatosReporte(datos);
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
    setCargando(false);
  };

  const generarCobrosDia = (pagos, fecha) => {
    const fechaSeleccionada = moment(fecha);
    return pagos
      .filter(pago => 
        pago.estado === 'confirmado' &&
        moment(pago.fechaRegistro).isSame(fechaSeleccionada, 'day')
      )
      .map(pago => ({
        cliente: pago.clienteNombre || 'Cliente',
        monto: pago.monto,
        empleado: pago.empleadoNombre || 'Empleado',
        hora: moment(pago.fechaRegistro).format('HH:mm'),
        tipo: pago.tipoPago
      }));
  };

  const generarListaMorosos = (clientes, pagos) => {
    return clientes
      .map(cliente => {
        const estadoInfo = calcularEstadoCliente(cliente, pagos);
        return { ...cliente, estadoInfo };
      })
      .filter(cliente => ['vencido', 'moroso'].includes(cliente.estadoInfo.estado))
      .sort((a, b) => b.estadoInfo.diasVencido - a.estadoInfo.diasVencido);
  };

  const generarReportePorEmpleado = (clientes, pagos, empleadoEmail) => {
    const clientesEmpleado = clientes.filter(c => c.empleadoAsignado === empleadoEmail);
    const pagosEmpleado = pagos.filter(p => p.empleadoId === empleadoEmail);
    
    return {
      empleado: empleados.find(e => e.email === empleadoEmail)?.nombre || 'Empleado',
      totalClientes: clientesEmpleado.length,
      cobrosHoy: pagosEmpleado.filter(p => 
        moment(p.fechaRegistro).isSame(moment(), 'day')
      ).length,
      montoTotal: pagosEmpleado
        .filter(p => p.estado === 'confirmado')
        .reduce((sum, p) => sum + p.monto, 0),
      clientes: clientesEmpleado.map(cliente => {
        const estadoInfo = calcularEstadoCliente(cliente, pagos);
        return { ...cliente, estadoInfo };
      })
    };
  };

  const generarReporteConFiltros = (clientes, pagos, filtros) => {
    let clientesFiltrados = clientes;

    if (filtros.empleado) {
      clientesFiltrados = clientesFiltrados.filter(c => c.empleadoAsignado === filtros.empleado);
    }

    return clientesFiltrados.map(cliente => {
      const estadoInfo = calcularEstadoCliente(cliente, pagos);
      const pagoReciente = pagos
        .filter(p => p.clienteId === cliente.id && p.estado === 'confirmado')
        .sort((a, b) => moment(b.fechaRegistro) - moment(a.fechaRegistro))[0];

      return {
        ...cliente,
        estadoInfo,
        ultimoPago: pagoReciente ? moment(pagoReciente.fechaRegistro).format('DD/MM/YYYY') : 'Nunca'
      };
    }).filter(cliente => {
      if (filtros.estado === 'morosos') return ['vencido', 'moroso'].includes(cliente.estadoInfo.estado);
      if (filtros.estado === 'al_dia') return cliente.estadoInfo.estado === 'al_dia';
      return true;
    });
  };

  const imprimirReporte = () => {
    let contenido = '';
    
    switch (tipoReporte) {
      case 'cobros_dia':
        contenido = generarHTMLCobrosDia();
        break;
      case 'morosos':
        contenido = generarHTMLMorosos();
        break;
      case 'por_empleado':
        contenido = generarHTMLPorEmpleado();
        break;
      default:
        contenido = generarHTMLGenerico();
    }

    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarHTMLCobrosDia = () => `
    <html>
      <head><title>Cobros del Día - ${filtros.fecha}</title>
      <style>body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h2>Cobros del Día - ${moment(filtros.fecha).format('DD/MM/YYYY')}</h2>
        <table>
          <tr><th>Cliente</th><th>Monto</th><th>Empleado</th><th>Hora</th><th>Tipo</th></tr>
          ${datosReporte.map(item => `
            <tr><td>${item.cliente}</td><td>$${item.monto}</td><td>${item.empleado}</td><td>${item.hora}</td><td>${item.tipo}</td></tr>
          `).join('')}
        </table>
        <p><strong>Total cobros: ${datosReporte.length}</strong></p>
        <p><strong>Monto total: $${datosReporte.reduce((sum, item) => sum + item.monto, 0).toLocaleString()}</strong></p>
      </body>
    </html>
  `;

  const generarHTMLMorosos = () => `
    <html>
      <head><title>Lista de Morosos</title>
      <style>body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h2>Lista de Morosos - ${moment().format('DD/MM/YYYY')}</h2>
        <table>
          <tr><th>Cliente</th><th>Teléfono</th><th>Empleado</th><th>Días Vencido</th><th>Monto Adeudado</th></tr>
          ${datosReporte.map(cliente => `
            <tr><td>${cliente.nombre} ${cliente.apellido}</td><td>${cliente.telefono}</td>
            <td>${cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}</td>
            <td>${cliente.estadoInfo.diasVencido}</td><td>$${cliente.precio}</td></tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;

  const generarHTMLPorEmpleado = () => `
    <html>
      <head><title>Reporte por Empleado</title>
      <style>body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h2>Reporte - ${datosReporte.empleado}</h2>
        <p>Total clientes: ${datosReporte.totalClientes}</p>
        <p>Cobros hoy: ${datosReporte.cobrosHoy}</p>
        <p>Monto total: $${datosReporte.montoTotal?.toLocaleString()}</p>
        <table>
          <tr><th>Cliente</th><th>Teléfono</th><th>Estado</th><th>Precio</th></tr>
          ${datosReporte.clientes?.map(cliente => `
            <tr><td>${cliente.nombre} ${cliente.apellido}</td><td>${cliente.telefono}</td>
            <td>${getEstadoTexto(cliente.estadoInfo)}</td><td>$${cliente.precio}</td></tr>
          `).join('') || ''}
        </table>
      </body>
    </html>
  `;

  const generarHTMLGenerico = () => `
    <html>
      <head><title>Reporte</title>
      <style>body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style></head>
      <body><h2>Reporte Generado</h2><p>Datos del reporte...</p></body>
    </html>
  `;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Reportes Avanzados
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Reporte</InputLabel>
              <Select
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
              >
                <MenuItem value="cobros_dia">Cobros del Día</MenuItem>
                <MenuItem value="morosos">Lista de Morosos</MenuItem>
                <MenuItem value="por_empleado">Reporte por Empleado</MenuItem>
                <MenuItem value="con_filtros">Reporte con Filtros</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {tipoReporte === 'cobros_dia' && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={filtros.fecha}
                onChange={(e) => setFiltros({...filtros, fecha: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}

          {(tipoReporte === 'por_empleado' || tipoReporte === 'con_filtros') && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={filtros.empleado}
                  onChange={(e) => setFiltros({...filtros, empleado: e.target.value})}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {empleados.map(emp => (
                    <MenuItem key={emp.email} value={emp.email}>{emp.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {tipoReporte === 'con_filtros' && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="al_dia">Al Día</MenuItem>
                  <MenuItem value="morosos">Morosos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<FilterList />}
            onClick={generarReporte}
            disabled={!tipoReporte || cargando}
            sx={{ mr: 2 }}
          >
            {cargando ? 'Generando...' : 'Generar Reporte'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={imprimirReporte}
            disabled={datosReporte.length === 0}
          >
            Imprimir
          </Button>
        </Box>

        {datosReporte.length > 0 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {tipoReporte === 'cobros_dia' && (
                    <>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Tipo</TableCell>
                    </>
                  )}
                  {tipoReporte === 'morosos' && (
                    <>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Días Vencido</TableCell>
                    </>
                  )}
                  {tipoReporte === 'con_filtros' && (
                    <>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Último Pago</TableCell>
                      <TableCell>Precio</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {tipoReporte === 'cobros_dia' && datosReporte.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell>${item.monto.toLocaleString()}</TableCell>
                    <TableCell>{item.empleado}</TableCell>
                    <TableCell>{item.hora}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                  </TableRow>
                ))}
                
                {tipoReporte === 'morosos' && datosReporte.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>{cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getEstadoTexto(cliente.estadoInfo)} 
                        color={cliente.estadoInfo.color} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{cliente.estadoInfo.diasVencido} días</TableCell>
                  </TableRow>
                ))}

                {tipoReporte === 'con_filtros' && datosReporte.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
                    <TableCell>{cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getEstadoTexto(cliente.estadoInfo)} 
                        color={cliente.estadoInfo.color} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{cliente.ultimoPago}</TableCell>
                    <TableCell>${cliente.precio?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tipoReporte === 'por_empleado' && datosReporte.empleado && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Resumen - {datosReporte.empleado}</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{datosReporte.totalClientes}</Typography>
                  <Typography variant="body2">Total Clientes</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">{datosReporte.cobrosHoy}</Typography>
                  <Typography variant="body2">Cobros Hoy</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">${datosReporte.montoTotal?.toLocaleString()}</Typography>
                  <Typography variant="body2">Monto Total Cobrado</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportesAvanzados;