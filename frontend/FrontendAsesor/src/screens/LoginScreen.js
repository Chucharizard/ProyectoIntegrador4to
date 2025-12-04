import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import {
  isBiometricAvailable,
  hasSavedCredentials,
  getBiometricType,
  isEnrolled,
  saveCredentials,
  getCredentials,
  deleteCredentials,
  authenticateWithBiometrics,
} from '../services/biometricAuth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biométrico');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAvailable();
    const enrolled = await isEnrolled();
    const hasCreds = await hasSavedCredentials();
    
    if (available && enrolled) {
      setBiometricAvailable(true);
      const type = await getBiometricType();
      setBiometricType(type);
      setHasCredentials(hasCreds);
    }
  };

  const handleLogin = async (biometricLogin = false) => {
    let loginEmail = email;
    let loginPassword = password;

    // Si es login biométrico, obtener credenciales guardadas
    if (biometricLogin) {
      const credentials = await getCredentials();
      if (!credentials) {
        Alert.alert('Error', 'No hay credenciales guardadas');
        return;
      }
      loginEmail = credentials.email;
      loginPassword = credentials.password;
    } else {
      // Validar campos si es login normal
      if (!loginEmail || !loginPassword) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
    }

    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (result.success) {
      // Si el login fue exitoso y el usuario quiere recordar, guardar credenciales
      if (!biometricLogin && rememberMe && biometricAvailable) {
        const saved = await saveCredentials(loginEmail, loginPassword);
        if (saved) {
          setHasCredentials(true);
        }
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleBiometricLogin = async () => {
    const result = await authenticateWithBiometrics();
    
    if (result.success) {
      await handleLogin(true);
    } else if (result.error === 'user_cancel') {
      // Usuario canceló, no hacer nada
    } else {
      Alert.alert('Error', 'No se pudo autenticar con biometría');
    }
  };

  const handleForgetCredentials = async () => {
    Alert.alert(
      'Olvidar credenciales',
      '¿Estás seguro de que quieres eliminar las credenciales guardadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteCredentials();
            if (deleted) {
              setHasCredentials(false);
              Alert.alert('Éxito', 'Credenciales eliminadas');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1c" />
      <LinearGradient
        colors={['#0a0f1c', '#111827', '#1f2937']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Logo/Icon Area */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.logoCircle}
              >
                <Text style={styles.logoEmoji}>🏠</Text>
              </LinearGradient>
              <Text style={styles.title}>Inmobiliaria App</Text>
              <Text style={styles.subtitle}>Portal de Asesores</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me Checkbox (solo si biometría disponible) */}
              {biometricAvailable && !hasCredentials && (
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkbox}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Recordar credenciales para {biometricType}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Login Button */}
              <TouchableOpacity
                onPress={() => handleLogin(false)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#6b7280', '#4b5563'] : ['#10b981', '#059669']}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Iniciar Sesión</Text>
                      <Text style={styles.buttonIcon}>→</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Biometric Login Button (solo si hay credenciales guardadas) */}
              {biometricAvailable && hasCredentials && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>o</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    onPress={handleBiometricLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.biometricButton}>
                      <Text style={styles.biometricIcon}>
                        {biometricType === 'Face ID' ? '👤' : '👆'}
                      </Text>
                      <Text style={styles.biometricButtonText}>
                        Usar {biometricType}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleForgetCredentials}
                    style={styles.forgetButton}
                  >
                    <Text style={styles.forgetButtonText}>
                      Olvidar credenciales guardadas
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Footer */}
              <Text style={styles.footer}>
                Sistema de Gestión Inmobiliaria v1.0
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#10b981',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkmark: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#9ca3af',
    fontSize: 14,
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#6b7280',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    padding: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  biometricButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgetButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  forgetButtonText: {
    color: '#6b7280',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    marginTop: 32,
  },
});
