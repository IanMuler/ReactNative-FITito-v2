import { ExerciseRepository } from '../repositories/exerciseRepository';
import { Exercise, CreateExerciseDto, UpdateExerciseDto } from '../types/exercise';

/**
 * Exercise Service
 * Business logic layer for exercises with simple schema (id, name, image, created_at)
 */
export class ExerciseService {
  private exerciseRepository: ExerciseRepository;

  constructor() {
    this.exerciseRepository = new ExerciseRepository();
  }

  /**
   * Get all exercises
   */
  async getAll(): Promise<Exercise[]> {
    return this.exerciseRepository.findAll();
  }

  /**
   * Get exercise by ID
   */
  async getById(id: number): Promise<Exercise> {
    if (!id || id <= 0) {
      throw new Error('Invalid exercise ID');
    }

    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    return exercise;
  }

  /**
   * Create new exercise
   */
  async create(exerciseData: CreateExerciseDto): Promise<Exercise> {
    // Validate required fields
    if (!exerciseData.name || !exerciseData.image) {
      throw new Error('Name and image are required');
    }

    return this.exerciseRepository.create(exerciseData);
  }

  /**
   * Update exercise
   */
  async update(id: number, exerciseData: UpdateExerciseDto): Promise<Exercise> {
    if (!id || id <= 0) {
      throw new Error('Invalid exercise ID');
    }

    // Check if exercise exists
    const existingExercise = await this.exerciseRepository.findById(id);
    if (!existingExercise) {
      throw new Error('Exercise not found');
    }

    // Validate required fields
    if (!exerciseData.name || !exerciseData.image) {
      throw new Error('Name and image are required');
    }

    const updatedExercise = await this.exerciseRepository.update(id, exerciseData);
    if (!updatedExercise) {
      throw new Error('Failed to update exercise');
    }

    return updatedExercise;
  }

  /**
   * Delete exercise (hard delete)
   */
  async delete(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Invalid exercise ID');
    }

    const existingExercise = await this.exerciseRepository.findById(id);
    if (!existingExercise) {
      throw new Error('Exercise not found');
    }

    const deleted = await this.exerciseRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete exercise');
    }
  }
}