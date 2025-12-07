import axiosInstance from '../api/axios';

/**
 * Servicio para gestionar ganancias de empleados
 */
export const gananciaEmpleadoService = {
  /**
   * Obtener todas las ganancias con filtros opcionales
   */
  async getAll(params = {}) {
    const response = await axiosInstance.get('/ganancias/', { params });
    return response.data;
  },

  /**
   * Obtener una ganancia por ID
   */
  async getById(idGanancia) {
    const response = await axiosInstance.get(`/ganancias/${idGanancia}`);
    return response.data;
  },

  /**
   * Crear una nueva ganancia manualmente (generalmente se crean automáticamente)
   */
  async create(ganancia) {
    const response = await axiosInstance.post('/ganancias/', ganancia);
    return response.data;
  },

  /**
   * Actualizar una ganancia (típicamente para marcar como concretado)
   */
  async update(idGanancia, ganancia) {
    const response = await axiosInstance.put(`/ganancias/${idGanancia}`, ganancia);
    return response.data;
  },

  /**
   * Marcar una ganancia como concretada (pagada)
   */
  async marcarComoConcretado(idGanancia, fechaCierre = null) {
    const response = await axiosInstance.put(`/ganancias/${idGanancia}`, {
      esta_concretado_ganancia: true,
      fecha_cierre_ganancia: fechaCierre || new Date().toISOString().split('T')[0]
    });
    return response.data;
  },

  /**
   * Obtener ganancias por empleado
   */
  async getPorEmpleado(idUsuarioEmpleado, soloPendientes = false) {
    const params = {
      id_usuario_empleado: idUsuarioEmpleado,
      solo_pendientes: soloPendientes
    };
    const response = await axiosInstance.get('/ganancias/', { params });
    return response.data;
  },

  /**
   * Obtener ganancias pendientes (no concretadas)
   */
  async getPendientes() {
    const response = await axiosInstance.get('/ganancias/', {
      params: { solo_pendientes: true }
    });
    return response.data;
  },

  /**
   * Eliminar una ganancia
   */
  async delete(idGanancia) {
    await axiosInstance.delete(`/ganancias/${idGanancia}`);
  },

  /**
   * Obtener estadísticas de ganancias
   */
  async getEstadisticas() {
    const response = await axiosInstance.get('/ganancias/');
    const ganancias = response.data;
    
    const total = ganancias.length;
    const concretadas = ganancias.filter(g => g.esta_concretado_ganancia).length;
    const pendientes = total - concretadas;
    
    const montoConcretado = ganancias
      .filter(g => g.esta_concretado_ganancia)
      .reduce((sum, g) => sum + parseFloat(g.dinero_ganado_ganancia || 0), 0);
    
    const montoPendiente = ganancias
      .filter(g => !g.esta_concretado_ganancia)
      .reduce((sum, g) => sum + parseFloat(g.dinero_ganado_ganancia || 0), 0);
    
    return {
      total,
      concretadas,
      pendientes,
      montoConcretado,
      montoPendiente,
      montoTotal: montoConcretado + montoPendiente
    };
  }
};

export default gananciaEmpleadoService;
