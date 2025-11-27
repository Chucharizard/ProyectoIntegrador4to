import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import citaService from '../services/citaService';
import propertyService from '../services/propertyService';
import clienteService from '../services/clienteService';

const CitaDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { citaId } = route.params;

  const [cita, setCita] = useState(null);
  const [propiedad, setPropiedad] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  useEffect(() => {
    loadCitaDetail();
  }, [citaId]);

  const loadCitaDetail = async () => {
    try {
      setLoading(true);
      const citaData = await citaService.getCitaById(citaId);
      console.log('📋 Cita cargada:', citaData);
      setCita(citaData);

      // Cargar datos de la propiedad
      if (citaData.id_propiedad) {
        try {
          const propiedadData = await propertyService.getPropertyById(citaData.id_propiedad);
          console.log('🏠 Propiedad cargada:', JSON.stringify(propiedadData, null, 2));
          setPropiedad(propiedadData);
        } catch (error) {
          console.error('Error al cargar propiedad:', error);
        }
      }

      // Cargar datos del cliente
      if (citaData.ci_cliente) {
        try {
          const clienteData = await clienteService.getClienteByCi(citaData.ci_cliente);
          console.log('� Cliente cargado:', clienteData);
          setCliente(clienteData);
        } catch (error) {
          console.error('Error al cargar cliente:', error);
        }
      }
    } catch (error) {
      console.error('Error al cargar cita:', error);
      Alert.alert('Error', 'No se pudo cargar la cita');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarNota = async () => {
    if (!nuevaNota.trim()) {
      Alert.alert('Atención', 'Escribe una nota antes de guardar');
      return;
    }

    try {
      setGuardandoNota(true);
      await citaService.agregarNota(citaId, nuevaNota.trim());
      setNuevaNota('');
      await loadCitaDetail();
      Alert.alert('✅ Nota guardada', 'La nota se agregó correctamente');
    } catch (error) {
      console.error('Error al agregar nota:', error);
      Alert.alert('Error', 'No se pudo guardar la nota');
    } finally {
      setGuardandoNota(false);
    }
  };

  const handleCambiarEstado = (nuevoEstado) => {
    Alert.alert(
      'Cambiar estado',
      `¿Confirmas cambiar el estado a "${nuevoEstado}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await citaService.actualizarCita(citaId, { estado_cita: nuevoEstado });
              await loadCitaDetail();
              Alert.alert('✅ Estado actualizado', `La cita está ahora en estado "${nuevoEstado}"`);
            } catch (error) {
              console.error('Error al cambiar estado:', error);
              Alert.alert('Error', 'No se pudo cambiar el estado');
            }
          }
        }
      ]
    );
  };

  const handleMarcarCompletada = () => {
    Alert.prompt(
      'Marcar como completada',
      '¿Cómo fue la visita? (opcional)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async (texto) => {
            try {
              await citaService.marcarComoCompletada(citaId, texto || 'Visita completada');
              await loadCitaDetail();
              Alert.alert('✅ Cita completada', 'La cita se marcó como realizada');
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo marcar como completada');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleVerMapa = () => {
    // Verificar coordenadas en propiedad.direccion
    const lat = propiedad?.direccion?.latitud_direccion || propiedad?.latitud_direccion;
    const lng = propiedad?.direccion?.longitud_direccion || propiedad?.longitud_direccion;
    
    if (!lat || !lng) {
      // Mostrar estructura completa en el alert para debugging
      const debug = `
Propiedad ID: ${propiedad?.id_propiedad || 'N/A'}
Tiene direccion: ${propiedad?.direccion ? 'SÍ' : 'NO'}
Lat direccion: ${propiedad?.direccion?.latitud_direccion || 'N/A'}
Lng direccion: ${propiedad?.direccion?.longitud_direccion || 'N/A'}
Lat directa: ${propiedad?.latitud_direccion || 'N/A'}
Lng directa: ${propiedad?.longitud_direccion || 'N/A'}
      `.trim();
      
      Alert.alert('🔍 Debug Coordenadas', debug);
      console.log('🔍 Datos completos:', JSON.stringify(propiedad, null, 2));
      return;
    }

    navigation.navigate('CitaMap', { 
      citaId,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      titulo: propiedad.titulo_propiedad || 'Propiedad'
    });
  };

  const handleAbrirEnGoogleMaps = () => {
    // Verificar coordenadas en propiedad.direccion
    const lat = propiedad?.direccion?.latitud_direccion || propiedad?.latitud_direccion;
    const lng = propiedad?.direccion?.longitud_direccion || propiedad?.longitud_direccion;
    
    if (!lat || !lng) {
      Alert.alert('Sin ubicación', 'Esta propiedad no tiene coordenadas registradas');
      return;
    }

    const label = encodeURIComponent(propiedad.titulo_propiedad || 'Cita');
    
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${label})`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    });

    Linking.openURL(url).catch(err => {
      console.error('Error al abrir maps:', err);
      Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
    });
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Programada': '#3b82f6',
      'Confirmada': '#10b981',
      'Realizada': '#6366f1',
      'Cancelada': '#ef4444',
      'No asistió': '#f59e0b'
    };
    return colores[estado] || '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Cargando cita...</Text>
      </View>
    );
  }

  if (!cita) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ No se encontró la cita</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Estado y fecha */}
        <View style={styles.section}>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(cita.estado_cita) }]}>
            <Text style={styles.estadoText}>{cita.estado_cita}</Text>
          </View>
          
          <Text style={styles.fecha}>
            📅 {formatearFecha(cita.fecha_visita_cita)}
          </Text>
        </View>

        {/* Información de la propiedad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Propiedad</Text>
          {propiedad ? (
            <>
              <Text style={styles.infoText}>{propiedad.titulo_propiedad}</Text>
              <Text style={styles.infoSecondary}>{propiedad.tipo_propiedad}</Text>
              {propiedad.direccion && (
                <>
                  <Text style={styles.infoSecondary}>
                    📍 {propiedad.direccion.calle_direccion}
                  </Text>
                  <Text style={styles.infoSecondary}>
                    {propiedad.direccion.zona_direccion && `${propiedad.direccion.zona_direccion}, `}
                    {propiedad.direccion.ciudad_direccion}
                  </Text>
                </>
              )}
              {!propiedad.direccion && (
                <Text style={styles.infoSecondary}>Sin dirección registrada</Text>
              )}
            </>
          ) : (
            <Text style={styles.infoText}>ID: {cita.id_propiedad}</Text>
          )}
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Cliente</Text>
          {cliente ? (
            <>
              <Text style={styles.infoText}>
                {cliente.nombres_completo_cliente} {cliente.apellidos_completo_cliente}
              </Text>
              <Text style={styles.infoSecondary}>CI: {cita.ci_cliente}</Text>
              {cliente.telefono_cliente && (
                <Text style={styles.infoSecondary}>📱 {cliente.telefono_cliente}</Text>
              )}
            </>
          ) : (
            <Text style={styles.infoText}>CI: {cita.ci_cliente}</Text>
          )}
        </View>

        {/* Lugar de encuentro */}
        {cita.lugar_encuentro_cita && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Lugar de encuentro</Text>
            <Text style={styles.infoText}>{cita.lugar_encuentro_cita}</Text>
          </View>
        )}

        {/* Botones de navegación */}
        {((propiedad?.direccion?.latitud_direccion && propiedad?.direccion?.longitud_direccion) || 
          (propiedad?.latitud_direccion && propiedad?.longitud_direccion)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ Navegación</Text>
            <View style={styles.botonesNavegacion}>
              <TouchableOpacity style={styles.btnMapa} onPress={handleVerMapa}>
                <Text style={styles.btnMapaText}>Ver en mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGoogleMaps} onPress={handleAbrirEnGoogleMaps}>
                <Text style={styles.btnGoogleMapsText}>Abrir en Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notas existentes */}
        {cita.nota_cita && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notas</Text>
            <View style={styles.notasContainer}>
              <Text style={styles.notasText}>{cita.nota_cita}</Text>
            </View>
          </View>
        )}

        {/* Agregar nueva nota */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ Agregar nota</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe una nota sobre esta cita..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
            value={nuevaNota}
            onChangeText={setNuevaNota}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.btnGuardarNota, guardandoNota && styles.btnDisabled]}
            onPress={handleAgregarNota}
            disabled={guardandoNota}
          >
            {guardandoNota ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.btnGuardarNotaText}>💾 Guardar nota</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Acciones de estado */}
        {cita.estado_cita !== 'Realizada' && cita.estado_cita !== 'Cancelada' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Acciones</Text>
            <View style={styles.accionesContainer}>
              {cita.estado_cita === 'Programada' && (
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => handleCambiarEstado('Confirmada')}
                >
                  <Text style={styles.btnAccionText}>✅ Confirmar cita</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.btnAccion, styles.btnCompletada]}
                onPress={handleMarcarCompletada}
              >
                <Text style={styles.btnAccionText}>✔️ Marcar como completada</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAccion, styles.btnCancelar]}
                onPress={() => {
                  Alert.prompt(
                    'Cancelar cita',
                    'Motivo de cancelación:',
                    [
                      { text: 'Cerrar', style: 'cancel' },
                      {
                        text: 'Cancelar cita',
                        style: 'destructive',
                        onPress: async (motivo) => {
                          try {
                            await citaService.cancelarCita(citaId, motivo || 'Sin motivo especificado');
                            await loadCitaDetail();
                            Alert.alert('Cita cancelada', 'La cita se canceló correctamente');
                          } catch (error) {
                            console.error('Error:', error);
                            Alert.alert('Error', 'No se pudo cancelar la cita');
                          }
                        }
                      }
                    ],
                    'plain-text'
                  );
                }}
              >
                <Text style={styles.btnAccionText}>❌ Cancelar cita</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
  errorText: {
    color: '#ef4444',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  estadoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fecha: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 4,
  },
  infoSecondary: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  botonesNavegacion: {
    gap: 12,
  },
  btnMapa: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnMapaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnGoogleMaps: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGoogleMapsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  notasContainer: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  notasText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 100,
    marginBottom: 12,
  },
  btnGuardarNota: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGuardarNotaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    backgroundColor: '#6b7280',
  },
  accionesContainer: {
    gap: 12,
  },
  btnAccion: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCompletada: {
    backgroundColor: '#10b981',
  },
  btnCancelar: {
    backgroundColor: '#ef4444',
  },
  btnAccionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CitaDetailScreen;
