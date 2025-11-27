import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import imageService from '../services/imageService';

export default function CameraScreen({ navigation, route }) {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Obtener ID y título de la propiedad desde la navegación
  const idPropiedad = route.params?.idPropiedad || '8946a4a8-b9f7-4495-b2c5-5cef56645480';
  const tituloPropiedad = route.params?.tituloPropiedad || 'Propiedad sin nombre';

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Permisos de cámara
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
      return;
    }

    // Permisos de ubicación
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la ubicación para agregar GPS a las fotos');
      return;
    }

    // Obtener ubicación actual
    try {
      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        };
        setImages([...images, newImage]);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `gallery_${Date.now()}_${index}.jpg`,
        }));
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error seleccionando imágenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const uploadImages = async () => {
    if (images.length === 0) {
      Alert.alert('Sin imágenes', 'Por favor captura al menos una foto');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const result = await imageService.uploadImages(idPropiedad, images, location);
    
    setUploading(false);
    setUploadProgress(100);

    if (result.success) {
      Alert.alert(
        '¡Éxito! 🎉',
        `${result.data.mensaje}\n\n📸 Total: ${result.data.imagenes.length} imagen(es) subidas\n🏠 ${tituloPropiedad}`,
        [
          {
            text: 'Ver más propiedades',
            onPress: () => {
              setImages([]);
              navigation.navigate('Properties');
            },
          },
          {
            text: 'Tomar más fotos',
            onPress: () => setImages([]),
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Subir Fotos</Text>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {tituloPropiedad}
        </Text>
      </View>

      {location && (
        <TouchableOpacity 
          style={styles.locationBadge}
          onPress={Platform.OS !== 'web' ? () => navigation.navigate('Map', {
            location,
            onSelectLocation: (newLocation) => setLocation(newLocation)
          }) : undefined}
          disabled={Platform.OS === 'web'}
        >
          <View style={styles.locationContent}>
            <Text style={styles.locationText}>
              📍 GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {Platform.OS !== 'web' && (
              <Text style={styles.locationEdit}>Editar ✎</Text>
            )}
          </View>
        </TouchableOpacity>
      )}

      {images.length > 0 && (
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            📸 {images.length} foto{images.length !== 1 ? 's' : ''} seleccionada{images.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {images.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>
              No hay fotos aún. Captura o selecciona imágenes.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={pickFromGallery}
          disabled={uploading}
        >
          <Text style={styles.buttonSecondaryText}>📁 Galería</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={takePhoto}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>📸 Cámara</Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={uploadImages}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>
              ⬆️ Subir {images.length} foto(s)
            </Text>
          )}
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
  propertyTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  locationBadge: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    margin: 15,
    borderRadius: 8,
  },
  locationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#1976d2',
    flex: 1,
  },
  locationEdit: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 10,
  },
  counterBadge: {
    backgroundColor: '#fff3e0',
    padding: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  counterText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  imageWrapper: {
    width: '48%',
    margin: '1%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
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
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    margin: 15,
    padding: 18,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#999',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
