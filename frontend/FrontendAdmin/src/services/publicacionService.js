import axiosInstance from '../api/axios';

const BASE_URL = '/propiedades';

export const publicacionService = {
  // ========================================
  // 📋 LISTAR PUBLICACIONES
  // ========================================
  
  /**
   * Obtener todas las propiedades publicadas
   */
  async getPublicadas(signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/publicadas/lista`, { signal });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('🚫 [PUBLICADAS] Petición cancelada');
        throw error;
      }
      console.error('❌ [PUBLICADAS] Error:', error);
      throw error;
    }
  },

  // ========================================
  // 📝 GESTIÓN DE DETALLES
  // ========================================
  
  /**
   * Obtener detalles de una propiedad
   */
  async getDetalles(idPropiedad, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${idPropiedad}/detalles`, { signal });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No tiene detalles aún
      }
      console.error('❌ [DETALLES] Error:', error);
      throw error;
    }
  },

  /**
   * Crear o actualizar detalles de una propiedad
   */
  async guardarDetalles(idPropiedad, detalles) {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${idPropiedad}/detalles`, {
        id_propiedad: idPropiedad,
        ...detalles
      }, {
        timeout: 60000 // 60 segundos para operaciones de guardado
      });
      return response.data;
    } catch (error) {
      console.error('❌ [GUARDAR DETALLES] Error:', error);
      throw error;
    }
  },

  // ========================================
  // 📢 PUBLICAR / DESPUBLICAR
  // ========================================
  
  /**
   * Publicar una propiedad
   */
  async publicar(idPropiedad, detalles) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${idPropiedad}/publicar`, {
        id_propiedad: idPropiedad,
        ...detalles
      }, {
        timeout: 60000 // 60 segundos para operaciones de publicación
      });
      return response.data;
    } catch (error) {
      console.error('❌ [PUBLICAR] Error:', error);
      throw error;
    }
  },

  /**
   * Despublicar una propiedad (retirar de publicación)
   */
  async despublicar(idPropiedad) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${idPropiedad}/despublicar`);
      return response.data;
    } catch (error) {
      console.error('❌ [DESPUBLICAR] Error:', error);
      throw error;
    }
  }
};

export default publicacionService;
