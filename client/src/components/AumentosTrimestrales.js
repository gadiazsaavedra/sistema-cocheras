import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import { TrendingUp, Email, Schedule } from '@mui/icons-material';
import { clientesFirestore } from '../services/firestore';

const AumentosTrimestrales = () => {
  const [clientesParaAumento, setClientesParaAumento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarClientesParaAumento();
  }, []);

  const cargarClientesParaAumento = async () => {
    setLoading(true);
    try {
      const response = await clientesFirestore.obtener();
      const clientes = response.datos || response || [];
      const hoy = new Date();
      
      const clientesConAumentoPendiente = clientes
        .filter(cliente => cliente.estado === 'activo')
        .map(cliente => {
          const ultimoAumento = cliente.fechaUltimoAumento 
            ? new Date(cliente.fechaUltimoAumento) 
            : new Date(cliente.fechaCreacion?.toDate?.() || hoy);
          
          const mesesTranscurridos = Math.floor((hoy - ultimoAumento) / (1000 * 60 * 60 * 24 * 30));
          
          return {
            ...cliente,
            mesesSinAumento: mesesTranscurridos,
            ultimoAumento: ultimoAumento.toLocaleDateString('es-AR'),
            requiereAumento: mesesTranscurridos >= 3
          };
        })
        .filter(cliente => cliente.requiereAumento)
        .sort((a, b) => b.mesesSinAumento - a.mesesSinAumento);
      
      setClientesParaAumento(clientesConAumentoPendiente);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setMensaje('❌ Error cargando datos');
    }
    setLoading(false);
  };

  const enviarNotificacionManual = async () => {
    setLoading(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? 'https://sistema-cocheras-backend.onrender.com/api'
        : 'http://localhost:3000/api';
      
      const response = await fetch(`${apiUrl}/admin/aumentos-trimestrales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setMensaje('✅ Notificación enviada exitosamente');
      } else {
        setMensaje('❌ Error enviando notificación');
      }
    } catch (error) {
      console.error('Error enviando notificación:', error);
      setMensaje('❌ Error enviando notificación');
    }
    setLoading(false);
  };

  const getColorPorMeses = (meses) => {
    if (meses >= 6) return 'error';
    if (meses >= 4) return 'warning';
    return 'info';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Schedule sx={{ mr: 1 }} />
        📅 Aumentos Trimestrales
      </Typography>

      {mensaje && (
        <Alert 
          severity={mensaje.includes('❌') ? 'error' : 'success'} 
          sx={{ mb: 3 }}
          onClose={() => setMensaje('')}
        >
          {mensaje}
        </Alert>
      )}

      {/* Resumen */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="warning.main">
              {clientesParaAumento.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clientes requieren aumento (3+ meses)
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="error.main">
              {clientesParaAumento.filter(c => c.mesesSinAumento >= 6).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clientes con 6+ meses sin aumento
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Email />}
              onClick={enviarNotificacionManual}
              disabled={loading || clientesParaAumento.length === 0}
              fullWidth
            >
              {loading ? 'Enviando...' : 'Enviar Notificación'}
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Información del sistema automático */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          📧 <strong>Sistema Automático:</strong> Se envía una notificación por email automáticamente 
          el primer día de cada mes a las 8:00 AM con todos los clientes que requieren aumento.
        </Typography>
      </Alert>

      {/* Tabla de clientes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Clientes que Requieren Aumento
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : clientesParaAumento.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              ✅ No hay clientes que requieran aumento trimestral
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Precio Actual</TableCell>
                    <TableCell>Último Aumento</TableCell>
                    <TableCell>Meses Sin Aumento</TableCell>
                    <TableCell>Empleado Asignado</TableCell>
                    <TableCell>Prioridad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesParaAumento.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {cliente.nombre} {cliente.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cliente.telefono}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          ${cliente.precio?.toLocaleString() || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cliente.ultimoAumento}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${cliente.mesesSinAumento} meses`}
                          color={getColorPorMeses(cliente.mesesSinAumento)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cliente.mesesSinAumento >= 6 ? 'URGENTE' : 'NORMAL'}
                          color={cliente.mesesSinAumento >= 6 ? 'error' : 'warning'}
                          size="small"
                          variant={cliente.mesesSinAumento >= 6 ? 'filled' : 'outlined'}
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
    </Box>
  );
};

export default AumentosTrimestrales;