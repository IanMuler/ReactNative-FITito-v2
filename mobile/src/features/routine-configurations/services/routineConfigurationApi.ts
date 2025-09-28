import {
  RoutineDayConfiguration,
  ExerciseConfiguration,
  CreateRoutineConfigurationDto,
  UpdateRoutineConfigurationDto
} from '../types/routineConfiguration';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const routineConfigurationApi = {
  // Get routine day configuration
  getConfiguration: async (routineWeekId: number, profileId: number): Promise<RoutineDayConfiguration> => {
    const response = await fetch(
      `${API_BASE_URL}/routine-weeks/${routineWeekId}/configuration?profile_id=${profileId}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch routine configuration');
    }
    const result: ApiResponse<RoutineDayConfiguration> = await response.json();
    return result.data;
  },


  // Update configuration
  updateConfiguration: async (
    routineWeekId: number, 
    data: UpdateRoutineConfigurationDto
  ): Promise<ExerciseConfiguration[]> => {
    const response = await fetch(
      `${API_BASE_URL}/routine-weeks/${routineWeekId}/configuration`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update routine configuration');
    }
    const result: ApiResponse<ExerciseConfiguration[]> = await response.json();
    return result.data;
  },

  // Delete configuration
  deleteConfiguration: async (routineWeekId: number, profileId: number): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/routine-weeks/${routineWeekId}/configuration?profile_id=${profileId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) {
      throw new Error('Failed to delete routine configuration');
    }
  },
};