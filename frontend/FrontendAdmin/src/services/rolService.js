import axiosInstance from '../api/axios';

const BASE_URL = '/roles/';

export const rolService = {
  // Obtener todos los roles
  async getAll(signal) {
    try {
      const response = await axiosInstance.get(BASE_URL, { signal });
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
      return response.data;
    } catch (error) {
      console.error(`Error deleting rol ${id}:`, error);
      throw error;
    }
  }
};

export default rolService;
