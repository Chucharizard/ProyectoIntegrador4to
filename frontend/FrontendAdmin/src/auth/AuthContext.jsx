import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Verificar si hay sesión al cargar - CON AbortController
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const checkAuth = async () => {
      console.log('🔍 [AUTH] Verificando autenticación...');
      const token = authService.getToken();
      console.log('🔑 [AUTH] Token:', token ? 'Existe' : 'No existe');
      
      if (token) {
        try {
          console.log('📡 [AUTH] Obteniendo usuario actual...');
          // ✅ Pasar signal a la petición
          const currentUser = await authService.getCurrentUser(controller.signal);
          console.log('✅ [AUTH] Usuario obtenido:', currentUser);
          
          if (isMounted) {
            setUser(currentUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // ✅ Ignorar errores de cancelación
          if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
            console.log('🚫 [AUTH] Petición cancelada');
            return;
          }

          console.error('❌ [AUTH] Error al obtener usuario:', error);
          console.error('❌ [AUTH] Response:', error.response);
          
          // Si falla, limpiar la sesión solo si el componente está montado
          if (isMounted) {
            authService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      controller.abort();
    };
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
      
      // ✅ Limpiar cualquier sesión parcial en caso de error
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión',
      };
    }
  };

  // Logout
  const logout = () => {
    console.log('🚪 [LOGOUT] Cerrando sesión');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // ✅ Verificar si el usuario tiene un rol específico (con validación)
  const hasRole = (roleId) => {
    if (!user || !user.id_rol) return false;
    return user.id_rol === roleId;
  };

  // ✅ Verificar si es broker (rol 1)
  const isBroker = () => {
    return hasRole(1);
  };

  // ✅ Verificar si es secretaria (asumiendo rol 2)
  const isSecretaria = () => {
    return hasRole(2);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    isBroker,
    isSecretaria,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// ✅ Exportar todo junto al final
// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth };
export default AuthContext;
