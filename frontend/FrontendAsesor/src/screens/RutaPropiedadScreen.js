import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { decodePolyline } from "../utils/polyline";

export default function RutaPropiedadScreen({ route, navigation }) {
  const { propiedad } = route.params;

  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener ruta usando OSRM (igual que CitaMapScreen)
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

  // Calcular distancia entre dos puntos (Haversine)
  const calculateDistance = (from, to) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const toRad = (value) => (value * Math.PI) / 180;

  useEffect(() => {
    const initMap = async () => {
      try {
        // Solicitar permisos de ubicación
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Error", "Se requieren permisos de ubicación");
          navigation.goBack();
          return;
        }

        // Obtener ubicación actual
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setCurrentLocation(currentCoords);

        // Obtener coordenadas del destino desde la propiedad
        const lat = propiedad?.direccion?.latitud_direccion;
        const lng = propiedad?.direccion?.longitud_direccion;

        if (!lat || !lng) {
          Alert.alert("Error", "Esta propiedad no tiene coordenadas registradas");
          navigation.goBack();
          return;
        }

        const destCoords = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        };
        setDestinationCoords(destCoords);

        // Calcular distancia
        const dist = calculateDistance(currentCoords, destCoords);
        setDistance(dist);

        // Obtener ruta OSRM
        const osrmRoute = await getRouteOSRM(currentCoords, destCoords);
        if (osrmRoute) {
          setRouteCoords(osrmRoute);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error inicializando mapa:", error);
        Alert.alert("Error", "No se pudo cargar el mapa");
        setLoading(false);
      }
    };

    initMap();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Cargando ruta...</Text>
      </View>
    );
  }

  if (!currentLocation || !destinationCoords) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>No se pudo obtener la ubicación</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.mapa}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
      >
        {/* Marcador de ubicación actual */}
        <Marker
          coordinate={currentLocation}
          title="Mi Ubicación"
          pinColor="blue"
        />

        {/* Marcador de la propiedad */}
        <Marker
          coordinate={destinationCoords}
          title={propiedad.titulo_propiedad || "Propiedad"}
          description={propiedad.tipo_propiedad}
          pinColor="red"
        />

        {/* Ruta */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#10b981"
          />
        )}
      </MapView>

      {/* Panel de información */}
      <View style={styles.infoPanel}>
        <Text style={styles.propertyTitle}>
          {propiedad.titulo_propiedad || "Propiedad"}
        </Text>
        <Text style={styles.propertyType}>{propiedad.tipo_propiedad}</Text>
        {distance !== null && (
          <Text style={styles.distanceText}>
            📍 Distancia: {distance < 1
              ? `${(distance * 1000).toFixed(0)} metros`
              : `${distance.toFixed(2)} km`}
          </Text>
        )}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  mapa: {
    flex: 1
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827"
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20
  },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1f2937",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  propertyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4
  },
  propertyType: {
    color: "#10b981",
    fontSize: 16,
    marginBottom: 8
  },
  distanceText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 12
  },
  backButton: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});
