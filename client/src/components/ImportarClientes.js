import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  TextField
} from '@mui/material';
import { Upload, Download, CheckCircle, Error } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { clientesFirestore } from '../services/firestore';

const ImportarClientes = ({ open, onClose, onSuccess }) => {
  const [archivo, setArchivo] = useState(null);
  const [datosPreview, setDatosPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState(null);
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);

  const descargarTemplate = () => {
    const template = [
      { 'Nombre': 'Juan', 'Apellido': 'Pérez' },
      { 'Nombre': 'María', 'Apellido': 'González' },
      { 'Nombre': 'Carlos', 'Apellido': 'López' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'template_clientes.xlsx');
  };

  const procesarArchivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setArchivo(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validar y limpiar datos
        const datosLimpios = jsonData
          .filter(row => row.Nombre && row.Apellido)
          .map((row, index) => ({
            id: index + 1,
            nombre: row.Nombre?.toString().trim(),
            apellido: row.Apellido?.toString().trim(),
            valido: true,
            error: null
          }));
        
        setDatosPreview(datosLimpios);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        alert('Error procesando el archivo Excel. Verifique el formato.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const importarClientes = async () => {
    if (datosPreview.length === 0) return;
    
    setLoading(true);
    setProgreso(0);
    
    const resultadosImport = {
      exitosos: 0,
      errores: 0,
      detalles: []
    };
    
    for (let i = 0; i < datosPreview.length; i++) {
      const cliente = datosPreview[i];
      
      try {
        // Capitalizar nombres
        const nombreCapitalizado = cliente.nombre.charAt(0).toUpperCase() + cliente.nombre.slice(1).toLowerCase();
        const apellidoCapitalizado = cliente.apellido.charAt(0).toUpperCase() + cliente.apellido.slice(1).toLowerCase();
        
        const clienteData = {
          nombre: nombreCapitalizado,
          apellido: apellidoCapitalizado,
          telefono: '', // Se completará después
          tipoVehiculo: 'auto', // Valor por defecto
          modalidadTiempo: 'diurna', // Valor por defecto
          modalidadTecho: 'bajo techo', // Valor por defecto
          fechaIngreso: fechaIngreso, // Fecha seleccionada
          diasVencimiento: 30, // Por defecto 30 días
          empleadoAsignado: '', // Sin asignar
          precio: 20000, // Precio por defecto (se ajustará después)
          fechaProximoVencimiento: new Date(new Date(fechaIngreso).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          estado: 'activo',
          importado: true,
          fechaImportacion: new Date().toISOString()
        };
        
        await clientesFirestore.crear(clienteData);
        
        resultadosImport.exitosos++;
        resultadosImport.detalles.push({
          nombre: `${nombreCapitalizado} ${apellidoCapitalizado}`,
          estado: 'exitoso',
          mensaje: 'Importado correctamente'
        });
        
      } catch (error) {
        console.error(`Error importando ${cliente.nombre}:`, error);
        resultadosImport.errores++;
        resultadosImport.detalles.push({
          nombre: `${cliente.nombre} ${cliente.apellido}`,
          estado: 'error',
          mensaje: error.message || 'Error desconocido'
        });
      }
      
      // Actualizar progreso
      setProgreso(((i + 1) / datosPreview.length) * 100);
    }
    
    setResultados(resultadosImport);
    setLoading(false);
    
    if (resultadosImport.exitosos > 0) {
      onSuccess();
    }
  };

  const reiniciar = () => {
    setArchivo(null);
    setDatosPreview([]);
    setResultados(null);
    setProgreso(0);
    setFechaIngreso(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        📊 Importar Clientes desde Excel
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {!resultados && (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>📋 Instrucciones:</strong><br/>
                1. Descarga el template Excel<br/>
                2. Completa las columnas "Nombre" y "Apellido"<br/>
                3. Sube el archivo<br/>
                4. Los demás datos (teléfono, vehículo, etc.) los completarás después editando cada cliente
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={descargarTemplate}
                sx={{ mr: 2 }}
              >
                📥 Descargar Template Excel
              </Button>
              
              <TextField
                type="date"
                label="Fecha de Ingreso al Negocio"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Esta fecha se aplicará a todos los clientes importados"
                sx={{ ml: 2 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={procesarArchivo}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<Upload />}
                  disabled={loading}
                >
                  📤 Subir Archivo Excel
                </Button>
              </label>
              {archivo && (
                <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                  ✅ Archivo seleccionado: {archivo.name}
                </Typography>
              )}
            </Box>

            {datosPreview.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  👀 Vista Previa ({datosPreview.length} clientes):
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>#</strong></TableCell>
                        <TableCell><strong>Nombre</strong></TableCell>
                        <TableCell><strong>Apellido</strong></TableCell>
                        <TableCell><strong>Fecha Ingreso</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datosPreview.slice(0, 10).map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell>{cliente.id}</TableCell>
                          <TableCell>{cliente.nombre}</TableCell>
                          <TableCell>{cliente.apellido}</TableCell>
                          <TableCell>{new Date(fechaIngreso).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {datosPreview.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                            ... y {datosPreview.length - 10} clientes más
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {loading && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Importando clientes... {Math.round(progreso)}%
                </Typography>
                <LinearProgress variant="determinate" value={progreso} />
              </Box>
            )}
          </>
        )}

        {resultados && (
          <Box>
            <Alert severity={resultados.errores === 0 ? 'success' : 'warning'} sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>📊 Resultado de la Importación:</strong><br/>
                ✅ Exitosos: {resultados.exitosos}<br/>
                ❌ Errores: {resultados.errores}
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom>
              📋 Detalle de Importación:
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Mensaje</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultados.detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>{detalle.nombre}</TableCell>
                      <TableCell>
                        {detalle.estado === 'exitoso' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Error color="error" />
                        )}
                      </TableCell>
                      <TableCell>{detalle.mensaje}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {!resultados ? (
          <>
            <Button
              variant="contained"
              onClick={importarClientes}
              disabled={datosPreview.length === 0 || loading}
              startIcon={<Upload />}
            >
              📥 Importar {datosPreview.length} Clientes
            </Button>
            <Button onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={() => {
                reiniciar();
                onClose();
              }}
            >
              ✅ Finalizar
            </Button>
            <Button
              variant="outlined"
              onClick={reiniciar}
            >
              🔄 Importar Más
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportarClientes;