import { 
  RoutineWeek, 
  WorkoutSession, 
  CreateWorkoutSessionDto, 
  UpdateRoutineWeekDto 
} from '../types/routine';
import { fetchHandler } from '@/services/fetchHandler';

export const routineApi = {
  // Routine Weeks Management

  // Get routine weeks for a profile
  getWeekSchedule: async (profileId: number): Promise<RoutineWeek[]> => {
    return fetchHandler.get<RoutineWeek[]>('/routine-weeks', { profile_id: profileId.toString() });
  },

  // Initialize default week schedule for a profile
  initializeWeekSchedule: async (profileId: number): Promise<RoutineWeek[]> => {
    return fetchHandler.post<RoutineWeek[]>('/routine-weeks/initialize', { profile_id: profileId });
  },

  // Update routine week (assign/remove routine, toggle rest day)
  updateRoutineWeek: async (
    routineWeekId: number, 
    update: UpdateRoutineWeekDto
  ): Promise<RoutineWeek> => {
    return fetchHandler.put<RoutineWeek>(`/routine-weeks/${routineWeekId}`, update);
  },

  // Mark day as completed
  markDayCompleted: async (
    routineWeekId: number, 
    completedDate: string
  ): Promise<RoutineWeek> => {
    return routineApi.updateRoutineWeek(routineWeekId, { completed_date: completedDate });
  },

  // Workout Sessions Management

  // Create new workout session
  createWorkoutSession: async (session: CreateWorkoutSessionDto): Promise<WorkoutSession> => {
    return fetchHandler.post<WorkoutSession>('/workout-sessions', session);
  },

  // Get workout session by ID with exercises and sets
  getWorkoutSession: async (sessionId: number, profileId: number): Promise<WorkoutSession> => {
    return fetchHandler.get<WorkoutSession>(`/workout-sessions/${sessionId}`, { profile_id: profileId.toString() });
  },

  // Get all workout sessions for a profile
  getWorkoutSessions: async (profileId: number): Promise<WorkoutSession[]> => {
    return fetchHandler.get<WorkoutSession[]>('/workout-sessions', { profile_id: profileId.toString() });
  },

  // Complete workout session
  completeWorkoutSession: async (sessionId: number, profileId: number): Promise<WorkoutSession> => {
    return fetchHandler.put<WorkoutSession>(`/workout-sessions/${sessionId}/complete`, { profile_id: profileId });
  },

  // Delete workout session
  deleteWorkoutSession: async (sessionId: number, profileId: number): Promise<void> => {
    return fetchHandler.delete<void>(`/workout-sessions/${sessionId}`);
  },

  // Get workout history for a profile
  getWorkoutHistory: async (profileId: number, daysBack: number = 30): Promise<any[]> => {
    return fetchHandler.get<any[]>(`/workout-history/${profileId}`, { days_back: daysBack.toString() });
  },

  // Get exercise progress over time
  getExerciseProgress: async (
    profileId: number, 
    exerciseId: number, 
    daysBack: number = 90
  ): Promise<any[]> => {
    return fetchHandler.get<any[]>(`/exercise-progress/${profileId}/${exerciseId}`, { days_back: daysBack.toString() });
  },
};