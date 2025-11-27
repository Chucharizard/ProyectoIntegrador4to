import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ navigation, route }) {
  const [region, setRegion] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recibir coordenadas iniciales si existen
  const initialLocation = route.params?.location;

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la ubicación');
        navigation.goBack();
        return;
      }

      let location;
      if (initialLocation) {
        // Usar ubicación pasada como parámetro
        location = initialLocation;
      } else {
        // Obtener ubicación actual
        const currentLocation = await Location.getCurrentPositionAsync({});
        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
      }

      const initialRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(initialRegion);
      setMarkerPosition(location);
      setLoading(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
      navigation.goBack();
    }
  };

  const handleMapPress = (event) => {
    setMarkerPosition(event.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    if (markerPosition) {
      // Devolver la ubicación seleccionada a la pantalla anterior
      if (route.params?.onSelectLocation) {
        route.params.onSelectLocation(markerPosition);
      }
      navigation.goBack();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newPosition = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setMarkerPosition(newPosition);
      setRegion({
        ...newPosition,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  if (loading || !region) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Seleccionar Ubicación</Text>
        <TouchableOpacity onPress={handleConfirm}>
          <Text style={styles.confirmButton}>Confirmar ✓</Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {markerPosition && (
          <Marker
            coordinate={markerPosition}
            draggable
            onDragEnd={(e) => setMarkerPosition(e.nativeEvent.coordinate)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerIcon}>📍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {markerPosition && (
        <View style={styles.coordinatesCard}>
          <Text style={styles.coordinatesTitle}>Coordenadas seleccionadas:</Text>
          <Text style={styles.coordinatesText}>
            Lat: {markerPosition.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordinatesText}>
            Lng: {markerPosition.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={getCurrentLocation}
      >
        <Text style={styles.myLocationText}>📍 Mi ubicación</Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          💡 Toca el mapa o arrastra el marcador para seleccionar la ubicación
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    fontSize: 40,
  },
  coordinatesCard: {
    position: 'absolute',
    top: 80,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  coordinatesText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(33, 33, 33, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});
