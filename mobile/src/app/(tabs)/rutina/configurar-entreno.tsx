import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";
import NumberInput from "@/components/ui/NumberInput";
import { useProfile } from "@/features/profile";
import { useRoutineConfiguration } from "@/features/routine-configurations";
import { useTrainingDayList } from "@/features/training-days";
import { useWeekSchedule } from "@/features/routines";

export type RPDetail = {
  value: string;
  time: number;
};

export type DSDetail = {
  reps: string;
  peso: string;
};

export type PartialDetail = {
  reps: string;
};

export type ExerciseDetail = {
  name: string;
  sets: {
    reps: string;
    weight: string;
    rir: string;
    rp?: RPDetail[];
    ds?: DSDetail[];
    partials?: PartialDetail;
  }[];
  image: string;
};

const ConfigureTrainingDayScreen = () => {
  const [exerciseDetails, setExerciseDetails] = useState<ExerciseDetail[]>([]);
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [buttonsActive, setButtonsActive] = useState<Record<string, boolean>>({});
  
  const router = useRouter();
  const { dayName, trainingDayName } = useLocalSearchParams();
  const { currentProfile, profileId, isLoading: profileIsLoading } = useProfile();
  
  console.log('🔄 ConfigureTrainingDayScreen render');
  console.log('📊 Component params:', { dayName, trainingDayName });
  console.log('📊 Profile state:', { currentProfile, profileId, profileIsLoading });

  // Derive routineWeekId from dayName
  const getDayNameToId = (dayName: string): number => {
    const dayMap: Record<string, number> = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 
      'Viernes': 5, 'Sábado': 6, 'Domingo': 7
    };
    console.log('🔍 Mapping day:', dayName, 'to ID:', dayMap[dayName] || 1);
    return dayMap[dayName] || 1;
  };

  const derivedRoutineWeekId = dayName ? getDayNameToId(dayName as string) : 1;
  console.log('📊 Derived routine week ID:', derivedRoutineWeekId, 'for day:', dayName);

  // Get configuration from backend
  const { 
    configuration, 
    exercises, 
    routineWeek,
    isLoading, 
    isSaving,
    updateConfiguration,
    initializeConfiguration
  } = useRoutineConfiguration(derivedRoutineWeekId, profileId);

  const { trainingDays } = useTrainingDayList();
  const { assignRoutineToDay } = useWeekSchedule();

  // Auto-assign training day when coming from asignar-entreno flow
  useEffect(() => {
    const autoAssignAndInitialize = async () => {
      console.log('🔄 AutoAssign useEffect triggered');
      console.log('📊 State check:', {
        profileIsLoading,
        dayName,
        trainingDayName,
        configuration,
        isLoading,
        trainingDaysLength: trainingDays?.length || 0
      });
      
      if (profileIsLoading || !currentProfile || !dayName || !trainingDayName) {
        console.log('❌ Early return - missing basic data');
        return;
      }
      
      // If we have trainingDayName but no configuration, auto-assign and initialize
      if (trainingDayName && !configuration) {
        console.log('🎯 Conditions met, looking for training day:', trainingDayName);
        const trainingDay = trainingDays?.find(td => td.name === trainingDayName);
        console.log('🔍 Found training day:', trainingDay);
        
        if (trainingDay) {
          console.log('✅ Assigning routine to day:', dayName, 'with training day ID:', trainingDay.id);
          try {
            await assignRoutineToDay(dayName as string, trainingDay.id);
            console.log('✅ Assignment successful, now initializing configuration');
            initializeConfiguration(trainingDay.id);
          } catch (error) {
            console.error('❌ Error in assignment:', error);
          }
        } else {
          console.log('❌ Training day not found in list');
        }
      } else {
        console.log('⏭️ Skipping auto-assignment:', {
          hasTrainingDayName: !!trainingDayName,
          hasConfiguration: !!configuration
        });
      }
    };
    
    autoAssignAndInitialize();
  }, [profileIsLoading, currentProfile, dayName, trainingDayName, configuration, isLoading, trainingDays]);

  // Convert backend exercises to frontend format when configuration loads
  useEffect(() => {
    console.log('🔄 Convert exercises useEffect triggered');
    console.log('📊 Convert state check:', {
      profileIsLoading,
      hasConfiguration: !!configuration,
      exercisesLength: exercises?.length || 0
    });
    
    if (profileIsLoading || !currentProfile || !configuration) {
      console.log('❌ Convert early return - no profile or configuration');
      return;
    }
    
    if (exercises && exercises.length > 0) {
      console.log('✅ Converting exercises from backend format:', exercises);
      // Convert from backend format to original format
      const convertedDetails = exercises.map((exercise) => ({
        name: exercise.exercise_name,
        sets: exercise.sets_config.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          rir: set.rir,
          rp: set.rp || [],
          ds: set.ds || [],
          partials: set.partials
        })),
        image: exercise.exercise_image || "",
      }));
      console.log('✅ Converted exercise details:', convertedDetails);
      setExerciseDetails(convertedDetails);
      initializeButtons(convertedDetails);
    } else {
      console.log('⚠️ No exercises to convert');
    }
  }, [configuration, exercises, profileIsLoading, currentProfile]);

  const initializeButtons = (exerciseDetails: ExerciseDetail[]) => {
    const initialButtonsActive: Record<string, boolean> = {};
    exerciseDetails.forEach((exercise, exerciseIndex) => {
      exercise.sets.forEach((set, setIndex) => {
        if (set.rp && set.rp.length > 0) {
          const keyRP = `${exerciseIndex}-${setIndex}-RP`;
          initialButtonsActive[keyRP] = true;
        }
        if (set.ds && set.ds.length > 0) {
          const keyDS = `${exerciseIndex}-${setIndex}-DS`;
          initialButtonsActive[keyDS] = true;
        }
        if (set.partials) {
          const keyP = `${exerciseIndex}-${setIndex}-P`;
          initialButtonsActive[keyP] = true;
        }
      });
    });
    setButtonsActive(initialButtonsActive);
  };

  useEffect(() => {
    checkIfAllInputsAreFilled();
  }, [exerciseDetails]);

  const checkIfAllInputsAreFilled = () => {
    for (const exercise of exerciseDetails) {
      for (const set of exercise.sets) {
        if (!set.reps || !set.weight || !set.rir) {
          setIsSaveEnabled(false);
          return;
        }
        if (buttonsActive[`${exerciseDetails.indexOf(exercise)}-${exercise.sets.indexOf(set)}-RP`] &&
          (set.rp?.some(rpDetail => !rpDetail.value || !rpDetail.time) || !set.rp?.length)) {
          setIsSaveEnabled(false);
          return;
        }
        if (buttonsActive[`${exerciseDetails.indexOf(exercise)}-${exercise.sets.indexOf(set)}-DS`] &&
          (set.ds?.some(dsDetail => !dsDetail.reps || !dsDetail.peso) || !set.ds?.length)) {
          setIsSaveEnabled(false);
          return;
        }
        if (buttonsActive[`${exerciseDetails.indexOf(exercise)}-${exercise.sets.indexOf(set)}-P`] &&
          (!set.partials || !set.partials.reps)) {
          setIsSaveEnabled(false);
          return;
        }
      }
    }
    setIsSaveEnabled(true);
  };

  const handleSave = async () => {
    const cleanedExerciseDetails = exerciseDetails.map((exercise) => {
      return {
        ...exercise,
        sets: exercise.sets.map((set) => {
          const cleanedSet = { ...set };
          if (!set.rp || set.rp.some(rpDetail => !rpDetail.value || !rpDetail.time)) {
            delete cleanedSet.rp;
          }
          if (!set.ds || set.ds.some(dsDetail => !dsDetail.reps || !dsDetail.peso)) {
            delete cleanedSet.ds;
          }
          if (!set.partials || !set.partials.reps) {
            delete cleanedSet.partials;
          }
          return cleanedSet;
        })
      };
    });

    // Convert to backend format and save
    if (derivedRoutineWeekId && cleanedExerciseDetails.length > 0) {
      const backendFormat = cleanedExerciseDetails.map((exercise, index) => ({
        exercise_id: 1, // This should be resolved from exercise name
        training_day_id: trainingDays?.find(td => td.name === trainingDayName)?.id,
        sets_config: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          rir: set.rir,
          rp: set.rp || [],
          ds: set.ds || [],
          partials: set.partials
        })),
        notes: null
      }));
      
      updateConfiguration(backendFormat);
    }
    
    router.push({ pathname: "/(tabs)/rutina" });
  };

  const handleInitializeFromTrainingDay = async () => {
    console.log('🔄 handleInitializeFromTrainingDay called');
    const trainingDay = trainingDays?.find(td => td.name === trainingDayName);
    console.log('📊 Initialize check:', {
      trainingDay,
      dayName,
      derivedRoutineWeekId,
      trainingDayName
    });
    
    if (trainingDay && dayName && derivedRoutineWeekId) {
      console.log('✅ All conditions met, proceeding with assignment and initialization');
      try {
        // First assign the training day to the routine week
        console.log('🎯 Assigning routine to day:', dayName, 'with training day ID:', trainingDay.id);
        await assignRoutineToDay(dayName as string, trainingDay.id);
        console.log('✅ Assignment completed, now initializing configuration');
        // Then initialize the configuration
        initializeConfiguration(trainingDay.id);
      } catch (error) {
        console.error('❌ Error in handleInitializeFromTrainingDay:', error);
      }
    } else {
      console.log('❌ Missing required data for initialization');
    }
  };

  const updateExerciseDetail = (
    exerciseIndex: number,
    setIndex: number,
    key: string,
    value: string | number,
    rpIndex?: number,
    dsIndex?: number
  ) => {
    const updatedDetails = [...exerciseDetails];
    const updatedSets = [...updatedDetails[exerciseIndex].sets];

    if (key === "rp" && rpIndex !== undefined) {
      const updatedRP = [...updatedSets[setIndex].rp || []];
      updatedRP[rpIndex] = { ...updatedRP[rpIndex], value: value as string };
      updatedSets[setIndex] = { ...updatedSets[setIndex], rp: updatedRP };
    } else if (key === "time" && rpIndex !== undefined) {
      const updatedRP = [...updatedSets[setIndex].rp || []];
      updatedRP[rpIndex] = { ...updatedRP[rpIndex], time: value as number };
      updatedSets[setIndex] = { ...updatedSets[setIndex], rp: updatedRP };
    } else if (key === "dsReps" && dsIndex !== undefined) {
      const updatedDS = [...updatedSets[setIndex].ds || []];
      updatedDS[dsIndex] = { ...updatedDS[dsIndex], reps: value as string };
      updatedSets[setIndex] = { ...updatedSets[setIndex], ds: updatedDS };
    } else if (key === "dsPeso" && dsIndex !== undefined) {
      const updatedDS = [...updatedSets[setIndex].ds || []];
      updatedDS[dsIndex] = { ...updatedDS[dsIndex], peso: value as string };
      updatedSets[setIndex] = { ...updatedSets[setIndex], ds: updatedDS };
    } else if (key === "partials") {
      updatedSets[setIndex] = { ...updatedSets[setIndex], partials: { reps: value as string } };
    } else {
      updatedSets[setIndex] = { ...updatedSets[setIndex], [key]: value };
    }

    updatedDetails[exerciseIndex].sets = updatedSets;
    setExerciseDetails(updatedDetails);
    checkIfAllInputsAreFilled();
  };

  const toggleButton = (exerciseIndex: number, setIndex: number, type: "RP" | "DS" | "P") => {
    const key = `${exerciseIndex}-${setIndex}-${type}`;
    setButtonsActive(prevState => ({
      ...prevState,
      [key]: !prevState[key],
    }));

    const updatedDetails = [...exerciseDetails];
    const updatedSets = [...updatedDetails[exerciseIndex].sets];
    const currentSet = updatedSets[setIndex];

    if (type === "RP") {
      if (!currentSet.rp || currentSet.rp.length === 0) {
        currentSet.rp = [{ value: "", time: 5 }];
      } else {
        currentSet.rp = [];
      }
    } else if (type === "DS") {
      if (!currentSet.ds || currentSet.ds.length === 0) {
        currentSet.ds = [{ reps: "", peso: "" }];
      } else {
        currentSet.ds = [];
      }
    } else if (type === "P") {
      if (!currentSet.partials || !currentSet.partials.reps) {
        currentSet.partials = { reps: "" };
      } else {
        currentSet.partials = undefined;
      }
    }

    updatedSets[setIndex] = currentSet;
    updatedDetails[exerciseIndex].sets = updatedSets;
    setExerciseDetails(updatedDetails);
    checkIfAllInputsAreFilled();
  };

  const addSet = (exerciseIndex: number) => {
    const updatedDetails = [...exerciseDetails];
    updatedDetails[exerciseIndex].sets.push({
      reps: "", weight: "", rir: "", rp: [], ds: [], partials: undefined
    });
    setExerciseDetails(updatedDetails);
  };

  const removeSet = (exerciseIndex: number) => {
    const updatedDetails = [...exerciseDetails];
    const updatedSets = [...updatedDetails[exerciseIndex].sets];
    updatedSets.pop();
    updatedDetails[exerciseIndex].sets = updatedSets;
    setExerciseDetails(updatedDetails);
  };

  const addField = (exerciseIndex: number, setIndex: number, type: "RP" | "DS") => {
    const updatedDetails = [...exerciseDetails];
    const updatedSets = [...updatedDetails[exerciseIndex].sets];

    if (type === "RP") {
      updatedSets[setIndex].rp?.push({ value: "", time: 5 });
    } else if (type === "DS") {
      updatedSets[setIndex].ds?.push({ reps: "", peso: "" });
    }

    setExerciseDetails(updatedDetails);
  };

  const removeField = (exerciseIndex: number, setIndex: number, index: number, type: "RP" | "DS") => {
    const updatedDetails = [...exerciseDetails];
    const updatedSets = [...updatedDetails[exerciseIndex].sets];

    if (type === "RP") {
      updatedSets[setIndex].rp?.splice(index, 1);
    } else if (type === "DS") {
      updatedSets[setIndex].ds?.splice(index, 1);
    }

    setExerciseDetails(updatedDetails);
  };

  return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title} testID="config-title">
          Configurar {trainingDayName} para {dayName}
        </Text>
        
        {isLoading && (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Cargando configuración...</Text>
          </View>
        )}
        
        {!isLoading && !configuration && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              No hay ejercicios configurados
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleInitializeFromTrainingDay}
              testID="button-initialize"
            >
              <Text style={styles.buttonText}>
                Inicializar desde día de entrenamiento
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {exerciseDetails.map((exercise, exerciseIndex) => (
          <View key={exerciseIndex} style={styles.exerciseContainer} testID={`exercise-${exercise.name}`}>
            <Text style={styles.exerciseName} testID={`exercise-name-${exercise.name}`}>{exercise.name}</Text>
            
            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={{ marginBottom: 10 }}>
                <View style={styles.setRow} testID={`exercise-set-${exercise.name}-${setIndex}`}>
                  <Text style={styles.setText}>Set {setIndex + 1}</Text>
                  <View style={[styles.setColumn, { flex: 1 }]}>
                    <View style={styles.setRow}>
                      <NumberInput
                        value={set.reps}
                        onChangeText={(text) =>
                          updateExerciseDetail(exerciseIndex, setIndex, "reps", text)
                        }
                        placeholder="Reps"
                        testID={`input-reps-${exercise.name}-${setIndex}`}
                      />
                      <NumberInput
                        value={set.weight}
                        onChangeText={(text) =>
                          updateExerciseDetail(
                            exerciseIndex,
                            setIndex,
                            "weight",
                            text
                          )
                        }
                        placeholder="Peso"
                        testID={`input-weight-${exercise.name}-${setIndex}`}
                      />
                      <NumberInput
                        value={set.rir}
                        onChangeText={(text) =>
                          updateExerciseDetail(exerciseIndex, setIndex, "rir", text)
                        }
                        placeholder="RIR"
                        testID={`input-rir-${exercise.name}-${setIndex}`}
                      />
                    </View>
                    
                    <View style={styles.setRow}>
                      <TouchableOpacity
                        style={[styles.rpButton, buttonsActive[`${exerciseIndex}-${setIndex}-RP`] ? styles.rpButtonActive : null]}
                        onPress={() => toggleButton(exerciseIndex, setIndex, "RP")}
                        testID={`button-rp-toggle-${exercise.name}-${setIndex}`}
                      >
                        <Text style={styles.rpButtonText}>RP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rpButton, buttonsActive[`${exerciseIndex}-${setIndex}-DS`] ? styles.rpButtonActive : null]}
                        onPress={() => toggleButton(exerciseIndex, setIndex, "DS")}
                        testID={`button-ds-toggle-${exercise.name}-${setIndex}`}
                      >
                        <Text style={styles.rpButtonText}>DS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rpButton, buttonsActive[`${exerciseIndex}-${setIndex}-P`] ? styles.rpButtonActive : null]}
                        onPress={() => toggleButton(exerciseIndex, setIndex, "P")}
                        testID={`button-p-toggle-${exercise.name}-${setIndex}`}
                      >
                        <Text style={styles.rpButtonText}>P</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Rest-Pause Section */}
                    {buttonsActive[`${exerciseIndex}-${setIndex}-RP`] && (
                      <View>
                        {set.rp?.map((rpDetail, rpIndex) => (
                          <View key={rpIndex} style={styles.rpRow}>
                            <NumberInput
                              value={rpDetail.value}
                              onChangeText={(text) =>
                                updateExerciseDetail(exerciseIndex, setIndex, "rp", text, rpIndex)
                              }
                              placeholder={`RP ${rpIndex + 1}`}
                              testID={`input-rp-${exercise.name}-${setIndex}-${rpIndex}`}
                            />
                            <Picker
                              selectedValue={rpDetail.time}
                              style={styles.timePicker}
                              onValueChange={(itemValue) =>
                                updateExerciseDetail(exerciseIndex, setIndex, "time", itemValue, rpIndex)
                              }
                              testID={`picker-rp-time-${exercise.name}-${setIndex}-${rpIndex}`}
                            >
                              {[5, 10, 15, 20, 25, 30].map((time) => (
                                <Picker.Item key={time} label={`${time}"`} value={time} />
                              ))}
                            </Picker>
                            {rpIndex === 0 ? (
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => addField(exerciseIndex, setIndex, "RP")}
                                testID={`button-add-rp-${exercise.name}-${setIndex}`}
                              >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeField(exerciseIndex, setIndex, rpIndex, "RP")}
                                testID={`button-remove-rp-${exercise.name}-${setIndex}-${rpIndex}`}
                              >
                                <Ionicons name="remove" size={24} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Drop Sets Section */}
                    {buttonsActive[`${exerciseIndex}-${setIndex}-DS`] && (
                      <View>
                        {set.ds?.map((dsDetail, dsIndex) => (
                          <View key={dsIndex} style={styles.dsRow}>
                            <NumberInput
                              value={dsDetail.reps}
                              onChangeText={(text) =>
                                updateExerciseDetail(exerciseIndex, setIndex, "dsReps", text, undefined, dsIndex)
                              }
                              placeholder={`DS Reps ${dsIndex + 1}`}
                              testID={`input-ds-reps-${exercise.name}-${setIndex}-${dsIndex}`}
                            />
                            <NumberInput
                              value={dsDetail.peso}
                              onChangeText={(text) =>
                                updateExerciseDetail(exerciseIndex, setIndex, "dsPeso", text, undefined, dsIndex)
                              }
                              placeholder={`DS Peso ${dsIndex + 1}`}
                              testID={`input-ds-peso-${exercise.name}-${setIndex}-${dsIndex}`}
                            />
                            {dsIndex === 0 ? (
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => addField(exerciseIndex, setIndex, "DS")}
                                testID={`button-add-ds-${exercise.name}-${setIndex}`}
                              >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeField(exerciseIndex, setIndex, dsIndex, "DS")}
                                testID={`button-remove-ds-${exercise.name}-${setIndex}-${dsIndex}`}
                              >
                                <Ionicons name="remove" size={24} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Partials Section */}
                    {buttonsActive[`${exerciseIndex}-${setIndex}-P`] && (
                      <View style={styles.partialRow}>
                        <NumberInput
                          value={set.partials?.reps || ""}
                          onChangeText={(text) =>
                            updateExerciseDetail(exerciseIndex, setIndex, "partials", text)
                          }
                          placeholder="Partials Reps"
                          testID={`input-partials-reps-${exercise.name}-${setIndex}`}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addSet(exerciseIndex)}
                testID={`button-add-set-${exercise.name}`}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {exercise.sets.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeSet(exerciseIndex)}
                  testID={`button-remove-set-${exercise.name}`}
                >
                  <Ionicons name="remove" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        <TouchableOpacity
          style={[styles.button, !isSaveEnabled && styles.disabledButton]}
          onPress={handleSave}
          disabled={!isSaveEnabled}
          testID="button-save"
        >
          <Text style={styles.buttonText}>Guardar día de rutina</Text>
        </TouchableOpacity>
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
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
  },
  exerciseContainer: {
    backgroundColor: "#1F2940",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 10,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  setColumn: {
    flexDirection: "column",
    gap: 10,
  },
  setText: {
    color: "#A5A5A5",
    fontSize: 16,
  },
  rpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  dsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  partialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  timePicker: {
    width: 120,
    color: "#FFFFFF",
    backgroundColor: "#1F2940",
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  addButton: {
    backgroundColor: "#2979FF",
    width: 40,
    height: 40,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#2979FF",
    width: 40,
    height: 40,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "bold",
  },
  rpButton: {
    backgroundColor: "#A5A5A5",
    width: 40,
    height: 40,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  rpButtonActive: {
    backgroundColor: "#2979FF",
  },
  rpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  emptyText: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default ConfigureTrainingDayScreen;