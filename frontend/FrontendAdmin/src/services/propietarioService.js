import axiosInstance from '../api/axios';
import { propietariosCache } from '../utils/cache'; // ✅ CAMBIO AQUÍ

const BASE_URL = '/propietarios/';

export const propietarioService = {
  // ✅ Obtener todos los propietarios CON CACHÉ
  async getAll(signal) {
    try {
      // 1. Intentar caché primero
      const cached = propietariosCache.get();
      if (cached) {
        return cached;
      }

      // 2. Si no hay caché, hacer petición
      console.log('📡 [PROPIETARIOS] Cargando desde API...');
      const response = await axiosInstance.get(BASE_URL, { signal });
      
      // 3. Guardar en caché
      propietariosCache.set(response.data);
      
      return response.data;
    } catch (error) {
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Error fetching propietarios:', error);
      }
      throw error;
    }
  },

  async getById(ci, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${ci}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching propietario ${ci}:`, error);
      throw error;
    }
  },

  async create(propietarioData) {
    try {
      const response = await axiosInstance.post(BASE_URL, propietarioData);
      propietariosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error('Error creating propietario:', error);
      throw error;
    }
  },

  async update(ci, propietarioData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${ci}`, propietarioData);
      propietariosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error updating propietario ${ci}:`, error);
      throw error;
    }
  },

  async delete(ci) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${ci}`);
      propietariosCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error deleting propietario ${ci}:`, error);
      throw error;
    }
  },

  // Buscar propietarios (filtrado local desde caché si existe)
  async search(searchTerm, signal) {
    try {
      const propietarios = await this.getAll(signal);
      const term = searchTerm.toLowerCase();
      return propietarios.filter(prop => 
        prop.ci_propietario?.toLowerCase().includes(term) ||
        prop.nombres_completo_propietario?.toLowerCase().includes(term) ||
        prop.apellidos_completo_propietario?.toLowerCase().includes(term) ||
        prop.correo_electronico_propietario?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching propietarios:', error);
      throw error;
    }
  }
};

export default propietarioService;
