import api from './api';

/**
 * Servicio para gestionar clientes
 */
const clienteService = {
  /**
   * Obtener cliente por CI
   * @param {string} ciCliente - CI del cliente
   * @returns {Promise<Object>}
   */
  async getClienteByCi(ciCliente) {
    try {
      const response = await api.get(`/clientes/${ciCliente}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener cliente ${ciCliente}:`, error);
      throw error;
    }
  }
};

export default clienteService;
