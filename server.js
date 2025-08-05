const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const multer = require('multer');
const moment = require('moment');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
// const backupRouter = require('./backup-api');
// const { 
//   initSentryBackend, 
//   sentryRequestHandler, 
//   sentryErrorHandler, 
//   captureError, 
//   captureMessage,
//   setUser 
// } = require('./error-monitoring');
const { enviarNotificacionPagoPendiente, enviarResumenDiario } = require('./email-notifications');
const { verificarAumentosTrimestrales } = require('./aumentos-trimestrales');

// Inicializar Sentry
// initSentryBackend();

const app = express();
const PORT = process.env.PORT || 10000;
const https = require('https');

// Configuración Firebase Admin (solo Firestore - GRATUITO)
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Crear directorio para fotos locales
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Sentry request handler (debe ir antes de otras rutas)
// app.use(sentryRequestHandler());

// CORS más permisivo para debugging
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Origin:', origin);
    // Permitir requests sin origin (Postman, apps móviles)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://sistema-cocheras.netlify.app',
      'https://sistema-cocheras-backend.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Temporalmente permitir todos los orígenes para debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Manejar preflight requests
app.options('*', (req, res) => {
  console.log('📶 Preflight request:', req.method, req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Log todas las peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('📱 Headers:', req.headers.origin, req.headers.authorization ? 'Auth: YES' : 'Auth: NO');
  next();
});
app.use(express.json());
app.use(express.static('client/build'));
app.use('/uploads', express.static('uploads')); // Servir fotos locales

// Rutas de backup
// app.use('/api/backup', backupRouter);

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(403).json({ error: 'Token inválido' });
  }
};

// Configuración multer para almacenamiento local (GRATUITO)
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// RUTAS DE AUTENTICACIÓN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // La autenticación se maneja en el frontend con Firebase Auth
    res.json({ message: 'Login manejado por Firebase Auth' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE CLIENTES
app.get('/api/clientes', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('clientes').get();
    const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(clientes);
  } catch (error) {
    console.error('Error en /api/clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clientes', authenticateToken, async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    const clienteData = {
      ...req.body,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'activo'
    };
    console.log('Guardando cliente:', clienteData);
    const docRef = await db.collection('clientes').add(clienteData);
    console.log('Cliente guardado con ID:', docRef.id);
    res.json({ id: docRef.id, ...clienteData });
  } catch (error) {
    console.error('Error guardando cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clientes/:id', authenticateToken, async (req, res) => {
  try {
    await db.collection('clientes').doc(req.params.id).update(req.body);
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE PAGOS
app.get('/api/pagos', authenticateToken, async (req, res) => {
  try {
    const { estado, empleado, fecha } = req.query;
    let query = db.collection('pagos');
    
    if (estado) query = query.where('estado', '==', estado);
    if (empleado) query = query.where('empleadoId', '==', empleado);
    if (fecha) {
      const startDate = moment(fecha).startOf('day').toDate();
      const endDate = moment(fecha).endOf('day').toDate();
      query = query.where('fechaRegistro', '>=', startDate)
                   .where('fechaRegistro', '<=', endDate);
    }
    
    const snapshot = await query.get();
    const pagos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convertir timestamps de Firestore a formato serializable
        fechaRegistro: data.fechaRegistro ? data.fechaRegistro.toDate().toISOString() : null,
        fechaConfirmacion: data.fechaConfirmacion ? data.fechaConfirmacion.toDate().toISOString() : null
      };
    });
    res.json(pagos);
  } catch (error) {
    console.error('Error en /api/pagos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para pagos adelantados
app.post('/api/pagos/adelantado', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Recibiendo pago adelantado:', req.body);
    
    const pagoData = {
      ...req.body,
      monto: parseFloat(req.body.monto),
      empleadoId: req.user.uid,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'confirmado', // Los pagos adelantados se confirman automáticamente
      fechaConfirmacion: admin.firestore.FieldValue.serverTimestamp(),
      confirmadoPor: req.user.uid
    };
    
    console.log('💾 Guardando pago adelantado en Firestore...');
    const docRef = await db.collection('pagos').add(pagoData);
    
    // Actualizar cliente con información del adelanto
    const fechaVencimiento = new Date();
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + req.body.mesesAdelantados);
    
    await db.collection('clientes').doc(req.body.clienteId).update({
      mesesAdelantados: req.body.mesesAdelantados,
      fechaVencimientoAdelanto: admin.firestore.Timestamp.fromDate(fechaVencimiento),
      ultimoPagoAdelantado: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Pago adelantado guardado con ID:', docRef.id);
    res.json({ id: docRef.id, ...pagoData });
  } catch (error) {
    console.error('❌ Error en pago adelantado:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pagos', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Recibiendo pago:', req.body);
    console.log('💰 Monto original:', req.body.monto, 'tipo:', typeof req.body.monto);
    console.log('💰 Monto parseado:', parseFloat(req.body.monto));
    
    const pagoData = {
      ...req.body,
      monto: parseFloat(req.body.monto),
      empleadoId: req.user.uid,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
      estado: req.body.empleadoNombre?.includes('ADMIN') ? 'confirmado' : 'pendiente'
    };
    
    // Si es pago directo de admin, agregar datos de confirmación
    if (req.body.empleadoNombre?.includes('ADMIN')) {
      pagoData.fechaConfirmacion = admin.firestore.FieldValue.serverTimestamp();
      pagoData.confirmadoPor = req.user.uid;
    }
    
    console.log('💾 Guardando pago en Firestore...');
    const docRef = await db.collection('pagos').add(pagoData);
    console.log('✅ Pago guardado con ID:', docRef.id);
    
    // Enviar notificación por email a administradores
    console.log('📧 Enviando notificación por email...');
    const emailResult = await enviarNotificacionPagoPendiente({
      ...pagoData,
      id: docRef.id,
      clienteNombre: req.body.clienteNombre || 'Cliente sin nombre',
      empleadoNombre: req.body.empleadoNombre || 'Empleado'
    });
    
    if (emailResult.success) {
      console.log('✅ Notificación email enviada para pago:', docRef.id);
    } else {
      console.log('⚠️ Error enviando email:', emailResult.error);
    }
    
    res.json({ id: docRef.id, ...pagoData });
  } catch (error) {
    console.error('❌ Error en /api/pagos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pagos/:id/confirmar', authenticateToken, async (req, res) => {
  try {
    const { accion } = req.body; // 'aprobar' o 'rechazar'
    
    await db.collection('pagos').doc(req.params.id).update({
      estado: accion === 'aprobar' ? 'confirmado' : 'rechazado',
      fechaConfirmacion: admin.firestore.FieldValue.serverTimestamp(),
      confirmadoPor: req.user.uid
    });
    
    res.json({ message: `Pago ${accion}do` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS PARA GESTIÓN DE AUMENTOS DE PRECIOS
app.post('/api/aumentos', authenticateToken, async (req, res) => {
  try {
    const aumentoData = {
      ...req.body,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      creadoPor: req.user.uid
    };
    
    const docRef = await db.collection('aumentos').add(aumentoData);
    res.json({ id: docRef.id, ...aumentoData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para enviar notificación manual de aumentos trimestrales
app.post('/api/admin/aumentos-trimestrales', authenticateToken, async (req, res) => {
  try {
    const adminEmails = ['gadiazsaavedra@gmail.com', 'c.andrea.lopez@hotmail.com'];
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({ error: 'Solo administradores pueden enviar notificaciones' });
    }
    
    const result = await verificarAumentosTrimestrales();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/aumentos', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('aumentos')
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    const aumentos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate().toISOString()
    }));
    
    res.json(aumentos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTA PARA LIMPIAR HISTORIAL (SOLO PARA PRUEBAS)
app.delete('/api/admin/limpiar-historial', authenticateToken, async (req, res) => {
  try {
    console.log('Solicitud de limpiar historial de:', req.user.email);
    
    // Verificar que sea administrador
    const adminEmails = ['gadiazsaavedra@gmail.com', 'c.andrea.lopez@hotmail.com'];
    if (!adminEmails.includes(req.user.email)) {
      console.log('Acceso denegado para:', req.user.email);
      return res.status(403).json({ error: 'Solo administradores pueden limpiar historial' });
    }
    
    // Obtener todos los pagos
    const pagosSnapshot = await db.collection('pagos').get();
    console.log(`Encontrados ${pagosSnapshot.docs.length} pagos para eliminar`);
    
    if (pagosSnapshot.docs.length === 0) {
      return res.json({ message: 'No hay pagos para eliminar', count: 0 });
    }
    
    // Eliminar en lotes de 500 (límite de Firestore)
    const batchSize = 500;
    let deletedCount = 0;
    
    for (let i = 0; i < pagosSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = pagosSnapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(`Eliminados ${deletedCount}/${pagosSnapshot.docs.length} pagos`);
    }
    
    console.log(`Historial limpiado exitosamente por ${req.user.email}. Total eliminados: ${deletedCount}`);
    res.json({ 
      message: 'Historial de pagos eliminado exitosamente', 
      count: deletedCount 
    });
  } catch (error) {
    console.error('Error limpiando historial:', error);
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE REPORTES
app.get('/api/reportes/clientes', authenticateToken, async (req, res) => {
  try {
    const { tipo, periodo } = req.query;
    
    const clientesSnapshot = await db.collection('clientes').get();
    const clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Obtener pagos del período
    let pagosQuery = db.collection('pagos').where('estado', '==', 'confirmado');
    if (periodo) {
      const [year, month] = periodo.split('-');
      const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
      const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();
      pagosQuery = pagosQuery.where('fechaRegistro', '>=', startDate)
                            .where('fechaRegistro', '<=', endDate);
    }
    
    const pagosSnapshot = await pagosQuery.get();
    const pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Combinar datos
    const reporte = clientes.map(cliente => {
      const pagoCliente = pagos.find(p => p.clienteId === cliente.id);
      return {
        nombre: cliente.nombre,
        tipoCochera: `${cliente.modalidadTiempo} ${cliente.modalidadTecho}`,
        montoPagado: pagoCliente ? pagoCliente.monto : '',
        fechaPago: pagoCliente ? moment(pagoCliente.fechaRegistro.toDate()).format('DD/MM/YYYY') : '',
        estado: pagoCliente ? 'Al día' : 'Moroso'
      };
    });
    
    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SISTEMA DE NOTIFICACIONES (Cron Jobs)
// Resumen diario de pagos pendientes a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Ejecutando resumen diario de pagos pendientes...');
  
  try {
    const result = await enviarResumenDiario();
    if (result.success) {
      console.log(`✅ Resumen diario enviado: ${result.count || 0} pagos pendientes`);
    } else {
      console.log(`⚠️ Error en resumen diario: ${result.error}`);
    }
  } catch (error) {
    console.error('Error en resumen diario:', error);
  }
});

// Verificación de aumentos trimestrales - primer día de cada mes a las 8:00 AM
cron.schedule('0 8 1 * *', async () => {
  console.log('Ejecutando verificación de aumentos trimestrales...');
  
  try {
    const result = await verificarAumentosTrimestrales();
    if (result.success) {
      console.log(`✅ Verificación de aumentos completada: ${result.clientesParaAumento} clientes requieren aumento`);
    } else {
      console.log(`⚠️ Error en verificación de aumentos: ${result.error}`);
    }
  } catch (error) {
    console.error('Error en verificación de aumentos trimestrales:', error);
  }
});

// Notificaciones de morosidad (mantener sistema existente)
cron.schedule('0 10 * * *', async () => {
  console.log('Ejecutando notificaciones de morosidad...');
  
  try {
    const clientesSnapshot = await db.collection('clientes').where('estado', '==', 'activo').get();
    const clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const cliente of clientes) {
      if (cliente.fechaVencimiento) {
        const diasVencimiento = moment().diff(moment(cliente.fechaVencimiento.toDate()), 'days');
        
        if (diasVencimiento === 25) {
          await enviarNotificacion(cliente, 'recordatorio');
        } else if (diasVencimiento === 30) {
          await enviarNotificacion(cliente, 'vencimiento');
        } else if (diasVencimiento === 35) {
          await enviarNotificacion(cliente, 'morosidad');
        }
      }
    }
  } catch (error) {
    console.error('Error en notificaciones de morosidad:', error);
  }
});

async function enviarNotificacion(cliente, tipo) {
  // Aquí integrarías con un servicio de SMS/WhatsApp
  console.log(`Notificación ${tipo} para ${cliente.nombre}`);
  
  // Guardar notificación en BD
  await db.collection('notificaciones').add({
    clienteId: cliente.id,
    tipo,
    mensaje: generarMensaje(tipo, cliente),
    fechaEnvio: admin.firestore.FieldValue.serverTimestamp(),
    estado: 'enviada'
  });
}

function generarMensaje(tipo, cliente) {
  const mensajes = {
    recordatorio: `Hola ${cliente.nombre}, te recordamos que tu pago de cochera vence en 5 días.`,
    vencimiento: `Hola ${cliente.nombre}, tu pago de cochera vence hoy. Por favor realiza el pago.`,
    morosidad: `Hola ${cliente.nombre}, tu pago de cochera está vencido. Contacta con nosotros.`
  };
  return mensajes[tipo];
}

// Ruta para corregir monto específico (temporal)
app.put('/api/admin/corregir-monto/:pagoId', authenticateToken, async (req, res) => {
  try {
    const { pagoId } = req.params;
    const { montoNuevo } = req.body;
    
    console.log(`Corrigiendo monto del pago ${pagoId} a ${montoNuevo}`);
    
    await db.collection('pagos').doc(pagoId).update({
      monto: parseFloat(montoNuevo)
    });
    
    res.json({ message: `Monto corregido a ${montoNuevo}` });
  } catch (error) {
    console.error('Error corrigiendo monto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check para Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Sentry error handler (debe ir al final, antes de listen)
// app.use(sentryErrorHandler());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Servidor en producción: https://sistema-cocheras-backend.onrender.com`);
    console.log('Servidor iniciado en producción');
  } else {
    console.log(`Acceso local: http://localhost:${PORT}`);
    console.log(`Acceso red: http://[TU_IP]:${PORT}`);
  }
});