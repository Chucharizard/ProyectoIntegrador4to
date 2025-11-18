import axiosInstance from '../api/axios';

const ENDPOINT = '/citas-visita';

/**
 * Servicio para gestión de citas de visita
 */
const citaVisitaService = {
  /**
   * Obtener todas las citas con filtros opcionales
   */
  getAll: async (filters = {}, signal) => {
    const params = new URLSearchParams();
    
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.id_propiedad) params.append('id_propiedad', filters.id_propiedad);
    if (filters.ci_cliente) params.append('ci_cliente', filters.ci_cliente);
    if (filters.id_usuario_asesor) params.append('id_usuario_asesor', filters.id_usuario_asesor);
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINT}/?${queryString}` : `${ENDPOINT}/`;
    
    const response = await axiosInstance.get(url, { signal });
    return response.data;
  },

  /**
   * Obtener citas del día de hoy
   */
  getToday: async (signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/hoy`, { signal });
    return response.data;
  },

  /**
   * Obtener citas asignadas al usuario actual
   */
  getMyCitas: async (signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/mis-citas`, { signal });
    return response.data;
  },

  /**
   * Obtener una cita por ID
   */
  getById: async (id, signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/${id}`, { signal });
    return response.data;
  },

  /**
   * Crear nueva cita
   */
  create: async (citaData) => {
    const response = await axiosInstance.post(`${ENDPOINT}/`, citaData);
    return response.data;
  },

  /**
   * Actualizar cita existente
   */
  update: async (id, citaData) => {
    const response = await axiosInstance.put(`${ENDPOINT}/${id}`, citaData);
    return response.data;
  },

  /**
   * Eliminar cita
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`${ENDPOINT}/${id}`);
    return response.data;
  },

  /**
   * Buscar citas (útil para búsqueda en tiempo real)
   */
  search: async (query, signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/?search=${encodeURIComponent(query)}`, { signal });
    return response.data;
  }
};

export default citaVisitaService;
