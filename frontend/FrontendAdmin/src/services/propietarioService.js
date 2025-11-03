import axiosInstance from '../api/axios';

const BASE_URL = '/propietarios/';

export const propietarioService = {
  // Obtener todos los propietarios
  async getAll(signal) {
    try {
      const response = await axiosInstance.get(BASE_URL, { signal });
      return response.data;
    } catch (error) {
      console.error('Error fetching propietarios:', error);
      throw error;
    }
  },

  // Obtener propietario por CI
  async getById(ci, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${ci}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching propietario ${ci}:`, error);
      throw error;
    }
  },

  // Crear nuevo propietario
  async create(propietarioData) {
    try {
      const response = await axiosInstance.post(BASE_URL, propietarioData);
      return response.data;
    } catch (error) {
      console.error('Error creating propietario:', error);
      throw error;
    }
  },

  // Actualizar propietario
  async update(ci, propietarioData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${ci}`, propietarioData);
      return response.data;
    } catch (error) {
      console.error(`Error updating propietario ${ci}:`, error);
      throw error;
    }
  },

  // Eliminar propietario
  async delete(ci) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${ci}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting propietario ${ci}:`, error);
      throw error;
    }
  },

  // Buscar propietarios (filtrado local)
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
