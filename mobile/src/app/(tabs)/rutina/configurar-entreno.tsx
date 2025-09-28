import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";
import { useProfile } from "@/features/profile";
import { useRoutineConfiguration } from "@/features/routine-configurations";
import { useTrainingDayList } from "@/features/training-days";
import { useWeekSchedule } from "@/features/routines";
import { useTrainingSession } from "@/features/training-sessions/hooks/useTrainingSession";
import { CreateTrainingSessionRequest } from "@/features/training-sessions/types";
import Toast from 'react-native-toast-message';
import {
  RPDetail,
  DSDetail,
  PartialDetail,
  ExerciseDetail,
  ButtonsActiveState
} from "@/features/routine-configurations/types";
import { configureTrainingDayStyles } from "@/features/routine-configurations/styles";
import {
  getDayNameToId,
  createTemplateFromTrainingDay,
  checkIfAllInputsAreFilled,
  initializeButtons
} from "@/features/routine-configurations/utils";

const ConfigureTrainingDayScreen = () => {
  /* State */
  const [exerciseDetails, setExerciseDetails] = useState<ExerciseDetail[]>([]);
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [buttonsActive, setButtonsActive] = useState<ButtonsActiveState>({});

  /* Routing and Parameters */
  const router = useRouter();
  const { dayName, trainingDayName } = useLocalSearchParams();
  
  /* Request hooks */
  const { currentProfile, profileId, isLoading: profileIsLoading } = useProfile();

  /* Data processing */

  const derivedRoutineWeekId = dayName ? getDayNameToId(dayName as string) : 1;

  const {
    configuration,
    exercises,
    routineWeek,
    isLoading,
    isSaving,
    updateConfiguration
  } = useRoutineConfiguration(derivedRoutineWeekId, profileId);

  const { trainingDays } = useTrainingDayList();
  const { assignRoutineToDay } = useWeekSchedule();
  const { createSession, activeSession } = useTrainingSession(profileId);

  /* Effects */
  useEffect(() => {
    if (profileIsLoading || !currentProfile) {
      return;
    }

    if (configuration && exercises && exercises.length > 0) {
      // Convert from backend format to original format (existing configuration)
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
      setExerciseDetails(convertedDetails);
      setButtonsActive(initializeButtons(convertedDetails));
    } else if (configuration && (!exercises || exercises.length === 0) && trainingDays && trainingDays.length > 0) {
      // No configuration exists, create template from first training day
      
      // Use the first available training day as template
      const firstTrainingDay = trainingDays[0];
      
      // Fetch the training day with exercises to create template
      import('../../../features/training-days/services/trainingDayApi').then(({ trainingDayApi }) => {
        trainingDayApi.getById(firstTrainingDay.id, profileId)
          .then((trainingDayData) => {
            if (trainingDayData.exercises && trainingDayData.exercises.length > 0) {
              const templateDetails = createTemplateFromTrainingDay(trainingDayData.exercises);
              setExerciseDetails(templateDetails);
              setButtonsActive(initializeButtons(templateDetails));
            }
          })
          .catch((error) => {
            console.error('Error loading training day for template:', error);
          });
      });
    }
  }, [configuration, exercises, profileIsLoading, currentProfile, trainingDays, profileId]);

  useEffect(() => {
    const isEnabled = checkIfAllInputsAreFilled(exerciseDetails, buttonsActive);
    setIsSaveEnabled(isEnabled);
  }, [exerciseDetails, buttonsActive]);

  /* Utility Functions */

  /* Handlers */
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
        exercise_name: exercise.name,
        order_index: index,
        training_day_id: trainingDays?.find(td => td.name === trainingDayName)?.id,
        sets_config: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          rir: set.rir,
          rp: set.rp || [],
          ds: set.ds || [],
          partials: set.partials
        })),
        notes: undefined
      }));

      updateConfiguration(backendFormat, trainingDayName as string);
    }

    router.push({ pathname: "/(tabs)/rutina" });
  };

  const handleStartTrainingSession = async () => {
    if (activeSession) {
      Toast.show({
        type: 'info',
        text1: 'Sesión activa',
        text2: 'Ya tienes una sesión de entrenamiento en curso',
      });
      router.push('/(tabs)/rutina/sesion-de-entrenamiento');
      return;
    }

    if (!exercises || exercises.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No hay ejercicios configurados para este día',
      });
      return;
    }

    try {
      const sessionData: CreateTrainingSessionRequest = {
        profile_id: profileId,
        routine_week_id: derivedRoutineWeekId,
        routine_name: routineWeek?.routine_name || 'Rutina sin nombre',
        day_of_week: derivedRoutineWeekId,
        day_name: dayName as string,
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

      router.push('/(tabs)/rutina/sesion-de-entrenamiento');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo iniciar la sesión de entrenamiento',
      });
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

  /* Sub-components as JSX fragments */
  const headerSection = (
    <View style={configureTrainingDayStyles.headerSection}>
      <View style={configureTrainingDayStyles.headerTop}>
        <View style={configureTrainingDayStyles.dayIndicator}>
          <Ionicons name="calendar-outline" size={16} color="#64B5F6" />
          <Text style={configureTrainingDayStyles.dayText}>{dayName}</Text>
        </View>
        <Text style={configureTrainingDayStyles.actionLabel}>CONFIGURACIÓN</Text>
      </View>
      <Text style={configureTrainingDayStyles.mainTitle}>
        {trainingDayName}
      </Text>
    </View>
  );

  const loadingState = (
    <View style={configureTrainingDayStyles.centered}>
      <Text style={configureTrainingDayStyles.loadingText}>Cargando configuración...</Text>
    </View>
  );

  const emptyState = (
    <View style={configureTrainingDayStyles.centered}>
      <Text style={configureTrainingDayStyles.emptyText}>
        No hay ejercicios configurados
      </Text>
      <Text style={configureTrainingDayStyles.emptySubtext}>
        Para configurar este día, primero debes asignar ejercicios desde la sección de ejercicios
      </Text>
    </View>
  );

  /* Conditional rendering */
  if (isLoading) {
    return (
      <View style={configureTrainingDayStyles.container}>
        <RadialGradientBackground />
        <ScrollView contentContainerStyle={configureTrainingDayStyles.scrollViewContent}>
          {headerSection}
          {loadingState}
        </ScrollView>
      </View>
    );
  }

  if (!isLoading && exerciseDetails.length === 0) {
    return (
      <View style={configureTrainingDayStyles.container}>
        <RadialGradientBackground />
        <ScrollView contentContainerStyle={configureTrainingDayStyles.scrollViewContent}>
          {headerSection}
          {emptyState}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={configureTrainingDayStyles.container}>
      <RadialGradientBackground />
      <ScrollView contentContainerStyle={configureTrainingDayStyles.scrollViewContent}>
        {headerSection}

        {exerciseDetails.map((exercise, exerciseIndex) => (
          <View key={exerciseIndex} style={configureTrainingDayStyles.exerciseSection} testID={`exercise-${exercise.name}`}>
            <Text style={configureTrainingDayStyles.exerciseTitle} testID={`exercise-name-${exercise.name}`}>{exercise.name}</Text>

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={configureTrainingDayStyles.exerciseCard}>
                <View style={configureTrainingDayStyles.setHeader}>
                  <Text style={configureTrainingDayStyles.setLabel}>Serie {setIndex + 1}</Text>
                </View>

                {/* Inputs Section */}
                <View style={configureTrainingDayStyles.inputsSection}>
                  <View style={configureTrainingDayStyles.inputField}>
                    <Text style={configureTrainingDayStyles.fieldLabel}>Repeticiones</Text>
                    <View style={configureTrainingDayStyles.inputGroup}>
                      <TouchableOpacity
                        style={[configureTrainingDayStyles.controlBtn, { left: 0 }]}
                        onPress={() => {
                          const currentValue = parseInt(set.reps) || 0;
                          const newValue = Math.max(0, currentValue - 1);
                          updateExerciseDetail(exerciseIndex, setIndex, "reps", newValue.toString());
                        }}
                      >
                        <Text style={configureTrainingDayStyles.controlBtnText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={configureTrainingDayStyles.setInput}
                        value={set.reps}
                        onChangeText={(text) =>
                          updateExerciseDetail(exerciseIndex, setIndex, "reps", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#a5a5a5"
                        keyboardType="numeric"
                        testID={`input-reps-${exercise.name}-${setIndex}`}
                      />
                      <TouchableOpacity
                        style={[configureTrainingDayStyles.controlBtn, { right: 0 }]}
                        onPress={() => {
                          const currentValue = parseInt(set.reps) || 0;
                          updateExerciseDetail(exerciseIndex, setIndex, "reps", (currentValue + 1).toString());
                        }}
                      >
                        <Text style={configureTrainingDayStyles.controlBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={configureTrainingDayStyles.inputField}>
                    <Text style={configureTrainingDayStyles.fieldLabel}>Peso (kg)</Text>
                    <View style={configureTrainingDayStyles.inputGroup}>
                      <TouchableOpacity
                        style={[configureTrainingDayStyles.controlBtn, { left: 0 }]}
                        onPress={() => {
                          const currentValue = parseInt(set.weight) || 0;
                          const newValue = Math.max(0, currentValue - 1);
                          updateExerciseDetail(exerciseIndex, setIndex, "weight", newValue.toString());
                        }}
                      >
                        <Text style={configureTrainingDayStyles.controlBtnText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={configureTrainingDayStyles.setInput}
                        value={set.weight}
                        onChangeText={(text) =>
                          updateExerciseDetail(exerciseIndex, setIndex, "weight", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#a5a5a5"
                        keyboardType="numeric"
                        testID={`input-weight-${exercise.name}-${setIndex}`}
                      />
                      <TouchableOpacity
                        style={[configureTrainingDayStyles.controlBtn, { right: 0 }]}
                        onPress={() => {
                          const currentValue = parseInt(set.weight) || 0;
                          updateExerciseDetail(exerciseIndex, setIndex, "weight", (currentValue + 1).toString());
                        }}
                      >
                        <Text style={configureTrainingDayStyles.controlBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={configureTrainingDayStyles.inputField}>
                    <Text style={configureTrainingDayStyles.fieldLabel}>RIR</Text>
                    <View style={configureTrainingDayStyles.inputGroup}>
                      <TouchableOpacity
                        style={[configureTrainingDayStyles.controlBtn, { left: 0 }]}
                        onPress={() => {
                          const currentValue = parseInt(set.rir) || 0;
                          const newValue = Math.max(0, currentValue - 1);
                          updateExerciseDetail(exerciseIndex, setIndex, "rir", newValue.toString());
                        }}
                      >
                        <Text style={configureTrainingDayStyles.controlBtnText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={configureTrainingDayStyles.setInput}
                        value={set.rir}
                        onChangeText={(text) =>
                          updateExerciseDetail(exerciseIndex, setIndex, "rir", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#a5a5a5"
                        keyboardType="numeric"
                        testID={`input-rir-${exercise.name}-${setIndex}`}
                      />
                      <TouchableOpacity
                        style={[configureTrainingDayStyles.controlBtn, { right: 0 }]}
                        onPress={() => {
                          const currentValue = parseInt(set.rir) || 0;
                          updateExerciseDetail(exerciseIndex, setIndex, "rir", (currentValue + 1).toString());
                        }}
                      >
                        <Text style={configureTrainingDayStyles.controlBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Techniques Section */}
                <View style={configureTrainingDayStyles.techniquesSection}>
                  <View style={configureTrainingDayStyles.techniquesRow}>
                    <Text style={configureTrainingDayStyles.sectionLabel}>Técnicas avanzadas</Text>
                    <View style={configureTrainingDayStyles.techniqueButtons}>
                      <TouchableOpacity
                        style={[
                          configureTrainingDayStyles.techniqueBtn,
                          buttonsActive[`${exerciseIndex}-${setIndex}-RP`] && configureTrainingDayStyles.techniqueBtnActiveRp
                        ]}
                        onPress={() => toggleButton(exerciseIndex, setIndex, "RP")}
                        testID={`button-rp-toggle-${exercise.name}-${setIndex}`}
                      >
                        <Text style={configureTrainingDayStyles.techniqueBtnText}>RP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          configureTrainingDayStyles.techniqueBtn,
                          buttonsActive[`${exerciseIndex}-${setIndex}-DS`] && configureTrainingDayStyles.techniqueBtnActiveDs
                        ]}
                        onPress={() => toggleButton(exerciseIndex, setIndex, "DS")}
                        testID={`button-ds-toggle-${exercise.name}-${setIndex}`}
                      >
                        <Text style={configureTrainingDayStyles.techniqueBtnText}>DS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          configureTrainingDayStyles.techniqueBtn,
                          buttonsActive[`${exerciseIndex}-${setIndex}-P`] && configureTrainingDayStyles.techniqueBtnActiveP
                        ]}
                        onPress={() => toggleButton(exerciseIndex, setIndex, "P")}
                        testID={`button-p-toggle-${exercise.name}-${setIndex}`}
                      >
                        <Text style={configureTrainingDayStyles.techniqueBtnText}>P</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Rest Pause Configuration */}
                  {buttonsActive[`${exerciseIndex}-${setIndex}-RP`] && (
                    <View style={configureTrainingDayStyles.techniqueConfig}>
                      <View style={configureTrainingDayStyles.configHeader}>
                        <Text style={configureTrainingDayStyles.configLabel}>Configuración Rest Pause</Text>
                        <View style={configureTrainingDayStyles.configActions}>
                          <TouchableOpacity
                            style={configureTrainingDayStyles.miniBtn}
                            onPress={() => addField(exerciseIndex, setIndex, "RP")}
                          >
                            <Text style={configureTrainingDayStyles.miniBtnText}>+</Text>
                          </TouchableOpacity>
                          {set.rp && set.rp.length > 1 && (
                            <TouchableOpacity
                              style={configureTrainingDayStyles.miniBtn}
                              onPress={() => removeField(exerciseIndex, setIndex, set.rp!.length - 1, "RP")}
                            >
                              <Text style={configureTrainingDayStyles.miniBtnText}>−</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {set.rp?.map((rpDetail, rpIndex) => (
                        <View key={rpIndex} style={configureTrainingDayStyles.rpSeries}>
                          <Text style={configureTrainingDayStyles.rpSeriesLabel}>RP {rpIndex + 1}</Text>

                          <View style={configureTrainingDayStyles.rpControls}>
                            <View style={configureTrainingDayStyles.rpField}>
                              <Text style={configureTrainingDayStyles.miniLabel}>Reps</Text>
                              <View style={configureTrainingDayStyles.miniInputGroup}>
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { left: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(rpDetail.value) || 0;
                                    const newValue = Math.max(0, currentValue - 1);
                                    updateExerciseDetail(exerciseIndex, setIndex, "rp", newValue.toString(), rpIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput
                                  style={configureTrainingDayStyles.miniInput}
                                  value={rpDetail.value}
                                  onChangeText={(text) =>
                                    updateExerciseDetail(exerciseIndex, setIndex, "rp", text, rpIndex)
                                  }
                                  placeholder="0"
                                  placeholderTextColor="#6b7280"
                                  keyboardType="numeric"
                                  testID={`input-rp-${exercise.name}-${setIndex}-${rpIndex}`}
                                />
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { right: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(rpDetail.value) || 0;
                                    updateExerciseDetail(exerciseIndex, setIndex, "rp", (currentValue + 1).toString(), rpIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View style={configureTrainingDayStyles.rpField}>
                              <Text style={configureTrainingDayStyles.miniLabel}>Descanso (seg)</Text>
                              <View style={configureTrainingDayStyles.miniInputGroup}>
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { left: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(rpDetail.time.toString()) || 15;
                                    const newValue = Math.max(5, currentValue - 5);
                                    updateExerciseDetail(exerciseIndex, setIndex, "time", newValue, rpIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput
                                  style={configureTrainingDayStyles.miniInput}
                                  value={rpDetail.time.toString()}
                                  onChangeText={(text) =>
                                    updateExerciseDetail(exerciseIndex, setIndex, "time", parseInt(text) || 15, rpIndex)
                                  }
                                  placeholder="15"
                                  placeholderTextColor="#6b7280"
                                  keyboardType="numeric"
                                  testID={`input-rp-time-${exercise.name}-${setIndex}-${rpIndex}`}
                                />
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { right: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(rpDetail.time.toString()) || 15;
                                    updateExerciseDetail(exerciseIndex, setIndex, "time", currentValue + 5, rpIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Drop Set Configuration */}
                  {buttonsActive[`${exerciseIndex}-${setIndex}-DS`] && (
                    <View style={configureTrainingDayStyles.techniqueConfig}>
                      <View style={configureTrainingDayStyles.configHeader}>
                        <Text style={configureTrainingDayStyles.configLabel}>Configuración Drop Set</Text>
                        <View style={configureTrainingDayStyles.configActions}>
                          <TouchableOpacity
                            style={configureTrainingDayStyles.miniBtn}
                            onPress={() => addField(exerciseIndex, setIndex, "DS")}
                          >
                            <Text style={configureTrainingDayStyles.miniBtnText}>+</Text>
                          </TouchableOpacity>
                          {set.ds && set.ds.length > 1 && (
                            <TouchableOpacity
                              style={configureTrainingDayStyles.miniBtn}
                              onPress={() => removeField(exerciseIndex, setIndex, set.ds!.length - 1, "DS")}
                            >
                              <Text style={configureTrainingDayStyles.miniBtnText}>−</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {set.ds?.map((dsDetail, dsIndex) => (
                        <View key={dsIndex} style={configureTrainingDayStyles.dsDrop}>
                          <Text style={configureTrainingDayStyles.dsDropLabel}>Drop {dsIndex + 1}</Text>

                          <View style={configureTrainingDayStyles.dsControls}>
                            <View style={configureTrainingDayStyles.dsField}>
                              <Text style={configureTrainingDayStyles.miniLabel}>Reps</Text>
                              <View style={configureTrainingDayStyles.miniInputGroup}>
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { left: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(dsDetail.reps) || 0;
                                    const newValue = Math.max(0, currentValue - 1);
                                    updateExerciseDetail(exerciseIndex, setIndex, "dsReps", newValue.toString(), undefined, dsIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput
                                  style={configureTrainingDayStyles.miniInput}
                                  value={dsDetail.reps}
                                  onChangeText={(text) =>
                                    updateExerciseDetail(exerciseIndex, setIndex, "dsReps", text, undefined, dsIndex)
                                  }
                                  placeholder="0"
                                  placeholderTextColor="#6b7280"
                                  keyboardType="numeric"
                                  testID={`input-ds-reps-${exercise.name}-${setIndex}-${dsIndex}`}
                                />
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { right: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(dsDetail.reps) || 0;
                                    updateExerciseDetail(exerciseIndex, setIndex, "dsReps", (currentValue + 1).toString(), undefined, dsIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View style={configureTrainingDayStyles.dsField}>
                              <Text style={configureTrainingDayStyles.miniLabel}>Peso (kg)</Text>
                              <View style={configureTrainingDayStyles.miniInputGroup}>
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { left: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(dsDetail.peso) || 0;
                                    const newValue = Math.max(0, currentValue - 1);
                                    updateExerciseDetail(exerciseIndex, setIndex, "dsPeso", newValue.toString(), undefined, dsIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput
                                  style={configureTrainingDayStyles.miniInput}
                                  value={dsDetail.peso}
                                  onChangeText={(text) =>
                                    updateExerciseDetail(exerciseIndex, setIndex, "dsPeso", text, undefined, dsIndex)
                                  }
                                  placeholder="0"
                                  placeholderTextColor="#6b7280"
                                  keyboardType="numeric"
                                  testID={`input-ds-peso-${exercise.name}-${setIndex}-${dsIndex}`}
                                />
                                <TouchableOpacity
                                  style={[configureTrainingDayStyles.miniControlBtn, { right: 0 }]}
                                  onPress={() => {
                                    const currentValue = parseInt(dsDetail.peso) || 0;
                                    updateExerciseDetail(exerciseIndex, setIndex, "dsPeso", (currentValue + 1).toString(), undefined, dsIndex);
                                  }}
                                >
                                  <Text style={configureTrainingDayStyles.miniControlBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Partials Configuration */}
                  {buttonsActive[`${exerciseIndex}-${setIndex}-P`] && (
                    <View style={configureTrainingDayStyles.techniqueConfig}>
                      <View style={configureTrainingDayStyles.configHeader}>
                        <Text style={configureTrainingDayStyles.configLabel}>Configuración Partials</Text>
                      </View>

                      <View style={configureTrainingDayStyles.pControl}>
                        <Text style={configureTrainingDayStyles.miniLabel}>Repeticiones parciales</Text>
                        <View style={configureTrainingDayStyles.miniInputGroup}>
                          <TouchableOpacity
                            style={[configureTrainingDayStyles.miniControlBtn, { left: 0 }]}
                            onPress={() => {
                              const currentValue = parseInt(set.partials?.reps || "0") || 0;
                              const newValue = Math.max(1, currentValue - 1);
                              updateExerciseDetail(exerciseIndex, setIndex, "partials", newValue.toString());
                            }}
                          >
                            <Text style={configureTrainingDayStyles.miniControlBtnText}>−</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={configureTrainingDayStyles.miniInput}
                            value={set.partials?.reps || ""}
                            onChangeText={(text) =>
                              updateExerciseDetail(exerciseIndex, setIndex, "partials", text)
                            }
                            placeholder="5"
                            placeholderTextColor="#6b7280"
                            keyboardType="numeric"
                            testID={`input-partials-reps-${exercise.name}-${setIndex}`}
                          />
                          <TouchableOpacity
                            style={configureTrainingDayStyles.miniControlBtn}
                            onPress={() => {
                              const currentValue = parseInt(set.partials?.reps || "0") || 0;
                              updateExerciseDetail(exerciseIndex, setIndex, "partials", (currentValue + 1).toString());
                            }}
                          >
                            <Text style={configureTrainingDayStyles.miniControlBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Action Buttons per Exercise */}
            <View style={configureTrainingDayStyles.actionButtons}>
              <TouchableOpacity
                style={[configureTrainingDayStyles.actionBtn, configureTrainingDayStyles.actionBtnSecondary]}
                onPress={() => removeSet(exerciseIndex)}
                disabled={exercise.sets.length <= 1}
                testID={`button-remove-set-${exercise.name}`}
              >
                <Text style={configureTrainingDayStyles.actionBtnText}>Eliminar serie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[configureTrainingDayStyles.actionBtn, configureTrainingDayStyles.actionBtnPrimary]}
                onPress={() => addSet(exerciseIndex)}
                testID={`button-add-set-${exercise.name}`}
              >
                <Text style={configureTrainingDayStyles.actionBtnText}>Agregar Serie</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[configureTrainingDayStyles.button, !isSaveEnabled && configureTrainingDayStyles.disabledButton]}
          onPress={handleSave}
          disabled={!isSaveEnabled}
          testID="button-save"
        >
          <Text style={configureTrainingDayStyles.buttonText}>Guardar día de rutina</Text>
        </TouchableOpacity>

        {exercises && exercises.length > 0 && (
          <TouchableOpacity
            style={[configureTrainingDayStyles.button, configureTrainingDayStyles.startSessionButton]}
            onPress={handleStartTrainingSession}
            testID="button-start-session"
          >
            <Text style={configureTrainingDayStyles.buttonText}>
              {activeSession ? '🏃‍♂️ Continuar entrenamiento' : '🚀 Iniciar entrenamiento'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};


export default ConfigureTrainingDayScreen;