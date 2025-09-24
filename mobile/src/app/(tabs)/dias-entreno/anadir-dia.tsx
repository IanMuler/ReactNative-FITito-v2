import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import RadialGradientBackground from '@/components/RadialGradientBackground';
import { useExerciseList } from '@/features/exercises/hooks';
import { Exercise } from '@/features/exercises/types';
import { 
  useTrainingDayActions,
  trainingDayApi,
  addTrainingDayStyles,
  CreateTrainingDayDto,
  UpdateTrainingDayDto
} from '@/features/training-days';
import { useProfile } from '@/features/profile';
import Toast from 'react-native-toast-message';

const AddTrainingDayPage: React.FC = () => {
  /* Route params */
  const { name, id } = useLocalSearchParams<{ name?: string; id?: string }>();
  const router = useRouter();

  /* Context */
  const { currentProfile } = useProfile();

  /* State */
  const [dayName, setDayName] = useState(name || '');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isEditMode, setIsEditMode] = useState(!!name);
  const [isInitializing, setIsInitializing] = useState(!!name);

  /* Hooks */
  const { exercises, isLoading: exercisesLoading } = useExerciseList();
  const { createTrainingDay, updateTrainingDay, isLoading } = useTrainingDayActions();

  /* Load existing training day for editing */
  useEffect(() => {
    const loadExistingTrainingDay = async () => {
      if (id && currentProfile) {
        try {
          const trainingDay = await trainingDayApi.getById(parseInt(id), currentProfile.id);
          setDayName(trainingDay.name);
          
          // Convert training day exercises to selected exercises format
          const exercisesForSelection = trainingDay.exercises.map(tde => ({
            id: tde.exercise.id,
            name: tde.exercise.name,
            image: tde.exercise.image,
          })) as Exercise[];
          
          setSelectedExercises(exercisesForSelection);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No se pudo cargar el día de entreno',
          });
          router.back();
        } finally {
          setIsInitializing(false);
        }
      } else if (name) {
        setIsInitializing(false);
      }
    };

    loadExistingTrainingDay();
  }, [id, currentProfile, name, router]);

  /* Handlers */
  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercises((prevSelected) =>
      prevSelected.some((ex) => ex.id === exercise.id)
        ? prevSelected.filter((ex) => ex.id !== exercise.id)
        : [...prevSelected, exercise]
    );
  };

  const saveTrainingDay = async () => {
    if (!currentProfile || !dayName.trim() || selectedExercises.length === 0) return;

    const exercisesData = selectedExercises.map((exercise, index) => ({
      exercise_id: exercise.id,
      order_index: index,
      sets: 3,
      reps: 12,
      rest_seconds: 60,
    }));

    if (isEditMode && id) {
      const updateData: UpdateTrainingDayDto = {
        profile_id: currentProfile.id,
        name: dayName.trim(),
        exercises: exercisesData,
      };
      updateTrainingDay(parseInt(id), updateData);
    } else {
      const createData: CreateTrainingDayDto = {
        profile_id: currentProfile.id,
        name: dayName.trim(),
        exercises: exercisesData,
      };
      createTrainingDay(createData);
    }
  };

  /* Computed values */
  const isButtonDisabled = !dayName.trim() || selectedExercises.length === 0 || isLoading;
  const isExerciseSelected = (exercise: Exercise) => 
    selectedExercises.some((ex) => ex.id === exercise.id);

  /* Subcomponents */
  const titleSection = (
    <Text testID="title" style={addTrainingDayStyles.title}>
      {isEditMode ? "Editar día de entreno" : "Añadir día de entreno"}
    </Text>
  );

  const nameInputSection = (
    <>
      <Text style={addTrainingDayStyles.label}>Nombre:</Text>
      <TextInput
        testID="input-day-name"
        style={addTrainingDayStyles.input}
        placeholder="Día de entreno"
        placeholderTextColor="#A5A5A5"
        value={dayName}
        onChangeText={setDayName}
      />
    </>
  );

  const exercisesLoadingSection = (
    <View style={addTrainingDayStyles.exercisesLoading}>
      <Text style={addTrainingDayStyles.exercisesLoadingText}>
        Cargando ejercicios...
      </Text>
    </View>
  );

  const exercisesEmptySection = (
    <View style={addTrainingDayStyles.exercisesEmpty}>
      <Text style={addTrainingDayStyles.exercisesEmptyText}>
        No hay ejercicios disponibles.{'\n'}
        Crea algunos ejercicios primero.
      </Text>
      <TouchableOpacity 
        style={addTrainingDayStyles.exercisesEmptyButton}
        onPress={() => router.push('/ejercicios/anadir-ejercicio')}
      >
        <Text style={addTrainingDayStyles.exercisesEmptyButtonText}>
          Crear ejercicio
        </Text>
      </TouchableOpacity>
    </View>
  );

  const exercisesSection = (
    <>
      <Text style={addTrainingDayStyles.label}>Ejercicios:</Text>
      <View style={addTrainingDayStyles.exercisesContainer}>
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            testID={`exercise-${exercise.name}`}
            style={[
              addTrainingDayStyles.exerciseCard,
              isExerciseSelected(exercise) && addTrainingDayStyles.selectedExerciseCard,
            ]}
            onPress={() => toggleExerciseSelection(exercise)}
          >
            <Image
              testID={`exercise-${exercise.name}-image`}
              source={{ uri: exercise.image }}
              style={addTrainingDayStyles.exerciseImage}
            />
            <Text 
              testID={`exercise-${exercise.name}-text`} 
              style={addTrainingDayStyles.exerciseText}
            >
              {exercise.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const saveButton = (
    <TouchableOpacity
      testID="button-save-training-day"
      style={[
        addTrainingDayStyles.button,
        isButtonDisabled && addTrainingDayStyles.buttonDisabled,
      ]}
      onPress={saveTrainingDay}
      disabled={isButtonDisabled}
    >
      <Text style={addTrainingDayStyles.buttonText} testID="button-save-training-day-text">
        {isEditMode ? "Guardar cambios" : "Guardar día de entreno"}
      </Text>
    </TouchableOpacity>
  );

  /* Show loading while initializing edit mode */
  if (isInitializing) {
    return (
      <View style={addTrainingDayStyles.container}>
        <RadialGradientBackground />
        <View style={addTrainingDayStyles.exercisesLoading}>
          <Text style={addTrainingDayStyles.exercisesLoadingText}>
            Cargando día de entreno...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={addTrainingDayStyles.container}>
      <RadialGradientBackground />
      <ScrollView>
        {titleSection}
        {nameInputSection}
        
        {exercisesLoading ? exercisesLoadingSection : (
          exercises.length === 0 ? exercisesEmptySection : exercisesSection
        )}
      </ScrollView>
      {saveButton}
    </View>
  );
};

export default AddTrainingDayPage;