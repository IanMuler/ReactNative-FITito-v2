import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { RadialGradientBackground } from '@/components';
import NumberInput from '@/components/ui/NumberInput';
import { useProfile } from '@/features/profile';
import { useTrainingSession } from '@/features/training-sessions/hooks/useTrainingSession';
import { LocalTrainingProgress, LocalSetProgress, LocalExerciseProgress } from '@/features/training-sessions/types';

export default function SesionEntrenoPage() {
  const router = useRouter();
  const { profileId } = useProfile();
  
  /* State */
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [localProgress, setLocalProgress] = useState<LocalTrainingProgress>({
    exerciseProgress: {},
    currentExerciseIndex: 0,
    hasUnsavedChanges: false
  });

  /* Training Session Hook */
  const {
    activeSession,
    isLoading,
    error,
    completeSession,
    cancelSession,
    refetch,
  } = useTrainingSession(profileId);

  /* Effects */
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar la sesión de entrenamiento',
      });
    }
  }, [error]);

  /* Update exercise index when session changes */
  useEffect(() => {
    if (activeSession && activeSession.exercises) {
      const maxIndex = activeSession.exercises.length - 1;
      if (currentExerciseIndex > maxIndex) {
        setCurrentExerciseIndex(Math.max(0, maxIndex));
      }
    }
  }, [activeSession, currentExerciseIndex]);

  /* Initialize local progress when session loads */
  useEffect(() => {
    if (activeSession) {
      const initialProgress: LocalTrainingProgress = {
        exerciseProgress: {},
        currentExerciseIndex: 0,
        hasUnsavedChanges: false
      };
      
      // Initialize progress for each exercise
      activeSession.exercises.forEach(exercise => {
        initialProgress.exerciseProgress[exercise.exercise_id] = {
          exercise_id: exercise.exercise_id,
          sets: exercise.planned_sets.map(() => ({
            reps: '',
            weight: '',
            rir: '',
            isCompleted: false
          })),
          isCompleted: false
        };
      });
      
      setLocalProgress(initialProgress);
    }
  }, [activeSession]);

  /* Local state update handler */
  const updateLocalProgress = (
    exerciseIndex: number,
    setIndex: number,
    key: string,
    value: string | number
  ) => {
    if (!activeSession) return;
    
    const exercise = activeSession.exercises[exerciseIndex];
    if (!exercise) return;

    setLocalProgress(prev => {
      const updatedProgress = { ...prev };
      const exerciseId = exercise.exercise_id;
      
      // Ensure exercise progress exists
      if (!updatedProgress.exerciseProgress[exerciseId]) {
        updatedProgress.exerciseProgress[exerciseId] = {
          exercise_id: exerciseId,
          sets: exercise.planned_sets.map(() => ({
            reps: '',
            weight: '',
            rir: '',
            isCompleted: false
          })),
          isCompleted: false
        };
      }
      
      // Update the specific set field
      const sets = [...updatedProgress.exerciseProgress[exerciseId].sets];
      const currentSet = { ...sets[setIndex] };
      
      if (key === "reps") {
        currentSet.reps = value as string;
      } else if (key === "weight") {
        currentSet.weight = value as string;
      } else if (key === "rir") {
        currentSet.rir = value as string;
      }
      
      // Determine if set is completed
      currentSet.isCompleted = Boolean(
        currentSet.reps && 
        currentSet.weight && 
        parseFloat(currentSet.reps) > 0 && 
        parseFloat(currentSet.weight) > 0
      );
      
      sets[setIndex] = currentSet;
      updatedProgress.exerciseProgress[exerciseId].sets = sets;
      updatedProgress.hasUnsavedChanges = true;
      
      console.log(`📋 [LOCAL] Updated set progress: exercise ${exerciseId}, set ${setIndex + 1}, completed: ${currentSet.isCompleted}`, currentSet);
      
      return updatedProgress;
    });
  };

  const handleSave = async () => {
    console.log('🎯 [Component] handleSave called:', {
      hasActiveSession: !!activeSession,
      activeSessionId: activeSession?.id,
      activeSessionIdType: typeof activeSession?.id,
      localProgress,
      fullActiveSession: activeSession
    });

    if (!activeSession) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No hay sesión activa para completar',
      });
      return;
    }

    try {
      // Convert local progress to API format
      const progressData = [];
      
      for (const [exerciseIdStr, exerciseProgress] of Object.entries(localProgress.exerciseProgress)) {
        const exerciseId = parseInt(exerciseIdStr, 10);
        
        exerciseProgress.sets.forEach((setProgress, setIndex) => {
          if (setProgress.isCompleted) {
            progressData.push({
              exercise_id: exerciseId,
              set_number: setIndex + 1,
              reps: setProgress.reps ? parseInt(setProgress.reps, 10) : undefined,
              weight: setProgress.weight ? parseFloat(setProgress.weight) : undefined,
              rir: setProgress.rir ? parseInt(setProgress.rir, 10) : undefined,
              rest_pause_details: setProgress.rp,
              drop_set_details: setProgress.ds,
              partials_details: setProgress.partials,
              is_completed: true
            });
          }
        });
      }
      
      console.log('🗺 [Component] Sending progress data:', progressData);
      
      const result = await completeSession({ progressData });
      console.log('✅ [Component] Session completed successfully:', result);
      
      Toast.show({
        type: 'success',
        text1: 'Sesión completada',
        text2: 'Tu entrenamiento ha sido guardado',
      });
      router.push('/(tabs)/rutina');
    } catch (error) {
      console.error('❌ [Component] handleSave failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        activeSessionId: activeSession?.id
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `No se pudo completar la sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  };

  // Get current exercise from active session
  const currentExercise = activeSession?.exercises[currentExerciseIndex];

  /* Conditional rendering */
  if (isLoading) {
    return (
      <View style={styles.container}>
        <RadialGradientBackground />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando sesión...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <RadialGradientBackground />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error al cargar la sesión</Text>
          <Text style={styles.errorSubtext}>{error?.message}</Text>
        </View>
      </View>
    );
  }

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <RadialGradientBackground />
        <View style={styles.centered}>
          <Text style={styles.noSessionTitle}>No hay sesión activa</Text>
          <Text style={styles.noSessionText}>
            Ve a la sección de rutinas para iniciar un entrenamiento
          </Text>
        </View>
      </View>
    );
  }

  /* Main render - following original project design */
  return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header with training day name and date */}
        <View style={styles.header}>
          <Text style={styles.dayText} testID="training-day-name">
            {activeSession.routine_name}
          </Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
        </View>

        {/* Exercise Card - Following original design */}
        {currentExercise && (
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>EJERCICIO</Text>
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
              {currentExercise.planned_sets.map((plannedSet, setIndex) => {
                // Get performed set data from local progress
                const exerciseProgress = localProgress.exerciseProgress[currentExercise.exercise_id];
                const performedSet = exerciseProgress?.sets[setIndex] || {
                  reps: '',
                  weight: '',
                  rir: '',
                  isCompleted: false
                };

                return (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setText}>Set {setIndex + 1}</Text>
                    <View style={{ flexDirection: "column", gap: 10, flex: 1 }}>
                      {/* Basic inputs row */}
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text style={styles.setDetailText}>Reps: {plannedSet.reps}</Text>
                          <NumberInput
                            value={performedSet.reps || ""}
                            onChangeText={(text) =>
                              updateLocalProgress(
                                currentExerciseIndex,
                                setIndex,
                                "reps",
                                text
                              )
                            }
                            placeholder="Reps"
                            defaultValue={plannedSet.reps}
                            testID={`input-reps-${currentExercise.exercise_name}-${setIndex}`}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text style={styles.setDetailText}>Peso: {plannedSet.weight} kg</Text>
                          <NumberInput
                            value={performedSet.weight || ""}
                            onChangeText={(text) =>
                              updateLocalProgress(
                                currentExerciseIndex,
                                setIndex,
                                "weight",
                                text
                              )
                            }
                            placeholder="Peso"
                            defaultValue={plannedSet.weight}
                            testID={`input-weight-${currentExercise.exercise_name}-${setIndex}`}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text style={styles.setDetailText}>RIR: {plannedSet.rir}</Text>
                          <NumberInput
                            value={performedSet.rir || ""}
                            onChangeText={(text) =>
                              updateLocalProgress(
                                currentExerciseIndex,
                                setIndex,
                                "rir",
                                text
                              )
                            }
                            placeholder="RIR"
                            defaultValue={plannedSet.rir}
                            testID={`input-rir-${currentExercise.exercise_name}-${setIndex}`}
                          />
                        </View>
                      </View>

                      {/* Advanced techniques - simplified for now */}
                      <View style={{ width: "60%", alignSelf: "center", gap: 5 }}>
                        {plannedSet.partials && (
                          <View style={{ flexDirection: "row", gap: 10 }}>
                            <View style={{ flex: 1, gap: 5 }}>
                              <Text style={styles.setDetailText}>Partials reps: {plannedSet.partials.reps}</Text>
                              <NumberInput
                                value={performedSet.partials?.reps || ""}
                                onChangeText={(text) =>
                                  updateLocalProgress(
                                    currentExerciseIndex,
                                    setIndex,
                                    "partials",
                                    text
                                  )
                                }
                                placeholder="Partials Reps"
                                defaultValue={plannedSet.partials.reps}
                                testID={`input-partials-reps-${currentExercise.exercise_name}-${setIndex}`}
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Navigation Buttons - Following original design */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              { opacity: currentExerciseIndex === 0 ? 0.5 : 1 },
            ]}
            disabled={currentExerciseIndex === 0}
            onPress={() =>
              setCurrentExerciseIndex((prevIndex) => Math.max(prevIndex - 1, 0))
            }
            testID="button-previous"
          >
            <Text style={styles.buttonText}>Anterior</Text>
          </TouchableOpacity>
          {currentExerciseIndex === (activeSession.exercises?.length || 1) - 1 ? (
            <TouchableOpacity style={styles.button} onPress={handleSave} testID="button-finish">
              <Text style={styles.buttonText}>Finalizar sesión</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                setCurrentExerciseIndex((prevIndex) =>
                  Math.min(prevIndex + 1, (activeSession.exercises?.length || 1) - 1)
                )
              }
              testID="button-next"
            >
              <Text style={styles.buttonText}>Siguiente</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
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
  },
  setsContainer: {
    width: "100%",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  setText: {
    color: "#A5A5A5",
    fontSize: 16,
  },
  setDetailText: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
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
    marginBottom: 10,
  },
  noSessionText: {
    color: '#B0BEC5',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#B0BEC5',
    fontSize: 14,
    textAlign: 'center',
  },
});