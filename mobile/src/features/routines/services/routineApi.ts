import { 
  RoutineWeek, 
  WorkoutSession, 
  CreateWorkoutSessionDto, 
  UpdateRoutineWeekDto 
} from '../types/routine';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const routineApi = {
  // Routine Weeks Management

  // Get routine weeks for a profile
  getWeekSchedule: async (profileId: number): Promise<RoutineWeek[]> => {
    const response = await fetch(`${API_BASE_URL}/routine-weeks?profile_id=${profileId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch routine weeks');
    }
    const result: ApiResponse<RoutineWeek[]> = await response.json();
    return result.data;
  },

  // Initialize default week schedule for a profile
  initializeWeekSchedule: async (profileId: number): Promise<RoutineWeek[]> => {
    const response = await fetch(`${API_BASE_URL}/routine-weeks/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (!response.ok) {
      throw new Error('Failed to initialize week schedule');
    }
    const result: ApiResponse<RoutineWeek[]> = await response.json();
    return result.data;
  },

  // Update routine week (assign/remove routine, toggle rest day)
  updateRoutineWeek: async (
    routineWeekId: number, 
    update: UpdateRoutineWeekDto
  ): Promise<RoutineWeek> => {
    const response = await fetch(`${API_BASE_URL}/routine-weeks/${routineWeekId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      throw new Error('Failed to update routine week');
    }
    const result: ApiResponse<RoutineWeek> = await response.json();
    return result.data;
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
    const response = await fetch(`${API_BASE_URL}/workout-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(session),
    });
    if (!response.ok) {
      throw new Error('Failed to create workout session');
    }
    const result: ApiResponse<WorkoutSession> = await response.json();
    return result.data;
  },

  // Get workout session by ID with exercises and sets
  getWorkoutSession: async (sessionId: number, profileId: number): Promise<WorkoutSession> => {
    const response = await fetch(
      `${API_BASE_URL}/workout-sessions/${sessionId}?profile_id=${profileId}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch workout session');
    }
    const result: ApiResponse<WorkoutSession> = await response.json();
    return result.data;
  },

  // Get all workout sessions for a profile
  getWorkoutSessions: async (profileId: number): Promise<WorkoutSession[]> => {
    const response = await fetch(`${API_BASE_URL}/workout-sessions?profile_id=${profileId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch workout sessions');
    }
    const result: ApiResponse<WorkoutSession[]> = await response.json();
    return result.data;
  },

  // Complete workout session
  completeWorkoutSession: async (sessionId: number, profileId: number): Promise<WorkoutSession> => {
    const response = await fetch(`${API_BASE_URL}/workout-sessions/${sessionId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (!response.ok) {
      throw new Error('Failed to complete workout session');
    }
    const result: ApiResponse<WorkoutSession> = await response.json();
    return result.data;
  },

  // Delete workout session
  deleteWorkoutSession: async (sessionId: number, profileId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/workout-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete workout session');
    }
  },

  // Get workout history for a profile
  getWorkoutHistory: async (profileId: number, daysBack: number = 30): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/workout-history/${profileId}?days_back=${daysBack}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch workout history');
    }
    const result: ApiResponse<any[]> = await response.json();
    return result.data;
  },

  // Get exercise progress over time
  getExerciseProgress: async (
    profileId: number, 
    exerciseId: number, 
    daysBack: number = 90
  ): Promise<any[]> => {
    const response = await fetch(
      `${API_BASE_URL}/exercise-progress/${profileId}/${exerciseId}?days_back=${daysBack}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch exercise progress');
    }
    const result: ApiResponse<any[]> = await response.json();
    return result.data;
  },
};