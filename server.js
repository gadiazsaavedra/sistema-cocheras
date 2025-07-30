const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const multer = require('multer');
const moment = require('moment');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(cors());
app.use(express.json());
app.use(express.static('client/build'));
app.use('/uploads', express.static('uploads')); // Servir fotos locales

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
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
    const pagos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(pagos);
  } catch (error) {
    console.error('Error en /api/pagos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pagos', authenticateToken, upload.single('comprobante'), async (req, res) => {
  try {
    const { clienteId, monto, tipoPago, ubicacion } = req.body;
    
    let comprobanteUrl = null;
    if (req.file) {
      comprobanteUrl = `/uploads/${req.file.filename}`; // Ruta local
    }
    
    const pagoData = {
      clienteId,
      monto: parseFloat(monto),
      tipoPago,
      ubicacion: JSON.parse(ubicacion),
      comprobanteUrl,
      empleadoId: req.user.uid,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente'
    };
    
    const docRef = await db.collection('pagos').add(pagoData);
    res.json({ id: docRef.id, ...pagoData });
  } catch (error) {
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
cron.schedule('0 9 * * *', async () => {
  console.log('Ejecutando notificaciones diarias...');
  
  try {
    const clientesSnapshot = await db.collection('clientes').where('estado', '==', 'activo').get();
    const clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const cliente of clientes) {
      const diasVencimiento = moment().diff(moment(cliente.fechaVencimiento.toDate()), 'days');
      
      if (diasVencimiento === 25) {
        // Recordatorio
        await enviarNotificacion(cliente, 'recordatorio');
      } else if (diasVencimiento === 30) {
        // Vencimiento
        await enviarNotificacion(cliente, 'vencimiento');
      } else if (diasVencimiento === 35) {
        // Morosidad
        await enviarNotificacion(cliente, 'morosidad');
      }
    }
  } catch (error) {
    console.error('Error en notificaciones:', error);
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

// Servir la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});