import axiosInstance from '../api/axios';
import { clientesCache } from '../utils/cache';

const BASE_URL = '/clientes/';

/**
 * ✅ Servicio MEJORADO de Clientes con Paginación y Caché Inteligente
 */
export const clienteService = {
  
  // ========================================
  // 📄 MÉTODOS CON PAGINACIÓN
  // ========================================
  
  /**
   * Obtener clientes con paginación
   * @param {AbortSignal} signal - Signal para cancelar petición
   * @param {Object} options - { page, pageSize, origen, zona, misClientes, search }
   * @returns {Promise<{items, total, page, page_size, total_pages, has_next, has_prev}>}
   */
  async getAll(signal, options = {}) {
    const {
      page = 1,
      pageSize = 30,
      origen = null,
      zona = null,
      misClientes = false,
      search = null
    } = options;

    // 🔹 Generar clave única para el caché basada en los parámetros
    const cacheKey = `clientes_p${page}_ps${pageSize}_${origen || 'all'}_${zona || 'all'}_${misClientes}_${search || ''}`;
    
    try {
      // 🔹 Intentar obtener del caché
      const cached = clientesCache.get();
      if (cached && cached[cacheKey]) {
        console.log(`✅ [CLIENTES] Usando caché para página ${page}`);
        return cached[cacheKey];
      }

      // 🔹 Construir query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', pageSize);
      
      if (origen) params.append('origen', origen);
      if (zona) params.append('zona_preferencia', zona);
      if (misClientes) params.append('mis_clientes', 'true');
      if (search) params.append('search', search);

      // 🔹 Hacer petición al backend
      const response = await axiosInstance.get(`${BASE_URL}?${params.toString()}`, { signal });
      
      // 🔹 Guardar en caché
      const currentCache = cached || {};
      currentCache[cacheKey] = response.data;
      clientesCache.set(currentCache);
      
      console.log(`💾 [CLIENTES] Página ${page} guardada en caché`);
      return response.data;
      
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('🚫 [CLIENTES] Petición cancelada');
        throw error;
      }
      console.error('❌ [CLIENTES] Error al obtener clientes:', error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Obtener todos los clientes sin paginación (para selectores)
   * @param {AbortSignal} signal 
   * @returns {Promise<Array>}
   */
  async getAllSimple(signal) {
    try {
      // Intentar obtener del caché
      const cached = clientesCache.get();
      if (cached && cached['all_simple']) {
        console.log('✅ [CLIENTES SIMPLE] Usando caché');
        return cached['all_simple'];
      }

      // Hacer petición
      const response = await axiosInstance.get(`${BASE_URL}all/simple`, { signal });
      
      // Guardar en caché
      const currentCache = cached || {};
      currentCache['all_simple'] = response.data;
      clientesCache.set(currentCache);
      
      console.log('💾 [CLIENTES SIMPLE] Guardado en caché');
      return response.data;
      
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('🚫 [CLIENTES SIMPLE] Petición cancelada');
        throw error;
      }
      console.error('❌ [CLIENTES SIMPLE] Error:', error);
      throw error;
    }
  },

  // ========================================
  // 🔍 MÉTODOS INDIVIDUALES
  // ========================================

  /**
   * Obtener cliente por CI
   */
  async getById(ci, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${ci}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`❌ [CLIENTES] Error al obtener cliente ${ci}:`, error);
      throw error;
    }
  },

  // ========================================
  // ✏️ MÉTODOS DE MODIFICACIÓN (Limpian caché)
  // ========================================

  /**
   * Crear nuevo cliente
   */
  async create(clienteData) {
    try {
      const response = await axiosInstance.post(BASE_URL, clienteData);
      
      // ✅ Limpiar caché al crear
      clientesCache.clear();
      console.log('🧹 [CLIENTES] Caché limpiado después de crear');
      
      return response.data;
    } catch (error) {
      console.error('❌ [CLIENTES] Error al crear cliente:', error);
      throw error;
    }
  },

  /**
   * Actualizar cliente
   */
  async update(ci, clienteData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${ci}`, clienteData);
      
      // ✅ Limpiar caché al actualizar
      clientesCache.clear();
      console.log('🧹 [CLIENTES] Caché limpiado después de actualizar');
      
      return response.data;
    } catch (error) {
      console.error(`❌ [CLIENTES] Error al actualizar cliente ${ci}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar cliente
   */
  async delete(ci) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${ci}`);
      
      // ✅ Limpiar caché al eliminar
      clientesCache.clear();
      console.log('🧹 [CLIENTES] Caché limpiado después de eliminar');
      
      return response.data;
    } catch (error) {
      console.error(`❌ [CLIENTES] Error al eliminar cliente ${ci}:`, error);
      throw error;
    }
  },

  // ========================================
  // 🧹 UTILIDADES DE CACHÉ
  // ========================================

  /**
   * Limpiar todo el caché de clientes
   */
  clearCache() {
    clientesCache.clear();
  },

  /**
   * Pre-cargar múltiples páginas en segundo plano
   * @param {Object} baseOptions - Opciones base para la petición
   * @param {Number} maxPages - Número máximo de páginas a pre-cargar
   */
  async preloadPages(baseOptions = {}, maxPages = 3) {
    try {
      console.log(`🔄 [CLIENTES] Pre-cargando ${maxPages} páginas...`);
      
      const promises = [];
      for (let page = 1; page <= maxPages; page++) {
        promises.push(
          this.getAll(null, { ...baseOptions, page })
            .catch(err => console.warn(`⚠️ Error pre-cargando página ${page}:`, err))
        );
      }
      
      await Promise.all(promises);
      console.log(`✅ [CLIENTES] ${maxPages} páginas pre-cargadas`);
      
    } catch (error) {
      console.error('❌ [CLIENTES] Error al pre-cargar páginas:', error);
    }
  }
};

export default clienteService;
