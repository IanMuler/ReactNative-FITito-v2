import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { TrainingSessionAsyncStorage } from '../services/asyncStorageService';
import { 
  TrainingSession, 
  CreateTrainingSessionRequest, 
  UpdateSetProgressRequest,
  SessionProgress,
  TrainingSessionStatus 
} from '../types';

export const useTrainingSession = (profileId?: number) => {
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active session when hook initializes or screen focuses
  const loadActiveSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!profileId) {
        setActiveSession(null);
        return;
      }

      const session = await TrainingSessionAsyncStorage.getActiveSession(profileId);
      setActiveSession(session);

      console.log('📱 [useTrainingSession] Loaded active session:', {
        hasSession: !!session,
        sessionId: session?.id,
        profileId: session?.profile_id,
        status: session?.status
      });
    } catch (err) {
      console.error('❌ Error loading active session:', err);
      setError('Failed to load active session');
      setActiveSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Load session on hook mount
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // Reload session when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActiveSession();
    }, [loadActiveSession])
  );

  // Create new training session
  const createSession = useCallback(async (request: CreateTrainingSessionRequest): Promise<TrainingSession> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      // Check if there's already an active session for this profile
      const existingSession = await TrainingSessionAsyncStorage.getActiveSession(profileId);
      if (existingSession && existingSession.status === 'active') {
        throw new Error('Ya existe una sesión activa. Completa o cancela la sesión actual antes de crear una nueva.');
      }

      const newSession = await TrainingSessionAsyncStorage.createSession(request);
      setActiveSession(newSession);

      // console.log('✅ [useTrainingSession] Created new session:', {
      //   id: newSession.id,
      //   routine_name: newSession.routine_name,
      //   exercises_count: newSession.exercises.length
      // });

      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create training session';
      console.error('❌ Error creating session:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Update set progress
  const updateSetProgress = useCallback(async (request: UpdateSetProgressRequest): Promise<void> => {
    try {
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      const updatedSession = await TrainingSessionAsyncStorage.updateSetProgress(request, profileId);
      setActiveSession(updatedSession);

      // console.log('✅ [useTrainingSession] Updated set progress:', {
      //   exercise_id: request.exercise_id,
      //   set_number: request.set_number
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update set progress';
      console.error('❌ Error updating set progress:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [activeSession, profileId]);

  // Move to next exercise
  const moveToNextExercise = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      const updatedSession = await TrainingSessionAsyncStorage.moveToNextExercise(activeSession.id, profileId);
      setActiveSession(updatedSession);

      // console.log('✅ [useTrainingSession] Moved to next exercise:', {
      //   current_index: updatedSession.current_exercise_index
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move to next exercise';
      console.error('❌ Error moving to next exercise:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [activeSession, profileId]);

  // Move to previous exercise
  const moveToPreviousExercise = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      const updatedSession = await TrainingSessionAsyncStorage.moveToPreviousExercise(activeSession.id, profileId);
      setActiveSession(updatedSession);

      // console.log('✅ [useTrainingSession] Moved to previous exercise:', {
      //   current_index: updatedSession.current_exercise_index
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move to previous exercise';
      console.error('❌ Error moving to previous exercise:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [activeSession, profileId]);

  // Complete session
  const completeSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      await TrainingSessionAsyncStorage.completeSession(activeSession.id, profileId);
      setActiveSession(null);

      Toast.show({
        type: 'success',
        text1: 'Sesión completada',
        text2: '¡Excelente entrenamiento!',
      });

      // console.log('✅ [useTrainingSession] Session completed:', {
      //   id: activeSession.id,
      //   routine_name: activeSession.routine_name
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session';
      console.error('❌ Error completing session:', errorMessage);
      setError(errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, profileId]);

  // Cancel session
  const cancelSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      await TrainingSessionAsyncStorage.cancelSession(activeSession.id, profileId);
      setActiveSession(null);

      Toast.show({
        type: 'info',
        text1: 'Sesión cancelada',
        text2: 'La sesión ha sido cancelada',
      });

      // console.log('✅ [useTrainingSession] Session cancelled:', {
      //   id: activeSession.id,
      //   routine_name: activeSession.routine_name
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session';
      console.error('❌ Error cancelling session:', errorMessage);
      setError(errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, profileId]);

  // Pause session
  const pauseSession = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      const updatedSession = await TrainingSessionAsyncStorage.pauseSession(activeSession.id, profileId);
      setActiveSession(updatedSession);

      Toast.show({
        type: 'info',
        text1: 'Sesión pausada',
      });

      // console.log('✅ [useTrainingSession] Session paused:', {
      //   id: activeSession.id
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause session';
      console.error('❌ Error pausing session:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [activeSession, profileId]);

  // Resume session
  const resumeSession = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      if (!activeSession) {
        throw new Error('No active session found');
      }

      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      const updatedSession = await TrainingSessionAsyncStorage.resumeSession(activeSession.id, profileId);
      setActiveSession(updatedSession);

      Toast.show({
        type: 'success',
        text1: 'Sesión reanudada',
      });

      // console.log('✅ [useTrainingSession] Session resumed:', {
      //   id: activeSession.id
      // });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume session';
      console.error('❌ Error resuming session:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [activeSession, profileId]);

  // Calculate session progress
  const getSessionProgress = useCallback((): SessionProgress | null => {
    if (!activeSession) return null;

    const totalExercises = activeSession.exercises.length;
    const completedExercises = activeSession.exercises.filter(ex => ex.is_completed).length;
    
    const totalSets = activeSession.exercises.reduce((sum, ex) => sum + ex.sets_config.length, 0);
    const completedSets = activeSession.exercises.reduce(
      (sum, ex) => sum + ex.performed_sets.filter(set => set.is_completed).length, 
      0
    );

    const sessionStart = new Date(activeSession.start_time);
    const now = new Date();
    const sessionDurationMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60));

    return {
      total_exercises: totalExercises,
      completed_exercises: completedExercises,
      current_exercise_index: activeSession.current_exercise_index,
      total_sets: totalSets,
      completed_sets: completedSets,
      session_duration_minutes: sessionDurationMinutes,
    };
  }, [activeSession]);

  // Get current exercise
  const getCurrentExercise = useCallback(() => {
    if (!activeSession || activeSession.exercises.length === 0) return null;
    return activeSession.exercises[activeSession.current_exercise_index] || null;
  }, [activeSession]);

  // Check if session can move to next exercise
  const canMoveToNext = useCallback(() => {
    if (!activeSession) return false;
    return activeSession.current_exercise_index < activeSession.exercises.length - 1;
  }, [activeSession]);

  // Check if session can move to previous exercise
  const canMoveToPrevious = useCallback(() => {
    if (!activeSession) return false;
    return activeSession.current_exercise_index > 0;
  }, [activeSession]);

  return {
    // State
    activeSession,
    isLoading,
    error,
    
    // Actions
    createSession,
    updateSetProgress,
    moveToNextExercise,
    moveToPreviousExercise,
    completeSession,
    cancelSession,
    pauseSession,
    resumeSession,
    loadActiveSession,
    
    // Computed values
    getSessionProgress,
    getCurrentExercise,
    canMoveToNext,
    canMoveToPrevious,
    
    // Helpers
    hasActiveSession: !!activeSession,
    isSessionActive: activeSession?.status === 'active',
    isSessionPaused: activeSession?.status === 'paused',
  };
};