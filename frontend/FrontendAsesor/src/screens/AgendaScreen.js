import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import citaService from '../services/citaService';

const AgendaScreen = () => {
  const navigation = useNavigation();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Programada');

  const estados = ['Todas', 'Programada', 'Confirmada', 'Realizada', 'Cancelada'];

  const loadCitas = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filtroEstado !== 'Todas') {
        filters.estado = filtroEstado;
      }
      
      const data = await citaService.getMisCitas(filters);
      setCitas(data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCitas();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadCitas();
    }, [filtroEstado])
  );

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const opciones = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Programada': '#3b82f6', // azul
      'Confirmada': '#10b981', // verde
      'Realizada': '#6366f1', // índigo
      'Cancelada': '#ef4444', // rojo
      'No asistió': '#f59e0b' // ámbar
    };
    return colores[estado] || '#6b7280';
  };

  const esCitaProxima = (fechaISO) => {
    const fechaCita = new Date(fechaISO);
    const ahora = new Date();
    const diferencia = fechaCita - ahora;
    
    // Menos de 2 horas
    return diferencia > 0 && diferencia < 2 * 60 * 60 * 1000;
  };

  const renderCitaCard = ({ item }) => {
    const estadoColor = getEstadoColor(item.estado_cita);
    const esProxima = esCitaProxima(item.fecha_visita_cita);

    return (
      <TouchableOpacity
        style={[styles.citaCard, esProxima && styles.citaProxima]}
        onPress={() => navigation.navigate('CitaDetail', { citaId: item.id_cita })}
        activeOpacity={0.7}
      >
        {/* Barra lateral de color según estado */}
        <View style={[styles.estadoBarra, { backgroundColor: estadoColor }]} />
        
        <View style={styles.citaContent}>
          {/* Fecha y hora */}
          <View style={styles.citaHeader}>
            <Text style={styles.citaFecha}>
              📅 {formatearFecha(item.fecha_visita_cita)}
            </Text>
            {esProxima && (
              <View style={styles.proximaBadge}>
                <Text style={styles.proximaText}>🔔 Próxima</Text>
              </View>
            )}
          </View>

          {/* Propiedad */}
          <Text style={styles.citaPropiedad} numberOfLines={1}>
            🏠 Propiedad: {item.id_propiedad}
          </Text>

          {/* Cliente */}
          <Text style={styles.citaCliente} numberOfLines={1}>
            👤 Cliente: {item.ci_cliente}
          </Text>

          {/* Lugar de encuentro */}
          {item.lugar_encuentro_cita && (
            <Text style={styles.citaLugar} numberOfLines={1}>
              📍 {item.lugar_encuentro_cita}
            </Text>
          )}

          {/* Estado */}
          <View style={styles.citaFooter}>
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
              <Text style={styles.estadoText}>{item.estado_cita}</Text>
            </View>

            {/* Botones de acción rápida */}
            {item.estado_cita === 'Programada' && (
              <TouchableOpacity
                style={styles.verMapaBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('CitaMap', { citaId: item.id_cita });
                }}
              >
                <Text style={styles.verMapaText}>🗺️ Ver mapa</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Cargando agenda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con filtros */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Mi Agenda</Text>
        <Text style={styles.subtitle}>{citas.length} citas</Text>
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtrosContainer}>
        <FlatList
          horizontal
          data={estados}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filtroBtn,
                filtroEstado === item && styles.filtroActivo
              ]}
              onPress={() => setFiltroEstado(item)}
            >
              <Text
                style={[
                  styles.filtroText,
                  filtroEstado === item && styles.filtroTextoActivo
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista de citas */}
      {citas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No hay citas {filtroEstado !== 'Todas' ? `en estado "${filtroEstado}"` : ''}</Text>
        </View>
      ) : (
        <FlatList
          data={citas}
          renderItem={renderCitaCard}
          keyExtractor={(item) => item.id_cita}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10b981']}
              tintColor="#10b981"
            />
          }
        />
      )}
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
  header: {
    padding: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  filtrosContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  filtroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 8,
  },
  filtroActivo: {
    backgroundColor: '#10b981',
  },
  filtroText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  filtroTextoActivo: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  citaCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  citaProxima: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  estadoBarra: {
    width: 6,
  },
  citaContent: {
    flex: 1,
    padding: 16,
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  citaFecha: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  proximaBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proximaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  citaPropiedad: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 6,
  },
  citaCliente: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 6,
  },
  citaLugar: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  citaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verMapaBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verMapaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default AgendaScreen;
