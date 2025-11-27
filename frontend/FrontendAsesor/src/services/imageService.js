import api from './api';

class ImageService {
  /**
   * Subir imágenes a una propiedad
   * @param {string} idPropiedad - UUID de la propiedad
   * @param {Array} images - Array de objetos con { uri, type, name }
   * @param {Object} gpsData - Objeto con latitud y longitud (opcional)
   */
  async uploadImages(idPropiedad, images, gpsData = null) {
    try {
      const formData = new FormData();

      // Agregar cada imagen al FormData
      images.forEach((image, index) => {
        formData.append('imagenes', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `imagen_${index}.jpg`,
        });
      });

      // Agregar coordenadas GPS si están disponibles
      if (gpsData) {
        formData.append('latitud', gpsData.latitude.toString());
        formData.append('longitud', gpsData.longitude.toString());
      }

      const response = await api.post(
        `/imagenes-propiedad/upload/${idPropiedad}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al subir imágenes',
      };
    }
  }

  /**
   * Obtener imágenes de una propiedad
   */
  async getImagesByPropiedad(idPropiedad) {
    try {
      const response = await api.get(`/imagenes-propiedad/propiedad/${idPropiedad}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo imágenes:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al obtener imágenes',
      };
    }
  }
}

export default new ImageService();
