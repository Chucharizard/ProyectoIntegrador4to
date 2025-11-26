import axiosInstance from '../api/axios';
import { contratosCache } from '../utils/cache';

const ENDPOINT = '/contratos';

/**
 * Servicio para gestión de contratos de operación
 */
const contratoService = {
  /**
   * Obtener todos los contratos con filtros opcionales
   */
  getAll: async (filters = {}, signal) => {
    const hasFilters = Object.keys(filters).length > 0;
    
    // ✅ Solo cachear si NO hay filtros
    if (!hasFilters) {
      const cached = contratosCache.get();
      if (cached) {
        console.log('✅ [CONTRATOS] Usando caché');
        return cached;
      }
    }
    
    const params = new URLSearchParams();
    
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.tipo_operacion) params.append('tipo_operacion', filters.tipo_operacion);
    if (filters.ci_cliente) params.append('ci_cliente', filters.ci_cliente);
    if (filters.id_usuario_colocador) params.append('id_usuario_colocador', filters.id_usuario_colocador);
    if (filters.skip !== undefined) params.append('skip', filters.skip);
    if (filters.limit !== undefined) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINT}/?${queryString}` : `${ENDPOINT}/`;
    
    console.log('📡 [CONTRATOS] Cargando desde API...');
    const response = await axiosInstance.get(url, { signal });
    
    // ✅ Guardar en caché solo si no hay filtros
    if (!hasFilters) {
      contratosCache.set(response.data);
      console.log('💾 [CONTRATOS] Guardado en caché');
    }
    
    return response.data;
  },

  /**
   * Obtener un contrato por ID
   */
  getById: async (id, signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/${id}`, { signal });
    return response.data;
  },

  /**
   * Obtener resumen completo de un contrato (incluye pagos y resumen financiero)
   */
  getResumen: async (id, signal) => {
    const response = await axiosInstance.get(`${ENDPOINT}/${id}/resumen`, { signal });
    return response.data;
  },

  /**
   * Crear nuevo contrato
   */
  create: async (contratoData) => {
    const response = await axiosInstance.post(`${ENDPOINT}/`, contratoData);
    contratosCache.clear(); // ✅ Invalidar caché
    return response.data;
  },

  /**
   * Actualizar contrato existente
   */
  update: async (id, contratoData) => {
    const response = await axiosInstance.put(`${ENDPOINT}/${id}`, contratoData);
    contratosCache.clear(); // ✅ Invalidar caché
    return response.data;
  },

  /**
   * Eliminar contrato
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`${ENDPOINT}/${id}`);
    contratosCache.clear(); // ✅ Invalidar caché
    return response.data;
  }
};

export default contratoService;
