import { RoutineWeekRepository } from '@/repositories/RoutineWeekRepository';
import {
  RoutineWeek,
  RoutineWeekWithDetails,
  UpdateRoutineWeekDto,
  ConfigurationResponse,
  ExerciseConfigItem,
  UpdateConfigDto,
} from '@/types/routine-week';

export class RoutineWeekService {
  constructor(private repository: RoutineWeekRepository) {}

  async getAllForProfile(profileId: number): Promise<RoutineWeekWithDetails[]> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    return this.repository.findAllForProfile(profileId);
  }

  async update(id: number, data: UpdateRoutineWeekDto): Promise<RoutineWeek> {
    if (!data.profile_id) {
      throw new Error('profile_id is required');
    }

    return this.repository.updateWeek(id, data);
  }

  async getConfiguration(id: number, profileId: number): Promise<ConfigurationResponse> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    const result = await this.repository.getConfiguration(id, profileId);

    if (!result) {
      throw new Error('Routine week not found or does not belong to this profile');
    }

    return result;
  }

  async updateConfiguration(id: number, data: UpdateConfigDto): Promise<ExerciseConfigItem[]> {
    if (!data.profile_id || !data.exercises || !Array.isArray(data.exercises)) {
      throw new Error('profile_id and exercises array are required');
    }

    return this.repository.updateConfiguration(
      id,
      data.profile_id,
      data.exercises,
      data.routine_name || null
    );
  }

  async deleteConfiguration(id: number, profileId: number): Promise<number> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    return this.repository.deleteConfiguration(id, profileId);
  }
}
