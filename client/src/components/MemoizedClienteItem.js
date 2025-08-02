import React from 'react';
import {
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { Add, Payment } from '@mui/icons-material';

const ClienteItem = React.memo(({ 
  cliente, 
  estadoMorosidad, 
  esMoroso, 
  isMobile, 
  onRegistrarPago 
}) => {
  return (
    <ListItem 
      sx={{ 
        border: esMoroso ? '2px solid #f44336' : '1px solid #e0e0e0',
        borderRadius: 2,
        mb: 1,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        bgcolor: esMoroso ? 'rgba(244, 67, 54, 0.05)' : 'inherit'
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                color: esMoroso ? 'error.main' : 'inherit'
              }}
            >
              {cliente.nombre} {cliente.apellido}
            </Typography>
            {esMoroso && (
              <Chip 
                label="MOROSO"
                color="error"
                size="small"
                sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              🏠 Cochera: {cliente.numeroCochera}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🕰️ {cliente.modalidadTiempo} {cliente.modalidadTecho}
            </Typography>
            {cliente.precio && (
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                💵 ${cliente.precio}
              </Typography>
            )}
          </Box>
        }
        sx={{ mb: isMobile ? 2 : 0 }}
      />
      <Button
        variant="contained"
        color={esMoroso ? 'error' : 'primary'}
        onClick={() => onRegistrarPago(cliente)}
        startIcon={<Add />}
        fullWidth={isMobile}
        sx={{ 
          minWidth: isMobile ? 'auto' : 140,
          height: 40,
          fontWeight: esMoroso ? 'bold' : 'normal'
        }}
      >
        {esMoroso ? 
          (isMobile ? 'COBRAR DEUDA' : 'COBRAR') : 
          (isMobile ? 'Registrar Pago' : 'Pago')
        }
      </Button>
    </ListItem>
  );
});

ClienteItem.displayName = 'ClienteItem';

export default ClienteItem;