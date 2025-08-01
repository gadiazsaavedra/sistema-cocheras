import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { preciosFirestore } from '../services/firestore';

const TablaPreciosConfig = () => {
  const [precios, setPrecios] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const vehiculos = ['moto', 'auto', 'camioneta', 'furgon', 'camion', 'trailer'];
  const modalidades = ['diurna', 'nocturna', '24hs'];
  const coberturas = ['bajo techo', 'bajo carpa'];

  const handlePrecioChange = (vehiculo, modalidad, cobertura, valor) => {
    setPrecios(prev => ({
      ...prev,
      [vehiculo]: {
        ...prev[vehiculo],
        [modalidad]: {
          ...prev[vehiculo]?.[modalidad],
          [cobertura]: parseInt(valor) || 0
        }
      }
    }));
  };

  const guardarPrecios = async () => {
    try {
      setGuardando(true);
      await preciosFirestore.guardar(precios);
      setMensaje('✅ Precios guardados exitosamente en Firebase');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando precios:', error);
      setMensaje('❌ Error guardando precios');
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    const cargarPrecios = async () => {
      try {
        setCargando(true);
        // Migrar desde localStorage si existe
        await preciosFirestore.migrarDesdeLocalStorage();
        // Cargar desde Firebase
        const preciosFirebase = await preciosFirestore.obtener();
        setPrecios(preciosFirebase);
      } catch (error) {
        console.error('Error cargando precios:', error);
        setMensaje('❌ Error cargando precios');
      } finally {
        setCargando(false);
      }
    };
    
    cargarPrecios();
  }, []);

  if (cargando) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Cargando configuración de precios desde Firebase...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          💰 Configuración de Precios por Tipo de Vehículo
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          🔄 Los precios ahora se guardan en Firebase y se sincronizan automáticamente
        </Alert>
        
        {mensaje && (
          <Alert 
            severity={mensaje.includes('❌') ? 'error' : 'success'}
            sx={{ mb: 2 }}
            onClose={() => setMensaje('')}
          >
            {mensaje}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vehículo</TableCell>
                <TableCell align="center">Diurna (8-17hs)</TableCell>
                <TableCell align="center">Nocturna (17-8hs)</TableCell>
                <TableCell align="center">24 Horas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehiculos.map((vehiculo) => (
                <React.Fragment key={vehiculo}>
                  <TableRow>
                    <TableCell rowSpan={2} sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {vehiculo}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>
                      <Typography variant="caption" display="block">Bajo Techo</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]?.diurna?.['bajo techo'] || 0}
                        onChange={(e) => handlePrecioChange(vehiculo, 'diurna', 'bajo techo', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>
                      <Typography variant="caption" display="block">Bajo Techo</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]?.nocturna?.['bajo techo'] || 0}
                        onChange={(e) => handlePrecioChange(vehiculo, 'nocturna', 'bajo techo', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>
                      <Typography variant="caption" display="block">Bajo Techo</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]?.['24hs']?.['bajo techo'] || 0}
                        onChange={(e) => handlePrecioChange(vehiculo, '24hs', 'bajo techo', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="center" sx={{ bgcolor: 'blue.50' }}>
                      <Typography variant="caption" display="block">Bajo Carpa</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]?.diurna?.['bajo carpa'] || 0}
                        onChange={(e) => handlePrecioChange(vehiculo, 'diurna', 'bajo carpa', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'blue.50' }}>
                      <Typography variant="caption" display="block">Bajo Carpa</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]?.nocturna?.['bajo carpa'] || 0}
                        onChange={(e) => handlePrecioChange(vehiculo, 'nocturna', 'bajo carpa', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'blue.50' }}>
                      <Typography variant="caption" display="block">Bajo Carpa</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]?.['24hs']?.['bajo carpa'] || 0}
                        onChange={(e) => handlePrecioChange(vehiculo, '24hs', 'bajo carpa', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={guardarPrecios}
            disabled={guardando}
            startIcon={guardando ? <CircularProgress size={20} /> : null}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Precios en Firebase'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TablaPreciosConfig;