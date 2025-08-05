import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress
} from '@mui/material';
import { Payment, Schedule, Calculate } from '@mui/icons-material';

const PagoAdelantado = ({ open, onClose, cliente, onSuccess }) => {
  const [mesesAdelantados, setMesesAdelantados] = useState(1);
  const [montoTotal, setMontoTotal] = useState('');
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const calcularMontoSugerido = () => {
    return (cliente?.precio || 0) * mesesAdelantados;
  };

  const calcularFechaVencimiento = () => {
    const hoy = new Date();
    const fechaVencimiento = new Date(hoy);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + mesesAdelantados);
    return fechaVencimiento.toLocaleDateString('es-AR');
  };

  const handleRegistrarPago = async () => {
    if (!montoTotal || parseFloat(montoTotal) <= 0) {
      return;
    }

    setLoading(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? 'https://sistema-cocheras-backend.onrender.com/api'
        : 'http://localhost:3000/api';

      // Registrar pago adelantado
      const pagoData = {
        clienteId: cliente.id,
        clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
        monto: parseFloat(montoTotal),
        tipoPago,
        observaciones: observaciones || `Pago adelantado ${mesesAdelantados} meses`,
        ubicacion: { lat: 0, lng: 0, admin: true },
        fotoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        empleadoNombre: 'ADMIN - Pago Adelantado',
        esAdelantado: true,
        mesesAdelantados: mesesAdelantados,
        fechaVencimientoAdelanto: calcularFechaVencimiento()
      };

      const response = await fetch(`${apiUrl}/pagos/adelantado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pagoData)
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error registrando pago adelantado:', error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setMesesAdelantados(1);
    setMontoTotal('');
    setTipoPago('efectivo');
    setObservaciones('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center' }}>
        <Schedule sx={{ mr: 1 }} />
        💰 Pago Adelantado
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {cliente && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Pago Adelantado:</strong> El cliente pagará por varios meses por adelantado.
                El sistema calculará automáticamente la nueva fecha de vencimiento.
              </Typography>
            </Alert>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" color="primary">
                {cliente.nombre} {cliente.apellido}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Precio mensual: ${cliente.precio?.toLocaleString()}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Meses a Pagar por Adelantado"
              type="number"
              value={mesesAdelantados}
              onChange={(e) => {
                const meses = Math.max(1, parseInt(e.target.value) || 1);
                setMesesAdelantados(meses);
                setMontoTotal(calcularMontoSugerido().toString());
              }}
              inputProps={{ min: 1, max: 12 }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Monto Total"
              type="number"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              helperText={`Sugerido: $${calcularMontoSugerido().toLocaleString()}`}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Pago</InputLabel>
              <Select
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value)}
              >
                <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
                <MenuItem value="tarjeta">💳 Tarjeta</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Observaciones"
              multiline
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={`Pago adelantado ${mesesAdelantados} meses`}
              sx={{ mb: 3 }}
            />

            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                📅 Resumen del Adelanto:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${mesesAdelantados} meses`} 
                  color="primary" 
                  size="small" 
                />
                <Chip 
                  label={`Válido hasta: ${calcularFechaVencimiento()}`} 
                  color="success" 
                  size="small" 
                />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleRegistrarPago}
          disabled={!montoTotal || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
          size="large"
        >
          {loading ? 'Procesando...' : '💰 Registrar Pago Adelantado'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onClose();
            resetForm();
          }}
          size="large"
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagoAdelantado;