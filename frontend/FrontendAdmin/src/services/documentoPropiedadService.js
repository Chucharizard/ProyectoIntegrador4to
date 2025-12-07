import axiosInstance from '../api/axios';

const documentoPropiedadService = {
  /**
   * Obtener todos los documentos de una propiedad
   */
  getByPropiedad: async (idPropiedad) => {
    try {
      const response = await axiosInstance.get('/documentos-propiedad/', {
        params: { id_propiedad: idPropiedad }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw error;
    }
  },

  /**
   * Subir un nuevo documento
   */
  upload: async (idPropiedad, tipoDocumento, file, observaciones = null) => {
    try {
      const formData = new FormData();
      formData.append('id_propiedad', idPropiedad);
      formData.append('tipo_documento', tipoDocumento);
      formData.append('file', file);
      
      if (observaciones) {
        formData.append('observaciones_documento', observaciones);
      }

      const response = await axiosInstance.post('/documentos-propiedad/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  },

  /**
   * Obtener un documento por ID
   */
  getById: async (idDocumento) => {
    try {
      const response = await axiosInstance.get(`/documentos-propiedad/${idDocumento}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener documento:', error);
      throw error;
    }
  },

  /**
   * Actualizar un documento
   */
  update: async (idDocumento, data) => {
    try {
      const response = await axiosInstance.put(`/documentos-propiedad/${idDocumento}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw error;
    }
  },

  /**
   * Eliminar un documento
   */
  delete: async (idDocumento) => {
    try {
      const response = await axiosInstance.delete(`/documentos-propiedad/${idDocumento}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw error;
    }
  }
};

export default documentoPropiedadService;
