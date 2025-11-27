import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import imageService from '../services/imageService';
import { getImageUrl } from '../config';

const { width } = Dimensions.get('window');
const imageSize = (width - 45) / 3; // 3 columnas con márgenes

export default function GalleryScreen({ navigation, route }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const idPropiedad = route.params?.idPropiedad;
  const tituloPropiedad = route.params?.tituloPropiedad || 'Galería';

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const result = await imageService.getImagesByPropiedad(idPropiedad);
    setLoading(false);
    setRefreshing(false);

    if (result.success) {
      // Ordenar por orden_imagen
      const sortedImages = result.data.sort((a, b) => a.orden_imagen - b.orden_imagen);
      setImages(sortedImages);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadImages();
  };

  const renderImage = ({ item, index }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => {
        // Aquí podrías abrir un modal con la imagen en grande
        Alert.alert(
          'Imagen',
          `Orden: ${item.orden_imagen + 1}\n${item.es_portada_imagen ? '⭐ Portada' : ''}`,
          [
            { text: 'OK' },
          ]
        );
      }}
    >
      <Image
        source={{ uri: getImageUrl(item.url_imagen) }}
        style={styles.image}
        resizeMode="cover"
      />
      {item.es_portada_imagen && (
        <View style={styles.portadaBadge}>
          <Text style={styles.portadaText}>⭐ Portada</Text>
        </View>
      )}
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{item.orden_imagen + 1}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando imágenes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Galería de Fotos</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {tituloPropiedad}
        </Text>
        <Text style={styles.count}>
          {images.length} foto{images.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item) => item.id_imagen}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>
              No hay fotos para esta propiedad
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Camera', { idPropiedad, tituloPropiedad })}
            >
              <Text style={styles.addButtonText}>📸 Agregar fotos</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {images.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('Camera', { idPropiedad, tituloPropiedad })}
        >
          <Text style={styles.floatingButtonText}>+ Agregar más fotos</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  count: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  grid: {
    padding: 5,
  },
  imageContainer: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  portadaBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(255, 193, 7, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  portadaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
