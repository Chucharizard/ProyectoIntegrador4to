import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import {
  isBiometricAvailable,
  hasSavedCredentials,
  getBiometricType,
  isEnrolled,
  deleteCredentials,
  saveCredentials,
  authenticateWithBiometrics,
} from '../services/biometricAuth';

export default function PerfilScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biométrico');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const available = await isBiometricAvailable();
    const enrolled = await isEnrolled();
    const hasCreds = await hasSavedCredentials();
    
    if (available && enrolled) {
      setBiometricAvailable(true);
      const type = await getBiometricType();
      setBiometricType(type);
      setBiometricEnabled(hasCreds);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      // Activar biometría
      Alert.alert(
        'Activar Autenticación Biométrica',
        `Para activar ${biometricType}, primero necesitamos verificar tu identidad. Luego deberás ingresar tu contraseña actual para guardarla de forma segura.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: async () => {
              // Pedir autenticación biométrica primero
              const result = await authenticateWithBiometrics();
              
              if (result.success) {
                // En lugar de Alert.prompt (que no funciona en Android), 
                // redirigir a una pantalla dedicada o usar el password del login
                Alert.alert(
                  'Configuración Guardada',
                  `${biometricType} se activará en tu próximo inicio de sesión. Asegúrate de marcar la opción "Recordar credenciales" al iniciar sesión.`,
                  [{ text: 'Entendido' }]
                );
                // Marcar como habilitado temporalmente
                setBiometricEnabled(true);
              } else {
                Alert.alert('Error', 'No se pudo verificar la autenticación biométrica');
              }
            },
          },
        ]
      );
    } else {
      // Desactivar biometría
      Alert.alert(
        'Desactivar Autenticación Biométrica',
        '¿Estás seguro de que quieres eliminar tus credenciales guardadas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const deleted = await deleteCredentials();
              if (deleted) {
                setBiometricEnabled(false);
                Alert.alert('Éxito', 'Credenciales eliminadas correctamente');
              }
            },
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Cambiar Contraseña',
      'Esta funcionalidad estará disponible próximamente',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1c" />
      <LinearGradient colors={['#0a0f1c', '#111827', '#1f2937']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </LinearGradient>
            <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>{user?.rol || 'Asesor'}</Text>
          </View>

          {/* Cuenta Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>🔑</Text>
                <Text style={styles.menuText}>Cambiar Contraseña</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>📧</Text>
                <Text style={styles.menuText}>Email</Text>
              </View>
              <Text style={styles.menuValue}>{user?.email}</Text>
            </View>
          </View>

          {/* Seguridad Section */}
          {biometricAvailable && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seguridad</Text>

              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>
                    {biometricType === 'Face ID' ? '👤' : '👆'}
                  </Text>
                  <View>
                    <Text style={styles.menuText}>{biometricType}</Text>
                    <Text style={styles.menuSubtext}>
                      {biometricEnabled ? 'Activado' : 'Desactivado'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#374151', true: '#059669' }}
                  thumbColor={biometricEnabled ? '#10b981' : '#6b7280'}
                  ios_backgroundColor="#374151"
                />
              </View>

              {biometricEnabled && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                  <Text style={styles.infoText}>
                    Podrás iniciar sesión usando {biometricType} sin necesidad de ingresar tu
                    contraseña
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Aplicación Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aplicación</Text>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>ℹ️</Text>
                <Text style={styles.menuText}>Versión</Text>
              </View>
              <Text style={styles.menuValue}>3.0.0</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>🏢</Text>
                <Text style={styles.menuText}>Inmobiliaria Movil</Text>
              </View>
              <Text style={styles.menuValue}>Oficial</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
            <LinearGradient
              colors={['#dc2626', '#b91c1c']}
              style={styles.logoutButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Sistema de Gestión Inmobiliaria
            </Text>
            <Text style={styles.footerSubtext}>
              © 2025 Todos los derechos reservados
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  menuSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  menuValue: {
    fontSize: 14,
    color: '#9ca3af',
  },
  menuArrow: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#4b5563',
  },
});
