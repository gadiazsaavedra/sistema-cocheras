import React, { useState, useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { PhotoCamera, CheckCircle } from '@mui/icons-material';

const CameraCapture = ({ onCapture, captured }) => {
  const [stream, setStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Cámara trasera
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      alert('No se pudo acceder a la cámara');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'comprobante.jpg', { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  return (
    <Box>
      {!showCamera && !captured && (
        <Button
          variant="outlined"
          startIcon={<PhotoCamera />}
          onClick={startCamera}
          fullWidth
        >
          Tomar Foto del Comprobante
        </Button>
      )}
      
      {captured && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'green' }}>
          <CheckCircle sx={{ mr: 1 }} />
          <Typography>Foto capturada correctamente</Typography>
          <Button 
            size="small" 
            onClick={() => {
              onCapture(null);
              setShowCamera(false);
            }}
            sx={{ ml: 2 }}
          >
            Tomar otra
          </Button>
        </Box>
      )}
      
      {showCamera && (
        <Box sx={{ textAlign: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}
          />
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={capturePhoto}
              sx={{ mr: 2 }}
            >
              Capturar
            </Button>
            <Button
              variant="outlined"
              onClick={stopCamera}
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