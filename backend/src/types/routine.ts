/**
 * Routine Types
 * Matches the PostgreSQL schema exactly as in exercises-simple.js
 */

export interface Routine {
  id: number;
  profile_id: number;
  name: string;
  description: string | null;
  color: string;
  duration_minutes: number | null;
  difficulty_level: number;
  is_active: boolean;
  is_favorite: boolean;
  tags: string[];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RoutineExercise {
  id: number;
  routine_id: number;
  exercise_id: number;
  order_in_routine: number;
  sets: number;
  reps: number;
  weight: number | null;
  duration_seconds: number | null;
  rest_time_seconds: number;
  rpe: number | null;
  notes: string | null;
  is_superset: boolean;
  superset_group: number | null;
  created_at: Date;
  updated_at: Date;
}

// List view with exercise count
export interface RoutineWithCount {
  id: number;
  name: string;
  description: string | null;
  color: string;
  duration_minutes: number | null;
  difficulty_level: number;
  is_active: boolean;
  is_favorite: boolean;
  tags: string[];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  exercise_count: number;
}

// Detailed view with exercises
export interface RoutineWithExercises extends Routine {
  exercises: RoutineExerciseDetail[];
}

export interface RoutineExerciseDetail {
  id: number;
  routine_id: number;
  exercise_id: number;
  order_in_routine: number;
  sets: number;
  reps: number;
  weight: number | null;
  duration_seconds: number | null;
  rest_time_seconds: number;
  rpe: number | null;
  notes: string | null;
  is_superset: boolean;
  superset_group: number | null;
  created_at: Date;
  updated_at: Date;
  exercise: {
    id: number;
    name: string;
    image: string;
  };
}

// DTOs for API
export interface CreateRoutineDto {
  profile_id: number;
  name: string;
  description?: string;
  color?: string;
  duration_minutes?: number;
  difficulty_level?: number;
  is_favorite?: boolean;
  tags?: string[];
  notes?: string;
  exercises: CreateRoutineExerciseDto[];
}

export interface CreateRoutineExerciseDto {
  exercise_id: number;
  order_in_routine?: number;
  sets?: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rest_time_seconds?: number;
  rpe?: number;
  notes?: string;
  is_superset?: boolean;
  superset_group?: number;
}

export interface UpdateRoutineDto {
  profile_id: number;
  name?: string;
  description?: string;
  color?: string;
  duration_minutes?: number;
  difficulty_level?: number;
  is_favorite?: boolean;
  tags?: string[];
  notes?: string;
  exercises?: CreateRoutineExerciseDto[];
}
