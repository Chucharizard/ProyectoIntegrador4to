// Configuración de la aplicación
// Cambia estos valores según tu entorno

export const config = {
  // URL del backend API
  // Desarrollo local: http://localhost:8000/api
  // Android emulador: http://10.0.2.2:8000/api
  // Red local: http://192.168.1.X:8000/api (reemplaza X con tu IP)
  // Producción: https://tu-dominio.com/api
  API_URL: __DEV__ 
    ? 'http://192.168.26.3:8000/api'  // IP WiFi de tu PC para probar en teléfono
    : 'https://tu-dominio.com/api',

  // Configuración de imágenes
  IMAGE_QUALITY: 0.8,
  MAX_IMAGES_PER_UPLOAD: 10,

  // Timeouts (en milisegundos)
  API_TIMEOUT: 30000,
  
  // Configuración de desarrollo
  DEBUG: __DEV__,
};

// Helper para obtener la URL completa de una imagen
export const getImageUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  
  // Si ya es una URL completa, retornarla tal cual
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  
  // Construir URL completa
  const baseUrl = config.API_URL.replace('/api', '');
  return `${baseUrl}${relativeUrl}`;
};

export default config;
