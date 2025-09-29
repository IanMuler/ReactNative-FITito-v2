import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import { TrainingSessionAsyncStorage } from '@/features/training-sessions/services/asyncStorageService';
import { routineApi } from '@/features/routines/services';
import { routineConfigurationApi } from '@/features/routine-configurations/services/routineConfigurationApi';

const RoutineScreen = () => {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const router = useRouter();
  const { currentProfile, profileId, profiles } = useProfile();
  
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
  const { activeSession, createSession, cancelSession, isLoading: isSessionLoading } = useTrainingSession(profileId);
  
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

  const handleCancelSession = () => {
    Alert.alert(
      "Cancelar sesión",
      "¿Estás seguro de que quieres cancelar la sesión actual? Se perderá todo el progreso.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSession();
              Toast.show({
                type: 'info',
                text1: 'Sesión cancelada',
                text2: 'La sesión ha sido cancelada',
              });
            } catch (error) {
              console.error('Error canceling session:', error);
            }
          }
        }
      ]
    );
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

      // Verificar si ambos perfiles tienen entreno hoy
      const otherProfile = profiles.find(p => p.id !== profileId);
      let otherProfileHasTraining = false;

      if (otherProfile) {
        try {
          // Obtener la semana de rutinas del otro perfil
          const otherRoutineWeeks = await routineApi.getWeekSchedule(otherProfile.id);
          const today = new Date();
          const todayDayIndex = today.getDay(); // 0 = Sunday, 6 = Saturday

          // Encontrar el día actual en la semana del otro perfil
          const otherProfileCurrentDay = otherRoutineWeeks.find(week => week.day_of_week === todayDayIndex);

          // Verificar si tiene entreno asignado y no es día de descanso
          if (otherProfileCurrentDay && otherProfileCurrentDay.routine_id && !otherProfileCurrentDay.is_rest_day) {
            // Verificar que no tenga sesión activa ya
            const otherProfileActiveSession = await TrainingSessionAsyncStorage.getActiveSession(otherProfile.id);
            if (!otherProfileActiveSession) {
              otherProfileHasTraining = true;
            }
          }
        } catch (error) {
          console.error('Error checking other profile training:', error);
        }
      }

      // Si ambos perfiles tienen entreno, mostrar Alert
      if (otherProfileHasTraining && otherProfile) {
        Alert.alert(
          'Iniciar sesiones',
          `${otherProfile.display_name || otherProfile.profile_name} también tiene entreno hoy. ¿Quieres iniciar la sesión en ambos perfiles?`,
          [
            {
              text: 'Solo este perfil',
              onPress: async () => {
                await startSingleSession(currentRoutineInfo);
              },
            },
            {
              text: 'Ambos perfiles',
              onPress: async () => {
                await startBothSessions(currentRoutineInfo, otherProfile.id);
              },
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      } else {
        // Solo iniciar sesión del perfil actual
        await startSingleSession(currentRoutineInfo);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo iniciar la sesión',
      });
    }
  };

  const startSingleSession = async (currentRoutineInfo: any) => {
    try {
      // Convertir day_of_week para training_sessions (que espera 1-7 en lugar de 0-6)
      const trainingSessionDayOfWeek = convertDayOfWeekForTrainingSession(currentRoutineInfo.day_of_week);

      console.log('🚀 Iniciando sesión con datos:', {
        routineWeekId: currentRoutineInfo.id,
        routineWeekDayOfWeek: currentRoutineInfo.day_of_week,
        trainingSessionDayOfWeek,
        dayName: currentRoutineInfo.day_name,
        exerciseCount: exercises.length
      });

      // Crear nueva sesión
      const sessionData: CreateTrainingSessionRequest = {
        profile_id: profileId,
        routine_week_id: currentRoutineInfo.id,
        routine_name: currentDay.trainingDayName || 'Rutina',
        day_of_week: trainingSessionDayOfWeek,
        day_name: currentDay.name,
        exercises: exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          exercise_image: exercise.exercise_image,
          sets_config: exercise.sets_config,
        })),
      };

      await createSession(sessionData);

      console.log('✅ Session created, navigating to training screen...');

      // Navigate
      router.push("/rutina/sesion-de-entrenamiento");

      // Show toast
      Toast.show({
        type: 'success',
        text1: 'Sesión iniciada',
        text2: '¡Comienza tu entrenamiento!',
      });
    } catch (error) {
      console.error('Error starting single session:', error);
      throw error;
    }
  };

  const startBothSessions = async (currentRoutineInfo: any, otherProfileId: number) => {
    try {
      // Crear sesión para el perfil actual
      const trainingSessionDayOfWeek = convertDayOfWeekForTrainingSession(currentRoutineInfo.day_of_week);

      const sessionData: CreateTrainingSessionRequest = {
        profile_id: profileId,
        routine_week_id: currentRoutineInfo.id,
        routine_name: currentDay.trainingDayName || 'Rutina',
        day_of_week: trainingSessionDayOfWeek,
        day_name: currentDay.name,
        exercises: exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          exercise_image: exercise.exercise_image,
          sets_config: exercise.sets_config,
        })),
      };

      await createSession(sessionData);

      // Obtener datos del otro perfil
      const otherRoutineWeeks = await routineApi.getWeekSchedule(otherProfileId);
      const today = new Date();
      const todayDayIndex = today.getDay();
      const otherProfileCurrentDay = otherRoutineWeeks.find(week => week.day_of_week === todayDayIndex);

      if (otherProfileCurrentDay && otherProfileCurrentDay.routine_id) {
        // Obtener configuración del otro perfil
        const otherRoutineWeekId = otherProfileCurrentDay.id;
        const otherConfiguration = await routineConfigurationApi.getConfiguration(otherRoutineWeekId, otherProfileId);

        if (otherConfiguration && otherConfiguration.exercises && otherConfiguration.exercises.length > 0) {
          const otherTrainingSessionDayOfWeek = convertDayOfWeekForTrainingSession(otherProfileCurrentDay.day_of_week);

          const otherSessionData: CreateTrainingSessionRequest = {
            profile_id: otherProfileId,
            routine_week_id: otherRoutineWeekId,
            routine_name: otherProfileCurrentDay.routine_name || 'Rutina',
            day_of_week: otherTrainingSessionDayOfWeek,
            day_name: otherProfileCurrentDay.day_name,
            exercises: otherConfiguration.exercises.map((exercise: any) => ({
              exercise_id: exercise.exercise_id,
              exercise_name: exercise.exercise_name,
              exercise_image: exercise.exercise_image,
              sets_config: exercise.sets_config,
            })),
          };

          await TrainingSessionAsyncStorage.createSession(otherSessionData);
        }
      }

      console.log('✅ Both sessions created, navigating to training screen...');

      router.push("/rutina/sesion-de-entrenamiento");

      Toast.show({
        type: 'success',
        text1: 'Sesiones iniciadas',
        text2: '¡Ambos perfiles listos para entrenar!',
      });
    } catch (error) {
      console.error('Error starting both sessions:', error);
      throw error;
    }
  };

  /* Derived State */
  const isCurrentDayCompletedToday = isDayCompletedToday(currentDay);
  const hasExercisesConfigured = exercises && exercises.length > 0;
  const isSessionDisabled = isCurrentDayCompletedToday || !currentDay?.trainingDayName || !hasExercisesConfigured;

  /* Debug button state */
  useEffect(() => {
    console.log('🔘 [Button State]:', {
      isSessionDisabled,
      isCurrentDayCompletedToday,
      hasTrainingDay: !!currentDay?.trainingDayName,
      trainingDayName: currentDay?.trainingDayName,
      hasExercisesConfigured,
      exercisesCount: exercises?.length || 0,
      activeSession: !!activeSession
    });
  }, [isSessionDisabled, isCurrentDayCompletedToday, currentDay?.trainingDayName, hasExercisesConfigured, exercises?.length, activeSession]);

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

  const sessionButtons = (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.button, isSessionDisabled && styles.disabledButton]}
        onPress={handleStartSession}
        disabled={isSessionDisabled}
        testID="button-start-session"
      >
        <Text style={styles.buttonText}>{ButtonText}</Text>
      </TouchableOpacity>

      {activeSession && (
        <TouchableOpacity
          style={[styles.cancelButton, isSessionLoading && styles.cancelButtonDisabled]}
          onPress={handleCancelSession}
          disabled={isSessionLoading}
          testID="button-cancel-session"
        >
          <Text style={styles.cancelButtonText}>
            {isSessionLoading ? '...' : '🗑️'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
      {sessionButtons}
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
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#FF5252",
    width: 50,
    height: 50,
    borderRadius: 25,
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
  cancelButtonDisabled: {
    backgroundColor: "#A5A5A5",
    opacity: 0.6,
  },
  disabledButton: {
    backgroundColor: "#A5A5A5",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  cancelButtonText: {
    fontSize: 20,
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