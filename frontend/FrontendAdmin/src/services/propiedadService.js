import axiosInstance from '../api/axios';
import { propiedadesCache } from '../utils/cache'; // ✅ Ya está correcto

const BASE_URL = '/propiedades/';

export const propiedadService = {
  /**
   * ✅ Obtener todas las propiedades CON CACHÉ Y PAGINACIÓN (para backward compatibility)
   * @param {AbortSignal} signal - Signal para cancelar petición
   * @param {Object} options - { page, pageSize }
   */
  async getAll(signal, options = {}) {
    try {
      const { page = 1, pageSize = 100 } = options;

      // ✅ Solo cachear página 1 sin filtros
      if (page === 1 && !options.filters) {
        const cached = propiedadesCache.get();
        if (cached) {
          console.log('✅ [PROPIEDADES] Usando caché para página', page);
          return cached;
        }
      }

      // Hacer petición con paginación
      console.log('📡 [PROPIEDADES] Cargando página', page, 'desde API...');
      const params = {
        page,
        page_size: pageSize
      };

      const response = await axiosInstance.get(BASE_URL, { 
        signal, 
        params 
      });
      
      // ✅ Guardar en caché solo página 1
      if (page === 1 && !options.filters) {
        propiedadesCache.set(response.data);
        console.log('💾 [PROPIEDADES] Página 1 guardada en caché');
      }
      
      return response.data;
    } catch (error) {
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Error fetching propiedades:', error);
      }
      throw error;
    }
  },

  /**
   * ✅ Obtener TODAS las propiedades sin paginación (para filtrado cliente-side)
   * @param {AbortSignal} signal - Signal para cancelar petición
   */
  async getAllSimple(signal) {
    try {
      // 1. Intentar caché primero
      const cached = propiedadesCache.get();
      if (cached) {
        console.log('✅ [PROPIEDADES SIMPLE] Usando caché');
        return cached;
      }

      // 2. Si no hay caché, hacer petición SIN paginación
      console.log('📡 [PROPIEDADES SIMPLE] Cargando TODAS desde API...');
      const response = await axiosInstance.get(BASE_URL, { 
        signal,
        params: { page_size: 10000 } // Cargar todas
      });
      
      // 3. Guardar en caché
      propiedadesCache.set(response.data);
      console.log('💾 [PROPIEDADES SIMPLE] Guardadas en caché');
      
      return response.data;
    } catch (error) {
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Error fetching propiedades simple:', error);
      }
      throw error;
    }
  },

  async getById(id, signal) {
    try {
      const response = await axiosInstance.get(`${BASE_URL}${id}`, { signal });
      return response.data;
    } catch (error) {
      console.error(`Error fetching propiedad ${id}:`, error);
      throw error;
    }
  },

  async create(propiedadData) {
    try {
      const response = await axiosInstance.post(BASE_URL, propiedadData);
      propiedadesCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error('Error creating propiedad:', error);
      throw error;
    }
  },

  async update(id, propiedadData) {
    try {
      const response = await axiosInstance.put(`${BASE_URL}${id}`, propiedadData);
      propiedadesCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error updating propiedad ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${BASE_URL}${id}`);
      propiedadesCache.clear(); // ✅ Invalidar caché
      return response.data;
    } catch (error) {
      console.error(`Error deleting propiedad ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Filtrar propiedades (sin caché porque los filtros varían)
   */
  async filter(filters, signal) {
    try {
      const params = new URLSearchParams();
      
      if (filters.tipo_operacion) params.append('tipo_operacion', filters.tipo_operacion);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.ci_propietario) params.append('ci_propietario', filters.ci_propietario);
      if (filters.tipo_propiedad) params.append('tipo_propiedad', filters.tipo_propiedad);
      if (filters.precio_min) params.append('precio_min', filters.precio_min);
      if (filters.precio_max) params.append('precio_max', filters.precio_max);
      
      const response = await axiosInstance.get(`${BASE_URL}?${params.toString()}`, { signal });
      return response.data;
    } catch (error) {
      console.error('Error filtering propiedades:', error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Búsqueda local desde caché (súper rápido)
   */
  async search(searchTerm, signal) {
    try {
      // Intentar buscar desde caché primero
      const cached = propiedadesCache.get();
      const propiedades = cached || (await this.getAll(signal)).items || (await this.getAll(signal));
      
      const term = searchTerm.toLowerCase();
      return propiedades.filter(prop => 
        prop.titulo_propiedad?.toLowerCase().includes(term) ||
        prop.descripcion_propiedad?.toLowerCase().includes(term) ||
        prop.direccion_propiedad?.toLowerCase().includes(term) ||
        prop.tipo_propiedad?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching propiedades:', error);
      throw error;
    }
  }
};

export default propiedadService;
