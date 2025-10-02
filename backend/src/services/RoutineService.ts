import { RoutineRepository } from '@/repositories/RoutineRepository';
import {
  Routine,
  RoutineWithCount,
  RoutineWithExercises,
  CreateRoutineDto,
  UpdateRoutineDto
} from '@/types/routine';
import { logger } from '@/utils/logger';

/**
 * Routine Service
 * Business logic layer for routines
 */
export class RoutineService {
  constructor(private repository: RoutineRepository) {}

  async getAllForProfile(profileId: number): Promise<RoutineWithCount[]> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    logger.info('Fetching routines for profile', { profileId });
    return this.repository.findAllWithCount(profileId);
  }

  async getByIdWithExercises(
    id: number,
    profileId: number
  ): Promise<RoutineWithExercises> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    logger.info('Fetching routine with exercises', { id, profileId });
    const routine = await this.repository.findByIdWithExercises(id, profileId);

    if (!routine) {
      throw new Error('Routine not found');
    }

    return routine;
  }

  async create(data: CreateRoutineDto): Promise<Routine> {
    const { profile_id, name, exercises } = data;

    if (!profile_id || !name) {
      throw new Error('profile_id and name are required');
    }

    if (!exercises || exercises.length === 0) {
      throw new Error('At least one exercise is required');
    }

    logger.info('Creating routine', { profile_id, name, exerciseCount: exercises.length });
    return this.repository.createWithExercises(data);
  }

  async update(id: number, data: UpdateRoutineDto): Promise<Routine> {
    const { profile_id } = data;

    if (!profile_id) {
      throw new Error('profile_id is required');
    }

    logger.info('Updating routine', { id, profile_id });
    return this.repository.updateWithExercises(id, data);
  }

  async delete(id: number, profileId: number): Promise<void> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    logger.info('Deleting routine', { id, profileId });
    const deleted = await this.repository.softDelete(id, profileId);

    if (!deleted) {
      throw new Error('Routine not found');
    }
  }
}
