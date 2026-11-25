// frontend/src/services/api.js
// Instancia de Axios compartida por todos los servicios.
// Inyecta automáticamente el JWT en cada request protegida.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Interceptor de request: agrega el JWT si está disponible en localStorage
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Interceptor de response: manejo centralizado de errores HTTP
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado o inválido: limpiar sesión
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      // Redirigir al login (sin depender del router acá)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;