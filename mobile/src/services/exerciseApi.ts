import { Exercise, CreateExerciseDto, UpdateExerciseDto } from '../types/exercise';
import { fetchHandler } from './fetchHandler';

export const exerciseApi = {
  // Get all exercises
  getAll: async (): Promise<Exercise[]> => {
    return fetchHandler.get<Exercise[]>('/exercises');
  },

  // Get exercise by ID
  getById: async (id: number): Promise<Exercise> => {
    return fetchHandler.get<Exercise>(`/exercises/${id}`);
  },

  // Create new exercise
  create: async (exercise: CreateExerciseDto): Promise<Exercise> => {
    return fetchHandler.post<Exercise>('/exercises', exercise);
  },

  // Update exercise
  update: async (id: number, exercise: UpdateExerciseDto): Promise<Exercise> => {
    return fetchHandler.put<Exercise>(`/exercises/${id}`, exercise);
  },

  // Delete exercise
  delete: async (id: number): Promise<void> => {
    return fetchHandler.delete<void>(`/exercises/${id}`);
  },
};