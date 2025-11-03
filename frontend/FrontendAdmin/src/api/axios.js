import axios from 'axios';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 30000, // 30 segundos (opcional: aumentar de 10s a 30s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignorar errores de cancelación (AbortController)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      console.log('Request canceled:', error.message);
      return Promise.reject(error);
    }

    // Manejar timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('Request timeout - La petición tardó demasiado');
      // Opcional: mostrar toast aquí si importas toast
      // toast.error('La petición tardó demasiado tiempo');
    }

    // Token inválido o expirado
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Error de red
    if (!error.response) {
      console.error('Network error - No se pudo conectar con el servidor');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
