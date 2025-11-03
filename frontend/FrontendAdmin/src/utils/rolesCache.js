const ROLES_CACHE_KEY = 'roles_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const rolesCache = {
  get: () => {
    try {
      const cached = localStorage.getItem(ROLES_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(ROLES_CACHE_KEY);
        return null;
      }

      console.log('✅ [ROLES CACHE] Usando caché de localStorage');
      return data;
    } catch (error) {
      console.error('❌ [ROLES CACHE] Error al leer caché:', error);
      localStorage.removeItem(ROLES_CACHE_KEY);
      return null;
    }
  },

  set: (data) => {
    try {
      localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('💾 [ROLES CACHE] Roles guardados en caché');
    } catch (error) {
      console.error('❌ [ROLES CACHE] Error al guardar caché:', error);
    }
  },

  clear: () => {
    localStorage.removeItem(ROLES_CACHE_KEY);
    console.log('🗑️ [ROLES CACHE] Caché limpiado');
  }
};
