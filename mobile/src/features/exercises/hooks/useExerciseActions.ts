import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { exerciseApi } from '../services';
import { CreateExerciseDto, UpdateExerciseDto } from '../types';

export const useExerciseActions = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  /* Create mutation */
  const createMutation = useMutation({
    mutationFn: exerciseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Toast.show({
        type: 'success',
        text1: 'Ejercicio creado',
        text2: 'El ejercicio se creó correctamente',
      });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Error al crear el ejercicio',
      });
    },
  });

  /* Update mutation */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateExerciseDto }) => 
      exerciseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Toast.show({
        type: 'success',
        text1: 'Ejercicio actualizado',
        text2: 'El ejercicio se actualizó correctamente',
      });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Error al actualizar el ejercicio',
      });
    },
  });

  /* Delete mutation */
  const deleteMutation = useMutation({
    mutationFn: exerciseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Toast.show({
        type: 'success',
        text1: 'Ejercicio eliminado',
        text2: 'El ejercicio se eliminó correctamente',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo eliminar el ejercicio',
      });
    },
  });

  /* Action handlers */
  const createExercise = (data: CreateExerciseDto) => {
    createMutation.mutate(data);
  };

  const updateExercise = (id: number, data: UpdateExerciseDto) => {
    updateMutation.mutate({ id, data });
  };

  const deleteExercise = (id: number) => {
    deleteMutation.mutate(id);
  };

  return {
    createExercise,
    updateExercise,
    deleteExercise,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};