import axiosInstance from '../api/axios';

const BASE_URL = '/usuarios/';

export const usuarioService = {
  // Obtener todos los usuarios
  async getAll(signal) {
    try {
      const response = await axiosInstance.get(BASE_URL, { signal });
      return response.data;
    } catch (error) {
      console.error('Error fetching usuarios:', error);
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
