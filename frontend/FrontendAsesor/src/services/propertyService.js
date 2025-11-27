import api from './api';

/**
 * Servicio para gestionar propiedades
 */
const propertyService = {
  /**
   * Obtener todas las propiedades
   * @returns {Promise<Array>}
   */
  async getPropiedades() {
    try {
      const response = await api.get('/propiedades/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      throw error;
    }
  },

  /**
   * Obtener propiedad por ID
   * @param {string} idPropiedad - ID de la propiedad
   * @returns {Promise<Object>}
   */
  async getPropertyById(idPropiedad) {
    try {
      const response = await api.get(`/propiedades/${idPropiedad}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener propiedad ${idPropiedad}:`, error);
      throw error;
    }
  }
};

export default propertyService;
