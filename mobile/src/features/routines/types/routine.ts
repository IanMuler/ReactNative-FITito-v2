// Advanced exercise techniques types
export interface RPDetail {
  reps: number;
  weight: number;
}

export interface DSDetail {
  reps: number;
  weight: number;
}

export interface PartialDetail {
  reps: number;
  range: string;
}

// Exercise set configuration
export interface SetDetail {
  reps: string;
  weight: string;
  rir?: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
}

// Exercise detail for routines
export interface ExerciseDetail {
  name: string;
  sets: SetDetail[];
  image: string;
}

// Day of week configuration 
export interface Day {
  name: string;
  rest: boolean;
  trainingDayName?: string;
  exerciseDetails?: ExerciseDetail[];
  completedDate?: string; // Format: YYYY-MM-DD
}

// Routine week configuration (matches backend unified schema)
export interface RoutineWeek {
  id: number;
  profile_id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  day_name: string; // Spanish day names
  is_rest_day: boolean;
  routine_id?: number;
  routine_name?: string; // Name of the routine assigned to this day
  training_day_id?: number; // Optional reference to training day template
  exercises_config: ExerciseConfig[]; // Unified exercises configuration
  completed_date?: string;
  has_configuration: boolean; // Whether this day has exercises configured
  created_at: string;
  updated_at: string;
}

// Exercise configuration in unified structure
export interface ExerciseConfig {
  exercise_id: number;
  exercise_name: string;
  exercise_image?: string;
  order_index: number;
  sets_config: SetDetail[];
  notes?: string;
}

// Workout session (matches backend schema)
export interface WorkoutSession {
  id: number;
  profile_id: number;
  routine_id?: number;
  routine_name: string;
  day_of_week: number;
  day_name: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string;
  rating?: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Workout session exercises (matches backend schema)
export interface WorkoutSessionExercise {
  id: number;
  workout_session_id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_image?: string;
  order_in_session: number;
  notes?: string;
  is_completed: boolean;
  created_at: string;
}

// Workout session sets (matches backend schema)
export interface WorkoutSessionSet {
  id: number;
  workout_session_exercise_id: number;
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rir?: number; // Reps in Reserve
  rpe?: number; // Rate of Perceived Exertion
  rest_seconds?: number;
  is_completed: boolean;
  is_warmup: boolean;
  notes?: string;
  // Advanced techniques (JSONB in backend)
  rest_pause_reps?: number[];
  drop_set_weights?: number[];
  partial_reps?: number;
  created_at: string;
}

// DTOs for API calls
export interface CreateWorkoutSessionDto {
  profile_id: number;
  routine_id?: number;
  routine_name: string;
  day_of_week: number;
  day_name: string;
  session_date: string;
  exercises: {
    exercise_id: number;
    exercise_name: string;
    exercise_image?: string;
    order_in_session: number;
    sets: {
      set_number: number;
      reps?: number;
      weight?: number;
      duration_seconds?: number;
      rir?: number;
      rpe?: number;
      rest_seconds?: number;
      is_warmup?: boolean;
      notes?: string;
      rp?: RPDetail[];
      ds?: DSDetail[];
      partials?: PartialDetail;
    }[];
  }[];
}

export interface UpdateRoutineWeekDto {
  is_rest_day?: boolean;
  routine_id?: number;
  completed_date?: string;
}

// History entry for completed sessions
export interface HistoryEntry {
  date: string;
  exerciseDetails: ExerciseDetail[];
}

// Constants
export const DAY_NAMES = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 
  'Viernes', 'Sábado', 'Domingo'
] as const;

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;