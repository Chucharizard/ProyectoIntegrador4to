import axiosInstance from '../api/axios';

const BASE_URL = '/direcciones/';

export const direccionService = {
  // Obtener todas las direcciones
  async getAll(signal) {
    try {
      const response = await axiosInstance.get(BASE_URL, { signal });
      return response.data;
    } catch (error) {
      console.error('Error fetching direcciones:', error);
      throw error;
    }
  },

  // Obtener dirección por ID
  async getById(id, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${id}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching direccion ${id}:`, error);
      throw error;
    }
  },

  // Crear nueva dirección
  async create(direccionData) {
    try {
      const response = await axiosInstance.post(BASE_URL, direccionData);
      return response.data;
    } catch (error) {
      console.error('Error creating direccion:', error);
      throw error;
    }
  },

  // Actualizar dirección
  async update(id, direccionData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${id}`, direccionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating direccion ${id}:`, error);
      throw error;
    }
  },

  // Eliminar dirección
  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting direccion ${id}:`, error);
      throw error;
    }
  }
};

export default direccionService;
