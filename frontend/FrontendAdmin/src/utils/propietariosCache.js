const PROPIETARIOS_CACHE_KEY = 'propietarios_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const propietariosCache = {
  get: () => {
    try {
      const cached = localStorage.getItem(PROPIETARIOS_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(PROPIETARIOS_CACHE_KEY);
        return null;
      }

      console.log('✅ [PROPIETARIOS CACHE] Usando caché de localStorage');
      return data;
    } catch (error) {
      console.error('❌ [PROPIETARIOS CACHE] Error al leer caché:', error);
      localStorage.removeItem(PROPIETARIOS_CACHE_KEY);
      return null;
    }
  },

  set: (data) => {
    try {
      localStorage.setItem(PROPIETARIOS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('💾 [PROPIETARIOS CACHE] Propietarios guardados en caché');
    } catch (error) {
      console.error('❌ [PROPIETARIOS CACHE] Error al guardar caché:', error);
    }
  },

  clear: () => {
    localStorage.removeItem(PROPIETARIOS_CACHE_KEY);
    console.log('🗑️ [PROPIETARIOS CACHE] Caché limpiado');
  }
};
