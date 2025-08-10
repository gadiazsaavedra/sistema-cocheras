import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Alert,
  Chip
} from '@mui/material';
import { Calculate } from '@mui/icons-material';
import { preciosFirestore } from '../services/firestore';

const CalculadoraAlquilerTemporal = () => {
  const [tipoVehiculo, setTipoVehiculo] = useState('auto');
  const [dias, setDias] = useState('');
  const [precios, setPrecios] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPrecios();
  }, []);

  const cargarPrecios = async () => {
    try {
      const preciosData = await preciosFirestore.obtener();
      setPrecios(preciosData || {});
    } catch (error) {
      console.error('Error cargando precios:', error);
      // Usar precios por defecto si falla
      setPrecios({
        moto: { '24hs': { 'bajo techo': 25000 } },
        auto: { '24hs': { 'bajo techo': 35000 } },
        camioneta: { '24hs': { 'bajo techo': 40000 } },
        furgon: { '24hs': { 'bajo techo': 45000 } },
        camion: { '24hs': { 'bajo techo': 60000 } },
        trailer: { '24hs': { 'bajo techo': 75000 } }
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularPrecio = () => {
    if (!dias || dias <= 0 || loading) return 0;
    
    try {
      const precioMensual = precios[tipoVehiculo]?.['24hs']?.['bajo techo'] || 0;
      const diasNum = parseInt(dias);
      
      if (precioMensual === 0) return 0;
      
      // Progresión lineal del divisor: de 5.3 (día 1) a 30 (día 30)
      // Fórmula: divisor = 5.3 + (diasNum - 1) * (24.7/29)
      const divisor = 5.3 + (diasNum - 1) * (24.7 / 29);
      const precioDiario = precioMensual / divisor;
      const precioTotal = precioDiario * diasNum;
      
      // Redondeo hacia arriba de 100 en 100
      return Math.ceil(precioTotal / 100) * 100;
    } catch (error) {
      console.error('Error calculando precio:', error);
      return 0;
    }
  };

  const getRango = () => {
    const diasNum = parseInt(dias) || 0;
    const divisor = 5.3 + (diasNum - 1) * (24.7 / 29);
    return `${diasNum} día${diasNum > 1 ? 's' : ''} (Divisor: ${divisor.toFixed(2)})`;
  };

  const getColor = () => {
    const diasNum = parseInt(dias) || 0;
    // Color basado en progresión: rojo para pocos días, verde para muchos días
    if (diasNum <= 7) return 'error'; // Rojo - Muy caro
    if (diasNum <= 14) return 'warning'; // Naranja - Caro
    if (diasNum <= 21) return 'info'; // Azul - Moderado
    return 'success'; // Verde - Económico
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Calculate sx={{ mr: 1 }} />
          🚗 Calculadora de Alquiler Temporal (24hs)
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Tipo de Vehículo</InputLabel>
            <Select
              value={tipoVehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value)}
            >
              <MenuItem value="moto">🏍️ Moto</MenuItem>
              <MenuItem value="auto">🚗 Auto</MenuItem>
              <MenuItem value="camioneta">🚙 Camioneta</MenuItem>
              <MenuItem value="furgon">🚐 Furgón</MenuItem>
              <MenuItem value="camion">🚚 Camión</MenuItem>
              <MenuItem value="trailer">🚛 Trailer</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Días de Alquiler"
            type="number"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            inputProps={{ min: 1, max: 30 }}
            sx={{ minWidth: 150 }}
          />
        </Box>

        {dias && !loading && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                📊 <strong>Configuración:</strong> {tipoVehiculo.charAt(0).toUpperCase() + tipoVehiculo.slice(1)} - 24hs - Bajo Techo<br/>
                📅 <strong>Período:</strong> {dias} días<br/>
                🧮 <strong>Cálculo:</strong> {getRango()}<br/>
                💰 <strong>Precio diario:</strong> ${Math.round((precios[tipoVehiculo]?.['24hs']?.['bajo techo'] || 0) / (5.3 + (parseInt(dias) - 1) * (24.7 / 29))).toLocaleString()}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" color="primary.main">
                ${calcularPrecio().toLocaleString()}
              </Typography>
              <Chip 
                label={getRango().split(' ')[0]} 
                color={getColor()} 
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Precio base mensual: ${(precios[tipoVehiculo]?.['24hs']?.['bajo techo'] || 0).toLocaleString()}
            </Typography>
          </Box>
        )}

        {loading && (
          <Alert severity="info">
            <Typography variant="body2">
              Cargando precios...
            </Typography>
          </Alert>
        )}
        
        {!loading && Object.keys(precios).length === 0 && (
          <Alert severity="warning">
            <Typography variant="body2">
              Error cargando precios. Usando valores por defecto.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CalculadoraAlquilerTemporal;