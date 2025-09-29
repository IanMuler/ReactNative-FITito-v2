import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";
import { useTrainingDayList } from "@/features/training-days";
import type { TrainingDay } from "@/features/training-days/types";
import { useWeekSchedule } from "@/features/routines";

const AssignTrainingDayScreen = () => {
  const router = useRouter();
  const { dayName } = useLocalSearchParams();

  /* Load real training days */
  const { trainingDays, isLoading, error, refreshing, onRefresh } = useTrainingDayList();
  const { assignTrainingDayToDay } = useWeekSchedule();

  const assignTrainingDay = async (trainingDay: TrainingDay) => {
    // Assign the training day to the day of the week
    await assignTrainingDayToDay(dayName as string, trainingDay.id);
    
    // Navigate to configuration
    router.push({
      pathname: "/(tabs)/rutina/configurar-entreno",
      params: { dayName, trainingDayName: trainingDay.name },
    });
  };

  /* JSX Fragments */
  const headerSection = (
    <View style={styles.header}>
      <Text style={styles.title} testID="assign-training-day-title">
        Asignar entreno a {dayName}
      </Text>
    </View>
  );

  const loadingState = (
    <View style={styles.centered}>
      <Text style={styles.loadingText}>Cargando días de entreno...</Text>
    </View>
  );

  const errorState = (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Error al cargar días de entreno</Text>
      <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const emptyState = (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>No tienes días de entreno creados</Text>
      <Text style={styles.emptySubtext}>Ve a "Días de entreno" para crear uno</Text>
    </View>
  );

  const trainingDaysSection = (
    <ScrollView 
      contentContainerStyle={styles.scrollViewContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
        />
      }
    >
      {trainingDays.map((trainingDay) => (
        <TouchableOpacity
          key={trainingDay.id}
          style={styles.trainingDayContainer}
          onPress={() => assignTrainingDay(trainingDay)}
          testID={`training-day-${trainingDay.id}`}
        >
          <Text style={styles.trainingDayText}>{trainingDay.name}</Text>
          {trainingDay.description && (
            <Text style={styles.trainingDayDescription}>{trainingDay.description}</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={styles.container} testID="assign-training-day-screen">
        <RadialGradientBackground />
        {headerSection}
        {loadingState}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container} testID="assign-training-day-screen">
        <RadialGradientBackground />
        {headerSection}
        {errorState}
      </View>
    );
  }

  if (trainingDays.length === 0) {
    return (
      <View style={styles.container} testID="assign-training-day-screen">
        <RadialGradientBackground />
        {headerSection}
        {emptyState}
      </View>
    );
  }

  return (
    <View style={styles.container} testID="assign-training-day-screen">
      <RadialGradientBackground />
      {headerSection}
      {trainingDaysSection}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "transparent",
  },
  header: {
    marginTop: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  trainingDayContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#1F2940",
    marginBottom: 10,
  },
  trainingDayText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  trainingDayDescription: {
    color: "#A5A5A5",
    fontSize: 14,
    marginTop: 5,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2979FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    color: "#A5A5A5",
    fontSize: 14,
    textAlign: "center",
  },
});

export default AssignTrainingDayScreen;