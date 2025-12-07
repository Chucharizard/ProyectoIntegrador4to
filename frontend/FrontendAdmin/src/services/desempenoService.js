import axiosInstance from '../api/axios';

/**
 * Servicio para gestionar desempeño de asesores
 */
export const desempenoService = {
  /**
   * Obtener todos los registros de desempeño con filtros opcionales
   */
  async getAll(params = {}) {
    const response = await axiosInstance.get('/desempeno/', { params });
    return response.data;
  },

  /**
   * Obtener un registro de desempeño por ID
   */
  async getById(idDesempeno) {
    const response = await axiosInstance.get(`/desempeno/${idDesempeno}`);
    return response.data;
  },

  /**
   * Crear un registro de desempeño manualmente
   */
  async create(desempeno) {
    const response = await axiosInstance.post('/desempeno/', desempeno);
    return response.data;
  },

  /**
   * Generar análisis de desempeño automáticamente
   * @param {Object} data - { id_usuario_asesor, tipo_periodo, anio, mes? }
   * @param {string} data.id_usuario_asesor - ID del usuario asesor
   * @param {string} data.tipo_periodo - 'mensual' o 'anual'
   * @param {number} data.anio - Año a analizar
   * @param {number} [data.mes] - Mes a analizar (solo para tipo_periodo='mensual')
   */
  async generar(data) {
    const response = await axiosInstance.post('/desempeno/generar', data);
    return response.data;
  },

  /**
   * Actualizar un registro de desempeño
   */
  async update(idDesempeno, desempeno) {
    const response = await axiosInstance.put(`/desempeno/${idDesempeno}`, desempeno);
    return response.data;
  },

  /**
   * Eliminar un registro de desempeño
   */
  async delete(idDesempeno) {
    await axiosInstance.delete(`/desempeno/${idDesempeno}`);
  },

  /**
   * Obtener desempeños por asesor
   */
  async getPorAsesor(idUsuarioAsesor) {
    const params = { id_usuario_asesor: idUsuarioAsesor };
    const response = await axiosInstance.get('/desempeno/', { params });
    return response.data;
  },

  /**
   * Obtener estadísticas generales de desempeño
   */
  async getEstadisticas() {
    const response = await axiosInstance.get('/desempeno/');
    const desempenos = response.data;
    
    const totalCaptaciones = desempenos.reduce((sum, d) => sum + (d.captaciones_desempeno || 0), 0);
    const totalColocaciones = desempenos.reduce((sum, d) => sum + (d.colocaciones_desempeno || 0), 0);
    const totalVisitas = desempenos.reduce((sum, d) => sum + (d.visitas_agendadas_desempeno || 0), 0);
    
    return {
      total: desempenos.length,
      totalCaptaciones,
      totalColocaciones,
      totalVisitas,
      promedioCaptaciones: desempenos.length > 0 ? (totalCaptaciones / desempenos.length).toFixed(1) : 0,
      promedioColocaciones: desempenos.length > 0 ? (totalColocaciones / desempenos.length).toFixed(1) : 0,
      promedioVisitas: desempenos.length > 0 ? (totalVisitas / desempenos.length).toFixed(1) : 0
    };
  },

  /**
   * Obtener ranking de asesores
   */
  async getRanking(periodo = null, top = 10) {
    const params = { top };
    if (periodo) params.periodo = periodo;
    const response = await axiosInstance.get('/desempeno/ranking/asesores', { params });
    return response.data;
  },

  /**
   * Obtener resumen de desempeño de un asesor
   */
  async getResumenAsesor(idUsuarioAsesor) {
    const response = await axiosInstance.get(`/desempeno/resumen/${idUsuarioAsesor}`);
    return response.data;
  }
};

export default desempenoService;
