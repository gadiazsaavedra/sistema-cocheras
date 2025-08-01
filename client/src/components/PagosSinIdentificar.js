import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Autocomplete,
  Grid
} from '@mui/material';
import { Add, Assignment, Delete, QuestionMark } from '@mui/icons-material';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { clientesFirestore, pagosFirestore } from '../services/firestore';
import moment from 'moment';

const PagosSinIdentificar = () => {
  const [pagosSinIdentificar, setPagosSinIdentificar] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [openNuevoPago, setOpenNuevoPago] = useState(false);
  const [openAsignar, setOpenAsignar] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [nuevoPagoData, setNuevoPagoData] = useState({
    nombrePagador: '',
    monto: '',
    tipoPago: 'transferencia',
    referencia: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar pagos sin identificar
      const pagosSinIdSnapshot = await getDocs(collection(db, 'pagosSinIdentificar'));
      const pagosSinIdData = pagosSinIdSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPagosSinIdentificar(pagosSinIdData);

      // Cargar clientes
      const clientesData = await clientesFirestore.obtener();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const registrarPagoSinIdentificar = async () => {
    if (!nuevoPagoData.nombrePagador || !nuevoPagoData.monto) {
      setMensaje('❌ Complete los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'pagosSinIdentificar'), {
        nombrePagador: nuevoPagoData.nombrePagador,
        monto: parseFloat(nuevoPagoData.monto),
        tipoPago: nuevoPagoData.tipoPago,
        referencia: nuevoPagoData.referencia,
        observaciones: nuevoPagoData.observaciones,
        fechaRecibido: new Date().toISOString(),
        estado: 'sin_identificar'
      });

      setMensaje('✅ Pago sin identificar registrado');
      setOpenNuevoPago(false);
      setNuevoPagoData({
        nombrePagador: '',
        monto: '',
        tipoPago: 'transferencia',
        referencia: '',
        observaciones: ''
      });
      cargarDatos();
    } catch (error) {
      console.error('Error registrando pago:', error);
      setMensaje('❌ Error registrando pago');
    }
    setLoading(false);
  };

  const asignarPagoACliente = async () => {
    if (!clienteSeleccionado) {
      setMensaje('❌ Seleccione un cliente');
      return;
    }

    setLoading(true);
    try {
      // Crear pago normal asignado al cliente
      const pagoData = {
        clienteId: clienteSeleccionado.id,
        clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        monto: pagoSeleccionado.monto,
        tipoPago: pagoSeleccionado.tipoPago,
        observaciones: `Pago de: ${pagoSeleccionado.nombrePagador}. ${pagoSeleccionado.observaciones || ''}`,
        ubicacion: { lat: 0, lng: 0 },
        fotoBase64: null,
        empleadoId: 'admin',
        empleadoNombre: 'ADMIN - Pago Electrónico',
        fechaRegistro: pagoSeleccionado.fechaRecibido,
        estado: 'confirmado',
        fechaConfirmacion: new Date().toISOString(),
        confirmadoPor: 'admin',
        tipoRegistro: 'pago_electronico',
        nombrePagadorOriginal: pagoSeleccionado.nombrePagador,
        referenciaOriginal: pagoSeleccionado.referencia
      };

      await pagosFirestore.crear(pagoData);

      // Eliminar de pagos sin identificar
      await deleteDoc(doc(db, 'pagosSinIdentificar', pagoSeleccionado.id));

      // Guardar relación pagador-cliente para futuras sugerencias
      await addDoc(collection(db, 'relacionesPagadores'), {
        nombrePagador: pagoSeleccionado.nombrePagador,
        clienteId: clienteSeleccionado.id,
        clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        fechaCreacion: new Date().toISOString()
      });

      setMensaje(`✅ Pago asignado a ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`);
      setOpenAsignar(false);
      setPagoSeleccionado(null);
      setClienteSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error('Error asignando pago:', error);
      setMensaje('❌ Error asignando pago');
    }
    setLoading(false);
  };

  const eliminarPagoSinIdentificar = async (pagoId) => {
    if (window.confirm('¿Está seguro de eliminar este pago sin identificar?')) {
      try {
        await deleteDoc(doc(db, 'pagosSinIdentificar', pagoId));
        setMensaje('✅ Pago eliminado');
        cargarDatos();
      } catch (error) {
        console.error('Error eliminando pago:', error);
        setMensaje('❌ Error eliminando pago');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          💳 Pagos Sin Identificar
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenNuevoPago(true)}
          color="primary"
        >
          Registrar Pago Recibido
        </Button>
      </Box>

      {mensaje && (
        <Alert severity={mensaje.includes('✅') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {mensaje}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>💡 Para Andrea:</strong> Registra aquí los pagos electrónicos recibidos que no sabes de qué cliente son. 
          Después podrás asignarlos al cliente correcto y el sistema recordará la relación para futuras transferencias.
        </Typography>
      </Alert>

      {pagosSinIdentificar.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <QuestionMark sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay pagos sin identificar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los pagos electrónicos que recibas aparecerán aquí hasta que los asignes a un cliente.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Fecha Recibido</strong></TableCell>
                <TableCell><strong>Nombre del Pagador</strong></TableCell>
                <TableCell><strong>Monto</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Referencia</strong></TableCell>
                <TableCell><strong>Observaciones</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagosSinIdentificar.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>
                    {moment(pago.fechaRecibido).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {pago.nombrePagador}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      ${pago.monto?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={pago.tipoPago} 
                      size="small"
                      color={pago.tipoPago === 'transferencia' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{pago.referencia || '-'}</TableCell>
                  <TableCell>{pago.observaciones || '-'}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Assignment />}
                      color="success"
                      onClick={() => {
                        setPagoSeleccionado(pago);
                        setOpenAsignar(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Asignar
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      color="error"
                      onClick={() => eliminarPagoSinIdentificar(pago.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para registrar nuevo pago sin identificar */}
      <Dialog open={openNuevoPago} onClose={() => setOpenNuevoPago(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          💳 Registrar Pago Electrónico Recibido
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Registra el pago que recibiste pero no sabes de qué cliente es.
          </Alert>
          
          <TextField
            fullWidth
            label="Nombre del Pagador *"
            value={nuevoPagoData.nombrePagador}
            onChange={(e) => setNuevoPagoData({...nuevoPagoData, nombrePagador: e.target.value})}
            placeholder="Ej: María Gómez, Juan Carlos SA, etc."
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Monto Recibido *"
            type="number"
            value={nuevoPagoData.monto}
            onChange={(e) => setNuevoPagoData({...nuevoPagoData, monto: e.target.value})}
            sx={{ mb: 2 }}
            inputProps={{ min: 0, step: 1000 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Pago</InputLabel>
            <Select
              value={nuevoPagoData.tipoPago}
              onChange={(e) => setNuevoPagoData({...nuevoPagoData, tipoPago: e.target.value})}
            >
              <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
              <MenuItem value="deposito">💰 Depósito</MenuItem>
              <MenuItem value="mercadopago">💳 MercadoPago</MenuItem>
              <MenuItem value="otro_electronico">📱 Otro Electrónico</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Referencia/CBU/Alias"
            value={nuevoPagoData.referencia}
            onChange={(e) => setNuevoPagoData({...nuevoPagoData, referencia: e.target.value})}
            placeholder="Ej: CBU, Alias, Número de operación"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Observaciones"
            multiline
            rows={2}
            value={nuevoPagoData.observaciones}
            onChange={(e) => setNuevoPagoData({...nuevoPagoData, observaciones: e.target.value})}
            placeholder="Cualquier detalle adicional..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            onClick={registrarPagoSinIdentificar}
            disabled={loading}
          >
            💾 Registrar Pago
          </Button>
          <Button onClick={() => setOpenNuevoPago(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para asignar pago a cliente */}
      <Dialog open={openAsignar} onClose={() => setOpenAsignar(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          🎯 Asignar Pago a Cliente
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {pagoSeleccionado && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Pago a asignar:</strong><br/>
                  💰 ${pagoSeleccionado.monto?.toLocaleString()} de {pagoSeleccionado.nombrePagador}
                </Typography>
              </Alert>
              
              <Autocomplete
                options={clientes}
                getOptionLabel={(cliente) => `${cliente.nombre} ${cliente.apellido} - ${cliente.telefono}`}
                value={clienteSeleccionado}
                onChange={(event, newValue) => setClienteSeleccionado(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Cliente *"
                    placeholder="Buscar por nombre, apellido o teléfono"
                  />
                )}
                sx={{ mb: 2 }}
              />
              
              {clienteSeleccionado && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Cliente seleccionado:</strong><br/>
                    {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}<br/>
                    📞 {clienteSeleccionado.telefono}<br/>
                    🚗 {clienteSeleccionado.tipoVehiculo}<br/>
                    💵 Precio mensual: ${clienteSeleccionado.precio?.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            color="success"
            onClick={asignarPagoACliente}
            disabled={loading || !clienteSeleccionado}
          >
            ✅ Asignar Pago
          </Button>
          <Button onClick={() => setOpenAsignar(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PagosSinIdentificar;