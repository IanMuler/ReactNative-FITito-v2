import {
  RoutineDayConfiguration,
  ExerciseConfiguration,
  CreateRoutineConfigurationDto,
  UpdateRoutineConfigurationDto
} from '../types/routineConfiguration';
import { fetchHandler } from '@/services/fetchHandler';

export const routineConfigurationApi = {
  // Get routine day configuration
  getConfiguration: async (routineWeekId: number, profileId: number): Promise<RoutineDayConfiguration> => {
    return fetchHandler.get<RoutineDayConfiguration>(
      `/routine-weeks/${routineWeekId}/configuration`,
      { profile_id: profileId.toString() }
    );
  },

  // Update configuration
  updateConfiguration: async (
    routineWeekId: number,
    data: UpdateRoutineConfigurationDto
  ): Promise<ExerciseConfiguration[]> => {
    return fetchHandler.put<ExerciseConfiguration[]>(
      `/routine-weeks/${routineWeekId}/configuration`,
      data
    );
  },

  // Delete configuration
  deleteConfiguration: async (routineWeekId: number, profileId: number): Promise<void> => {
    return fetchHandler.delete<void>(
      `/routine-weeks/${routineWeekId}/configuration`,
      { profile_id: profileId.toString() }
    );
  },
};