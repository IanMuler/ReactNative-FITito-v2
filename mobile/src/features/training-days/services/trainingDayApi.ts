import { 
  TrainingDay, 
  TrainingDayWithExercises, 
  CreateTrainingDayDto, 
  UpdateTrainingDayDto 
} from '../types/trainingDay';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const trainingDayApi = {
  // Get all training days for a profile
  getAllByProfile: async (profileId: number): Promise<TrainingDay[]> => {
    const response = await fetch(`${API_BASE_URL}/training-days?profile_id=${profileId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch training days');
    }
    const result: ApiResponse<TrainingDay[]> = await response.json();
    return result.data;
  },

  // Get training day by ID with exercises
  getById: async (id: number, profileId: number): Promise<TrainingDayWithExercises> => {
    const response = await fetch(`${API_BASE_URL}/training-days/${id}?profile_id=${profileId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch training day');
    }
    const result: ApiResponse<TrainingDayWithExercises> = await response.json();
    return result.data;
  },

  // Create new training day
  create: async (trainingDay: CreateTrainingDayDto): Promise<TrainingDay> => {
    const response = await fetch(`${API_BASE_URL}/training-days`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainingDay),
    });
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.error || 'Failed to create training day');
    }
    const result: ApiResponse<TrainingDay> = await response.json();
    return result.data;
  },

  // Update training day
  update: async (id: number, trainingDay: UpdateTrainingDayDto): Promise<TrainingDay> => {
    const response = await fetch(`${API_BASE_URL}/training-days/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainingDay),
    });
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.error || 'Failed to update training day');
    }
    const result: ApiResponse<TrainingDay> = await response.json();
    return result.data;
  },

  // Delete training day (soft delete)
  delete: async (id: number, profileId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/training-days/${id}?profile_id=${profileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete training day');
    }
  },
};