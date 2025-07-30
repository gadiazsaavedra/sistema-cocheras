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
  Alert
} from '@mui/material';

const TablaPreciosConfig = () => {
  const [precios, setPrecios] = useState({
    moto: { diurna: { 'bajo techo': 15000, 'bajo carpa': 12000 }, nocturna: { 'bajo techo': 18000, 'bajo carpa': 15000 }, '24hs': { 'bajo techo': 25000, 'bajo carpa': 20000 } },
    auto: { diurna: { 'bajo techo': 20000, 'bajo carpa': 17000 }, nocturna: { 'bajo techo': 23000, 'bajo carpa': 20000 }, '24hs': { 'bajo techo': 35000, 'bajo carpa': 30000 } },
    camioneta: { diurna: { 'bajo techo': 25000, 'bajo carpa': 22000 }, nocturna: { 'bajo techo': 28000, 'bajo carpa': 25000 }, '24hs': { 'bajo techo': 40000, 'bajo carpa': 35000 } },
    furgon: { diurna: { 'bajo techo': 30000, 'bajo carpa': 27000 }, nocturna: { 'bajo techo': 33000, 'bajo carpa': 30000 }, '24hs': { 'bajo techo': 45000, 'bajo carpa': 40000 } },
    camion: { diurna: { 'bajo techo': 40000, 'bajo carpa': 35000 }, nocturna: { 'bajo techo': 45000, 'bajo carpa': 40000 }, '24hs': { 'bajo techo': 60000, 'bajo carpa': 55000 } },
    trailer: { diurna: { 'bajo techo': 50000, 'bajo carpa': 45000 }, nocturna: { 'bajo techo': 55000, 'bajo carpa': 50000 }, '24hs': { 'bajo techo': 75000, 'bajo carpa': 70000 } }
  });
  
  const [mensaje, setMensaje] = useState('');

  const vehiculos = ['moto', 'auto', 'camioneta', 'furgon', 'camion', 'trailer'];
  const modalidades = ['diurna', 'nocturna', '24hs'];
  const coberturas = ['bajo techo', 'bajo carpa'];

  const handlePrecioChange = (vehiculo, modalidad, cobertura, valor) => {
    setPrecios(prev => ({
      ...prev,
      [vehiculo]: {
        ...prev[vehiculo],
        [modalidad]: {
          ...prev[vehiculo][modalidad],
          [cobertura]: parseInt(valor) || 0
        }
      }
    }));
  };

  const guardarPrecios = () => {
    localStorage.setItem('tablaPreciosCocheras', JSON.stringify(precios));
    setMensaje('✅ Precios guardados exitosamente');
    setTimeout(() => setMensaje(''), 3000);
  };

  useEffect(() => {
    const preciosGuardados = localStorage.getItem('tablaPreciosCocheras');
    if (preciosGuardados) {
      setPrecios(JSON.parse(preciosGuardados));
    }
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Configuración de Precios por Tipo de Vehículo
        </Typography>
        
        {mensaje && (
          <Alert 
            severity="success"
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
                        value={precios[vehiculo].diurna['bajo techo']}
                        onChange={(e) => handlePrecioChange(vehiculo, 'diurna', 'bajo techo', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>
                      <Typography variant="caption" display="block">Bajo Techo</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo].nocturna['bajo techo']}
                        onChange={(e) => handlePrecioChange(vehiculo, 'nocturna', 'bajo techo', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>
                      <Typography variant="caption" display="block">Bajo Techo</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]['24hs']['bajo techo']}
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
                        value={precios[vehiculo].diurna['bajo carpa']}
                        onChange={(e) => handlePrecioChange(vehiculo, 'diurna', 'bajo carpa', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'blue.50' }}>
                      <Typography variant="caption" display="block">Bajo Carpa</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo].nocturna['bajo carpa']}
                        onChange={(e) => handlePrecioChange(vehiculo, 'nocturna', 'bajo carpa', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'blue.50' }}>
                      <Typography variant="caption" display="block">Bajo Carpa</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={precios[vehiculo]['24hs']['bajo carpa']}
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
          <Button variant="contained" onClick={guardarPrecios}>
            Guardar Precios
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TablaPreciosConfig;