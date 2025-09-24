import { Exercise } from '@/features/exercises/types';

export interface TrainingDay {
  id: number;
  profile_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  exercise_count?: number;
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
  created_at: string;
  exercise: {
    id: number;
    name: string;
    image: string;
  };
}

export interface TrainingDayWithExercises extends TrainingDay {
  exercises: TrainingDayExercise[];
}

// DTO types for API requests
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

// Form types (original app compatibility)
export interface SelectedExercise {
  name: string;
  image: string;
}

export interface TrainingDayForm {
  name: string;
  exercises: SelectedExercise[];
}