import axiosInstance from '../api/axios';

const BASE_URL = '/pagos/';

const pagoService = {
  // ✅ NUEVO: Obtener pagos con paginación
  async getAll(signal, options = {}) {
    try {
      const { 
        page = 1, 
        pageSize = 30,
        idContrato = null,
        estado = null
      } = options;

      const params = {
        page,
        page_size: pageSize
      };

      if (idContrato) params.id_contrato = idContrato;
      if (estado) params.estado = estado;

      const response = await axiosInstance.get(BASE_URL, { 
        signal, 
        params 
      });

      // Retorna: { items, total, page, page_size, total_pages, has_next, has_prev }
      return response.data;
    } catch (error) {
      console.error('Error fetching pagos:', error);
      throw error;
    }
  },

  // ✅ NUEVO: Método optimizado para Dashboard
  async getDashboard(limit = 30, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}dashboard`, {
        signal,
        params: { limit }
      });
      
      // Retorna array directo de pagos
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard pagos:', error);
      throw error;
    }
  },

  // ✅ NUEVO: Obtener pagos atrasados
  async getAtrasados(signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}atrasados/lista`, { signal });
      
      // Retorna: { total_atrasados, pagos: [...] }
      return response.data;
    } catch (error) {
      console.error('Error fetching pagos atrasados:', error);
      throw error;
    }
  },

  // Obtener pago por ID
  async getById(id, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${id}`, { signal });
      return response.data;
    } catch (error) {
      console.error('Error fetching pago:', error);
      throw error;
    }
  },

  // Crear nuevo pago
  async create(pagoData) {
    try {
      const response = await axiosInstance.post(BASE_URL, pagoData);
      return response.data;
    } catch (error) {
      console.error('Error creating pago:', error);
      throw error;
    }
  },

  // Actualizar pago
  async update(id, pagoData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${id}`, pagoData);
      return response.data;
    } catch (error) {
      console.error('Error updating pago:', error);
      throw error;
    }
  },

  // Eliminar pago
  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting pago:', error);
      throw error;
    }
  },

  // Obtener resumen de pagos por contrato
  async getResumenByContrato(idContrato, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}resumen/${idContrato}`, { signal });
      return response.data;
    } catch (error) {
      console.error('Error fetching resumen pagos:', error);
      throw error;
    }
  }
};

export default pagoService;
