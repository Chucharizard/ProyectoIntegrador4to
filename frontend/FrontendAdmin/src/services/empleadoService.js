import axiosInstance from '../api/axios';

const BASE_URL = '/empleados/';

export const empleadoService = {
  async getAll(signal) {
    try {
      const response = await axiosInstance.get(BASE_URL, { signal });
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
      return response.data;
    } catch (error) {
      console.error('Error creating empleado:', error);
      throw error;
    }
  },

  async update(ci, empleadoData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${ci}`, empleadoData);
      return response.data;
    } catch (error) {
      console.error(`Error updating empleado ${ci}:`, error);
      throw error;
    }
  },

  async delete(ci) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${ci}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting empleado ${ci}:`, error);
      throw error;
    }
  }
};

export default empleadoService;
