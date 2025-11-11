import axiosInstance from '../api/axios';
import { propiedadesCache } from '../utils/propiedadesCache';

const BASE_URL = '/propiedades/';

export const propiedadService = {
  // ✅ Obtener todas las propiedades CON CACHÉ
  async getAll(signal) {
    try {
      // 1. Intentar caché primero
      const cached = propiedadesCache.get();
      if (cached) {
        return cached;
      }

      // 2. Si no hay caché, hacer petición
      console.log('📡 [PROPIEDADES] Cargando desde API...');
      const response = await axiosInstance.get(BASE_URL, { signal });
      
      // 3. Guardar en caché
      propiedadesCache.set(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching propiedades:', error);
      throw error;
    }
  },

  async getById(id, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${id}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching propiedad ${id}:`, error);
      throw error;
    }
  },

  async create(propiedadData) {
    try {
      const response = await axiosInstance.post(BASE_URL, propiedadData);
      propiedadesCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error('Error creating propiedad:', error);
      throw error;
    }
  },

  async update(id, propiedadData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${id}`, propiedadData);
      propiedadesCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error updating propiedad ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${id}`);
      propiedadesCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error deleting propiedad ${id}:`, error);
      throw error;
    }
  },

  async filter(filters, signal) {
    try {
      const params = new URLSearchParams();
      if (filters.tipo_operacion) params.append('tipo_operacion', filters.tipo_operacion);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.ci_propietario) params.append('ci_propietario', filters.ci_propietario);
      
      const response = await axiosInstance.get(`${BASE_URL}?${params.toString()}`, { signal });
      return response.data;
    } catch (error) {
      console.error('Error filtering propiedades:', error);
      throw error;
    }
  }
};

export default propiedadService;
