import axiosInstance from '../api/axios';
import { rolesCache } from '../utils/cache'; // ✅ CAMBIO AQUÍ

const BASE_URL = '/roles/';

export const rolService = {
  // Obtener todos los roles CON CACHÉ
  async getAll(signal) {
    try {
      // ✅ 1. Intentar obtener del caché primero
      const cached = rolesCache.get();
      if (cached) {
        return cached;
      }

      // ✅ 2. Si no hay caché, hacer petición al backend
      console.log('📡 [ROLES] Cargando desde API...');
      const response = await axiosInstance.get(BASE_URL, { signal });
      
      // ✅ 3. Guardar en caché para la próxima vez
      rolesCache.set(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Obtener rol por ID
  async getById(id, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${id}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching rol ${id}:`, error);
      throw error;
    }
  },

  // Crear nuevo rol
  async create(rolData) {
    try {
      const response = await axiosInstance.post(BASE_URL, rolData);
      // ✅ Invalidar caché cuando se crea un rol
      rolesCache.clear();
      return response.data;
    } catch (error) {
      console.error('Error creating rol:', error);
      throw error;
    }
  },

  // Actualizar rol
  async update(id, rolData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${id}`, rolData);
      // ✅ Invalidar caché cuando se actualiza un rol
      rolesCache.clear();
      return response.data;
    } catch (error) {
      console.error(`Error updating rol ${id}:`, error);
      throw error;
    }
  },

  // Eliminar rol
  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${id}`);
      // ✅ Invalidar caché cuando se elimina un rol
      rolesCache.clear();
      return response.data;
    } catch (error) {
      console.error(`Error deleting rol ${id}:`, error);
      throw error;
    }
  }
};

export default rolService;
