/**
 * Training Day Types
 * Matches the PostgreSQL schema exactly as in exercises-simple.js
 */

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

// List view with exercise count
export interface TrainingDayWithCount {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  exercise_count: number;
}

// Detailed view with exercises
export interface TrainingDayWithExercises extends TrainingDay {
  exercises: TrainingDayExerciseDetail[];
}

export interface TrainingDayExerciseDetail {
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
  exercise: {
    id: number;
    name: string;
    image: string;
  };
}

// DTOs for API
export interface CreateTrainingDayDto {
  profile_id: number;
  name: string;
  description?: string;
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
  profile_id: number;
  name?: string;
  description?: string;
  exercises?: CreateTrainingDayExerciseDto[];
}