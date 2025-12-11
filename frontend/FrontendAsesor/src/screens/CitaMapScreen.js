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
import { decodePolyline } from '../utils/polyline';

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

  // NUEVO: ruta verdadera por las calles
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    initMap();
  }, []);

  useEffect(() => {
    if (currentLocation && destinationCoords) {
      const interval = setInterval(() => {
        checkProximity();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentLocation, destinationCoords]);


  // 🚀 NUEVO: obtener ruta OSRM entre dos puntos
  const getRouteOSRM = async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) return null;

      const polyline = data.routes[0].geometry;
      return decodePolyline(polyline);
    } catch (error) {
      console.error("Error obteniendo ruta OSRM:", error);
      return null;
    }
  };


  const initMap = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        navigation.goBack();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const currentCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setCurrentLocation(currentCoords);

      let destCoords;

      if (latitude && longitude) {
        destCoords = { latitude, longitude };
      } else if (citaId) {
        const cita = await citaService.getCitaById(citaId);
        const propiedad = await propertyService.getPropertyById(cita.id_propiedad);

        const lat = propiedad?.direccion?.latitud_direccion || propiedad?.latitud_direccion;
        const lng = propiedad?.direccion?.longitud_direccion || propiedad?.longitud_direccion;

        if (!lat || !lng) {
          Alert.alert('Error', 'La propiedad no tiene coordenadas');
          navigation.goBack();
          return;
        }

        destCoords = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        };
      }

      setDestinationCoords(destCoords);

      const dist = calculateDistance(currentCoords, destCoords);
      setDistance(dist);

      // ⭐ NUEVO: Obtener ruta REAL
      const osrmRoute = await getRouteOSRM(currentCoords, destCoords);
      if (osrmRoute) {
        setRouteCoords(osrmRoute);
      }

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

      checkProximity(currentCoords, destCoords, dist);

    } catch (error) {
      console.error('Error al inicializar mapa:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoading(false);
    }
  };


  const calculateDistance = (from, to) => {
    const R = 6371;
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const toRad = (value) => (value * Math.PI) / 180;


  const checkProximity = (currentLoc = currentLocation, destLoc = destinationCoords, dist = distance) => {
    if (!currentLoc || !destLoc || checkingProximity) return;
    setCheckingProximity(true);

    if (dist < 0.1) {
      Alert.alert('🎯 ¡Has llegado!', 'Estás en la ubicación de la cita');
    } else if (dist < 0.5) {
      Alert.alert('📍 Cerca del destino', `A ${(dist * 1000).toFixed(0)} metros`);
    }

    setTimeout(() => setCheckingProximity(false), 2000);
  };


  const handleRefreshLocation = async () => {
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

      // Refrescar ruta
      const osrmRoute = await getRouteOSRM(newCoords, destinationCoords);
      if (osrmRoute) {
        setRouteCoords(osrmRoute);
      }
    }
  };


  const handleOpenGoogleMaps = () => {
    if (!destinationCoords) return;

    const lat = destinationCoords.latitude;
    const lng = destinationCoords.longitude;
    const label = encodeURIComponent(titulo || "Destino");

    const url = Platform.select({
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      ios: `maps:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });

    Linking.openURL(url);
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
          {destinationCoords && (
            <Marker
              coordinate={destinationCoords}
              title={titulo || "Propiedad"}
              description="Ubicación de la cita"
              pinColor="#ef4444"
            />
          )}

          {/* 🚀 RUTA REAL */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#10b981"
              strokeWidth={6}
            />
          )}
        </MapView>
      )}

      <View style={styles.infoPanel}>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceLabel}>Distancia al destino:</Text>
          <Text style={styles.distanceValue}>
            {distance
              ? distance < 1
                ? `${(distance * 1000).toFixed(0)} m`
                : `${distance.toFixed(2)} km`
              : "Calculando..."}
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.btnRefresh} onPress={handleRefreshLocation}>
            <Text style={styles.btnText}>🔄 Actualizar</Text>
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
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 12,
    fontSize: 16
  },
  map: { flex: 1 },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1f2937",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  distanceContainer: { marginBottom: 16 },
  distanceLabel: { color: "#9ca3af", fontSize: 14 },
  distanceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10b981"
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12
  },
  btnRefresh: {
    flex: 1,
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  btnNavigate: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  btnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600"
  }
});

export default CitaMapScreen;
