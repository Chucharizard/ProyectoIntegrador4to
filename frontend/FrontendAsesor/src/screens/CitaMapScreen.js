import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRoute, useNavigation } from '@react-navigation/native';
import citaService from '../services/citaService';
import propertyService from '../services/propertyService';

const CitaMapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { citaId, latitude, longitude, titulo } = route.params || {};

  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);
  const [checkingProximity, setCheckingProximity] = useState(false);

  useEffect(() => {
    initMap();
  }, []);

  useEffect(() => {
    // Verificar proximidad cada 30 segundos
    if (currentLocation && destinationCoords) {
      const interval = setInterval(() => {
        checkProximity();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [currentLocation, destinationCoords]);

  const initMap = async () => {
    try {
      setLoading(true);

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para mostrar el mapa');
        navigation.goBack();
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const currentCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setCurrentLocation(currentCoords);

      // Obtener coordenadas de destino
      let destCoords;
      if (latitude && longitude) {
        destCoords = { latitude, longitude };
      } else if (citaId) {
        // Cargar desde la cita
        const cita = await citaService.getCitaById(citaId);
        const propiedad = await propertyService.getPropertyById(cita.id_propiedad);
        
        // Verificar coordenadas en propiedad.direccion o propiedad directamente
        const lat = propiedad?.direccion?.latitud_direccion || propiedad?.latitud_direccion;
        const lng = propiedad?.direccion?.longitud_direccion || propiedad?.longitud_direccion;
        
        if (!lat || !lng) {
          Alert.alert('Error', 'La propiedad no tiene coordenadas registradas');
          console.log('🔍 Datos de propiedad:', JSON.stringify(propiedad, null, 2));
          navigation.goBack();
          return;
        }

        destCoords = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        };
      } else {
        Alert.alert('Error', 'No se especificó una ubicación de destino');
        navigation.goBack();
        return;
      }

      setDestinationCoords(destCoords);

      // Calcular distancia
      const dist = calculateDistance(currentCoords, destCoords);
      setDistance(dist);

      // Centrar el mapa para mostrar ambos puntos
      const midLat = (currentCoords.latitude + destCoords.latitude) / 2;
      const midLon = (currentCoords.longitude + destCoords.longitude) / 2;
      const latDelta = Math.abs(currentCoords.latitude - destCoords.latitude) * 2.5;
      const lonDelta = Math.abs(currentCoords.longitude - destCoords.longitude) * 2.5;

      setRegion({
        latitude: midLat,
        longitude: midLon,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lonDelta, 0.01)
      });

      // Verificar proximidad inicial
      checkProximity(currentCoords, destCoords, dist);

    } catch (error) {
      console.error('Error al inicializar mapa:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (from, to) => {
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // en km
  };

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  const checkProximity = (currentLoc = currentLocation, destLoc = destinationCoords, dist = distance) => {
    if (!currentLoc || !destLoc || checkingProximity) return;

    setCheckingProximity(true);

    // Alerta si está a menos de 100 metros
    if (dist < 0.1) {
      Alert.alert(
        '🎯 ¡Has llegado!',
        'Estás en la ubicación de la cita',
        [{ text: 'OK' }]
      );
    }
    // Alerta si está a menos de 500 metros
    else if (dist < 0.5) {
      Alert.alert(
        '📍 Cerca del destino',
        `Estás a ${(dist * 1000).toFixed(0)} metros de la ubicación de la cita`,
        [{ text: 'OK' }]
      );
    }
    // Alerta si NO está cerca y la cita es próxima
    else if (dist > 1) {
      console.log(`⚠️ Lejos del destino: ${dist.toFixed(2)} km`);
    }

    setTimeout(() => setCheckingProximity(false), 2000);
  };

  const handleRefreshLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setCurrentLocation(newCoords);

      if (destinationCoords) {
        const dist = calculateDistance(newCoords, destinationCoords);
        setDistance(dist);
        checkProximity(newCoords, destinationCoords, dist);
      }

      Alert.alert('✅ Ubicación actualizada', `Distancia al destino: ${(distance * 1000).toFixed(0)}m`);
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      Alert.alert('Error', 'No se pudo actualizar la ubicación');
    }
  };

  const handleOpenGoogleMaps = () => {
    if (!destinationCoords) return;

    const lat = destinationCoords.latitude;
    const lng = destinationCoords.longitude;
    const label = encodeURIComponent(titulo || 'Destino');
    
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${label})`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });

    Linking.openURL(url).catch(err => {
      console.error('Error al abrir maps:', err);
      Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Marcador de destino (propiedad) */}
          {destinationCoords && (
            <Marker
              coordinate={destinationCoords}
              title={titulo || 'Propiedad'}
              description="Ubicación de la cita"
              pinColor="#ef4444"
            />
          )}

          {/* Línea recta entre ubicación actual y destino */}
          {currentLocation && destinationCoords && (
            <Polyline
              coordinates={[currentLocation, destinationCoords]}
              strokeColor="#3b82f6"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          )}
        </MapView>
      )}

      {/* Panel de información */}
      <View style={styles.infoPanel}>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceLabel}>Distancia al destino:</Text>
          <Text style={styles.distanceValue}>
            {distance ? (distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`) : 'Calculando...'}
          </Text>
        </View>

        {distance && distance > 1 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Estás lejos del lugar de la cita
            </Text>
          </View>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.btnRefresh} onPress={handleRefreshLocation}>
            <Text style={styles.btnText}>🔄 Actualizar ubicación</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnNavigate} onPress={handleOpenGoogleMaps}>
            <Text style={styles.btnText}>🗺️ Navegar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f2937',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  distanceContainer: {
    marginBottom: 16,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  warningBox: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnRefresh: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnNavigate: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CitaMapScreen;
