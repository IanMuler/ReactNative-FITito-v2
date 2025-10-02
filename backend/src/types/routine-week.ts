/**
 * Routine Week Types
 * Matches the PostgreSQL schema exactly as in exercises-simple.js
 */

export interface RoutineWeek {
  id: number;
  profile_id: number;
  day_of_week: number;
  day_name: string;
  is_rest_day: boolean;
  routine_id: number | null;
  routine_name: string | null;
  training_day_id: number | null;
  exercises_config: any;
  created_at: Date;
  updated_at: Date;
}

export interface RoutineWeekWithDetails extends RoutineWeek {
  has_configuration: boolean;
  routine_color?: string;
  difficulty_level?: number;
  duration_minutes?: number;
}

// DTOs for API
export interface CreateRoutineWeekDto {
  profile_id: number;
}

export interface UpdateRoutineWeekDto {
  profile_id: number;
  routine_id?: number | null;
  training_day_id?: number | null;
  is_rest_day?: boolean;
}

export interface RoutineWeekConfigurationDto {
  profile_id: number;
  routine_id?: number | null;
  training_day_id?: number | null;
  exercises_config?: any;
}

// Configuration types for exercises_config JSONB
export interface SetConfig {
  reps: string;
  weight: string;
  rir: string;
  rp: string[];
  ds: string[];
}

export interface ExerciseConfigItem {
  exercise_id: number;
  exercise_name: string;
  exercise_image: string;
  order_index: number;
  sets_config: SetConfig[];
  notes: string;
}

export interface ConfigurationResponse {
  routine_week: {
    id: number;
    day_name: string;
    routine_id: number | null;
    routine_name: string | null;
  };
  exercises: ExerciseConfigItem[];
}

export interface InitializeConfigDto {
  profile_id: number;
  training_day_id: number;
}

export interface UpdateConfigDto {
  profile_id: number;
  exercises: Array<{
    exercise_id: number;
    sets_config: SetConfig[];
    notes?: string;
    training_day_id?: number;
  }>;
  routine_name?: string;
}
