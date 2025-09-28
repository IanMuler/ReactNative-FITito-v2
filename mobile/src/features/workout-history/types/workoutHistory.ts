/* Workout History Types - Based on completed training sessions */

// Core workout session structure for history (matches backend response)
export interface WorkoutSession {
  id: number;
  profile_id: number;
  routine_id: number | null;
  routine_name: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number;
  total_weight_lifted: number | null;
  total_sets: number;
  total_reps: number;
  average_rpe: number | null;
  notes: string | null;
  is_completed: boolean;
  workout_type: string;
  location: string | null;
  mood_before: number | null;
  mood_after: number | null;
  energy_before: number | null;
  energy_after: number | null;
  created_at: string;
  updated_at: string;
  exercises_count: string;
  exercises: WorkoutExercise[];
}

// Exercise performed in a workout session (matches backend response)
export interface WorkoutExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_image: string | null;
  order_in_session: number;
  is_completed: boolean;
  exercise_notes: string | null;
  exercise_full_name: string;
  exercise_full_image: string | null;
  sets: PerformedSet[];
}

// Planned set structure (from routine configuration)
export interface PlannedSet {
  set_number: number;
  reps: number | null;
  weight: number | null;
  rir: number | null;
  rp?: { reps: number; weight: number }[];
  ds?: { reps: number; weight: number }[];
  partials?: { reps: number };
}

// Performed set structure (actual workout data - matches backend response)
export interface PerformedSet {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  reps: number;
  weight: number;
  rir: number;
  rp?: { reps: number; weight: number }[];
  ds?: { reps: number; weight: number }[];
  partials?: { reps: number };
  notes?: string;
  rest_time?: number;
  perceived_exertion?: number;
  created_at: string;
  updated_at: string;
}

// Options for fetching workout history
export interface WorkoutHistoryOptions {
  daysBack?: number;
  limit?: number;
  includeIncomplete?: boolean;
}

// Statistics for workout history display
export interface WorkoutStats {
  totalSessions: number;
  completedSessions: number;
  totalExercises: number;
  totalSets: number;
  averageSessionDuration: number; // in minutes
  lastWorkoutDate: string | null;
}

// Display-specific types for UI components
export interface WorkoutHistoryDisplay {
  session: WorkoutSession;
  formattedDate: string;
  duration: string;
  exerciseCount: number;
  setCount: number;
  dayDisplayName: string;
}

// Search and filter options for history list
export interface WorkoutHistoryFilters {
  startDate?: string;
  endDate?: string;
  dayName?: string;
  exerciseName?: string;
  status?: 'completed' | 'cancelled';
}