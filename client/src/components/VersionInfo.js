import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import { Close, Info } from '@mui/icons-material';
import { VERSION_INFO } from '../utils/version';

const VersionInfo = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Info sx={{ mr: 1 }} />
          Información de Versión
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sistema de Gestión de Cocheras
          </Typography>
          <Chip 
            label={`Versión ${VERSION_INFO.version}`} 
            color="primary" 
            sx={{ mr: 1 }} 
          />
          <Chip 
            label={`Build: ${VERSION_INFO.buildDate}`} 
            variant="outlined" 
          />
        </Box>

        {Object.entries(VERSION_INFO.changelog).reverse().map(([version, changes]) => (
          <Box key={version} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Versión {version}
            </Typography>
            <List dense>
              {changes.map((change, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={change}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default VersionInfo;