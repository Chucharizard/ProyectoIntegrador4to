import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import GalleryScreen from '../screens/GalleryScreen';
import AgendaScreen from '../screens/AgendaScreen';
import CitaDetailScreen from '../screens/CitaDetailScreen';

// Screens de mapas solo en móviles (react-native-maps no funciona en web)
const MapScreen = Platform.OS !== 'web' ? require('../screens/MapScreen').default : null;
const CitaMapScreen = Platform.OS !== 'web' ? require('../screens/CitaMapScreen').default : null;

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Properties" component={PropertiesScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
            <Stack.Screen name="Agenda" component={AgendaScreen} />
            <Stack.Screen name="CitaDetail" component={CitaDetailScreen} />
            {Platform.OS !== 'web' && MapScreen && (
              <Stack.Screen name="Map" component={MapScreen} />
            )}
            {Platform.OS !== 'web' && CitaMapScreen && (
              <Stack.Screen name="CitaMap" component={CitaMapScreen} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
