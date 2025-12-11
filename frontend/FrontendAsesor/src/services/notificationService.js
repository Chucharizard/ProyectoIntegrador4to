import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra el dispositivo para recibir notificaciones push
 * y guarda el token en el backend
 */
export async function registrarNotificaciones() {
  try {
    // Verificar si está corriendo en Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      console.log('⚠️ Las notificaciones push no están disponibles en Expo Go (SDK 53+)');
      console.log('💡 Para usar notificaciones, necesitas crear un development build');
      console.log('📚 Más info: https://docs.expo.dev/develop/development-builds/introduction/');
      return null;
    }

    // Verificar que sea un dispositivo físico (no funciona en simuladores)
    if (!Device.isDevice) {
      console.log('Las notificaciones push solo funcionan en dispositivos físicos');
      return null;
    }

    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // Obtener token de Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                     Constants.manifest?.extra?.eas?.projectId ||
                     Constants.manifest2?.extra?.eas?.projectId;
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    console.log('✅ Token de notificaciones obtenido:', token.data);

    // Guardar token en AsyncStorage
    await AsyncStorage.setItem('expo_push_token', token.data);

    // Configurar canal de notificaciones para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('citas', {
        name: 'Citas de Visita',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error al registrar notificaciones:', error);
    return null;
  }
}

/**
 * Envía el token al backend para asociarlo con el usuario
 */
export async function enviarTokenAlBackend(token) {
  try {
    const authToken = await AsyncStorage.getItem('token');
    const API_URL = await AsyncStorage.getItem('apiUrl');

    if (!authToken || !API_URL) {
      console.log('No hay sesión activa para enviar token');
      return false;
    }

    await axios.patch(
      `${API_URL}/usuarios/me/push-token`,
      { expo_push_token: token },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log('✅ Token enviado al backend correctamente');
    return true;
  } catch (error) {
    console.error('Error al enviar token al backend:', error);
    return false;
  }
}

/**
 * Configura listeners para manejar notificaciones recibidas y presionadas
 */
export function configurarListenersNotificaciones(navigation) {
  // Listener para notificaciones recibidas mientras la app está abierta
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📩 Notificación recibida:', notification);
      // Puedes mostrar un banner o actualizar el estado de la app aquí
    }
  );

  // Listener para cuando el usuario presiona una notificación
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('👆 Notificación presionada:', response);
      
      // Extraer datos de la notificación
      const data = response.notification.request.content.data;
      
      // Navegar según el tipo de notificación
      if (data.tipo === 'cita_nueva' || data.tipo === 'cita_reprogramada') {
        if (data.id_cita) {
          // Navegar a los detalles de la cita
          navigation.navigate('CitaDetail', { citaId: data.id_cita });
        } else {
          // Navegar a la lista de citas
          navigation.navigate('Agenda');
        }
      }
    }
  );

  // Retornar función de limpieza
  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelarTodasLasNotificaciones() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Programa una notificación local para recordatorio de cita
 */
export async function programarRecordatorioCita(citaId, titulo, mensaje, fechaCita, minutosAntes = 30) {
  try {
    const fechaRecordatorio = new Date(fechaCita);
    fechaRecordatorio.setMinutes(fechaRecordatorio.getMinutes() - minutosAntes);

    // Solo programar si la fecha es futura
    if (fechaRecordatorio > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 Recordatorio: ${titulo}`,
          body: mensaje,
          sound: 'default',
          data: { tipo: 'recordatorio_cita', id_cita: citaId },
        },
        trigger: fechaRecordatorio,
      });

      console.log(`✅ Recordatorio programado para ${fechaRecordatorio.toLocaleString()}`);
      return true;
    } else {
      console.log('La fecha del recordatorio ya pasó');
      return false;
    }
  } catch (error) {
    console.error('Error al programar recordatorio:', error);
    return false;
  }
}
