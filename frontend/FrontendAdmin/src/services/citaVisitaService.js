import axiosInstance from '../api/axios';
import { citasCache } from '../utils/cache'; // ✅ AGREGAR

const ENDPOINT = '/citas-visita';

/**
 * Servicio para gestión de citas de visita CON CACHÉ
 */
const citaVisitaService = {
  /**
   * ✅ Obtener citas con paginación + CACHÉ
   */
  getAll: async (options = {}, signal) => {
    const {
      page = 1,
      pageSize = 20,
      estado = null,
      idPropiedad = null,
      ciCliente = null,
      idUsuarioAsesor = null,
      misCitas = false,
      fechaDesde = null,
      fechaHasta = null
    } = options;

    // ✅ Si es página 1 sin filtros, intentar usar caché
    const sinFiltros = !estado && !idPropiedad && !ciCliente && !idUsuarioAsesor && !misCitas && !fechaDesde && !fechaHasta;
    
    if (page === 1 && sinFiltros) {
      const cached = citasCache.get();
      if (cached) {
        return cached;
      }
    }

    const params = {
      page,
      page_size: pageSize
    };

    if (estado) params.estado = estado;
    if (idPropiedad) params.id_propiedad = idPropiedad;
    if (ciCliente) params.ci_cliente = ciCliente;
    if (idUsuarioAsesor) params.id_usuario_asesor = idUsuarioAsesor;
    if (misCitas) params.mis_citas = true;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;

    const response = await axiosInstance.get(`${ENDPOINT}/`, { 
      signal, 
      params 
    });

    // ✅ Guardar en caché solo página 1 sin filtros
    if (page === 1 && sinFiltros) {
      citasCache.set(response.data);
    }

    return response.data;
  },

  /**
   * Obtener citas sin paginación (legacy)
   */
  getAllUnpaginated: async (filters = {}, signal) => {
    const params = {};
    
    if (filters.estado) params.estado = filters.estado;
    if (filters.id_propiedad) params.id_propiedad = filters.id_propiedad;
    if (filters.ci_cliente) params.ci_cliente = filters.ci_cliente;
    if (filters.id_usuario_asesor) params.id_usuario_asesor = filters.id_usuario_asesor;
    if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
    if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
    if (filters.skip) params.skip = filters.skip;
    if (filters.limit) params.limit = filters.limit;
    
    const response = await axiosInstance.get(`${ENDPOINT}/all`, { 
      signal, 
      params 
    });
    return response.data;
  },

  /**
   * ✅ Obtener próximas N citas (optimizado para dashboard)
   */
  getProximas: async (limit = 5, signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/proximas`, {
      signal,
      params: { limit }
    });
    
    return response.data;
  },

  /**
   * Obtener resumen de citas de hoy
   */
  getHoyResumen: async (signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/hoy/resumen`, { signal });
    return response.data;
  },

  /**
   * Obtener citas del día de hoy
   */
  getToday: async (signal) => {
    const hoy = new Date().toISOString().split('T')[0];
    return citaVisitaService.getAll({
      fechaDesde: hoy,
      fechaHasta: hoy
    }, signal);
  },

  /**
   * Obtener mis citas (del usuario autenticado)
   */
  getMyCitas: async (signal) => {
    return citaVisitaService.getAll({
      misCitas: true
    }, signal);
  },

  /**
   * Obtener una cita por ID
   */
  getById: async (id, signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/${id}`, { signal });
    return response.data;
  },

  /**
   * ✅ Crear nueva cita + LIMPIAR CACHÉ
   */
  create: async (citaData) => {
    const response = await axiosInstance.post(`${ENDPOINT}/`, citaData);
    
    // ✅ Limpiar caché después de crear
    citasCache.clear();
    
    return response.data;
  },

  /**
   * ✅ Actualizar cita + LIMPIAR CACHÉ
   */
  update: async (id, citaData) => {
    const response = await axiosInstance.put(`${ENDPOINT}/${id}`, citaData);
    
    // ✅ Limpiar caché después de actualizar
    citasCache.clear();
    
    return response.data;
  },

  /**
   * ✅ Eliminar cita + LIMPIAR CACHÉ
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`${ENDPOINT}/${id}`);
    
    // ✅ Limpiar caché después de eliminar
    citasCache.clear();
    
    return response.data;
  },

  /**
   * ✅ Buscar citas (usa caché si es posible)
   */
  search: async (query, signal) => {
    // Intentar buscar desde caché primero
    const cached = citasCache.get();
    const citas = cached ? (cached.items || cached) : null;
    
    if (citas && query) {
      // Búsqueda local súper rápida
      const term = query.toLowerCase();
      return citas.filter(cita => 
        cita.lugar_encuentro_cita?.toLowerCase().includes(term) ||
        cita.nota_cita?.toLowerCase().includes(term) ||
        cita.estado_cita?.toLowerCase().includes(term)
      );
    }
    
    // Si no hay caché, hacer petición normal
    return citaVisitaService.getAll({
      pageSize: 50
    }, signal);
  }
};

export default citaVisitaService;
