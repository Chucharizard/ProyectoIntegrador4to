import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>BIENVENIDO</Text>
          <Text style={styles.userName}>{user?.nombre_usuario || 'Asesor'}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Text style={styles.profileIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Agenda')}
        >
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardTitle}>Mi Agenda</Text>
          <Text style={styles.cardSubtitle}>
            Ver citas y visitas programadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BuscarPropiedades')}
        >
          <Text style={styles.cardIcon}>🧭</Text>
          <Text style={styles.cardTitle}>Buscar ruta</Text>
          <Text style={styles.cardSubtitle}>Encuentra una propiedad y ve la ruta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Properties')}
        >
          <Text style={styles.cardIcon}>🏠</Text>
          <Text style={styles.cardTitle}>Propiedades</Text>
          <Text style={styles.cardSubtitle}>
            Ver propiedades asignadas
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04432eff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#96ffe8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#04432eff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#04432eff',
  },
  userName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#96ffe8ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#96ffe8ff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#009685ff',
  },
  logoutText: {
    color: '#00134fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
