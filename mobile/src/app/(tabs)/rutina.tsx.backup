import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RutinaScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Rutinas</Text>
          <Text style={styles.subtitle}>Gestiona tus rutinas de ejercicio</Text>
        </View>

        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>🗓️ Rutinas Placeholder</Text>
          <Text style={styles.placeholderText}>
            Aquí podrás:
          </Text>
          <Text style={styles.placeholderList}>
            • Crear nuevas rutinas{'\n'}
            • Editar rutinas existentes{'\n'}
            • Organizar ejercicios por días{'\n'}
            • Duplicar rutinas favoritas{'\n'}
            • Ver historial de entrenamientos
          </Text>
          
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>Rutina de Ejemplo</Text>
            <Text style={styles.mockCardSubtitle}>Push - Pecho, Hombros, Tríceps</Text>
            <Text style={styles.mockCardInfo}>6 ejercicios • 45-60 min</Text>
          </View>

          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>Rutina de Ejemplo 2</Text>
            <Text style={styles.mockCardSubtitle}>Pull - Espalda, Bíceps</Text>
            <Text style={styles.mockCardInfo}>5 ejercicios • 40-50 min</Text>
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
  },
});