import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RadialGradientBackground } from '@/components';
import NumberInput from '@/components/ui/NumberInput';
import { useProfile } from '@/features/profile';
import { ProfileSwitch } from '@/features/profile/components';
import { useTrainingSession } from '@/features/training-sessions/hooks/useTrainingSession';
import { UpdateSetProgressRequest } from '@/features/training-sessions/types';
import { TrainingSessionAsyncStorage } from '@/features/training-sessions/services/asyncStorageService';

export default function SesionEntrenoPage() {
  const router = useRouter();
  const { profileId, profiles } = useProfile();
  const queryClient = useQueryClient();

  /* State */
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionInputs, setSessionInputs] = useState<{[key: string]: string}>({});
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [hasJustCompleted, setHasJustCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* Training Session Hook */
  const {
    activeSession,
    updateSetProgress,
    moveToNextExercise,
    moveToPreviousExercise,
    completeSession,
    cancelSession,
    getCurrentExercise,
    canMoveToNext,
    canMoveToPrevious,
    isLoading,
  } = useTrainingSession(profileId);

  /* Track when initial load completes */
  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [isLoading, hasInitiallyLoaded]);

  /* Redirect if no active session */
  useEffect(() => {
    if (!isLoading && hasInitiallyLoaded && !hasJustCompleted) {
      if (!activeSession && !hasCheckedSession) {
        setHasCheckedSession(true);
        Toast.show({
          type: 'info',
          text1: 'No hay sesión activa',
          text2: 'Regresando a rutina...',
        });
        router.replace('/rutina');
      }
    }
  }, [activeSession, isLoading, router, hasCheckedSession, hasInitiallyLoaded, hasJustCompleted, profileId]);

  /* Update current exercise index when session changes */
  useEffect(() => {
    if (activeSession) {
      setCurrentExerciseIndex(activeSession.current_exercise_index || 0);
    }
  }, [activeSession]);

  /* Initialize inputs with performed_sets values when exercise changes */
  useEffect(() => {
    if (currentExercise && activeSession) {
      const newInputs: {[key: string]: string} = {};

      currentExercise.performed_sets.forEach((performedSet) => {
        const repsKey = `reps_${currentExercise.exercise_id}_${performedSet.set_number}`;
        const weightKey = `weight_${currentExercise.exercise_id}_${performedSet.set_number}`;
        const rirKey = `rir_${currentExercise.exercise_id}_${performedSet.set_number}`;

        if (performedSet.reps !== undefined) newInputs[repsKey] = String(performedSet.reps);
        if (performedSet.weight !== undefined) newInputs[weightKey] = String(performedSet.weight);
        if (performedSet.rir !== undefined) newInputs[rirKey] = String(performedSet.rir);
      });

      setSessionInputs(newInputs);
    }
  }, [currentExercise, activeSession]);

  /* Reset check flags when profile changes */
  useEffect(() => {
    setHasCheckedSession(false);
    setHasInitiallyLoaded(false);
    setHasJustCompleted(false);
  }, [profileId]);

  /* Handlers */
  const handleCancelSession = () => {
    Alert.alert(
      'Cancelar sesión',
      '¿Estás seguro de que quieres cancelar la sesión? Se perderá todo el progreso.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession();
              router.replace('/rutina');
            } catch (error) {
              console.error('Error cancelling session:', error);
            }
          },
        },
      ]
    );
  };

  const completeSingleSession = async () => {
    try {
      setIsSaving(true);

      // Performed sets are already saved automatically when inputs change
      await completeSession();

      // Mark session as completed to prevent redirect
      setHasJustCompleted(true);

      // Invalidate session history queries to update icons in rutina index
      queryClient.invalidateQueries({ queryKey: ['session-history'] });
      queryClient.invalidateQueries({ queryKey: ['legacy-workout-history-v2'] });

      Toast.show({
        type: 'success',
        text1: 'Sesión guardada en histórico',
        text2: '¡Excelente entrenamiento!',
      });
      router.replace('/rutina');
    } catch (error) {
      console.error('Error completing session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo completar la sesión',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completeBothSessions = async (otherProfileId: number) => {
    try {
      setIsSaving(true);

      // Completar sesión del perfil actual
      await completeSession();

      // Obtener y completar sesión del otro perfil
      const otherSession = await TrainingSessionAsyncStorage.getActiveSession(otherProfileId);
      if (otherSession) {
        await TrainingSessionAsyncStorage.completeSession(otherSession.id, otherProfileId);
      }

      setHasJustCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['session-history'] });
      queryClient.invalidateQueries({ queryKey: ['legacy-workout-history-v2'] });

      Toast.show({
        type: 'success',
        text1: 'Sesiones finalizadas',
        text2: '¡Ambos perfiles completaron su entrenamiento!',
      });
      router.replace('/rutina');
    } catch (error) {
      console.error('Error completing both sessions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo completar las sesiones',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    // Verificar si el otro perfil también tiene sesión activa
    const otherProfile = profiles.find(p => p.id !== profileId);
    let otherProfileHasActiveSession = false;

    if (otherProfile) {
      try {
        const otherSession = await TrainingSessionAsyncStorage.getActiveSession(otherProfile.id);
        if (otherSession) {
          otherProfileHasActiveSession = true;
        }
      } catch (error) {
        console.error('Error checking other profile session:', error);
      }
    }

    // Si ambos perfiles tienen sesión activa, mostrar opciones
    if (otherProfileHasActiveSession && otherProfile) {
      Alert.alert(
        'Finalizar sesiones',
        `${otherProfile.display_name || otherProfile.profile_name} también tiene una sesión activa. ¿Quieres finalizar ambas sesiones?`,
        [
          {
            text: 'Solo este perfil',
            onPress: async () => {
              await completeSingleSession();
            },
          },
          {
            text: 'Ambos perfiles',
            onPress: async () => {
              await completeBothSessions(otherProfile.id);
            },
          },
          {
            text: 'Continuar entrenando',
            style: 'cancel',
          },
        ]
      );
    } else {
      // Solo finalizar sesión del perfil actual
      Alert.alert(
        'Finalizar sesión',
        '¿Quieres finalizar la sesión de entrenamiento?',
        [
          {
            text: 'Continuar entrenando',
            style: 'cancel',
          },
          {
            text: 'Finalizar',
            style: 'default',
            onPress: async () => {
              await completeSingleSession();
            },
          },
        ]
      );
    }
  };

  const updateSetInput = (key: string, value: string) => {
    // Update local state
    setSessionInputs(prev => ({
      ...prev,
      [key]: value,
    }));

    // Extract exercise_id and set_number from key
    // key format: "reps_123_1" or "weight_123_1" or "rir_123_1"
    const [type, exerciseId, setNumber] = key.split('_');

    if (!currentExercise || !activeSession) return;

    // Build update request with current values
    const repsKey = `reps_${exerciseId}_${setNumber}`;
    const weightKey = `weight_${exerciseId}_${setNumber}`;
    const rirKey = `rir_${exerciseId}_${setNumber}`;

    // Get latest values (including the one just updated)
    const currentInputs = {
      ...sessionInputs,
      [key]: value,
    };

    const updateRequest: UpdateSetProgressRequest = {
      session_id: activeSession.id,
      exercise_id: parseInt(exerciseId),
      set_number: parseInt(setNumber),
      reps: currentInputs[repsKey] ? parseInt(currentInputs[repsKey]) : undefined,
      weight: currentInputs[weightKey] ? parseFloat(currentInputs[weightKey]) : undefined,
      rir: currentInputs[rirKey] ? parseInt(currentInputs[rirKey]) : undefined,
    };

    // Save to AsyncStorage (fire and forget - no await)
    updateSetProgress(updateRequest).catch(err => {
      console.error('Error persisting set progress:', err);
    });
  };

  const handlePreviousExercise = async () => {
    if (canMoveToPrevious()) {
      await moveToPreviousExercise();
      setCurrentExerciseIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextExercise = async () => {
    if (canMoveToNext()) {
      await moveToNextExercise();
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  /* Get current exercise */
  const currentExercise = getCurrentExercise();

  /* Conditional rendering */
  if (isLoading || !activeSession) {
    return (
      <View style={styles.container}>
        <RadialGradientBackground />
        <ProfileSwitch />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando sesión...</Text>
        </View>
      </View>
    );
  }

  if (!currentExercise) {
    return (
      <View style={styles.container}>
        <RadialGradientBackground />
        <ProfileSwitch />
        <View style={styles.centered}>
          <Text style={styles.noSessionTitle}>No hay ejercicios en esta sesión</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* Main render */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <RadialGradientBackground />
      <ProfileSwitch />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dayText} testID="training-day-name">
            {activeSession.routine_name}
          </Text>
          <Text style={styles.dateText}>{activeSession.day_name} - {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Exercise Card */}
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseTitle}>EJERCICIO {currentExerciseIndex + 1} de {activeSession.exercises.length}</Text>
          <Text style={styles.exerciseName}>{currentExercise.exercise_name}</Text>
          {currentExercise.exercise_image && (
            <Image
              source={{ uri: currentExercise.exercise_image }}
              style={styles.exerciseImage}
              testID={`exercise-image-${currentExercise.exercise_name}`}
            />
          )}

          {/* Sets Container */}
          <View style={styles.setsContainer}>
            {currentExercise.sets_config.map((setConfig, setIndex) => {
              const setNumber = setIndex + 1;
              const repsKey = `reps_${currentExercise.exercise_id}_${setNumber}`;
              const weightKey = `weight_${currentExercise.exercise_id}_${setNumber}`;
              const rirKey = `rir_${currentExercise.exercise_id}_${setNumber}`;

              return (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setText}>Set {setNumber}</Text>
                  <View style={styles.setInputsContainer}>
                    <View style={styles.inputColumn}>
                      <Text style={styles.setDetailText}>Reps: {setConfig.reps}</Text>
                      <NumberInput
                        value={sessionInputs[repsKey] || ""}
                        onChangeText={(text) => updateSetInput(repsKey, text)}
                        placeholder="0"
                        defaultValue={setConfig.reps}
                        testID={`input-reps-${currentExercise.exercise_name}-${setIndex}`}
                      />
                    </View>
                    <View style={styles.inputColumn}>
                      <Text style={styles.setDetailText}>Peso: {setConfig.weight} kg</Text>
                      <NumberInput
                        value={sessionInputs[weightKey] || ""}
                        onChangeText={(text) => updateSetInput(weightKey, text)}
                        placeholder="0"
                        defaultValue={setConfig.weight}
                        testID={`input-weight-${currentExercise.exercise_name}-${setIndex}`}
                      />
                    </View>
                    <View style={styles.inputColumn}>
                      <Text style={styles.setDetailText}>RIR: {setConfig.rir}</Text>
                      <NumberInput
                        value={sessionInputs[rirKey] || ""}
                        onChangeText={(text) => updateSetInput(rirKey, text)}
                        placeholder="0"
                        defaultValue={setConfig.rir}
                        testID={`input-rir-${currentExercise.exercise_name}-${setIndex}`}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Cancel Session Button - Circular and minimalist */}
          <TouchableOpacity
            style={styles.cancelSessionButton}
            onPress={handleCancelSession}
            testID="button-cancel-session"
          >
            <Text style={styles.cancelSessionButtonText}>🗑️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { opacity: !canMoveToPrevious() ? 0.5 : 1 },
            ]}
            disabled={!canMoveToPrevious()}
            onPress={handlePreviousExercise}
            testID="button-previous"
          >
            <Text style={styles.buttonText}>Anterior</Text>
          </TouchableOpacity>

          {!canMoveToNext() ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleCompleteSession}
              testID="button-finish"
            >
              <Text style={styles.buttonText}>Finalizar sesión</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleNextExercise}
              testID="button-next"
            >
              <Text style={styles.buttonText}>Siguiente</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#121623",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
  },
  dayText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  dateText: {
    color: "#A5A5A5",
    fontSize: 16,
    marginBottom: 20,
  },
  exerciseCard: {
    backgroundColor: "#1F2940",
    flex: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  exerciseTitle: {
    color: "#A5A5A5",
    fontSize: 16,
    marginBottom: 10,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  exerciseImage: {
    height: 80,
    width: 80,
    marginBottom: 20,
    borderRadius: 10,
  },
  setsContainer: {
    width: "100%",
  },
  setRow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 15,
  },
  setText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  setInputsContainer: {
    flexDirection: "row",
    gap: 15,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputColumn: {
    flex: 1,
    gap: 8,
    minWidth: 90,
  },
  setDetailText: {
    color: "#A5A5A5",
    fontSize: 14,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  cancelSessionButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelSessionButtonText: {
    fontSize: 24,
    opacity: 0.6,
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  noSessionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});