import axiosInstance from '../api/axios';

const BASE_URL = '/clientes/';  // Sin /api porque ya está en baseURL de axios

export const clienteService = {
  // Obtener todos los clientes
  getAll: async () => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  // Obtener cliente por CI
  getById: async (ci) => {
    const response = await axiosInstance.get(`${BASE_URL}/${ci}`);
    return response.data;
  },

  // Crear nuevo cliente
  create: async (clienteData) => {
    const response = await axiosInstance.post(BASE_URL, clienteData);
    return response.data;
  },

  // Actualizar cliente
  update: async (ci, clienteData) => {
    const response = await axiosInstance.put(`${BASE_URL}/${ci}`, clienteData);
    return response.data;
  },

  // Eliminar cliente
  delete: async (ci) => {
    const response = await axiosInstance.delete(`${BASE_URL}/${ci}`);
    return response.data;
  },

  // Buscar clientes por término
  search: async (searchTerm) => {
    const response = await axiosInstance.get(`${BASE_URL}/buscar/${searchTerm}`);
    return response.data;
  },
};
