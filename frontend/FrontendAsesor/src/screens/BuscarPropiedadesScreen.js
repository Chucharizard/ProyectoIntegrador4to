import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import propertyService from '../services/propertyService';
import { useNavigation } from '@react-navigation/native';

export default function BuscarPropiedadesScreen() {
  const navigation = useNavigation();

  const [propiedades, setPropiedades] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getPropiedades();
      
      // Asegurar que siempre trabajamos con un array
      let lista = [];
      if (Array.isArray(data)) {
        lista = data;
      } else if (data && Array.isArray(data.items)) {
        lista = data.items;
      } else if (data && typeof data === 'object') {
        // Si es objeto pero no tiene items, intenta extraer valores si son arrays
        const values = Object.values(data).find(v => Array.isArray(v));
        lista = values || [];
      }
      
      console.log(`✅ ${lista.length} propiedades cargadas`);
      setPropiedades(lista);
      setFiltradas(lista);
    } catch (err) {
      console.error("❌ Error cargando propiedades:", err);
      setPropiedades([]);
      setFiltradas([]);
      alert("Error al cargar propiedades. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const filtrar = (text) => {
    setBusqueda(text);

    // Asegurar que propiedades es un array
    const lista = Array.isArray(propiedades) ? propiedades : [];

    if (!text.trim()) {
      setFiltradas(lista);
      return;
    }

    const filtro = text.toLowerCase();
    const resultado = lista.filter((p) =>
      p.titulo_propiedad?.toLowerCase().includes(filtro) ||
      p.tipo_propiedad?.toLowerCase().includes(filtro) ||
      p.codigo_publico_propiedad?.toLowerCase().includes(filtro)
    );

    setFiltradas(resultado);
  };

  const abrirRuta = (item) => {
    const lat = item?.direccion?.latitud_direccion;
    const lng = item?.direccion?.longitud_direccion;

    if (!lat || !lng) {
      alert("Esta propiedad no tiene coordenadas registradas.");
      return;
    }

    navigation.navigate("RutaPropiedad", { propiedad: item });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando propiedades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar Propiedades</Text>

      <TextInput
        style={styles.input}
        placeholder="Buscar por título, tipo o código..."
        placeholderTextColor="#888"
        value={busqueda}
        onChangeText={filtrar}
      />

      <ScrollView style={styles.list}>
        {filtradas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron propiedades' : 'No hay propiedades disponibles'}
            </Text>
          </View>
        ) : (
          filtradas.map((p) => (
            <TouchableOpacity
              key={p.id_propiedad}
              style={styles.card}
              onPress={() => abrirRuta(p)}
            >
              <Text style={styles.cardTitle}>{p.titulo_propiedad || 'Sin título'}</Text>
              <Text style={styles.cardDesc}>{p.tipo_propiedad || 'Sin tipo'}</Text>

              {p.direccion && p.direccion.latitud_direccion && p.direccion.longitud_direccion ? (
                <Text style={styles.coords}>
                  📍 {p.direccion.latitud_direccion}, {p.direccion.longitud_direccion}
                </Text>
              ) : (
                <Text style={styles.noCoords}>⚠️ Sin coordenadas</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 20
  },
  title: {
    color: "#10b981",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15
  },
  input: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: "white",
    marginBottom: 12
  },
  list: { marginTop: 10 },
  card: {
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftColor: "#10b981",
    borderLeftWidth: 4
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  cardDesc: { color: "#9ca3af", marginTop: 4 },
  coords: { color: "#10b981", marginTop: 6 },
  noCoords: { color: "#ef4444", marginTop: 6 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827"
  }
});
