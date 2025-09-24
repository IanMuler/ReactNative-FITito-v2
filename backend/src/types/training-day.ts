// Training day types for FITito
// These types match the PostgreSQL schema for training days functionality

export interface TrainingDay {
  id: number;
  profile_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TrainingDayExercise {
  id: number;
  training_day_id: number;
  exercise_id: number;
  order_index: number;
  sets: number;
  reps: number;
  weight: number | null;
  rest_seconds: number;
  notes: string | null;
  created_at: Date;
}

// DTO types for API requests/responses
export interface CreateTrainingDayDto {
  name: string;
  description?: string;
  is_active?: boolean;
  exercises: CreateTrainingDayExerciseDto[];
}

export interface CreateTrainingDayExerciseDto {
  exercise_id: number;
  order_index?: number;
  sets?: number;
  reps?: number;
  weight?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface UpdateTrainingDayDto {
  name?: string;
  description?: string;
  is_active?: boolean;
  exercises?: UpdateTrainingDayExerciseDto[];
}

export interface UpdateTrainingDayExerciseDto {
  id?: number; // For updating existing exercises
  exercise_id: number;
  order_index?: number;
  sets?: number;
  reps?: number;
  weight?: number;
  rest_seconds?: number;
  notes?: string;
}

// Response types with populated data
export interface TrainingDayResponse {
  id: number;
  profile_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  exercises: TrainingDayExerciseResponse[];
}

export interface TrainingDayExerciseResponse {
  id: number;
  training_day_id: number;
  exercise_id: number;
  order_index: number;
  sets: number;
  reps: number;
  weight: number | null;
  rest_seconds: number;
  notes: string | null;
  created_at: Date;
  // Exercise details populated via join
  exercise: {
    id: number;
    name: string;
    image_url: string | null;
    category: string;
    muscle_groups: string[];
  };
}

// List view optimized response (minimal data)
export interface TrainingDayListItem {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  exercise_count: number;
  created_at: Date;
  updated_at: Date;
}

// Search and filter options
export interface TrainingDaySearchOptions {
  profile_id: number;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'ASC' | 'DESC';
}

// Input types for database operations
export type CreateTrainingDayInput = Omit<TrainingDay, 'id' | 'created_at' | 'updated_at'>;
export type CreateTrainingDayExerciseInput = Omit<TrainingDayExercise, 'id' | 'created_at'>;

export type UpdateTrainingDayInput = Partial<Omit<TrainingDay, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;
export type UpdateTrainingDayExerciseInput = Partial<Omit<TrainingDayExercise, 'id' | 'training_day_id' | 'created_at'>>;

// Validation types
export interface TrainingDayValidation {
  name: {
    minLength: 2;
    maxLength: 100;
    pattern: /^[A-Za-z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
  };
  description: {
    maxLength: 500;
  };
  exercises: {
    minCount: 1;
    maxCount: 20;
  };
}

// Business logic types
export interface TrainingDayStats {
  total_training_days: number;
  active_training_days: number;
  total_exercises: number;
  most_used_exercises: Array<{
    exercise_id: number;
    exercise_name: string;
    usage_count: number;
  }>;
  average_exercises_per_day: number;
}

export interface DuplicateTrainingDayOptions {
  new_name: string;
  copy_exercises: boolean;
  target_profile_id?: number; // For copying between profiles
}

// Error types specific to training days
export enum TrainingDayErrorType {
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  NO_EXERCISES = 'NO_EXERCISES',
  INVALID_EXERCISE_ORDER = 'INVALID_EXERCISE_ORDER',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  TRAINING_DAY_NOT_FOUND = 'TRAINING_DAY_NOT_FOUND',
  EXERCISE_NOT_FOUND = 'EXERCISE_NOT_FOUND',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

export interface TrainingDayError {
  type: TrainingDayErrorType;
  message: string;
  field?: string;
}