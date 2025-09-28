/* Training Session Hook - Based on original FITito project logic */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingSessionApi } from '../services/trainingSessionApi';
import { useWeekSchedule } from '@/features/routines/hooks';
import { 
  TrainingSession, 
  CreateTrainingSessionRequest, 
  UpdateProgressRequest, 
  CompleteSessionRequest,
  PerformedSet,
  TrainingSessionUIState
} from '../types';

export const useTrainingSession = (profileId: number) => {
  const queryClient = useQueryClient();
  const { markDayCompleted } = useWeekSchedule();
  
  // UI state management
  const [uiState, setUIState] = useState<TrainingSessionUIState>({
    currentExerciseIndex: 0,
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,
    buttonsActive: {}
  });

  // Get active training session
  const { 
    data: activeSession, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['activeTrainingSession', profileId],
    queryFn: () => trainingSessionApi.getActiveSession(profileId),
    refetchInterval: 30000, // Refetch every 30 seconds to keep session alive
    retry: 1
  });

  // Create new training session
  const createSessionMutation = useMutation({
    mutationFn: trainingSessionApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTrainingSession', profileId] });
    }
  });

  // Note: updateProgress removed - using local state instead

  // Complete session
  const completeSessionMutation = useMutation({
    mutationFn: ({ sessionId, completionData }: { sessionId: number; completionData?: CompleteSessionRequest }) =>
      trainingSessionApi.completeSession(sessionId, completionData),
    onSuccess: () => {
      // Invalidate training session queries
      queryClient.invalidateQueries({ queryKey: ['activeTrainingSession', profileId] });
      queryClient.invalidateQueries({ queryKey: ['workoutSessions', profileId] });
      
      // CRITICAL: Invalidate routine-weeks to update day completion status
      queryClient.invalidateQueries({ queryKey: ['routine-weeks', profileId] });
      
      // Invalidate workout history queries to show completed sessions immediately
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });
    }
  });

  // Cancel session
  const cancelSessionMutation = useMutation({
    mutationFn: trainingSessionApi.cancelSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTrainingSession', profileId] });
    }
  });

  // Initialize button states based on exercise configuration
  const initializeButtonStates = useCallback((session: TrainingSession) => {
    const buttonsActive: Record<string, boolean> = {};
    
    session.exercises.forEach((exercise, exerciseIndex) => {
      exercise.planned_sets.forEach((set, setIndex) => {
        if (set.rp && set.rp.length > 0) {
          const keyRP = `${exerciseIndex}-${setIndex}-RP`;
          buttonsActive[keyRP] = true;
        }
        if (set.ds && set.ds.length > 0) {
          const keyDS = `${exerciseIndex}-${setIndex}-DS`;
          buttonsActive[keyDS] = true;
        }
        if (set.partials) {
          const keyP = `${exerciseIndex}-${setIndex}-P`;
          buttonsActive[keyP] = true;
        }
      });
    });
    
    setUIState(prev => ({ 
      ...prev, 
      buttonsActive,
      currentExerciseIndex: session.current_exercise_index || 0
    }));
  }, []);

  // Update UI state when session changes
  useEffect(() => {
    if (activeSession) {
      initializeButtonStates(activeSession);
    }
  }, [activeSession, initializeButtonStates]);

  // Create session wrapper
  const createSession = useCallback(async (sessionData: CreateTrainingSessionRequest) => {
    setUIState(prev => ({ ...prev, isLoading: true }));
    try {
      await createSessionMutation.mutateAsync(sessionData);
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
    }
  }, [createSessionMutation]);

  // updateProgress removed - components now use local state

  // Complete session wrapper
  const completeSession = useCallback(async (completionData?: CompleteSessionRequest) => {
    console.log('🎯 [Hook] Starting completeSession:', {
      hasActiveSession: !!activeSession,
      activeSessionId: activeSession?.id,
      activeSessionIdType: typeof activeSession?.id,
      completionData
    });

    if (!activeSession) {
      const error = 'No active session available to complete';
      console.error('❌ [Hook] Complete session failed:', error);
      throw new Error(error);
    }

    if (!activeSession.id) {
      const error = `Active session has invalid ID: ${activeSession.id}`;
      console.error('❌ [Hook] Complete session failed:', error);
      throw new Error(error);
    }
    
    setUIState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🚀 [Hook] Calling mutation with sessionId:', activeSession.id);
      const result = await completeSessionMutation.mutateAsync({
        sessionId: activeSession.id,
        completionData
      });
      console.log('✅ [Hook] Session completed successfully:', result);
      
      // Mark day as completed in routine schedule
      if (activeSession.day_name) {
        console.log('📅 [Hook] Marking day as completed:', activeSession.day_name);
        await markDayCompleted(activeSession.day_name);
        console.log('✅ [Hook] Day marked as completed successfully');
      } else {
        console.warn('⚠️ [Hook] No day_name found in activeSession, cannot mark day as completed');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [Hook] Complete session failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        activeSessionId: activeSession.id
      });
      throw error;
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
    }
  }, [activeSession, completeSessionMutation]);

  // Cancel session wrapper
  const cancelSession = useCallback(async () => {
    if (!activeSession) return;
    
    setUIState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await cancelSessionMutation.mutateAsync(activeSession.id);
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
    }
  }, [activeSession, cancelSessionMutation]);

  // Navigate between exercises
  const setCurrentExerciseIndex = useCallback((index: number) => {
    setUIState(prev => ({ ...prev, currentExerciseIndex: index }));
    
    // No backend update needed - using local state only
  }, []);

  // Toggle advanced technique buttons
  const toggleButton = useCallback((exerciseIndex: number, setIndex: number, type: 'RP' | 'DS' | 'P') => {
    const key = `${exerciseIndex}-${setIndex}-${type}`;
    
    setUIState(prev => ({
      ...prev,
      buttonsActive: {
        ...prev.buttonsActive,
        [key]: !prev.buttonsActive[key]
      },
      hasUnsavedChanges: true
    }));
  }, []);

  // Check if all required inputs are filled for current exercise
  const isCurrentExerciseComplete = useCallback(() => {
    if (!activeSession || !activeSession.exercises[uiState.currentExerciseIndex]) {
      return false;
    }
    
    const currentExercise = activeSession.exercises[uiState.currentExerciseIndex];
    
    return currentExercise.planned_sets.every((plannedSet, setIndex) => {
      const performedSet = currentExercise.performed_sets[setIndex];
      
      if (!performedSet || !performedSet.reps || !performedSet.weight || !performedSet.rir) {
        return false;
      }
      
      // Check advanced techniques if they're active
      const rpKey = `${uiState.currentExerciseIndex}-${setIndex}-RP`;
      const dsKey = `${uiState.currentExerciseIndex}-${setIndex}-DS`;
      const pKey = `${uiState.currentExerciseIndex}-${setIndex}-P`;
      
      if (uiState.buttonsActive[rpKey] && (!performedSet.rp || performedSet.rp.length === 0)) {
        return false;
      }
      
      if (uiState.buttonsActive[dsKey] && (!performedSet.ds || performedSet.ds.length === 0)) {
        return false;
      }
      
      if (uiState.buttonsActive[pKey] && (!performedSet.partials || !performedSet.partials.reps)) {
        return false;
      }
      
      return true;
    });
  }, [activeSession, uiState.currentExerciseIndex, uiState.buttonsActive]);

  return {
    // Data
    activeSession,
    isLoading: isLoading || uiState.isLoading,
    isSaving: uiState.isSaving,
    error,
    
    // UI State
    currentExerciseIndex: uiState.currentExerciseIndex,
    hasUnsavedChanges: uiState.hasUnsavedChanges,
    buttonsActive: uiState.buttonsActive,
    
    // Actions
    createSession,
    completeSession,
    cancelSession,
    refetch,
    
    // Navigation
    setCurrentExerciseIndex,
    toggleButton,
    
    // Validation
    isCurrentExerciseComplete,
    
    // Mutation states
    isCreating: createSessionMutation.isPending,
    isCompleting: completeSessionMutation.isPending,
    isCancelling: cancelSessionMutation.isPending
  };
};