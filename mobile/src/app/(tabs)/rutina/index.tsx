import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LinearGradientItem from "@/components/ui/LinearGradientItem";
import Menu, { MenuItem } from "@/components/ui/Menu";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";
import * as Font from "expo-font";
import { useWeekSchedule } from "@/features/routines/hooks";
import type { Day } from "@/features/routines/types";
import { useProfile } from '@/features/profile';
import Toast from 'react-native-toast-message';
import { useTrainingSession } from '@/features/training-sessions/hooks/useTrainingSession';
import { useRoutineConfiguration } from '@/features/routine-configurations';
import { CreateTrainingSessionRequest } from '@/features/training-sessions/types';

const RoutineScreen = () => {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const router = useRouter();
  const { currentProfile, profileId } = useProfile();
  
  /* Business Logic */
  const {
    days,
    currentDayIndex,
    currentWeek,
    month,
    year,
    isLoading,
    isDayCompletedToday,
    toggleRestDay,
    removeRoutineFromDay,
    getCurrentRoutineWeekId,
    getCurrentRoutineWeekInfo,
    convertDayOfWeekForTrainingSession,
  } = useWeekSchedule();

  /* Training Session Logic */
  const { activeSession, createSession } = useTrainingSession(profileId);
  
  /* Current Day Configuration */
  const currentDay = days[currentDayIndex] || {};
  const currentRoutineWeekId = getCurrentRoutineWeekId(); // Get the correct routine week ID
  const { 
    configuration, 
    exercises 
  } = useRoutineConfiguration(currentRoutineWeekId, profileId);

  useEffect(() => {
    const loadIcons = async () => {
      await Font.loadAsync({
        ...Ionicons.font,
      });
      setIconsLoaded(true);
    };
    loadIcons();
  }, []);


  /* Event Handlers */
  const assignTrainingDay = (day: Day) => {
    router.push({
      pathname: "/(tabs)/rutina/asignar-entreno",
      params: { dayName: day.name },
    });
  };

  const editTrainingDay = (day: Day) => {
    router.push({
      pathname: "/(tabs)/rutina/configurar-entreno",
      params: { dayName: day.name, trainingDayName: day.trainingDayName },
    });
  };

  const removeTrainingDay = async (day: Day) => {
    console.log(`🗑️ Removing training day: ${day.name}`);
    try {
      await removeRoutineFromDay(day.name);
      console.log(`✅ Training day ${day.name} removed completely`);
    } catch (error) {
      console.error(`❌ Failed to remove training day ${day.name}:`, error);
    }
  };

  const handleDayPress = (dayIndex: number) => {
    if (isDayCompletedToday(days[dayIndex])) {
      const date = new Date();
      date.setDate(date.getDate() - (currentDayIndex - dayIndex));

      router.push({
        pathname: "/(tabs)/rutina/historico",
        params: {
          date: date.toLocaleDateString(),
        },
      });
    }
  };

  const handleStartSession = async () => {
    if (!currentProfile || !currentDay?.trainingDayName) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No hay rutina asignada para hoy',
      });
      return;
    }

    try {
      // Si ya hay una sesión activa, navegar a ella
      if (activeSession) {
        router.push("/(tabs)/rutina/sesion-de-entrenamiento");
        return;
      }

      // Verificar que hay ejercicios configurados
      if (!exercises || exercises.length === 0) {
        console.log('❌ No exercises found for session start:', {
          currentRoutineWeekId,
          exercisesArray: exercises,
          dayName: currentDay.name,
          trainingDayName: currentDay.trainingDayName
        });
        
        Toast.show({
          type: 'error',
          text1: 'No hay ejercicios configurados',
          text2: `Configura ejercicios para ${currentDay.name} antes de iniciar`,
        });
        return;
      }

      // Verificar que tenemos información de rutina válida
      const currentRoutineInfo = getCurrentRoutineWeekInfo();
      if (!currentRoutineInfo) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudo determinar la rutina para este día',
        });
        return;
      }

      // Convertir day_of_week para training_sessions (que espera 1-7 en lugar de 0-6)
      const trainingSessionDayOfWeek = convertDayOfWeekForTrainingSession(currentRoutineInfo.day_of_week);
      
      console.log('🚀 Iniciando sesión con datos:', {
        routineWeekId: currentRoutineInfo.id,
        routineWeekDayOfWeek: currentRoutineInfo.day_of_week,
        trainingSessionDayOfWeek,
        dayName: currentRoutineInfo.day_name,
        exerciseCount: exercises.length
      });

      // Crear nueva sesión usando el backend
      const sessionData: CreateTrainingSessionRequest = {
        profile_id: profileId,
        routine_week_id: currentRoutineInfo.id,
        routine_name: currentDay.trainingDayName || 'Rutina',
        day_of_week: trainingSessionDayOfWeek, // Usar el formato correcto para training_sessions
        day_name: currentDay.name,
        exercises: exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          exercise_image: exercise.exercise_image,
          sets_config: exercise.sets_config,
        })),
      };

      await createSession(sessionData);
      
      Toast.show({
        type: 'success',
        text1: 'Sesión iniciada',
        text2: '¡Comienza tu entrenamiento!',
      });

      router.push("/(tabs)/rutina/sesion-de-entrenamiento");
    } catch (error) {
      console.error('Error starting session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo iniciar la sesión',
      });
    }
  };

  /* Derived State */
  const isCurrentDayCompletedToday = isDayCompletedToday(currentDay);
  const hasExercisesConfigured = exercises && exercises.length > 0;
  const isSessionDisabled = isCurrentDayCompletedToday || !currentDay?.trainingDayName || !hasExercisesConfigured;

  /* Debug logging for completion status */
  useEffect(() => {
    if (days.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 [Rutina Index] Debug completion status:', {
        today,
        currentDayIndex,
        totalDays: days.length,
      });
      
      days.forEach((day, index) => {
        const isCompleted = isDayCompletedToday(day);
        console.log(`📅 [Rutina Index] Day ${index} (${day.name}):`, {
          completedDate: day.completedDate,
          today,
          matches: day.completedDate === today,
          isCompleted,
          rest: day.rest,
          trainingDayName: day.trainingDayName,
        });
      });
      
      console.log('🎯 [Rutina Index] Current day status:', {
        currentDay: currentDay.name,
        isCurrentDayCompletedToday,
        isSessionDisabled,
        activeSession: !!activeSession,
      });
    }
  }, [days, currentDayIndex, isDayCompletedToday, currentDay, isCurrentDayCompletedToday, isSessionDisabled, activeSession]);

  const ButtonText = currentDay.rest
    ? "Día de descanso"
    : !currentDay?.trainingDayName
      ? "No hay entrenamiento asignado"
      : !hasExercisesConfigured
        ? "No hay ejercicios configurados"
        : isCurrentDayCompletedToday
          ? "Sesión finalizada"
          : activeSession
            ? "Continuar sesión"
            : "Empezar sesión";

  /* Menu Options */
  const options = (day: Day) => [
    {
      label: day.rest ? "Día de rutina" : "Día de descanso",
      onPress: () => toggleRestDay(day),
      testID: `menu-option-toggle-rest-${day.name}`
    },
    {
      label: "Asignar entreno",
      onPress: () => assignTrainingDay(day),
      testID: `menu-option-assign-${day.name}`
    },
    ...(day.trainingDayName ? [
      {
        label: "Editar entreno",
        onPress: () => editTrainingDay(day),
        testID: `menu-option-edit-${day.name}`
      },
      {
        label: "Remover entreno",
        onPress: () => removeTrainingDay(day),
        testID: `menu-option-remove-${day.name}`
      },
    ] : [])
  ];

  /* JSX Fragments */
  const headerSection = (
    <View style={styles.header}>
      <Text style={styles.title}>Rutina</Text>
      <Text style={styles.subtitle}>
        Semana {currentWeek} - {month} {year}
      </Text>
    </View>
  );

  const floatingSettingsButton = iconsLoaded && (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => router.push("/(tabs)/rutina/management")}
      testID="button-settings"
    >
      <Ionicons name="settings" size={24} color="white" />
    </TouchableOpacity>
  );

  const sessionButton = (
    <TouchableOpacity
      style={[styles.button, isSessionDisabled && styles.disabledButton]}
      onPress={handleStartSession}
      disabled={isSessionDisabled}
      testID="button-start-session"
    >
      <Text style={styles.buttonText}>{ButtonText}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container} testID="routine-screen">
        <RadialGradientBackground />
        {headerSection}
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando rutina...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="routine-screen">
      <RadialGradientBackground />
      {headerSection}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {days.map((day, index) => (
          <LinearGradientItem
            key={index}
            styles={{
              dayContainer: styles.dayContainer,
              restDayContainer: styles.restDayContainer,
              activeContainer: styles.activeDayContainer,
            }}
            day={day}
            isActive={currentDayIndex === index}
          >
            <View style={[styles.dayInnerContainer]} testID={`day-${day.name}`}>
              <View>
                <Text
                  style={[
                    styles.dayText,
                    day.rest && styles.restDayText,
                    currentDayIndex === index && styles.activeDayText,
                  ]}
                >
                  {day.name}
                </Text>
                {day.trainingDayName && (
                  <Text style={styles.trainingDayText}>
                    {day.trainingDayName}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {isDayCompletedToday(day) && (
                  <TouchableOpacity onPress={() => handleDayPress(index)} testID={`day-completed-${day.name}`}>
                    <Ionicons name={"book"} size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <View style={styles.ellipsisContainer}>
                  <Menu trigger={
                    <Ionicons
                      name="ellipsis-vertical"
                      size={24}
                      color="#FFFFFF"
                      testID={`ellipsis-vertical-${day.name}`}
                    />}
                  >
                    {options(day).map((option, index) => (
                      <MenuItem key={index} text={option.label} onPress={option.onPress} testID={option.testID} />
                    ))}
                  </Menu>
                </View>
              </View>
            </View>
          </LinearGradientItem>
        ))}
      </ScrollView>
      {sessionButton}
      {floatingSettingsButton}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  header: {
    marginTop: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    color: "#A5A5A5",
    fontSize: 16,
    marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  dayContainer: {
    padding: 22,
    borderRadius: 10,
    marginBottom: 8,
    opacity: 0.8,
  },
  activeDayContainer: {
    backgroundColor: "#2979FF",
  },
  restDayContainer: {
    backgroundColor: "#A5A5A5",
  },
  dayInnerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayText: {
    color: "#A5A5A5",
    fontSize: 18,
    fontWeight: "bold",
  },
  trainingDayText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 5,
  },
  activeDayText: {
    color: "#FFFFFF",
  },
  restDayText: {
    color: "#6c757d",
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#A5A5A5",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  ellipsisContainer: {
    position: 'relative',
    zIndex: 2,
  },
  floatingButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#2979FF",
    padding: 10,
    borderRadius: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
});

export default RoutineScreen;