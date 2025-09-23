import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiasEntrenoScreen() {
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Días de Entreno</Text>
          <Text style={styles.subtitle}>Hoy es {today}</Text>
        </View>

        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>🚶 Entrenamientos Placeholder</Text>
          <Text style={styles.placeholderText}>
            Aquí podrás:
          </Text>
          <Text style={styles.placeholderList}>
            • Iniciar una sesión de entrenamiento{'\n'}
            • Ver el calendario de entrenamientos{'\n'}
            • Registrar sets y repeticiones{'\n'}
            • Seguir rutinas predefinidas{'\n'}
            • Ver progreso y estadísticas
          </Text>
          
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>Entrenamiento de Hoy</Text>
            <Text style={styles.mockCardSubtitle}>Push Day - Pecho y Hombros</Text>
            <Text style={styles.mockCardInfo}>📅 Programado para hoy • 60 min</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pendiente</Text>
            </View>
          </View>

          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>Último Entrenamiento</Text>
            <Text style={styles.mockCardSubtitle}>Pull Day - Espalda y Bíceps</Text>
            <Text style={styles.mockCardInfo}>📅 Hace 2 días • 55 min completado</Text>
            <View style={[styles.statusBadge, styles.completedBadge]}>
              <Text style={styles.statusText}>Completado</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Estadísticas de la Semana</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Entrenamientos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2.5h</Text>
              <Text style={styles.statLabel}>Tiempo Total</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A5A5A5',
    textTransform: 'capitalize',
  },
  placeholderContainer: {
    backgroundColor: '#1a1f2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#A5A5A5',
    marginBottom: 10,
  },
  placeholderList: {
    fontSize: 14,
    color: '#A5A5A5',
    lineHeight: 22,
    marginBottom: 20,
  },
  mockCard: {
    backgroundColor: '#252a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  mockCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  mockCardSubtitle: {
    fontSize: 14,
    color: '#0a7ea4',
    marginBottom: 5,
  },
  mockCardInfo: {
    fontSize: 12,
    color: '#A5A5A5',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  completedBadge: {
    backgroundColor: '#27ae60',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    backgroundColor: '#1a1f2e',
    borderRadius: 15,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#A5A5A5',
  },
});