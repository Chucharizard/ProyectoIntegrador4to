import axiosInstance from '../api/axios';

/**
 * Servicio para gestionar las imágenes de propiedades
 */
export const imagenesService = {
  /**
   * Obtener todas las imágenes de una propiedad
   */
  async getImagenesPorPropiedad(idPropiedad) {
    const response = await axiosInstance.get(`/imagenes-propiedad/propiedad/${idPropiedad}`);
    return response.data;
  },

  /**
   * Obtener una imagen por ID
   */
  async getImagenById(idImagen) {
    const response = await axiosInstance.get(`/imagenes-propiedad/${idImagen}`);
    return response.data;
  },

  /**
   * Crear una nueva imagen
   */
  async crearImagen(data) {
    const response = await axiosInstance.post('/imagenes-propiedad/', data);
    return response.data;
  },

  /**
   * Actualizar una imagen
   */
  async actualizarImagen(idImagen, data) {
    const response = await axiosInstance.put(`/imagenes-propiedad/${idImagen}`, data);
    return response.data;
  },

  /**
   * Eliminar una imagen
   */
  async eliminarImagen(idImagen) {
    await axiosInstance.delete(`/imagenes-propiedad/${idImagen}`);
  },

  /**
   * Marcar/desmarcar imagen como portada
   */
  async togglePortada(idImagen, esPortada) {
    const response = await axiosInstance.put(`/imagenes-propiedad/${idImagen}`, {
      es_portada_imagen: esPortada
    });
    return response.data;
  },

  /**
   * Subir múltiples imágenes para una propiedad
   */
  async subirImagenes(idPropiedad, files) {
    const formData = new FormData();
    
    // Agregar cada archivo al FormData
    files.forEach((file) => {
      formData.append('imagenes', file);
    });

    const response = await axiosInstance.post(
      `/imagenes-propiedad/upload/${idPropiedad}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data.imagenes || response.data;
  }
};

export default imagenesService;
