import { TrainingDayRepository } from '@/repositories/TrainingDayRepository';
import {
  TrainingDay,
  TrainingDayWithCount,
  TrainingDayWithExercises,
  CreateTrainingDayDto,
  UpdateTrainingDayDto
} from '@/types/training-day';
import { logger } from '@/utils/logger';

/**
 * Training Day Service
 * Business logic layer for training days
 */
export class TrainingDayService {
  constructor(private repository: TrainingDayRepository) {}

  /**
   * Get all training days for a profile with exercise count
   */
  async getAllForProfile(profileId: number): Promise<TrainingDayWithCount[]> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    logger.info('Fetching training days for profile', { profileId });
    return this.repository.findAllWithCount(profileId);
  }

  /**
   * Get training day by ID with exercises
   */
  async getByIdWithExercises(
    id: number,
    profileId: number
  ): Promise<TrainingDayWithExercises> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    logger.info('Fetching training day with exercises', { id, profileId });
    const trainingDay = await this.repository.findByIdWithExercises(id, profileId);

    if (!trainingDay) {
      throw new Error('Training day not found');
    }

    return trainingDay;
  }

  /**
   * Create new training day with exercises
   */
  async create(data: CreateTrainingDayDto): Promise<TrainingDay> {
    const { profile_id, name, exercises } = data;

    if (!profile_id || !name) {
      throw new Error('profile_id and name are required');
    }

    if (!exercises || exercises.length === 0) {
      throw new Error('At least one exercise is required');
    }

    logger.info('Creating training day', { profile_id, name, exerciseCount: exercises.length });
    return this.repository.createWithExercises(data);
  }

  /**
   * Update training day
   */
  async update(id: number, data: UpdateTrainingDayDto): Promise<TrainingDay> {
    const { profile_id } = data;

    if (!profile_id) {
      throw new Error('profile_id is required');
    }

    logger.info('Updating training day', { id, profile_id });
    return this.repository.updateWithExercises(id, data);
  }

  /**
   * Delete training day (soft delete)
   */
  async delete(id: number, profileId: number): Promise<void> {
    if (!profileId) {
      throw new Error('profile_id is required');
    }

    logger.info('Deleting training day', { id, profileId });
    const deleted = await this.repository.softDelete(id, profileId);

    if (!deleted) {
      throw new Error('Training day not found');
    }
  }
}
