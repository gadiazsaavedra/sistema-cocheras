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
  Alert
} from '@mui/material';
import { Camera } from '@mui/icons-material';
import { clientesAPI, pagosAPI } from '../services/api';
import CameraCapture from '../components/CameraCapture';

const EmpleadoDashboard = () => {
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
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarClientes();
    obtenerUbicacion();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await clientesAPI.obtener();
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacion({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Error obteniendo ubicación:', error)
      );
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
      setMensaje('Pago registrado exitosamente. Pendiente de confirmación.');
      setOpenPago(false);
      setPagoData({ monto: '', tipoPago: 'efectivo', foto: null });
    } catch (error) {
      setMensaje('Error registrando pago');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Panel de Empleado
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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clientes Asignados
              </Typography>
              <List>
                {clientes.map((cliente) => (
                  <ListItem key={cliente.id}>
                    <ListItemText
                      primary={cliente.nombre}
                      secondary={`Cochera: ${cliente.numeroCochera} - ${cliente.modalidadTiempo} ${cliente.modalidadTecho}`}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleRegistrarPago(cliente)}
                    >
                      Registrar Pago
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openPago} onClose={() => setOpenPago(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago - {selectedCliente?.nombre}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={pagoData.monto}
              onChange={(e) => setPagoData({...pagoData, monto: e.target.value})}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Pago</InputLabel>
              <Select
                value={pagoData.tipoPago}
                onChange={(e) => setPagoData({...pagoData, tipoPago: e.target.value})}
              >
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
                <MenuItem value="tarjeta">Tarjeta</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Foto del Comprobante *
              </Typography>
              <CameraCapture
                onCapture={(foto) => setPagoData({...pagoData, foto})}
                captured={!!pagoData.foto}
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmitPago}
                disabled={loading || !pagoData.foto}
                fullWidth
              >
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenPago(false)}
                fullWidth
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default EmpleadoDashboard;