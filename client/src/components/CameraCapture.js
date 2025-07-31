import React, { useState, useRef } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  useMediaQuery, 
  useTheme,
  Alert,
  CircularProgress
} from '@mui/material';
import { PhotoCamera, CheckCircle, Cameraswitch } from '@mui/icons-material';

const CameraCapture = ({ onCapture, captured }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [stream, setStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setLoading(true);
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      let errorMsg = 'No se pudo acceder a la cámara.';
      
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Permisos de cámara denegados. Toque el candado 🔒 y active la cámara.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No se encontró cámara en el dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Cámara no soportada en este navegador. Pruebe con Chrome.';
      }
      
      // Ofrecer alternativa de simulación para desarrollo
      if (window.location.hostname !== 'localhost') {
        errorMsg += ' \n\n📱 Para desarrollo: Use el simulador de foto.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Función para simular captura de foto (solo para desarrollo)
  const simularFoto = () => {
    // Crear una imagen simulada
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Fondo
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 300);
    
    // Texto simulado
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText('📄 COMPROBANTE SIMULADO', 50, 100);
    ctx.fillText('💰 Pago: $15,000', 50, 140);
    ctx.fillText('📅 ' + new Date().toLocaleDateString(), 50, 180);
    ctx.fillText('🏠 Sistema Cocheras', 50, 220);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `comprobante-sim-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    stopCamera();
    setTimeout(() => startCamera(), 100);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      // Agregar timestamp y ubicación si está disponible
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, canvas.height - 60, canvas.width, 60);
      context.fillStyle = 'white';
      context.font = '16px Arial';
      context.fillText(`Fecha: ${new Date().toLocaleString()}`, 10, canvas.height - 35);
      context.fillText(`Sistema Cocheras - Comprobante`, 10, canvas.height - 15);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `comprobante-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!showCamera && !captured && (
        <Box>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <PhotoCamera />}
            onClick={startCamera}
            fullWidth
            disabled={loading}
            size={isMobile ? 'large' : 'medium'}
            sx={{ 
              height: isMobile ? 56 : 48,
              fontSize: isMobile ? '1.1rem' : '1rem',
              mb: error && window.location.hostname !== 'localhost' ? 1 : 0
            }}
            color={error ? 'error' : 'primary'}
          >
            {loading ? 'Iniciando cámara...' : '📷 Tomar Foto del Comprobante'}
          </Button>
          
          {/* Botón simulador solo si hay error y no es localhost */}
          {error && window.location.hostname !== 'localhost' && (
            <Button
              variant="contained"
              onClick={simularFoto}
              fullWidth
              size={isMobile ? 'large' : 'medium'}
              sx={{ 
                height: isMobile ? 56 : 48,
                fontSize: isMobile ? '1.1rem' : '1rem',
                bgcolor: 'orange',
                '&:hover': { bgcolor: 'darkorange' }
              }}
            >
              📱 Usar Foto Simulada (Desarrollo)
            </Button>
          )}
        </Box>
      )}
      
      {captured && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          bgcolor: 'success.light',
          borderRadius: 2,
          color: 'success.contrastText'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1 }} />
            <Typography variant={isMobile ? 'body1' : 'body2'}>
              ✅ Foto capturada correctamente
            </Typography>
          </Box>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => {
              onCapture(null);
              setShowCamera(false);
            }}
            sx={{ 
              color: 'success.contrastText',
              borderColor: 'success.contrastText'
            }}
          >
            Tomar otra
          </Button>
        </Box>
      )}
      
      {showCamera && (
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ 
                width: '100%', 
                maxWidth: isMobile ? '100%' : '400px', 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            />
            
            {/* Overlay con instrucciones */}
            <Box sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              right: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              p: 1,
              borderRadius: 1,
              fontSize: '0.9rem'
            }}>
              📄 Enfoque el comprobante de pago
            </Box>
          </Box>
          
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            gap: 1,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              onClick={capturePhoto}
              size={isMobile ? 'large' : 'medium'}
              sx={{ minWidth: 120 }}
            >
              📸 Capturar
            </Button>
            
            {isMobile && (
              <Button
                variant="outlined"
                onClick={switchCamera}
                startIcon={<Cameraswitch />}
                size="large"
              >
                Cambiar
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={stopCamera}
              size={isMobile ? 'large' : 'medium'}
              sx={{ minWidth: 100 }}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default CameraCapture;