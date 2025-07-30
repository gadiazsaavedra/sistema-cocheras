import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Phone } from '@mui/icons-material';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const PhoneAuth = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Números autorizados de empleados
  const empleadosAutorizados = {
    '+5491123456789': { nombre: 'Victor', email: 'victor@empresa.com' },
    '+5491123456790': { nombre: 'Raul', email: 'raul@empresa.com' },
    '+5491123456791': { nombre: 'Carlos', email: 'carlos@empresa.com' },
    '+5491123456792': { nombre: 'Fernando', email: 'fernando@empresa.com' }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        }
      });
    }
  };

  const sendVerificationCode = async () => {
    if (!empleadosAutorizados[phoneNumber]) {
      setError('Número no autorizado. Solo empleados pueden acceder.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setError('');
    } catch (error) {
      setError('Error enviando código: ' + error.message);
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (!confirmationResult) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const empleado = empleadosAutorizados[phoneNumber];
      
      // Simular datos de usuario para el sistema
      const userData = {
        uid: result.user.uid,
        phoneNumber: phoneNumber,
        email: empleado.email,
        displayName: empleado.nombre,
        role: 'empleado'
      };

      onSuccess(userData);
    } catch (error) {
      setError('Código incorrecto');
    }
    setLoading(false);
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Phone sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5">Acceso por Teléfono</Typography>
          <Typography variant="body2" color="text.secondary">
            Solo para empleados autorizados
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!confirmationResult ? (
          <Box>
            <TextField
              fullWidth
              label="Número de Teléfono"
              placeholder="+5491123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Formato: +54911XXXXXXXX"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={sendVerificationCode}
              disabled={loading || !phoneNumber}
            >
              {loading ? 'Enviando...' : 'Enviar Código SMS'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Código enviado a {phoneNumber}
            </Alert>
            <TextField
              fullWidth
              label="Código de Verificación"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={verifyCode}
              disabled={loading || !verificationCode}
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setConfirmationResult(null);
                setVerificationCode('');
              }}
              sx={{ mt: 1 }}
            >
              Cambiar Número
            </Button>
          </Box>
        )}

        <div id="recaptcha-container"></div>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" display="block">
            <strong>Empleados Autorizados:</strong>
          </Typography>
          {Object.entries(empleadosAutorizados).map(([phone, data]) => (
            <Typography key={phone} variant="caption" display="block">
              • {data.nombre}: {phone}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PhoneAuth;