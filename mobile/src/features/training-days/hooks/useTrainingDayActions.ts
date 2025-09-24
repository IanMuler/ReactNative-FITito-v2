import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { trainingDayApi } from '../services';
import { CreateTrainingDayDto, UpdateTrainingDayDto } from '../types';
import { useProfile } from '@/features/profile';

export const useTrainingDayActions = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentProfile } = useProfile();

  /* Create mutation */
  const createMutation = useMutation({
    mutationFn: trainingDayApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingDays'] });
      Toast.show({
        type: 'success',
        text1: 'Día de entreno creado',
        text2: 'El día se creó correctamente',
      });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Error al crear el día de entreno',
      });
    },
  });

  /* Update mutation */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTrainingDayDto }) => 
      trainingDayApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingDays'] });
      Toast.show({
        type: 'success',
        text1: 'Día actualizado',
        text2: 'El día se actualizó correctamente',
      });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Error al actualizar el día de entreno',
      });
    },
  });

  /* Delete mutation */
  const deleteMutation = useMutation({
    mutationFn: ({ id, profileId }: { id: number; profileId: number }) => 
      trainingDayApi.delete(id, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingDays'] });
      Toast.show({
        type: 'success',
        text1: 'Día eliminado',
        text2: 'El día se eliminó correctamente',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo eliminar el día de entreno',
      });
    },
  });

  /* Action handlers */
  const createTrainingDay = (data: CreateTrainingDayDto) => {
    createMutation.mutate(data);
  };

  const updateTrainingDay = (id: number, data: UpdateTrainingDayDto) => {
    updateMutation.mutate({ id, data });
  };

  const deleteTrainingDay = (id: number) => {
    if (!currentProfile) return;
    deleteMutation.mutate({ id, profileId: currentProfile.id });
  };

  return {
    createTrainingDay,
    updateTrainingDay,
    deleteTrainingDay,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};