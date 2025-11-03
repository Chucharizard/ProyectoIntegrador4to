import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [AUTH] Verificando autenticación...');
      const token = authService.getToken();
      console.log('🔑 [AUTH] Token:', token ? 'Existe' : 'No existe');
      
      if (token) {
        try {
          console.log('📡 [AUTH] Obteniendo usuario actual...');
          // Intentar obtener el usuario actual
          const currentUser = await authService.getCurrentUser();
          console.log('✅ [AUTH] Usuario obtenido:', currentUser);
          setUser(currentUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('❌ [AUTH] Error al obtener usuario:', error);
          console.error('❌ [AUTH] Response:', error.response);
          // Si falla, limpiar la sesión
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login
  const login = async (credentials) => {
    try {
      console.log('🔐 [LOGIN] Intentando login con:', credentials.nombre_usuario);
      const data = await authService.login(credentials);
      console.log('✅ [LOGIN] Respuesta del login:', data);
      
      // Guardar token
      authService.saveSession(data.access_token, data.user);
      console.log('💾 [LOGIN] Token y usuario guardados');
      
      setUser(data.user);
      setIsAuthenticated(true);
      console.log('✅ [LOGIN] Estado actualizado, user:', data.user);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [LOGIN] Error:', error);
      console.error('❌ [LOGIN] Response:', error.response);
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión',
      };
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (roleId) => {
    return user?.id_rol === roleId;
  };

  // Verificar si es broker (rol 1)
  const isBroker = () => {
    return user?.id_rol === 1;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    isBroker,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
