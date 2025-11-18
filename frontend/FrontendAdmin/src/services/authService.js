import axiosInstance from '../api/axios';
import { API_ENDPOINTS } from '../api/endpoints';

export const authService = {
  // Login de usuario
  login: async (credentials) => {
    // La API espera form-data para OAuth2
    const formData = new URLSearchParams();
    formData.append('username', credentials.nombre_usuario);
    formData.append('password', credentials.contrasenia_usuario);
    
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  },

  // ✅ Obtener usuario actual CON signal
  getCurrentUser: async (signal) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ME, { signal });
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Verificar si hay sesión activa
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Guardar token y usuario
  saveSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Obtener usuario guardado
  getSavedUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
