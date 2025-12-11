import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { configurarListenersNotificaciones } from './src/services/notificationService';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Configurar listeners de notificaciones
    const cleanup = configurarListenersNotificaciones({
      navigate: (screen, params) => {
        if (navigationRef.current) {
          navigationRef.current.navigate(screen, params);
        }
      }
    });

    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator ref={navigationRef} />
    </AuthProvider>
  );
}
