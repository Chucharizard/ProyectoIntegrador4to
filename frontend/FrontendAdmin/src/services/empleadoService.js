import axiosInstance from '../api/axios';
import { empleadosCache } from '../utils/cache';

const BASE_URL = '/empleados/';

export const empleadoService = {
  async getAll(signal) {
    try {
      // 1. Intentar caché primero
      const cached = empleadosCache.get();
      if (cached) {
        console.log('✅ [EMPLEADOS] Usando caché');
        return cached;
      }

      // 2. Si no hay caché, hacer petición
      console.log('📡 [EMPLEADOS] Cargando desde API...');
      const response = await axiosInstance.get(BASE_URL, { signal });
      
      // 3. Guardar en caché
      empleadosCache.set(response.data);
      console.log('💾 [EMPLEADOS] Guardado en caché');
      
      return response.data;
    } catch (error) {
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Error fetching empleados:', error);
      }
      throw error;
    }
  },

  async getById(ci, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${ci}`, { signal });
      return response.data;
    } catch (error) {
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error(`Error fetching empleado ${ci}:`, error);
      }
      throw error;
    }
  },

  async create(empleadoData) {
    try {
      const response = await axiosInstance.post(BASE_URL, empleadoData);
      empleadosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error('Error creating empleado:', error);
      throw error;
    }
  },

  async update(ci, empleadoData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${ci}`, empleadoData);
      empleadosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error updating empleado ${ci}:`, error);
      throw error;
    }
  },

  async delete(ci) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${ci}`);
      empleadosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error deleting empleado ${ci}:`, error);
      throw error;
    }
  }
};

export default empleadoService;
