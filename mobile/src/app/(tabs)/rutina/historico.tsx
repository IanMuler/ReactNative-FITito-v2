import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { DAY_NAMES } from "@/features/routines/types";
import { useLegacyHistory, HistoryExerciseCard } from "@/features/workout-history-legacy";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";

const HistoricoScreen = () => {
  /* Constants */
  const { date } = useLocalSearchParams<{ date: string }>(); // formato: DD/MM/YYYY
  const profileId = 1; // TODO: Get from profile context

  /* Parse date */
  const parsedDate = date ? new Date(date.split('/').reverse().join('-')) : new Date();
  const dayName = DAY_NAMES[parsedDate.getDay()];

  /* Request hooks */
  const { 
    dayHistory, 
    isLoading, 
    error, 
    refetch 
  } = useLegacyHistory(profileId, date || "");


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
  
  if (!hasExercises) return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <Text style={styles.title}>Histórico de {dayName} {date}</Text>
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
        <Text style={styles.title} testID="historico-title">
          Histórico de {dayName} {date}
        </Text>
        
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
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    textAlign: "center",
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