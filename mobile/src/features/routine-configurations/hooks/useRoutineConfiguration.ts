import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { routineConfigurationApi } from '../services/routineConfigurationApi';
import {
  RoutineDayConfiguration,
  ExerciseConfiguration,
  UpdateRoutineConfigurationDto,
  InitializeRoutineConfigurationDto
} from '../types/routineConfiguration';

export const useRoutineConfiguration = (routineWeekId: number, profileId: number) => {
  const queryClient = useQueryClient();

  // Get configuration
  const {
    data: configuration,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['routine-configuration', routineWeekId, profileId],
    queryFn: () => routineConfigurationApi.getConfiguration(routineWeekId, profileId),
    enabled: !!routineWeekId && !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize configuration mutation
  const initializeMutation = useMutation({
    mutationFn: (data: InitializeRoutineConfigurationDto) =>
      routineConfigurationApi.initializeConfiguration(routineWeekId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['routine-configuration', routineWeekId, profileId] 
      });
      Toast.show({
        type: 'success',
        text1: 'Configuración inicializada',
        text2: 'Los ejercicios han sido configurados desde el día de entrenamiento',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al inicializar',
        text2: error.message || 'No se pudo inicializar la configuración',
      });
    },
  });

  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoutineConfigurationDto) =>
      routineConfigurationApi.updateConfiguration(routineWeekId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['routine-configuration', routineWeekId, profileId] 
      });
      Toast.show({
        type: 'success',
        text1: 'Configuración guardada',
        text2: 'Los cambios han sido guardados correctamente',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al guardar',
        text2: error.message || 'No se pudo guardar la configuración',
      });
    },
  });

  // Delete configuration mutation
  const deleteMutation = useMutation({
    mutationFn: () => routineConfigurationApi.deleteConfiguration(routineWeekId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['routine-configuration', routineWeekId, profileId] 
      });
      Toast.show({
        type: 'success',
        text1: 'Configuración eliminada',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al eliminar',
        text2: error.message || 'No se pudo eliminar la configuración',
      });
    },
  });

  return {
    // Data
    configuration,
    exercises: configuration?.exercises || [],
    routineWeek: configuration?.routine_week,

    // States
    isLoading: isLoading || initializeMutation.isPending,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error,

    // Actions
    initializeConfiguration: (trainingDayId: number) =>
      initializeMutation.mutate({
        profile_id: profileId,
        training_day_id: trainingDayId,
      }),
    
    updateConfiguration: (exercises: ExerciseConfiguration[]) =>
      updateMutation.mutate({
        profile_id: profileId,
        exercises: exercises.map(exercise => ({
          exercise_id: exercise.exercise_id,
          training_day_id: exercise.training_day_id,
          sets_config: exercise.sets_config,
          notes: exercise.notes,
        })),
      }),

    deleteConfiguration: () => deleteMutation.mutate(),
    
    refetch,
  };
};