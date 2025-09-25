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
    queryFn: () => routineApi.getWeekSchedule(profileId),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
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
    
    return routineWeeks.map(routineWeek => ({
      name: routineWeek.day_name,
      rest: routineWeek.is_rest_day,
      trainingDayName: routineWeek.routine_id ? `Rutina ${routineWeek.routine_id}` : undefined, // TODO: Get actual routine name
      completedDate: routineWeek.completed_date,
    }));
  }, [routineWeeks]);

  /* Current day calculations */
  const currentDayIndex = useMemo(() => {
    const today = new Date().getDay();
    // Convert Sunday=0 to Monday=1 indexing
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
    return day.completedDate === getTodayString();
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
      }
    });
  }, [routineWeeks, updateWeekMutation]);

  const assignRoutineToDay = useCallback(async (dayName: string, routineId: number) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        routine_id: routineId,
        is_rest_day: false,
      }
    });
  }, [routineWeeks, updateWeekMutation]);

  const removeRoutineFromDay = useCallback(async (dayName: string) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        routine_id: null,
        completed_date: null, // Also clear completion status
      }
    });
  }, [routineWeeks, updateWeekMutation]);

  const markDayCompleted = useCallback(async (dayName: string) => {
    const routineWeek = routineWeeks.find(rw => rw.day_name === dayName);
    if (!routineWeek) return;

    const completedDate = getTodayString();
    
    updateWeekMutation.mutate({
      routineWeekId: routineWeek.id,
      update: {
        completed_date: completedDate,
      }
    });
  }, [routineWeeks, updateWeekMutation]);

  /* Initialize schedule if empty */
  useEffect(() => {
    if (profileId && !isLoading && !routineWeeks.length && !error) {
      initializeMutation.mutate();
    }
  }, [profileId, isLoading, routineWeeks.length, error]);

  return {
    // Data
    days,
    currentDayIndex,
    currentWeek,
    month,
    year,
    
    // States
    isLoading: isLoading || initializeMutation.isPending,
    error,
    isUpdating: updateWeekMutation.isPending,
    
    // Helpers
    getTodayString,
    isDayCompletedToday,
    
    // Actions
    toggleRestDay,
    assignRoutineToDay,
    removeRoutineFromDay,
    markDayCompleted,
    initializeSchedule: () => initializeMutation.mutate(),
  };
};