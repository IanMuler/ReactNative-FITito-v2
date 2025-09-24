import { Exercise } from '../types';

/* Exercise formatting utilities */
export const normalizeExerciseName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
};

export const formatExerciseTitle = (name: string): string => {
  return normalizeExerciseName(name);
};

export const getDisplayName = (exercise: Exercise): string => {
  return formatExerciseTitle(exercise.name);
};

/* Date formatting utilities */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Hace unos segundos';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCreatedDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* Form data formatting */
export const normalizeFormData = (data: { name: string; image: string }): { name: string; image: string } => {
  return {
    name: normalizeExerciseName(data.name),
    image: data.image.trim(),
  };
};

/* Display data utilities */
export interface DisplayExercise extends Exercise {
  displayName: string;
  timeAgo: string;
  formattedDate: string;
}

export const transformExerciseForDisplay = (exercise: Exercise): DisplayExercise => {
  return {
    ...exercise,
    displayName: getDisplayName(exercise),
    timeAgo: formatTimeAgo(exercise.created_at),
    formattedDate: formatCreatedDate(exercise.created_at),
  };
};

export const transformExercisesForDisplay = (exercises: Exercise[]): DisplayExercise[] => {
  return exercises.map(transformExerciseForDisplay);
};