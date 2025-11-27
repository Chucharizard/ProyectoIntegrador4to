import api from './api';

/**
 * Servicio para gestionar citas de visita del asesor
 */
const citaService = {
  /**
   * Obtener citas del asesor actual
   * @param {Object} filters - Filtros: estado, fecha_desde, fecha_hasta
   * @returns {Promise<Array>}
   */
  async getMisCitas(filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('mis_citas', 'true');
      
      if (filters.estado) {
        params.append('estado', filters.estado);
      }
      if (filters.fecha_desde) {
        params.append('fecha_desde', filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        params.append('fecha_hasta', filters.fecha_hasta);
      }

      console.log('📡 Solicitando citas con filtros:', filters);
      const response = await api.get(`/citas-visita/all?${params.toString()}`);
      console.log('✅ Citas obtenidas:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener mis citas:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  /**
   * Obtener citas de hoy con resumen
   * @returns {Promise<Object>}
   */
  async getCitasHoy() {
    try {
      const response = await api.get('/citas-visita/hoy/resumen');
      return response.data;
    } catch (error) {
      console.error('Error al obtener citas de hoy:', error);
      throw error;
    }
  },

  /**
   * Obtener próximas N citas
   * @param {number} limit - Número de citas a obtener
   * @returns {Promise<Array>}
   */
  async getProximasCitas(limit = 10) {
    try {
      const response = await api.get(`/citas-visita/proximas?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener próximas citas:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle de una cita
   * @param {string} idCita - ID de la cita
   * @returns {Promise<Object>}
   */
  async getCitaById(idCita) {
    try {
      const response = await api.get(`/citas-visita/${idCita}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener cita:', error);
      throw error;
    }
  },

  /**
   * Actualizar estado y/o notas de una cita
   * @param {string} idCita - ID de la cita
   * @param {Object} data - Datos a actualizar: { estado_cita?, nota_cita? }
   * @returns {Promise<Object>}
   */
  async actualizarCita(idCita, data) {
    try {
      const response = await api.put(`/citas-visita/${idCita}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      throw error;
    }
  },

  /**
   * Agregar nota a una cita (concatena con notas existentes)
   * @param {string} idCita - ID de la cita
   * @param {string} nuevaNota - Nueva nota a agregar
   * @returns {Promise<Object>}
   */
  async agregarNota(idCita, nuevaNota) {
    try {
      // Primero obtenemos la cita para ver si ya tiene notas
      const cita = await this.getCitaById(idCita);
      
      const timestamp = new Date().toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      
      const notaFormateada = `[${timestamp}] ${nuevaNota}`;
      
      let notasActualizadas;
      if (cita.nota_cita && cita.nota_cita.trim()) {
        notasActualizadas = `${cita.nota_cita}\n\n${notaFormateada}`;
      } else {
        notasActualizadas = notaFormateada;
      }

      return await this.actualizarCita(idCita, {
        nota_cita: notasActualizadas
      });
    } catch (error) {
      console.error('Error al agregar nota:', error);
      throw error;
    }
  },

  /**
   * Marcar cita como completada
   * @param {string} idCita - ID de la cita
   * @param {string} nota - Nota opcional sobre la visita
   * @returns {Promise<Object>}
   */
  async marcarComoCompletada(idCita, nota = null) {
    try {
      const data = { estado_cita: 'Realizada' };
      if (nota) {
        data.nota_cita = nota;
      }
      return await this.actualizarCita(idCita, data);
    } catch (error) {
      console.error('Error al marcar cita como completada:', error);
      throw error;
    }
  },

  /**
   * Cancelar una cita
   * @param {string} idCita - ID de la cita
   * @param {string} motivo - Motivo de cancelación
   * @returns {Promise<Object>}
   */
  async cancelarCita(idCita, motivo) {
    try {
      return await this.actualizarCita(idCita, {
        estado_cita: 'Cancelada',
        nota_cita: `[CANCELADA] ${motivo}`
      });
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      throw error;
    }
  }
};

export default citaService;
