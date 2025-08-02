import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LazyLoader = ({ message = 'Cargando...' }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: '200px',
    flexDirection: 'column'
  }}>
    <CircularProgress size={40} />
    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
      {message}
    </Typography>
  </Box>
);

export default LazyLoader;