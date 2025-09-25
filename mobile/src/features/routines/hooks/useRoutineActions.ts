import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { routineApi } from '../services';
import { CreateWorkoutSessionDto, WorkoutSession } from '../types';
import { useProfile } from '@/features/profile';

export const useRoutineActions = () => {
  const { profileId } = useProfile();
  const queryClient = useQueryClient();
  const router = useRouter();

  /* Queries */
  const { 
    data: workoutSessions = [], 
    isLoading: isLoadingSessions 
  } = useQuery({
    queryKey: ['workout-sessions', profileId],
    queryFn: () => routineApi.getWorkoutSessions(profileId),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { 
    data: workoutHistory = [], 
    isLoading: isLoadingHistory 
  } = useQuery({
    queryKey: ['workout-history', profileId],
    queryFn: () => routineApi.getWorkoutHistory(profileId),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /* Mutations */
  const createSessionMutation = useMutation({
    mutationFn: (session: CreateWorkoutSessionDto) => 
      routineApi.createWorkoutSession(session),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions', profileId] });
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      
      Toast.show({
        type: 'success',
        text1: 'Sesión creada',
        text2: 'Sesión de entrenamiento iniciada',
      });
      
      // Navigate to session screen
      router.push({
        pathname: '/(tabs)/rutina/sesion-de-entrenamiento',
        params: { sessionId: newSession.id.toString() }
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al crear sesión',
        text2: error.message,
      });
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: ({ sessionId, profileId: pid }: { sessionId: number, profileId: number }) =>
      routineApi.completeWorkoutSession(sessionId, pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions', profileId] });
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      queryClient.invalidateQueries({ queryKey: ['workout-history', profileId] });
      
      Toast.show({
        type: 'success',
        text1: 'Sesión completada',
        text2: '¡Excelente trabajo!',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al completar sesión',
        text2: error.message,
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: ({ sessionId, profileId: pid }: { sessionId: number, profileId: number }) =>
      routineApi.deleteWorkoutSession(sessionId, pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions', profileId] });
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      
      Toast.show({
        type: 'success',
        text1: 'Sesión eliminada',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al eliminar sesión',
        text2: error.message,
      });
    },
  });

  /* Actions */
  const createWorkoutSession = useCallback(async (sessionData: Omit<CreateWorkoutSessionDto, 'profile_id'>) => {
    if (!profileId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Perfil no seleccionado',
      });
      return;
    }

    createSessionMutation.mutate({
      ...sessionData,
      profile_id: profileId,
    });
  }, [profileId, createSessionMutation]);

  const completeWorkoutSession = useCallback(async (sessionId: number) => {
    if (!profileId) return;

    Alert.alert(
      'Completar sesión',
      '¿Estás seguro de que quieres completar esta sesión de entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          style: 'default',
          onPress: () => completeSessionMutation.mutate({ sessionId, profileId }),
        },
      ]
    );
  }, [profileId, completeSessionMutation]);

  const deleteWorkoutSession = useCallback(async (sessionId: number) => {
    if (!profileId) return;

    Alert.alert(
      'Eliminar sesión',
      '¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteSessionMutation.mutate({ sessionId, profileId }),
        },
      ]
    );
  }, [profileId, deleteSessionMutation]);

  const startWorkoutSession = useCallback((dayName: string, routineName: string) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const sessionData = {
      routine_name: routineName,
      day_of_week: dayOfWeek,
      day_name: dayName,
      session_date: today.toISOString().split('T')[0],
      exercises: [], // Will be populated during the session
    };

    createWorkoutSession(sessionData);
  }, [createWorkoutSession]);

  const getSessionById = useCallback((sessionId: number) => {
    return workoutSessions.find(session => session.id === sessionId);
  }, [workoutSessions]);

  const getTodaysSession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return workoutSessions.find(session => 
      session.session_date === today && !session.is_completed
    );
  }, [workoutSessions]);

  return {
    // Data
    workoutSessions,
    workoutHistory,
    
    // States
    isLoadingSessions,
    isLoadingHistory,
    isCreating: createSessionMutation.isPending,
    isCompleting: completeSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
    
    // Actions
    createWorkoutSession,
    completeWorkoutSession,
    deleteWorkoutSession,
    startWorkoutSession,
    
    // Getters
    getSessionById,
    getTodaysSession,
  };
};