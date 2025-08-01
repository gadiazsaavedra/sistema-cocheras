import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Grid,
  Typography
} from '@mui/material';
// import { clientesFirestore } from '../services/firestore';
// import AlertaDuplicadosCliente from './AlertaDuplicadosCliente';

const ClienteForm = ({ open, onClose, onSave, cliente = null }) => {
  // const [alertaDuplicados, setAlertaDuplicados] = useState({
  //   open: false,
  //   clienteData: null,
  //   duplicados: {},
  //   onConfirm: null
  // });
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    tipoVehiculo: 'auto',
    modalidadTiempo: 'diurna',
    modalidadTecho: 'bajo techo',
    fechaIngreso: new Date().toISOString().split('T')[0],
    diasVencimiento: 30,
    empleadoAsignado: ''
  });

  // Actualizar formData cuando cambie el cliente
  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        telefono: cliente.telefono || '',
        tipoVehiculo: cliente.tipoVehiculo || 'auto',
        modalidadTiempo: cliente.modalidadTiempo || 'diurna',
        modalidadTecho: cliente.modalidadTecho || 'bajo techo',
        fechaIngreso: cliente.fechaIngreso ? cliente.fechaIngreso.split('T')[0] : new Date().toISOString().split('T')[0],
        diasVencimiento: cliente.diasVencimiento || 30,
        empleadoAsignado: cliente.empleadoAsignado || ''
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
        tipoVehiculo: 'auto',
        modalidadTiempo: 'diurna',
        modalidadTecho: 'bajo techo',
        fechaIngreso: new Date().toISOString().split('T')[0],
        diasVencimiento: 30,
        empleadoAsignado: ''
      });
    }
  }, [cliente]);

  // Obtener precios de localStorage o usar valores por defecto
  const getPreciosTabla = () => {
    const preciosGuardados = localStorage.getItem('tablaPreciosCocheras');
    if (preciosGuardados) {
      return JSON.parse(preciosGuardados);
    }
    return {
      moto: { diurna: { 'bajo techo': 15000, 'bajo carpa': 12000 }, nocturna: { 'bajo techo': 18000, 'bajo carpa': 15000 }, '24hs': { 'bajo techo': 25000, 'bajo carpa': 20000 } },
      auto: { diurna: { 'bajo techo': 20000, 'bajo carpa': 17000 }, nocturna: { 'bajo techo': 23000, 'bajo carpa': 20000 }, '24hs': { 'bajo techo': 35000, 'bajo carpa': 30000 } },
      camioneta: { diurna: { 'bajo techo': 25000, 'bajo carpa': 22000 }, nocturna: { 'bajo techo': 28000, 'bajo carpa': 25000 }, '24hs': { 'bajo techo': 40000, 'bajo carpa': 35000 } },
      furgon: { diurna: { 'bajo techo': 30000, 'bajo carpa': 27000 }, nocturna: { 'bajo techo': 33000, 'bajo carpa': 30000 }, '24hs': { 'bajo techo': 45000, 'bajo carpa': 40000 } },
      camion: { diurna: { 'bajo techo': 40000, 'bajo carpa': 35000 }, nocturna: { 'bajo techo': 45000, 'bajo carpa': 40000 }, '24hs': { 'bajo techo': 60000, 'bajo carpa': 55000 } },
      trailer: { diurna: { 'bajo techo': 50000, 'bajo carpa': 45000 }, nocturna: { 'bajo techo': 55000, 'bajo carpa': 50000 }, '24hs': { 'bajo techo': 75000, 'bajo carpa': 70000 } }
    };
  };

  const precios = getPreciosTabla();

  const getPrecio = () => {
    return precios[formData.tipoVehiculo]?.[formData.modalidadTiempo]?.[formData.modalidadTecho] || 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función simplificada sin validación de duplicados
  const guardarCliente = (clienteData) => {
    onSave(clienteData);
    onClose();
  };

  const handleSubmit = () => {
    const clienteData = {
      ...formData,
      precio: getPrecio(),
      fechaProximoVencimiento: new Date(new Date(formData.fechaIngreso).getTime() + formData.diasVencimiento * 24 * 60 * 60 * 1000).toISOString()
    };
    guardarCliente(clienteData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {cliente ? 'Editar Cliente' : 'Agregar Cliente'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => {
                  const valor = e.target.value;
                  const nombreCapitalizado = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
                  handleChange('nombre', nombreCapitalizado);
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => {
                  const valor = e.target.value;
                  const apellidoCapitalizado = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
                  handleChange('apellido', apellidoCapitalizado);
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Vehículo</InputLabel>
                <Select
                  value={formData.tipoVehiculo}
                  onChange={(e) => handleChange('tipoVehiculo', e.target.value)}
                >
                  <MenuItem value="moto">Moto</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                  <MenuItem value="camioneta">Camioneta</MenuItem>
                  <MenuItem value="furgon">Furgón</MenuItem>
                  <MenuItem value="camion">Camión</MenuItem>
                  <MenuItem value="trailer">Trailer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Modalidad de Tiempo</InputLabel>
                <Select
                  value={formData.modalidadTiempo}
                  onChange={(e) => handleChange('modalidadTiempo', e.target.value)}
                >
                  <MenuItem value="diurna">Diurna (8:00-17:00)</MenuItem>
                  <MenuItem value="nocturna">Nocturna (17:00-8:00)</MenuItem>
                  <MenuItem value="24hs">24 Horas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Modalidad de Techo</InputLabel>
                <Select
                  value={formData.modalidadTecho}
                  onChange={(e) => handleChange('modalidadTecho', e.target.value)}
                >
                  <MenuItem value="bajo techo">Bajo Techo</MenuItem>
                  <MenuItem value="bajo carpa">Bajo Carpa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Ingreso"
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => handleChange('fechaIngreso', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Días para Vencimiento"
                type="number"
                value={formData.diasVencimiento}
                onChange={(e) => handleChange('diasVencimiento', e.target.value)}
                helperText="Cada cuántos días debe pagar (por defecto 30)"
                inputProps={{ min: 1, max: 365 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Empleado Asignado</InputLabel>
                <Select
                  value={formData.empleadoAsignado}
                  onChange={(e) => handleChange('empleadoAsignado', e.target.value)}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  <MenuItem value="victor@empresa.com">Victor</MenuItem>
                  <MenuItem value="raul@empresa.com">Raul</MenuItem>
                  <MenuItem value="carlos@empresa.com">Carlos</MenuItem>
                  <MenuItem value="fernando@empresa.com">Fernando</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" color="primary">
                  Precio: ${getPrecio().toLocaleString()} cada {formData.diasVencimiento} días
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Próximo vencimiento: {new Date(new Date(formData.fechaIngreso).getTime() + formData.diasVencimiento * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!formData.nombre || !formData.apellido || !formData.telefono || !formData.fechaIngreso}
            >
              {cliente ? 'Actualizar' : 'Agregar'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      
      {/* Alerta de Duplicados temporalmente deshabilitada */}
    </Dialog>
  );
};

export default ClienteForm;