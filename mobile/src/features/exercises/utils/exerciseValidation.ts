import { Exercise, CreateExerciseDto } from '../types';

/* Exercise validation utilities */
export const validateExerciseName = (name: string): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'El nombre del ejercicio es requerido' };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'El nombre no puede tener más de 50 caracteres' };
  }
  
  return { isValid: true };
};

export const validateExerciseImage = (imageUri: string | null): { isValid: boolean; error?: string } => {
  if (!imageUri || !imageUri.trim()) {
    return { isValid: false, error: 'La imagen del ejercicio es requerida' };
  }
  
  return { isValid: true };
};

export const validateExerciseForm = (data: CreateExerciseDto): { 
  isValid: boolean; 
  errors: { name?: string; image?: string; } 
} => {
  const nameValidation = validateExerciseName(data.name);
  const imageValidation = validateExerciseImage(data.image);
  
  return {
    isValid: nameValidation.isValid && imageValidation.isValid,
    errors: {
      ...(nameValidation.error && { name: nameValidation.error }),
      ...(imageValidation.error && { image: imageValidation.error }),
    }
  };
};

export const isDuplicateExercise = (
  newExercise: CreateExerciseDto, 
  existingExercises: Exercise[],
  excludeId?: number
): boolean => {
  return existingExercises.some(exercise => 
    exercise.id !== excludeId && 
    exercise.name.toLowerCase().trim() === newExercise.name.toLowerCase().trim()
  );
};

/* Image validation utilities */
export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isLocalImageUri = (uri: string): boolean => {
  return uri.startsWith('file://') || uri.startsWith('content://');
};