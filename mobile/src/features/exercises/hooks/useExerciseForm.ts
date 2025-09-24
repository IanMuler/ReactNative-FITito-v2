import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  validateExerciseForm, 
  normalizeFormData,
  validateExerciseName,
  validateExerciseImage 
} from '../utils';
import { CreateExerciseDto, Exercise } from '../types';
import { useExerciseActions, useExerciseList } from './';
import Toast from 'react-native-toast-message';

interface ExerciseFormParams {
  id?: string;
  name?: string;
  image?: string;
}

export const useExerciseForm = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as ExerciseFormParams;
  
  /* Business Logic Hooks */
  const { exercises } = useExerciseList();
  const { createExercise, updateExercise } = useExerciseActions();
  
  /* Form state */
  const [exerciseName, setExerciseName] = useState(params.name || "");
  const [exerciseImage, setExerciseImage] = useState<string | null>(params.image || null);
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({});
  
  /* Derived state */
  const isEditing = !!params.id;
  const exerciseId = params.id ? parseInt(params.id) : undefined;
  
  /* Duplicate name validation */
  const checkDuplicateName = useCallback((name: string): boolean => {
    if (!name.trim()) return false;
    
    const nameExists = exercises.some(
      (exercise: Exercise) => 
        exercise.name.toLowerCase() === name.toLowerCase() && 
        exercise.name !== params.name
    );
    
    return nameExists;
  }, [exercises, params.name]);

  /* Form validation */
  const validateField = useCallback((field: 'name' | 'image', value: string | null) => {
    let validation;
    
    switch (field) {
      case 'name':
        validation = validateExerciseName(value || '');
        break;
      case 'image':
        validation = validateExerciseImage(value);
        break;
      default:
        return;
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: validation.error
    }));
    
    return validation.isValid;
  }, []);
  
  const validateForm = useCallback((): boolean => {
    const formData: CreateExerciseDto = {
      name: exerciseName,
      image: exerciseImage || '',
    };
    
    // Check for duplicate names
    if (checkDuplicateName(exerciseName)) {
      const duplicateError = "Ya existe un ejercicio con ese nombre.";
      setErrors(prev => ({ ...prev, name: duplicateError }));
      Alert.alert("Error", duplicateError);
      return false;
    }
    
    const validation = validateExerciseForm(formData);
    setErrors(validation.errors);
    
    if (!validation.isValid) {
      const firstError = validation.errors.name || validation.errors.image;
      if (firstError) {
        Alert.alert("Error de validación", firstError);
      }
    }
    
    return validation.isValid;
  }, [exerciseName, exerciseImage, checkDuplicateName]);
  
  /* Form handlers */
  const handleNameChange = useCallback((name: string) => {
    setExerciseName(name);
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  }, [errors.name]);
  
  const handleImageChange = useCallback((imageUri: string | null) => {
    setExerciseImage(imageUri);
    // Clear image error when user selects image
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  }, [errors.image]);
  
  const resetForm = useCallback(() => {
    setExerciseName('');
    setExerciseImage(null);
    setErrors({});
  }, []);
  
  const getFormData = useCallback((): CreateExerciseDto | null => {
    if (!validateForm()) {
      return null;
    }
    
    return normalizeFormData({
      name: exerciseName,
      image: exerciseImage || '',
    });
  }, [exerciseName, exerciseImage, validateForm]);
  
  /* Save operations */
  const saveExercise = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    const formData = getFormData();
    if (!formData) {
      return false;
    }

    try {
      if (isEditing && params.name) {
        // Editing existing exercise - find by name and update
        const exerciseToUpdate = exercises.find(ex => ex.name === params.name);
        if (exerciseToUpdate) {
          await updateExercise(exerciseToUpdate.id, formData);
          Toast.show({
            type: 'success',
            text1: 'Ejercicio actualizado',
            text2: 'Los cambios se han guardado correctamente',
          });
        }
      } else {
        // Creating new exercise
        await createExercise(formData);
        Toast.show({
          type: 'success',
          text1: 'Ejercicio creado',
          text2: 'El ejercicio se ha añadido correctamente',
        });
      }
      
      router.back();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return false;
    }
  }, [validateForm, getFormData, isEditing, params.name, exercises, updateExercise, createExercise, router]);

  /* Navigation helpers */
  const goBack = useCallback(() => {
    router.back();
  }, [router]);
  
  /* Effects */
  useEffect(() => {
    if (params.name && params.image) {
      setExerciseName(params.name);
      setExerciseImage(params.image);
    }
  }, [params.name, params.image]);
  
  /* Computed values */
  const isFormValid = exerciseName.trim() && exerciseImage && Object.keys(errors).length === 0;
  const hasChanges = exerciseName !== (params.name || '') || exerciseImage !== (params.image || null);
  
  return {
    // State
    exerciseName,
    exerciseImage,
    errors,
    isEditing,
    exerciseId,
    
    // Computed
    isFormValid,
    hasChanges,
    
    // Handlers
    handleNameChange,
    handleImageChange,
    validateField,
    validateForm,
    resetForm,
    getFormData,
    saveExercise,
    goBack,
    
    // Validation helpers
    checkDuplicateName,
  };
};