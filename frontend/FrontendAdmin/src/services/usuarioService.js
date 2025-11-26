import axiosInstance from '../api/axios';
import { usuariosCache } from '../utils/cache';

const BASE_URL = '/usuarios/';

export const usuarioService = {
  // Obtener todos los usuarios
  async getAll(signal) {
    try {
      // 1. Intentar caché primero
      const cached = usuariosCache.get();
      if (cached) {
        console.log('✅ [USUARIOS] Usando caché');
        return cached;
      }

      // 2. Si no hay caché, hacer petición
      console.log('📡 [USUARIOS] Cargando desde API...');
      const response = await axiosInstance.get(BASE_URL, { signal });
      
      // 3. Guardar en caché
      usuariosCache.set(response.data);
      console.log('💾 [USUARIOS] Guardado en caché');
      
      return response.data;
    } catch (error) {
      // No loguear errores de cancelación
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Error fetching usuarios:', error);
      }
      throw error;
    }
  },

  // Obtener usuario por CI
  async getById(ci, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${ci}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching usuario ${ci}:`, error);
      throw error;
    }
  },

  // Crear nuevo usuario
  async create(usuarioData) {
    try {
      const response = await axiosInstance.post(BASE_URL, usuarioData);
      usuariosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  },

  // Actualizar usuario
  async update(ci, usuarioData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${ci}`, usuarioData);
      usuariosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error updating usuario ${ci}:`, error);
      throw error;
    }
  },

  // Eliminar usuario
  async delete(ci) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${ci}`);
      usuariosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error deleting usuario ${ci}:`, error);
      throw error;
    }
  },

  // Buscar usuarios (filtrado local)
  async search(searchTerm, signal) {
    try {
      const usuarios = await this.getAll(signal);
      const term = searchTerm.toLowerCase();
      return usuarios.filter(user => 
        user.ci_empleado?.toLowerCase().includes(term) ||
        user.nombre_usuario?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching usuarios:', error);
      throw error;
    }
  }
};

export default usuarioService;
