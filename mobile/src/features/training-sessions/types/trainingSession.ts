export interface TrainingSession {
  id: string; // UUID for local sessions
  profile_id: number;
  routine_week_id: number | null;
  routine_name: string;
  day_of_week: number;
  day_name: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  current_exercise_index: number;
  start_time: string; // ISO timestamp
  last_activity: string; // ISO timestamp
  exercises: TrainingSessionExercise[];
  notes?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface TrainingSessionExercise {
  id: string; // UUID for local exercises
  exercise_id: number;
  exercise_name: string;
  exercise_image?: string;
  order_in_session: number;
  sets_config: SetConfig[];
  performed_sets: PerformedSet[];
  is_completed: boolean;
  notes?: string;
}

export interface SetConfig {
  reps: string;
  weight: string;
  rir: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
}

export interface PerformedSet {
  set_number: number;
  reps?: number;
  weight?: number;
  rir?: number;
  rest_pause_details?: RPDetail[];
  drop_set_details?: DSDetail[];
  partials_details?: PartialDetail;
  notes?: string;
}

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

export interface CreateTrainingSessionRequest {
  profile_id: number;
  routine_week_id: number | null;
  routine_name: string;
  day_of_week: number;
  day_name: string;
  exercises: {
    exercise_id: number;
    exercise_name: string;
    exercise_image?: string;
    sets_config: SetConfig[];
  }[];
}

export interface UpdateSetProgressRequest {
  session_id: string;
  exercise_id: number;
  set_number: number;
  reps?: number;
  weight?: number;
  rir?: number;
  rest_pause_details?: RPDetail[];
  drop_set_details?: DSDetail[];
  partials_details?: PartialDetail;
  notes?: string;
}

export interface SessionProgress {
  total_exercises: number;
  completed_exercises: number;
  current_exercise_index: number;
  total_sets: number;
  completed_sets: number;
  session_duration_minutes: number;
}

export type TrainingSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';