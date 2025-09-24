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

interface ExerciseFormParams {
  id?: string;
  name?: string;
  image?: string;
}

export const useExerciseForm = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as ExerciseFormParams;
  
  /* Form state */
  const [exerciseName, setExerciseName] = useState(params.name || "");
  const [exerciseImage, setExerciseImage] = useState<string | null>(params.image || null);
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({});
  
  /* Derived state */
  const isEditing = !!params.id;
  const exerciseId = params.id ? parseInt(params.id) : undefined;
  
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
    
    const validation = validateExerciseForm(formData);
    setErrors(validation.errors);
    
    if (!validation.isValid) {
      const firstError = validation.errors.name || validation.errors.image;
      if (firstError) {
        Alert.alert("Error de validación", firstError);
      }
    }
    
    return validation.isValid;
  }, [exerciseName, exerciseImage]);
  
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
    goBack,
  };
};