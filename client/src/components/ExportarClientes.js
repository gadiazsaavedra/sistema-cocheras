import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Print, PictureAsPdf, TableChart } from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { calcularEstadoCliente, getEstadoTexto } from '../utils/morosidad';

const ExportarClientes = ({ open, onClose, clientes, todosLosPagos, ordenamiento }) => {
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState({
    nombre: true,
    apellido: true,
    telefono: true,
    vehiculo: true,
    empleado: true,
    precio: true,
    vencimiento: true,
    estado: true,
    cochera: false,
    modalidad: false
  });

  const [formatoImpresion, setFormatoImpresion] = useState('completo');

  const columnas = {
    nombre: 'Nombre',
    apellido: 'Apellido', 
    telefono: 'Teléfono',
    vehiculo: 'Vehículo',
    empleado: 'Empleado',
    precio: 'Precio',
    vencimiento: 'Vencimiento',
    estado: 'Estado',
    cochera: 'Cochera',
    modalidad: 'Modalidad'
  };

  const handleColumnChange = (columna) => {
    setColumnasSeleccionadas(prev => ({
      ...prev,
      [columna]: !prev[columna]
    }));
  };

  const prepararDatos = () => {
    return clientes.map(cliente => {
      const estadoMorosidad = calcularEstadoCliente(cliente, todosLosPagos);
      
      return {
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        telefono: cliente.telefono || '',
        vehiculo: cliente.tipoVehiculo || '',
        empleado: cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar',
        precio: `$${(cliente.precio || 0).toLocaleString()}`,
        vencimiento: cliente.fechaProximoVencimiento ? 
          new Date(cliente.fechaProximoVencimiento).toLocaleDateString() : 'No definido',
        estado: getEstadoTexto(estadoMorosidad),
        cochera: cliente.numeroCochera || 'N/A',
        modalidad: `${cliente.modalidadTiempo || ''} ${cliente.modalidadTecho || ''}`.trim()
      };
    });
  };

  const filtrarColumnas = (datos) => {
    return datos.map(fila => {
      const filaFiltrada = {};
      Object.keys(columnasSeleccionadas).forEach(key => {
        if (columnasSeleccionadas[key]) {
          filaFiltrada[columnas[key]] = fila[key];
        }
      });
      return filaFiltrada;
    });
  };

  const handleImprimir = () => {
    const datos = prepararDatos();
    const datosFiltrados = filtrarColumnas(datos);
    
    if (datosFiltrados.length === 0) {
      alert('No hay datos para imprimir');
      return;
    }

    const ventanaImpresion = window.open('', '_blank');
    const headers = Object.keys(datosFiltrados[0]);
    
    const estilos = formatoImpresion === 'compacto' ? 
      'font-size: 10px; padding: 2px;' : 
      'font-size: 12px; padding: 8px;';

    const html = `
      <html>
        <head>
          <title>Lista de Clientes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 15px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; ${estilos} text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .page-break { page-break-before: always; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>📋 Lista de Clientes</h2>
            <div class="info">
              Generado el: ${new Date().toLocaleDateString()} | 
              Total clientes: ${datosFiltrados.length} | 
              Ordenado por: ${ordenamiento}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${datosFiltrados.map(fila => `
                <tr>
                  ${headers.map(header => `<td>${fila[header] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
  };

  const handleExportarPDF = () => {
    const datos = prepararDatos();
    const datosFiltrados = filtrarColumnas(datos);
    
    if (datosFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    const headers = Object.keys(datosFiltrados[0]);
    const rows = datosFiltrados.map(fila => headers.map(header => fila[header] || ''));

    // Título
    doc.setFontSize(16);
    doc.text('📋 Lista de Clientes', 20, 20);
    
    // Información
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total: ${datosFiltrados.length} clientes`, 20, 35);
    doc.text(`Ordenado por: ${ordenamiento}`, 20, 40);

    // Tabla
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: { 
        fontSize: formatoImpresion === 'compacto' ? 8 : 10,
        cellPadding: formatoImpresion === 'compacto' ? 2 : 3
      },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`clientes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportarExcel = () => {
    const datos = prepararDatos();
    const datosFiltrados = filtrarColumnas(datos);
    
    if (datosFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Crear hoja con datos
    const ws = XLSX.utils.json_to_sheet(datosFiltrados);
    
    // Agregar información en las primeras filas
    XLSX.utils.sheet_add_aoa(ws, [
      ['Lista de Clientes'],
      [`Generado: ${new Date().toLocaleDateString()}`],
      [`Total clientes: ${datosFiltrados.length}`],
      [`Ordenado por: ${ordenamiento}`],
      [] // Fila vacía
    ], { origin: 'A1' });
    
    // Mover los datos hacia abajo
    const range = XLSX.utils.decode_range(ws['!ref']);
    range.s.r = 5; // Empezar desde la fila 6
    ws['!ref'] = XLSX.utils.encode_range(range);
    
    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    
    // Guardar archivo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columnasSeleccionadasCount = Object.values(columnasSeleccionadas).filter(Boolean).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        📊 Exportar Lista de Clientes
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Se exportarán <strong>{clientes.length} clientes</strong> con el ordenamiento actual: <strong>{ordenamiento}</strong>
        </Alert>

        {/* Selección de Columnas */}
        <Typography variant="h6" gutterBottom>
          📋 Seleccionar Columnas ({columnasSeleccionadasCount}/10)
        </Typography>
        <FormGroup row sx={{ mb: 3 }}>
          {Object.entries(columnas).map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={columnasSeleccionadas[key]}
                  onChange={() => handleColumnChange(key)}
                />
              }
              label={label}
              sx={{ minWidth: '150px' }}
            />
          ))}
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        {/* Formato de Impresión */}
        <Typography variant="h6" gutterBottom>
          🖨️ Formato de Impresión
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Formato</InputLabel>
          <Select
            value={formatoImpresion}
            onChange={(e) => setFormatoImpresion(e.target.value)}
          >
            <MenuItem value="completo">📄 Completo - Texto grande, más legible</MenuItem>
            <MenuItem value="compacto">📑 Compacto - Texto pequeño, más datos por página</MenuItem>
          </Select>
        </FormControl>

        {columnasSeleccionadasCount === 0 && (
          <Alert severity="warning">
            Debe seleccionar al menos una columna para exportar
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handleImprimir}
            disabled={columnasSeleccionadasCount === 0}
            color="primary"
          >
            🖨️ Imprimir
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={handleExportarPDF}
            disabled={columnasSeleccionadasCount === 0}
            color="error"
          >
            📄 PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<TableChart />}
            onClick={handleExportarExcel}
            disabled={columnasSeleccionadasCount === 0}
            color="success"
          >
            📊 Excel
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ExportarClientes;