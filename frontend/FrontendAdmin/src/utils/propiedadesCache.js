const PROPIEDADES_CACHE_KEY = 'propiedades_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export const propiedadesCache = {
  get: () => {
    try {
      const cached = localStorage.getItem(PROPIEDADES_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(PROPIEDADES_CACHE_KEY);
        return null;
      }

      console.log('✅ [PROPIEDADES CACHE] Usando caché de localStorage');
      return data;
    } catch (error) {
      console.error('❌ [PROPIEDADES CACHE] Error al leer caché:', error);
      localStorage.removeItem(PROPIEDADES_CACHE_KEY);
      return null;
    }
  },

  set: (data) => {
    try {
      localStorage.setItem(PROPIEDADES_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('💾 [PROPIEDADES CACHE] Propiedades guardadas en caché');
    } catch (error) {
      console.error('❌ [PROPIEDADES CACHE] Error al guardar caché:', error);
    }
  },

  clear: () => {
    localStorage.removeItem(PROPIEDADES_CACHE_KEY);
    console.log('🗑️ [PROPIEDADES CACHE] Caché limpiado');
  }
};
