import React from 'react';
import { Alert, Typography, Chip, Box } from '@mui/material';
import { Schedule, Warning } from '@mui/icons-material';

const AlertaAdelanto = ({ cliente }) => {
  if (!cliente?.mesesAdelantados || !cliente?.fechaVencimientoAdelanto) {
    return null;
  }

  const fechaVencimiento = new Date(cliente.fechaVencimientoAdelanto.toDate?.() || cliente.fechaVencimientoAdelanto);
  const hoy = new Date();
  const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

  const getSeverity = () => {
    if (diasRestantes <= 0) return 'error';
    if (diasRestantes <= 7) return 'warning';
    if (diasRestantes <= 30) return 'info';
    return 'success';
  };

  const getMensaje = () => {
    if (diasRestantes <= 0) return '🔴 Adelanto vencido';
    if (diasRestantes <= 7) return '🟡 Adelanto por vencer';
    if (diasRestantes <= 30) return '🟠 Adelanto próximo a vencer';
    return '🟢 Adelanto vigente';
  };

  const eliminarAdelanto = async () => {
    if (!window.confirm('¿Eliminar el adelanto de este cliente?')) return;
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const apiUrl = window.location.hostname.includes('netlify.app') 
        ? 'https://sistema-cocheras-backend.onrender.com/api'
        : 'http://localhost:3000/api';
      
      const response = await fetch(`${apiUrl}/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mesesAdelantados: null,
          fechaVencimientoAdelanto: null,
          ultimoPagoAdelantado: null
        })
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Alert 
        severity={getSeverity()} 
        sx={{ mb: 1 }}
        icon={<Schedule />}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            <strong>{getMensaje()}</strong>
          </Typography>
          <Chip 
            label={`${cliente.mesesAdelantados} meses pagados`}
            size="small"
            color={getSeverity()}
          />
          <Chip 
            label={`Válido hasta: ${fechaVencimiento.toLocaleDateString('es-AR')}`}
            size="small"
            variant="outlined"
          />
          {diasRestantes > 0 && (
            <Chip 
              label={`${diasRestantes} días restantes`}
              size="small"
              color={getSeverity()}
            />
          )}
        </Box>
      </Alert>
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <button 
          onClick={eliminarAdelanto}
          style={{ 
            background: '#ff4444', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          ❌ ELIMINAR ADELANTO
        </button>
      </Box>
    </>
  );
};

export default AlertaAdelanto;