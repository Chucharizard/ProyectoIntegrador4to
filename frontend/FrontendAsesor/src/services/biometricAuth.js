import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'user_credentials';

/**
 * Verifica si el dispositivo tiene hardware biométrico disponible
 */
export const isBiometricAvailable = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error verificando disponibilidad biométrica:', error);
    return false;
  }
};

/**
 * Verifica si hay credenciales biométricas guardadas
 */
export const hasSavedCredentials = async () => {
  try {
    const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return credentials !== null;
  } catch (error) {
    console.error('Error verificando credenciales guardadas:', error);
    return false;
  }
};

/**
 * Obtiene el tipo de autenticación biométrica disponible
 */
export const getBiometricType = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Huella Digital';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    
    return 'Biométrico';
  } catch (error) {
    console.error('Error obteniendo tipo biométrico:', error);
    return 'Biométrico';
  }
};

/**
 * Verifica si el usuario tiene biometría configurada en el dispositivo
 */
export const isEnrolled = async () => {
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch (error) {
    console.error('Error verificando enrollment:', error);
    return false;
  }
};

/**
 * Guarda las credenciales de forma segura
 */
export const saveCredentials = async (email, password) => {
  try {
    const credentials = JSON.stringify({ email, password });
    await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);
    return true;
  } catch (error) {
    console.error('Error guardando credenciales:', error);
    return false;
  }
};

/**
 * Obtiene las credenciales guardadas
 */
export const getCredentials = async () => {
  try {
    const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (credentials) {
      return JSON.parse(credentials);
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo credenciales:', error);
    return null;
  }
};

/**
 * Elimina las credenciales guardadas
 */
export const deleteCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    return true;
  } catch (error) {
    console.error('Error eliminando credenciales:', error);
    return false;
  }
};

/**
 * Autentica al usuario usando biometría
 */
export const authenticateWithBiometrics = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autenticarse para iniciar sesión',
      fallbackLabel: 'Usar contraseña',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });

    return result;
  } catch (error) {
    console.error('Error en autenticación biométrica:', error);
    return { success: false };
  }
};
