import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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