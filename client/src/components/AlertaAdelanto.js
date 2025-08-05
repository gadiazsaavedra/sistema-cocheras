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

  return (
    <Alert 
      severity={getSeverity()} 
      sx={{ mb: 2 }}
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
  );
};

export default AlertaAdelanto;