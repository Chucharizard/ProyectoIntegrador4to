// ============================================
// ⚙️ CONFIGURACIÓN DE DURACIONES (Mejorada)
// ============================================
const DURATIONS = {
  INSTANT: 30 * 1000,        // 30 segundos (datos muy volátiles)
  SHORT: 1 * 60 * 1000,      // 1 minuto (citas, pagos pendientes)
  STANDARD: 5 * 60 * 1000,   // 5 minutos (propiedades, clientes)
  MEDIUM: 10 * 60 * 1000,    // 10 minutos (propietarios, empleados)
  LONG: 30 * 60 * 1000,      // 30 minutos (roles, configuración)
  VERY_LONG: 60 * 60 * 1000  // 1 hora (datos casi estáticos)
};


// ============================================
// 🏭 FACTORY DE CACHÉ CON VERSIÓN MEJORADA
// ============================================
const createCache = (key, duration = DURATIONS.STANDARD, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB por caché
    enableStats = true          // Estadísticas de uso
  } = options;

  // Estadísticas
  let stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    clears: 0
  };

  return {
    /**
     * Obtener datos del caché
     */
    get: () => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) {
          if (enableStats) stats.misses++;
          return null;
        }

        const { data, timestamp, version = 1 } = JSON.parse(cached);
        const now = Date.now();

        // Verificar expiración
        if (now - timestamp > duration) {
          localStorage.removeItem(key);
          if (enableStats) stats.misses++;
          return null;
        }

        if (enableStats) stats.hits++;
        const cacheKey = key.toUpperCase().replace('_CACHE', '');
        const age = Math.floor((now - timestamp) / 1000);
        console.log(`✅ [${cacheKey} CACHE] Hit! (${age}s ago, v${version})`);
        
        return data;
      } catch (error) {
        const cacheKey = key.toUpperCase().replace('_CACHE', '');
        console.error(`❌ [${cacheKey} CACHE] Error al leer:`, error);
        localStorage.removeItem(key);
        if (enableStats) stats.misses++;
        return null;
      }
    },

    /**
     * Guardar datos en caché
     */
    set: (data, customDuration = null) => {
      try {
        const payload = JSON.stringify({
          data,
          timestamp: Date.now(),
          version: 2 // Versión del formato de caché
        });

        // Verificar tamaño
        const size = new Blob([payload]).size;
        if (size > maxSize) {
          console.warn(`⚠️ [${key}] Datos muy grandes (${(size / 1024 / 1024).toFixed(2)}MB), no se guardará en caché`);
          return false;
        }

        localStorage.setItem(key, payload);
        if (enableStats) stats.sets++;
        
        const cacheKey = key.toUpperCase().replace('_CACHE', '');
        console.log(`💾 [${cacheKey} CACHE] Guardado (${(size / 1024).toFixed(2)}KB, TTL: ${(customDuration || duration) / 1000}s)`);
        
        return true;
      } catch (error) {
        const cacheKey = key.toUpperCase().replace('_CACHE', '');
        
        // Manejar error de cuota excedida
        if (error.name === 'QuotaExceededError') {
          console.error(`❌ [${cacheKey} CACHE] Cuota excedida, limpiando cachés antiguos...`);
          clearOldestCaches();
          
          // Reintentar
          try {
            localStorage.setItem(key, JSON.stringify({
              data,
              timestamp: Date.now(),
              version: 2
            }));
            return true;
          } catch (retryError) {
            console.error(`❌ [${cacheKey} CACHE] Fallo al reintentar:`, retryError);
            return false;
          }
        }
        
        console.error(`❌ [${cacheKey} CACHE] Error al guardar:`, error);
        return false;
      }
    },

    /**
     * Limpiar caché específico
     */
    clear: () => {
      localStorage.removeItem(key);
      if (enableStats) stats.clears++;
      const cacheKey = key.toUpperCase().replace('_CACHE', '');
      console.log(`🗑️ [${cacheKey} CACHE] Limpiado`);
    },

    /**
     * Verificar si existe y es válido
     */
    isValid: () => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return false;

        const { timestamp } = JSON.parse(cached);
        const now = Date.now();
        return (now - timestamp) <= duration;
      } catch {
        return false;
      }
    },

    /**
     * Obtener edad del caché en segundos
     */
    getAge: () => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { timestamp } = JSON.parse(cached);
        return Math.floor((Date.now() - timestamp) / 1000);
      } catch {
        return null;
      }
    },

    /**
     * Obtener estadísticas
     */
    getStats: () => {
      if (!enableStats) return null;
      
      const hitRate = stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
        : 0;
      
      return {
        ...stats,
        hitRate: `${hitRate}%`
      };
    },

    /**
     * Resetear estadísticas
     */
    resetStats: () => {
      stats = { hits: 0, misses: 0, sets: 0, clears: 0 };
    }
  };
};


// ============================================
// 🧹 FUNCIONES AUXILIARES
// ============================================

/**
 * Limpiar los cachés más antiguos cuando se excede la cuota
 */
const clearOldestCaches = () => {
  try {
    const cacheKeys = Object.keys(localStorage).filter(key => key.endsWith('_cache'));
    const caches = [];

    cacheKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const { timestamp } = JSON.parse(item);
          caches.push({ key, timestamp });
        }
      } catch {
        // Eliminar cachés corruptos
        localStorage.removeItem(key);
      }
    });

    // Ordenar por antigüedad y eliminar los 3 más viejos
    caches.sort((a, b) => a.timestamp - b.timestamp);
    caches.slice(0, 3).forEach(cache => {
      localStorage.removeItem(cache.key);
      console.log(`🗑️ [CACHE] Eliminado caché antiguo: ${cache.key}`);
    });

  } catch (error) {
    console.error('❌ [CACHE] Error al limpiar cachés antiguos:', error);
  }
};


// ============================================
// 📦 CACHES ESPECÍFICOS
// ============================================

// ✅ Propiedades (10 minutos - ahora carga todo, dura más)
export const propiedadesCache = createCache('propiedades_cache', DURATIONS.MEDIUM);

// ✅ Propietarios (10 minutos - cambian poco)
export const propietariosCache = createCache('propietarios_cache', DURATIONS.MEDIUM);

// ✅ Roles (1 hora - casi nunca cambian)
export const rolesCache = createCache('roles_cache', DURATIONS.VERY_LONG);

// ✅ Clientes (10 minutos - ahora carga todo, dura más)
export const clientesCache = createCache('clientes_cache', DURATIONS.MEDIUM);

// ✅ Empleados (10 minutos)
export const empleadosCache = createCache('empleados_cache', DURATIONS.MEDIUM);

// ✅ Usuarios (10 minutos)
export const usuariosCache = createCache('usuarios_cache', DURATIONS.MEDIUM);

// ✅ Citas (1 minuto - cambian frecuentemente)
export const citasCache = createCache('citas_cache', DURATIONS.SHORT);

// ✅ Pagos (1 minuto - importante mantener actualizado)
export const pagosCache = createCache('pagos_cache', DURATIONS.SHORT);

// ✅ Contratos (5 minutos)
export const contratosCache = createCache('contratos_cache', DURATIONS.STANDARD);

// ✅ Direcciones (10 minutos)
export const direccionesCache = createCache('direcciones_cache', DURATIONS.MEDIUM);


// ============================================
// 🧹 GESTIÓN GLOBAL DE CACHÉ
// ============================================

/**
 * Limpiar todo el caché
 */
export const clearAllCache = () => {
  propiedadesCache.clear();
  propietariosCache.clear();
  rolesCache.clear();
  clientesCache.clear();
  empleadosCache.clear();
  usuariosCache.clear();
  citasCache.clear();
  pagosCache.clear();
  contratosCache.clear();
  direccionesCache.clear();
  console.log('🧹 [CACHE GLOBAL] Todo el caché limpiado');
};

/**
 * Limpiar cachés expirados
 */
export const clearExpiredCaches = () => {
  const caches = [
    { name: 'propiedades', cache: propiedadesCache },
    { name: 'propietarios', cache: propietariosCache },
    { name: 'roles', cache: rolesCache },
    { name: 'clientes', cache: clientesCache },
    { name: 'empleados', cache: empleadosCache },
    { name: 'usuarios', cache: usuariosCache },
    { name: 'citas', cache: citasCache },
    { name: 'pagos', cache: pagosCache },
    { name: 'contratos', cache: contratosCache },
    { name: 'direcciones', cache: direccionesCache }
  ];

  let cleared = 0;
  caches.forEach(({ cache }) => {
    if (!cache.isValid()) {
      cache.clear();
      cleared++;
    }
  });

  console.log(`🧹 [CACHE] ${cleared} cachés expirados limpiados`);
  return cleared;
};


// ============================================
// 📊 INFO DEL CACHÉ (Mejorado)
// ============================================

/**
 * Obtener información detallada del caché
 */
export const getCacheInfo = () => {
  const caches = {
    propiedades: propiedadesCache,
    propietarios: propietariosCache,
    roles: rolesCache,
    clientes: clientesCache,
    empleados: empleadosCache,
    usuarios: usuariosCache,
    citas: citasCache,
    pagos: pagosCache,
    contratos: contratosCache,
    direcciones: direccionesCache
  };

  const info = {};
  let totalSize = 0;
  let validCaches = 0;

  Object.entries(caches).forEach(([name, cache]) => {
    try {
      const key = `${name}_cache`;
      const item = localStorage.getItem(key);
      
      if (item) {
        const { data } = JSON.parse(item);
        const age = cache.getAge();
        const isValid = cache.isValid();
        const size = new Blob([item]).size;
        const stats = cache.getStats();
        
        info[name] = {
          valid: isValid,
          age: age ? `${age}s` : 'N/A',
          size: `${(size / 1024).toFixed(2)} KB`,
          items: Array.isArray(data) ? data.length : (data?.items?.length || 'N/A'),
          stats: stats || 'disabled'
        };
        
        totalSize += size;
        if (isValid) validCaches++;
      } else {
        info[name] = { status: 'empty' };
      }
    } catch (error) {
      info[name] = { status: 'error', error: error.message };
    }
  });

  info._summary = {
    total_size: `${(totalSize / 1024).toFixed(2)} KB`,
    valid_caches: validCaches,
    total_caches: Object.keys(caches).length
  };

  return info;
};


// ============================================
// 🧪 VERIFICAR ESPACIO DISPONIBLE (Mejorado)
// ============================================

export const checkLocalStorageSpace = () => {
  try {
    let totalSize = 0;
    let cacheSize = 0;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const itemSize = value.length + key.length;
        totalSize += itemSize;
        
        if (key.endsWith('_cache')) {
          cacheSize += itemSize;
        }
      }
    });
    
    const usedKB = (totalSize / 1024).toFixed(2);
    const cacheKB = (cacheSize / 1024).toFixed(2);
    const limitKB = 5120; // ~5MB típico
    const percentUsed = ((totalSize / (limitKB * 1024)) * 100).toFixed(2);
    const cachePercent = ((cacheSize / totalSize) * 100).toFixed(2);
    
    const result = {
      used: usedKB,
      cache_used: cacheKB,
      cache_percent: cachePercent,
      limit: limitKB,
      percent: percentUsed,
      available: (limitKB - parseFloat(usedKB)).toFixed(2),
      status: percentUsed < 70 ? 'ok' : percentUsed < 90 ? 'warning' : 'critical'
    };
    
    console.log(
      `📦 [STORAGE] Total: ${usedKB}KB | Caché: ${cacheKB}KB (${cachePercent}%) | ` +
      `Límite: ${limitKB}KB | Uso: ${percentUsed}% | Disponible: ${result.available}KB`
    );
    
    // Limpiar automáticamente si está crítico
    if (result.status === 'critical') {
      console.warn('⚠️ [STORAGE] Espacio crítico, limpiando cachés expirados...');
      clearExpiredCaches();
    }
    
    return result;
  } catch (error) {
    console.error('❌ [STORAGE] Error al verificar espacio:', error);
    return null;
  }
};


// ============================================
// ⏰ AUTO-LIMPIEZA PERIÓDICA
// ============================================

/**
 * Iniciar limpieza automática de cachés expirados
 * @param {number} intervalMinutes - Intervalo en minutos
 */
export const startAutoCleanup = (intervalMinutes = 5) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`🤖 [AUTO-CLEANUP] Iniciado (cada ${intervalMinutes} minutos)`);
  
  const intervalId = setInterval(() => {
    console.log('🤖 [AUTO-CLEANUP] Ejecutando limpieza...');
    const cleared = clearExpiredCaches();
    checkLocalStorageSpace();
    
    if (cleared === 0) {
      console.log('✅ [AUTO-CLEANUP] No hay cachés expirados');
    }
  }, intervalMs);
  
  // Retornar ID para poder detener si es necesario
  return intervalId;
};

/**
 * Detener limpieza automática
 */
export const stopAutoCleanup = (intervalId) => {
  clearInterval(intervalId);
  console.log('🛑 [AUTO-CLEANUP] Detenido');
};


// ============================================
// 🎯 EXPORT DEFAULT
// ============================================

export default {
  // Cachés específicos
  propiedades: propiedadesCache,
  propietarios: propietariosCache,
  roles: rolesCache,
  clientes: clientesCache,
  empleados: empleadosCache,
  usuarios: usuariosCache,
  citas: citasCache,
  pagos: pagosCache,
  contratos: contratosCache,
  direcciones: direccionesCache,
  
  // Gestión
  clearAll: clearAllCache,
  clearExpired: clearExpiredCaches,
  getInfo: getCacheInfo,
  checkSpace: checkLocalStorageSpace,
  
  // Auto-limpieza
  startAutoCleanup,
  stopAutoCleanup,
  
  // Duraciones (para uso externo)
  DURATIONS
};
