import { ExerciseRepository } from '../repositories/exerciseRepository';
import { Exercise, CreateExerciseDto, UpdateExerciseDto, ExerciseFilters, ExerciseCategory } from '../types/exercise';

export class ExerciseService {
  private exerciseRepository: ExerciseRepository;

  constructor() {
    this.exerciseRepository = new ExerciseRepository();
  }

  /**
   * Get all exercises with optional filters and pagination
   */
  async getExercises(filters: ExerciseFilters = {}): Promise<{
    exercises: Exercise[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Set default values
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    // Get exercises and total count
    const [exercises, total] = await Promise.all([
      this.exerciseRepository.findAll({ ...filters, limit, offset }),
      this.exerciseRepository.count(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      exercises,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: number): Promise<Exercise> {
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
   * Get exercises by category
   */
  async getExercisesByCategory(category: ExerciseCategory): Promise<Exercise[]> {
    if (!Object.values(ExerciseCategory).includes(category)) {
      throw new Error('Invalid exercise category');
    }

    return this.exerciseRepository.findByCategory(category);
  }

  /**
   * Search exercises by name
   */
  async searchExercises(searchTerm: string): Promise<Exercise[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters long');
    }

    return this.exerciseRepository.searchByName(searchTerm.trim());
  }

  /**
   * Create new exercise
   */
  async createExercise(exerciseData: CreateExerciseDto): Promise<Exercise> {
    // Validate required fields
    this.validateExerciseData(exerciseData);

    // Sanitize data
    const sanitizedData = this.sanitizeExerciseData(exerciseData);

    return this.exerciseRepository.create(sanitizedData);
  }

  /**
   * Update exercise
   */
  async updateExercise(id: number, exerciseData: UpdateExerciseDto): Promise<Exercise> {
    if (!id || id <= 0) {
      throw new Error('Invalid exercise ID');
    }

    // Check if exercise exists
    const existingExercise = await this.exerciseRepository.findById(id);
    if (!existingExercise) {
      throw new Error('Exercise not found');
    }

    // Validate update data
    this.validateUpdateData(exerciseData);

    // Sanitize data
    const sanitizedData = this.sanitizeUpdateData(exerciseData);

    const updatedExercise = await this.exerciseRepository.update(id, sanitizedData);
    if (!updatedExercise) {
      throw new Error('Failed to update exercise');
    }

    return updatedExercise;
  }

  /**
   * Delete exercise (soft delete)
   */
  async deleteExercise(id: number): Promise<void> {
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

  /**
   * Get exercise metadata (muscle groups, equipment)
   */
  async getExerciseMetadata(): Promise<{
    muscleGroups: string[];
    equipment: string[];
    categories: ExerciseCategory[];
    difficultyLevels: number[];
  }> {
    const [muscleGroups, equipment] = await Promise.all([
      this.exerciseRepository.getUniqueMuscleGroups(),
      this.exerciseRepository.getUniqueEquipment()
    ]);

    return {
      muscleGroups,
      equipment,
      categories: Object.values(ExerciseCategory),
      difficultyLevels: [1, 2, 3, 4, 5]
    };
  }

  /**
   * Get exercise statistics
   */
  async getExerciseStats(): Promise<{
    totalExercises: number;
    exercisesByCategory: Record<ExerciseCategory, number>;
    exercisesByDifficulty: Record<number, number>;
    compoundExercises: number;
    bodyweightExercises: number;
  }> {
    const allExercises = await this.exerciseRepository.findAll({ is_active: true });

    const stats = {
      totalExercises: allExercises.length,
      exercisesByCategory: {} as Record<ExerciseCategory, number>,
      exercisesByDifficulty: {} as Record<number, number>,
      compoundExercises: 0,
      bodyweightExercises: 0
    };

    // Initialize categories
    Object.values(ExerciseCategory).forEach(category => {
      stats.exercisesByCategory[category] = 0;
    });

    // Initialize difficulty levels
    [1, 2, 3, 4, 5].forEach(level => {
      stats.exercisesByDifficulty[level] = 0;
    });

    // Calculate stats
    allExercises.forEach(exercise => {
      stats.exercisesByCategory[exercise.category]++;
      stats.exercisesByDifficulty[exercise.difficulty_level]++;
      
      if (exercise.is_compound) {
        stats.compoundExercises++;
      }
      
      if (exercise.is_bodyweight) {
        stats.bodyweightExercises++;
      }
    });

    return stats;
  }

  /**
   * Validate exercise data for creation
   */
  private validateExerciseData(data: CreateExerciseDto): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Exercise name must be at least 2 characters long');
    }

    if (!data.category || !Object.values(ExerciseCategory).includes(data.category)) {
      throw new Error('Valid exercise category is required');
    }

    if (!data.muscle_groups || data.muscle_groups.length === 0) {
      throw new Error('At least one muscle group is required');
    }

    if (data.difficulty_level && (data.difficulty_level < 1 || data.difficulty_level > 5)) {
      throw new Error('Difficulty level must be between 1 and 5');
    }

    if (data.video_url && !this.isValidUrl(data.video_url)) {
      throw new Error('Invalid video URL format');
    }

    if (data.image_url && !this.isValidUrl(data.image_url)) {
      throw new Error('Invalid image URL format');
    }
  }

  /**
   * Validate exercise data for update
   */
  private validateUpdateData(data: UpdateExerciseDto): void {
    if (data.name !== undefined && (!data.name || data.name.trim().length < 2)) {
      throw new Error('Exercise name must be at least 2 characters long');
    }

    if (data.category !== undefined && !Object.values(ExerciseCategory).includes(data.category)) {
      throw new Error('Invalid exercise category');
    }

    if (data.muscle_groups !== undefined && data.muscle_groups.length === 0) {
      throw new Error('At least one muscle group is required');
    }

    if (data.difficulty_level !== undefined && (data.difficulty_level < 1 || data.difficulty_level > 5)) {
      throw new Error('Difficulty level must be between 1 and 5');
    }

    if (data.video_url !== undefined && data.video_url && !this.isValidUrl(data.video_url)) {
      throw new Error('Invalid video URL format');
    }

    if (data.image_url !== undefined && data.image_url && !this.isValidUrl(data.image_url)) {
      throw new Error('Invalid image URL format');
    }
  }

  /**
   * Sanitize exercise data
   */
  private sanitizeExerciseData(data: CreateExerciseDto): CreateExerciseDto {
    return {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim(),
      muscle_groups: data.muscle_groups.map(mg => mg.trim().toLowerCase()),
      equipment: data.equipment?.map(eq => eq.trim().toLowerCase()) || [],
      instructions: data.instructions?.map(inst => inst.trim()) || [],
      tips: data.tips?.map(tip => tip.trim()) || [],
      common_mistakes: data.common_mistakes?.map(mistake => mistake.trim()) || [],
      variations: data.variations?.map(variation => variation.trim()) || []
    };
  }

  /**
   * Sanitize update data
   */
  private sanitizeUpdateData(data: UpdateExerciseDto): UpdateExerciseDto {
    const sanitized: UpdateExerciseDto = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'name' || key === 'description') {
          sanitized[key as keyof UpdateExerciseDto] = typeof value === 'string' ? value.trim() : value;
        } else if (key === 'muscle_groups' || key === 'equipment') {
          sanitized[key as keyof UpdateExerciseDto] = Array.isArray(value) 
            ? value.map((item: string) => item.trim().toLowerCase()) 
            : value;
        } else if (key === 'instructions' || key === 'tips' || key === 'common_mistakes' || key === 'variations') {
          sanitized[key as keyof UpdateExerciseDto] = Array.isArray(value) 
            ? value.map((item: string) => item.trim()) 
            : value;
        } else {
          sanitized[key as keyof UpdateExerciseDto] = value;
        }
      }
    });

    return sanitized;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return /^https?:\/\/.+/.test(url);
    } catch {
      return false;
    }
  }
}