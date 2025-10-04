import {
  TrainingDay,
  TrainingDayWithExercises,
  CreateTrainingDayDto,
  UpdateTrainingDayDto
} from '../types/trainingDay';
import { fetchHandler } from '@/services/fetchHandler';

export const trainingDayApi = {
  // Get all training days for a profile
  getAllByProfile: async (profileId: number): Promise<TrainingDay[]> => {
    return fetchHandler.get<TrainingDay[]>('/training-days', {
      profile_id: profileId.toString()
    });
  },

  // Get training day by ID with exercises
  getById: async (id: number, profileId: number): Promise<TrainingDayWithExercises> => {
    return fetchHandler.get<TrainingDayWithExercises>(`/training-days/${id}`, {
      profile_id: profileId.toString()
    });
  },

  // Create new training day
  create: async (trainingDay: CreateTrainingDayDto): Promise<TrainingDay> => {
    return fetchHandler.post<TrainingDay>('/training-days', trainingDay);
  },

  // Update training day
  update: async (id: number, trainingDay: UpdateTrainingDayDto): Promise<TrainingDay> => {
    return fetchHandler.put<TrainingDay>(`/training-days/${id}`, trainingDay);
  },

  // Delete training day (soft delete)
  delete: async (id: number, profileId: number): Promise<void> => {
    return fetchHandler.delete<void>(`/training-days/${id}`, {
      profile_id: profileId.toString()
    });
  },
};