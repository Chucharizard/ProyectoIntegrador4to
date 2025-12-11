import citaService from './citaService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const POLLING_INTERVAL = 30000; // 30 segundos
const LAST_CHECK_KEY = 'last_citas_check';

let pollingInterval = null;
let onNewCitaCallback = null;

/**
 * Inicia el polling para detectar citas nuevas o reprogramadas
 * @param {Function} callback - Función que se ejecuta cuando hay nuevas citas
 */
export const startPolling = (callback) => {
  onNewCitaCallback = callback;
  
  // Limpiar intervalo anterior si existe
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Verificar inmediatamente
  checkForNewCitas();

  // Verificar cada 30 segundos
  pollingInterval = setInterval(checkForNewCitas, POLLING_INTERVAL);
  
  console.log('✅ Polling iniciado - Verificando cada 30 segundos');
};

/**
 * Detiene el polling
 */
export const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('🛑 Polling detenido');
  }
};

/**
 * Verifica si hay citas nuevas desde la última verificación
 */
const checkForNewCitas = async () => {
  try {
    // Obtener IDs de citas conocidas
    const lastIdsStr = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const lastIds = lastIdsStr ? JSON.parse(lastIdsStr) : [];
    
    // Obtener todas las citas actuales del usuario
    const todasLasCitas = await citaService.getMisCitas({});
    
    // Extraer IDs actuales
    const currentIds = todasLasCitas.map(cita => cita.id_cita);
    
    // Detectar citas nuevas (IDs que no estaban antes)
    const newIds = currentIds.filter(id => !lastIds.includes(id));
    
    // Detectar citas modificadas (comparar fecha_visita_cita y estado)
    const citasModificadas = [];
    for (const cita of todasLasCitas) {
      // Si es un ID conocido, verificar si cambió algo
      if (lastIds.includes(cita.id_cita)) {
        try {
          const citaGuardadaStr = await AsyncStorage.getItem(`cita_${cita.id_cita}`);
          if (citaGuardadaStr) {
            const citaGuardada = JSON.parse(citaGuardadaStr);
            
            // Detectar cambios en fecha o estado
            const cambioFecha = cita.fecha_visita_cita !== citaGuardada.fecha_visita_cita;
            const cambioEstado = cita.estado_cita !== citaGuardada.estado_cita;
            
            if (cambioFecha || cambioEstado) {
              citasModificadas.push(cita);
              console.log(`📝 Cita ${cita.id_cita} modificada:`, {
                cambioFecha,
                cambioEstado,
                fechaAnterior: citaGuardada.fecha_visita_cita,
                fechaNueva: cita.fecha_visita_cita,
                estadoAnterior: citaGuardada.estado_cita,
                estadoNuevo: cita.estado_cita
              });
            }
          }
        } catch (e) {
          console.error(`Error al verificar cita ${cita.id_cita}:`, e);
        }
      }
    }
    
    // Filtrar las citas nuevas y modificadas completas
    const citasNuevas = todasLasCitas.filter(cita => 
      newIds.includes(cita.id_cita) || citasModificadas.some(c => c.id_cita === cita.id_cita)
    );

    // Guardar IDs actuales para la próxima verificación
    await AsyncStorage.setItem(LAST_CHECK_KEY, JSON.stringify(currentIds));
    
    // Guardar snapshot de cada cita para detectar cambios futuros
    for (const cita of todasLasCitas) {
      await AsyncStorage.setItem(`cita_${cita.id_cita}`, JSON.stringify({
        id_cita: cita.id_cita,
        fecha_visita_cita: cita.fecha_visita_cita,
        estado_cita: cita.estado_cita
      }));
    }

    // Notificar si hay citas nuevas o modificadas
    if (citasNuevas.length > 0 && onNewCitaCallback) {
      console.log(`🔔 ${citasNuevas.length} cita(s) nueva(s)/modificada(s) detectada(s)`);
      onNewCitaCallback(citasNuevas);
    }
  } catch (error) {
    console.error('Error al verificar citas nuevas:', error);
  }
};

/**
 * Marca las citas actuales como conocidas (para evitar notificaciones al iniciar)
 */
export const markAsChecked = async () => {
  try {
    const todasLasCitas = await citaService.getMisCitas({});
    const currentIds = todasLasCitas.map(cita => cita.id_cita);
    await AsyncStorage.setItem(LAST_CHECK_KEY, JSON.stringify(currentIds));
    
    // Guardar snapshot de cada cita
    for (const cita of todasLasCitas) {
      await AsyncStorage.setItem(`cita_${cita.id_cita}`, JSON.stringify({
        id_cita: cita.id_cita,
        fecha_visita_cita: cita.fecha_visita_cita,
        estado_cita: cita.estado_cita
      }));
    }
    
    console.log('✅ Marcado como revisado');
  } catch (error) {
    console.error('Error al marcar como revisado:', error);
  }
};

export default {
  startPolling,
  stopPolling,
  markAsChecked,
};
