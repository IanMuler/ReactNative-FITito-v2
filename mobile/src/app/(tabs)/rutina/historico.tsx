import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { DAY_NAMES } from "@/features/routines/types";
import { useLegacyHistory, HistoryExerciseCard } from "@/features/workout-history-legacy";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";
import { useProfile } from "@/features/profile";

const HistoricoScreen = () => {
  /* Constants */
  const { date } = useLocalSearchParams<{ date: string }>(); // formato: DD/MM/YYYY
  const { profileId } = useProfile();

  /* Parse date */
  const parsedDate = date
    ? (() => {
        const [day, month, year] = date.split('/').map(Number);
        return new Date(year, month - 1, day); // month-1 porque enero es 0
      })()
    : new Date();
  const dayName = DAY_NAMES[parsedDate.getDay() === 0 ? 6 : parsedDate.getDay() - 1];

  /* Check if date is today */
  const today = new Date();
  const isToday =
    parsedDate.getDate() === today.getDate() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getFullYear() === today.getFullYear();

  /* Request hooks */
  const {
    dayHistory,
    isLoading,
    error,
    refetch,
    deleteHistory,
    isDeleting
  } = useLegacyHistory(profileId, date || "");

  /* Handlers */
  const handleDeleteHistory = () => {
    const alertTitle = isToday ? "Borrar histórico de hoy" : "Borrar histórico";
    const alertMessage = isToday
      ? "¿Estás seguro de que quieres eliminar el histórico de hoy? Esta acción no se puede deshacer."
      : `¿Estás seguro de que quieres eliminar el histórico del ${date}? Esta acción no se puede deshacer.`;

    Alert.alert(
      alertTitle,
      alertMessage,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Borrar",
          style: "destructive",
          onPress: () => {
            if (date) {
              deleteHistory(date);
            }
          }
        }
      ]
    );
  };


  /* Sub-components */

  const LoadingState = (
    <View style={styles.centeredContent}>
      <Text style={styles.loadingText}>Cargando historial...</Text>
    </View>
  );

  const ErrorState = (
    <View style={styles.centeredContent}>
      <Text style={styles.errorText}>Error al cargar el historial</Text>
      <Text style={styles.errorDetails}>{error?.message}</Text>
    </View>
  );

  const EmptyState = (
    <View style={styles.centeredContent}>
      <Text style={styles.emptyText}>📝 No hay entrenamientos registrados</Text>
      <Text style={styles.emptyDescription}>
        Para este día no se encontraron entrenamientos completados.
      </Text>
    </View>
  );

  /* Conditional rendering */
  if (isLoading) return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <Text style={styles.title}>Histórico de {dayName} {date}</Text>
      {LoadingState}
    </View>
  );

  if (error) return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <Text style={styles.title}>Histórico de {dayName} {date}</Text>
      {ErrorState}
    </View>
  );

  /* Check if we have exercises to display */
  const hasExercises = dayHistory && dayHistory.length > 0 && dayHistory[0]?.exerciseDetails?.length > 0;
  const hasHistoryRecord = dayHistory && dayHistory.length > 0;

  if (!hasExercises) return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Histórico de {dayName} {date}</Text>

        {hasHistoryRecord && (
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteHistory}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Borrando...' : isToday ? '🗑️ Borrar histórico de hoy' : '🗑️ Borrar histórico'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {EmptyState}
    </View>
  );

  return (
    <View style={styles.container} testID="historico-screen">
      <RadialGradientBackground />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#FFFFFF"
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title} testID="historico-title">
            Histórico de {dayName} {date}
          </Text>

          {hasExercises && (
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDeleteHistory}
              disabled={isDeleting}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Borrando...' : isToday ? '🗑️ Borrar histórico de hoy' : '🗑️ Borrar histórico'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.exercisesSection}>
          {dayHistory[0]?.exerciseDetails.map((exercise, index) => (
            <HistoryExerciseCard
              key={index}
              exercise={exercise}
              testID={`historico-exercise-card-${index}`}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "transparent",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 15,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#FF5252",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteButtonDisabled: {
    backgroundColor: "#A5A5A5",
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Exercises section
  exercisesSection: {
    marginTop: 10,
  },

  // State styles
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  errorDetails: {
    color: "#A5A5A5",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
  },
  emptyDescription: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default HistoricoScreen;