const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

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

// RUTAS DE CLIENTES
app.get('/clientes', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('clientes').get();
    const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clientes', authenticateToken, async (req, res) => {
  try {
    const clienteData = {
      ...req.body,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'activo'
    };
    const docRef = await db.collection('clientes').add(clienteData);
    res.json({ id: docRef.id, ...clienteData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE PAGOS
app.get('/pagos', authenticateToken, async (req, res) => {
  try {
    const { estado, empleado } = req.query;
    let query = db.collection('pagos');
    
    if (estado) query = query.where('estado', '==', estado);
    if (empleado) query = query.where('empleadoId', '==', empleado);
    
    const snapshot = await query.get();
    const pagos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaRegistro: data.fechaRegistro ? data.fechaRegistro.toDate().toISOString() : null,
        fechaConfirmacion: data.fechaConfirmacion ? data.fechaConfirmacion.toDate().toISOString() : null
      };
    });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/pagos', authenticateToken, async (req, res) => {
  try {
    const { clienteId, monto, tipoPago, ubicacion, fotoBase64 } = req.body;
    
    const pagoData = {
      clienteId,
      monto: parseFloat(monto),
      tipoPago,
      ubicacion: JSON.parse(ubicacion),
      fotoBase64,
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

app.put('/pagos/:id/confirmar', authenticateToken, async (req, res) => {
  try {
    const { accion } = req.body;
    
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

exports.api = functions.https.onRequest(app);