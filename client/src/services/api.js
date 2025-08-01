import axios from 'axios';
import { auth } from './firebase';

// Detectar si estamos en desarrollo local o producción
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Producción: Render backend
  if (window.location.hostname.includes('netlify.app') || 
      window.location.hostname.includes('github.io') || 
      window.location.hostname.includes('web.app')) {
    return 'https://sistema-cocheras-backend.onrender.com/api';
  }
  
  // Desarrollo local
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  
  // Red local
  return `http://${window.location.hostname}:3000/api`;
};

const API_BASE_URL = getApiUrl();

console.log('API URL configurada:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const clientesAPI = {
  obtener: () => api.get('/clientes'),
  crear: (cliente) => api.post('/clientes', cliente),
  actualizar: (id, cliente) => api.put(`/clientes/${id}`, cliente),
};

export const pagosAPI = {
  obtener: (filtros = {}) => api.get('/pagos', { params: filtros }),
  crear: (formData) => api.post('/pagos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  confirmar: (id, accion) => api.put(`/pagos/${id}/confirmar`, { accion }),
};

export const reportesAPI = {
  clientes: (filtros = {}) => api.get('/reportes/clientes', { params: filtros }),
};

export default api;