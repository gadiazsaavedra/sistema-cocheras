import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import PhoneAuth from './PhoneAuth';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError('Credenciales incorrectas');
    }
    
    setLoading(false);
  };

  const handlePhoneSuccess = (userData) => {
    // Simular login exitoso con datos del teléfono
    login(userData.email, 'phone_auth');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Sistema de Cocheras
          </Typography>
          
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="Email" />
            <Tab label="Teléfono" />
          </Tabs>
          
          {tabValue === 0 && (
            <Box>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
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