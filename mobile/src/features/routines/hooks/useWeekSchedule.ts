import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { routineApi } from '../services';
import { Day, DAY_NAMES, MONTH_NAMES } from '../types';
import { useProfile } from '@/features/profile';

export const useWeekSchedule = () => {
  const { currentProfile, profileId } = useProfile();
  const queryClient = useQueryClient();

  /* Queries */
  const { 
    data: routineWeeks = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['routine-weeks', profileId],
    queryFn: () => {
      console.log('🔄 Fetching routine weeks for profileId:', profileId);
      return routineApi.getWeekSchedule(profileId);
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      console.log('✅ Routine weeks loaded:', data);
      data.forEach((week, index) => {
        console.log(`📅 Day ${index + 1}: ${week.day_name} - ID: ${week.id} - Routine: ${week.routine_id} - Rest: ${week.is_rest_day}`);
      });
    },
    onError: (error) => {
      console.error('❌ Error loading routine weeks:', error);
    }
  });

  /* Mutations */
  const initializeMutation = useMutation({
    mutationFn: () => routineApi.initializeWeekSchedule(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      Toast.show({
        type: 'success',
        text1: 'Horario semanal inicializado',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al inicializar horario',
        text2: error.message,
      });
    },
  });

  const updateWeekMutation = useMutation({
    mutationFn: ({ routineWeekId, update }: { routineWeekId: number, update: any }) =>
      routineApi.updateRoutineWeek(routineWeekId, update),
    onSuccess: (data, variables: { routineWeekId: number, update: any, operationType?: string }) => {
      console.log('✅ UpdateWeekMutation success:', {
        operationType: variables.operationType,
        routineWeekId: variables.routineWeekId,
        update: variables.update,
        response: data
      });
      
      console.log('🔄 Invalidating queries with key:', ['routine-weeks', profileId]);
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      
      // Show success toast based on operation type
      const { operationType } = variables;
      let successMessage = 'Día actualizado correctamente';
      
      switch (operationType) {
        case 'remove':
          successMessage = 'Día de entreno eliminado correctamente';
          break;
        case 'assign':
          successMessage = 'Rutina asignada correctamente';
          break;
        case 'toggle':
          successMessage = 'Día de descanso actualizado';
          break;
        case 'complete':
          successMessage = 'Día marcado como completado';
          break;
      }
      
      Toast.show({
        type: 'success',
        text1: successMessage,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al actualizar día',
        text2: error.message,
      });
    },
  });

  /* Derived data - Convert backend data to UI format */
  const days: Day[] = useMemo(() => {
    if (!routineWeeks.length) return [];
    
    // Sort backend data by day_of_week first
    const sortedWeeks = [...routineWeeks].sort((a, b) => a.day_of_week - b.day_of_week);
    
    // Reorder from backend format (Sunday=0, Monday=1) to UI format (Monday=0, Sunday=6)
    const reorderedWeeks = [
      ...sortedWeeks.slice(1), // Monday(1) to Saturday(6)
      sortedWeeks[0]            // Sunday(0) goes to end
    ];
    
    return reorderedWeeks.map(routineWeek => ({
      name: routineWeek.day_name,
      rest: routineWeek.is_rest_day,
      trainingDayName: routineWeek.routine_name || (
        routineWeek.routine_id ? `Rutina ${routineWeek.routine_id}` : undefined
      ),
      completedDate: routineWeek.completed_date,
    }));
  }, [routineWeeks]);

  /* Current day calculations */
  const currentDayIndex = useMemo(() => {
    const today = new Date().getDay();
    // Convert to Monday=0, Tuesday=1, ..., Sunday=6 indexing
    return today === 0 ? 6 : today - 1;
  }, []);

  const currentWeek = Math.ceil(new Date().getDate() / 7);
  const month = MONTH_NAMES[new Date().getMonth()];
  const year = new Date().getFullYear();

  /* Helper functions */
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isDayCompletedToday = useCallback((day: Day) => {
    if (!day.completedDate) return false;
    
    // Handle both ISO timestamp and date string formats
    const completedDateStr = typeof day.completedDate === 'string' 
      ? day.completedDate.split('T')[0]  // Extract date part from ISO timestamp
      : day.completedDate;
    
    return completedDateStr === getTodayString();
  }, []);

  /* Actions */
  const toggleRestDay = useCallback(async (day: Day) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === day.name);
    if (!routineWeek) return;

    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        is_rest_day: !routineWeek.is_rest_day,
        routine_id: routineWeek.is_rest_day ? null : routineWeek.routine_id, // Clear routine if becoming rest day
        profile_id: profileId,
      },
      operationType: 'toggle'
    });
  }, [routineWeeks, updateWeekMutation, profileId]);

  const assignRoutineToDay = useCallback(async (dayName: string, routineId: number) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        routine_id: routineId,
        is_rest_day: false,
        profile_id: profileId,
      },
      operationType: 'assign'
    });
  }, [routineWeeks, updateWeekMutation, profileId]);

  const assignTrainingDayToDay = useCallback(async (dayName: string, trainingDayId: number) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        training_day_id: trainingDayId,
        is_rest_day: false,
        profile_id: profileId,
      },
      operationType: 'assign'
    });
  }, [routineWeeks, updateWeekMutation, profileId]);

  const removeRoutineFromDay = useCallback(async (dayName: string) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    // Use the unified DELETE configuration endpoint to completely clear the day
    try {
      const response = await fetch(`http://192.168.1.50:3000/api/v1/routine-weeks/${routineWeek.id}/configuration?profile_id=${profileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete routine configuration');
      }
      
      // Invalidate routine weeks query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      
      Toast.show({
        type: 'success',
        text1: 'Entreno eliminado correctamente',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error al eliminar entreno',
        text2: error.message,
      });
    }
  }, [routineWeeks, profileId, queryClient]);

  const markDayCompleted = useCallback(async (dayName: string) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    const completedDate = getTodayString();
    
    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        completed_date: completedDate,
        profile_id: profileId,
      },
      operationType: 'complete'
    });
  }, [routineWeeks, updateWeekMutation, profileId]);

  /* Initialize schedule if empty */
  useEffect(() => {
    if (profileId && !isLoading && !routineWeeks.length && !error) {
      initializeMutation.mutate();
    }
  }, [profileId, isLoading, routineWeeks.length, error]);

  /* Helper to get routine week info for current day */
  const getCurrentRoutineWeekInfo = useCallback(() => {
    if (!routineWeeks.length) return null;
    
    // Convert UI currentDayIndex back to backend day_of_week
    // currentDayIndex: Monday=0, Tuesday=1, ..., Sunday=6
    // backend day_of_week: Sunday=0, Monday=1, ..., Saturday=6
    const backendDayOfWeek = currentDayIndex === 6 ? 0 : currentDayIndex + 1;
    
    // Find the routine week that matches this day_of_week
    const routineWeek = routineWeeks.find(rw => rw.day_of_week === backendDayOfWeek);
    
    console.log('🗓️ getCurrentRoutineWeekInfo:', {
      currentDayIndex,
      backendDayOfWeek,
      routineWeekId: routineWeek?.id,
      dayName: routineWeek?.day_name,
      hasExercises: routineWeek ? (routineWeek.exercises_config?.length || 0) > 0 : false
    });
    
    return routineWeek ? {
      id: routineWeek.id,
      day_of_week: routineWeek.day_of_week,
      day_name: routineWeek.day_name,
      routine_name: routineWeek.routine_name,
      exercises_config: routineWeek.exercises_config || []
    } : null;
  }, [routineWeeks, currentDayIndex]);

  /* Helper to get routine week ID for current day (backward compatibility) */
  const getCurrentRoutineWeekId = useCallback(() => {
    const info = getCurrentRoutineWeekInfo();
    return info?.id || null;
  }, [getCurrentRoutineWeekInfo]);

  /* Helper to convert day_of_week from routine_weeks format (0-6) to training_sessions format (1-7) */
  const convertDayOfWeekForTrainingSession = useCallback((routineWeekDayOfWeek: number): number => {
    // routine_weeks: Sunday=0, Monday=1, ..., Saturday=6
    // AsyncStorage training_sessions: Monday=1, Tuesday=2, ..., Sunday=7
    if (routineWeekDayOfWeek === 0) {
      return 7; // Sunday: 0 -> 7
    }
    return routineWeekDayOfWeek; // Monday-Saturday: 1-6 -> 1-6
  }, []);

  return {
    // Data
    days,
    currentDayIndex,
    currentWeek,
    month,
    year,
    routineWeeks, // Add raw routine weeks data
    
    // States
    isLoading: isLoading || initializeMutation.isPending,
    error,
    isUpdating: updateWeekMutation.isPending,
    
    // Helpers
    getTodayString,
    isDayCompletedToday,
    getCurrentRoutineWeekId,
    getCurrentRoutineWeekInfo,
    convertDayOfWeekForTrainingSession,
    
    // Actions
    toggleRestDay,
    assignRoutineToDay,
    assignTrainingDayToDay,
    removeRoutineFromDay,
    markDayCompleted,
    initializeSchedule: () => initializeMutation.mutate(),
  };
};