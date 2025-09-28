/* Training Session Types - Based on original FITito project */

// Basic types from routine configurations (reused)
export interface RPDetail {
  value: string;
  time: number;
}

export interface DSDetail {
  reps: string;
  peso: string;
}

export interface PartialDetail {
  reps: string;
}

// Set configuration (planned vs performed)
export interface SetConfiguration {
  reps: string;
  weight: string;
  rir: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
}

export interface PerformedSet {
  reps: string;
  weight: string;
  rir: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
  isCompleted?: boolean;
}

// Exercise in training session
export interface TrainingSessionExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_image?: string;
  order_in_session: number;
  planned_sets: SetConfiguration[];
  performed_sets: PerformedSet[];
  is_completed: boolean;
  notes?: string;
}

// Active training session
export interface TrainingSession {
  id: number;
  profile_id: number;
  routine_week_id?: number;
  routine_name: string;
  day_of_week: number;
  day_name: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  current_exercise_index: number;
  start_time: string;
  last_activity: string;
  notes?: string;
  exercises: TrainingSessionExercise[];
  progress: TrainingSessionProgress[];
}

// Progress tracking for individual sets
export interface TrainingSessionProgress {
  id: number;
  training_session_id: number;
  exercise_id: number;
  set_number: number;
  reps?: number;
  weight?: number;
  rir?: number;
  rest_pause_details?: RPDetail[];
  drop_set_details?: DSDetail[];
  partials_details?: PartialDetail;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
}

// API request/response types
export interface CreateTrainingSessionRequest {
  profile_id: number;
  routine_week_id?: number;
  routine_name: string;
  day_of_week: number;
  day_name: string;
  exercises: {
    exercise_id: number;
    exercise_name: string;
    exercise_image?: string;
    sets_config: SetConfiguration[];
  }[];
}

export interface UpdateProgressRequest {
  exercise_id: number;
  set_number: number;
  reps?: number;
  weight?: number;
  rir?: number;
  rest_pause_details?: RPDetail[];
  drop_set_details?: DSDetail[];
  partials_details?: PartialDetail;
  is_completed: boolean;
  current_exercise_index?: number;
}

// Local state for training session progress (not saved to DB until completion)
export interface LocalSetProgress {
  reps: string;
  weight: string; 
  rir: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
  isCompleted: boolean;
}

export interface LocalExerciseProgress {
  exercise_id: number;
  sets: LocalSetProgress[];
  isCompleted: boolean;
}

export interface LocalTrainingProgress {
  exerciseProgress: Record<number, LocalExerciseProgress>; // exerciseId -> progress
  currentExerciseIndex: number;
  hasUnsavedChanges: boolean;
}

export interface CompleteSessionRequest {
  notes?: string;
  rating?: number;
  progressData?: {
    exercise_id: number;
    set_number: number;
    reps?: number;
    weight?: number;
    rir?: number;
    rest_pause_details?: RPDetail[];
    drop_set_details?: DSDetail[];
    partials_details?: PartialDetail;
    is_completed: boolean;
  }[];
}

// UI State types
export interface TrainingSessionUIState {
  currentExerciseIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  buttonsActive: Record<string, boolean>; // For RP/DS/P button states
}

// Session summary for completion
export interface SessionSummary {
  total_exercises: number;
  completed_exercises: number;
  total_sets: number;
  completed_sets: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
}

// History entry (for completed sessions)
export interface TrainingSessionHistoryEntry {
  date: string;
  routine_name: string;
  day_name: string;
  duration_minutes?: number;
  exercises_completed: number;
  total_exercises: number;
  rating?: number;
  notes?: string;
}