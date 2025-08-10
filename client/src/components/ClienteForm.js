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
  Typography,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import { preciosFirestore } from '../services/firestore';

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
    empleadoAsignado: '',
    // Campos para aumentos graduales
    esClienteAntiguo: false,
    precioBase: '',
    precioObjetivo: '',
    aumentoMensual: '',
    proximoAumento: ''
  });
  
  const [precios, setPrecios] = useState({});
  const [cargandoPrecios, setCargandoPrecios] = useState(true);

  // Cargar precios desde Firebase
  useEffect(() => {
    const cargarPrecios = async () => {
      try {
        setCargandoPrecios(true);
        // Intentar migrar desde localStorage si existe
        await preciosFirestore.migrarDesdeLocalStorage();
        // Obtener precios de Firebase
        const preciosFirebase = await preciosFirestore.obtener();
        setPrecios(preciosFirebase);
      } catch (error) {
        console.error('Error cargando precios:', error);
      } finally {
        setCargandoPrecios(false);
      }
    };
    
    cargarPrecios();
  }, []);

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
        empleadoAsignado: cliente.empleadoAsignado || '',
        // Campos de aumentos graduales
        esClienteAntiguo: cliente.esClienteAntiguo || false,
        precioBase: cliente.precioBase || '',
        precioObjetivo: cliente.precioObjetivo || '',
        aumentoMensual: cliente.aumentoMensual || '',
        proximoAumento: cliente.proximoAumento || ''
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
        empleadoAsignado: '',
        esClienteAntiguo: false,
        precioBase: '',
        precioObjetivo: '',
        aumentoMensual: '',
        proximoAumento: ''
      });
    }
  }, [cliente]);

  const getPrecio = () => {
    if (cargandoPrecios || !precios[formData.tipoVehiculo]) return 0;
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
                  <MenuItem value="victor.cocheras@sistema.local">Victor</MenuItem>
                  <MenuItem value="raul.cocheras@sistema.local">Raul</MenuItem>
                  <MenuItem value="carlos.cocheras@sistema.local">Carlos</MenuItem>
                  <MenuItem value="fernando.cocheras@sistema.local">Fernando</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                {cargandoPrecios ? (
                  <Typography variant="h6" color="text.secondary">
                    Cargando precios...
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h6" color="primary">
                      Precio: ${getPrecio().toLocaleString()} cada {formData.diasVencimiento} días
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Próximo vencimiento: {new Date(new Date(formData.fechaIngreso).getTime() + formData.diasVencimiento * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
            
            {/* Sección de Aumentos Graduales */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.esClienteAntiguo}
                      onChange={(e) => handleChange('esClienteAntiguo', e.target.checked)}
                    />
                  }
                  label="🕰️ Cliente Antiguo (Precio Personalizado con Aumentos Graduales)"
                  sx={{ mb: 2 }}
                />
                
                {formData.esClienteAntiguo && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📈 Configuración de Aumentos Graduales
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Precio Base Actual ($)"
                          type="number"
                          value={formData.precioBase}
                          onChange={(e) => handleChange('precioBase', e.target.value)}
                          helperText="Precio que paga actualmente"
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Precio Objetivo ($)"
                          type="number"
                          value={formData.precioObjetivo}
                          onChange={(e) => handleChange('precioObjetivo', e.target.value)}
                          helperText="Precio a alcanzar (clientes nuevos)"
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Aumento Mensual ($)"
                          type="number"
                          value={formData.aumentoMensual}
                          onChange={(e) => handleChange('aumentoMensual', e.target.value)}
                          helperText="Aumento cada mes"
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Próximo Aumento"
                          type="date"
                          value={formData.proximoAumento}
                          onChange={(e) => handleChange('proximoAumento', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          helperText="Fecha del próximo aumento"
                        />
                      </Grid>
                    </Grid>
                    
                    {formData.precioBase && formData.precioObjetivo && formData.aumentoMensual && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          📈 <strong>Simulación:</strong><br/>
                          Precio actual: ${parseFloat(formData.precioBase || 0).toLocaleString()}<br/>
                          Precio objetivo: ${parseFloat(formData.precioObjetivo || 0).toLocaleString()}<br/>
                          Diferencia: ${(parseFloat(formData.precioObjetivo || 0) - parseFloat(formData.precioBase || 0)).toLocaleString()}<br/>
                          Meses para equiparar: {Math.ceil((parseFloat(formData.precioObjetivo || 0) - parseFloat(formData.precioBase || 0)) / parseFloat(formData.aumentoMensual || 1))} meses
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}
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