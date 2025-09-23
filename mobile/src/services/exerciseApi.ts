import { Exercise, CreateExerciseDto, UpdateExerciseDto } from '../types/exercise';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const exerciseApi = {
  // Get all exercises
  getAll: async (): Promise<Exercise[]> => {
    const response = await fetch(`${API_BASE_URL}/exercises`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    const result: ApiResponse<Exercise[]> = await response.json();
    return result.data;
  },

  // Get exercise by ID
  getById: async (id: number): Promise<Exercise> => {
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercise');
    }
    const result: ApiResponse<Exercise> = await response.json();
    return result.data;
  },

  // Create new exercise
  create: async (exercise: CreateExerciseDto): Promise<Exercise> => {
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exercise),
    });
    if (!response.ok) {
      throw new Error('Failed to create exercise');
    }
    const result: ApiResponse<Exercise> = await response.json();
    return result.data;
  },

  // Update exercise
  update: async (id: number, exercise: UpdateExerciseDto): Promise<Exercise> => {
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exercise),
    });
    if (!response.ok) {
      throw new Error('Failed to update exercise');
    }
    const result: ApiResponse<Exercise> = await response.json();
    return result.data;
  },

  // Delete exercise
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete exercise');
    }
  },
};