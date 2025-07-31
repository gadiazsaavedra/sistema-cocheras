import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import PhoneAuth from './PhoneAuth';

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Recuperar email guardado
    const savedEmail = localStorage.getItem('cocheras_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      // Guardar email si "recordar" está activado
      if (rememberMe) {
        localStorage.setItem('cocheras_email', email);
      } else {
        localStorage.removeItem('cocheras_email');
      }
    } else {
      setError(result.error || 'Error de conexión');
    }
    
    setLoading(false);
  };

  const handlePhoneSuccess = (userData) => {
    // Simular login exitoso con datos del teléfono
    login(userData.email, 'phone_auth');
  };

  return (
    <Container maxWidth={isMobile ? 'xs' : 'sm'}>
      <Box sx={{ 
        mt: isMobile ? 4 : 8,
        px: isMobile ? 1 : 0
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: isMobile ? 2 : 4,
            borderRadius: isMobile ? 2 : 1
          }}
        >
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            align="center" 
            gutterBottom
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            🏠 Sistema de Cocheras
          </Typography>
          
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)} 
            sx={{ mb: 3 }}
            variant={isMobile ? 'fullWidth' : 'standard'}
          >
            <Tab label="Email" />
            <Tab label="Teléfono" />
          </Tabs>
          
          {tabValue === 0 && (
            <Box>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="email"
                  size={isMobile ? 'medium' : 'medium'}
                />
                
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  size={isMobile ? 'medium' : 'medium'}
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Recordar email"
                  sx={{ mt: 1, mb: 2 }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ 
                    mt: 2, 
                    mb: 2,
                    height: isMobile ? 48 : 42,
                    fontSize: isMobile ? '1.1rem' : '1rem'
                  }}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
            </Box>
          )}
          
          {tabValue === 1 && (
            <PhoneAuth onSuccess={handlePhoneSuccess} />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;