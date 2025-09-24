import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Exercise } from '../types';

export const useExerciseNavigation = () => {
  const router = useRouter();

  /* Navigation handlers */
  const navigateToAddExercise = useCallback(() => {
    router.push("/ejercicios/anadir-ejercicio");
  }, [router]);

  const navigateToEditExercise = useCallback((exercise: Exercise) => {
    router.push({
      pathname: "/ejercicios/anadir-ejercicio",
      params: { 
        name: exercise.name, 
        image: exercise.image 
      },
    });
  }, [router]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    navigateToAddExercise,
    navigateToEditExercise,
    goBack,
  };
};