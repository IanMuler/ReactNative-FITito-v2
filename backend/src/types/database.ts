// Database entity types for FITito
// These types match the PostgreSQL schema

export interface User {
  id: number;
  email: string;
  password_hash: string;
  email_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: number;
  user_id: number;
  profile_name: string;
  display_name: string | null;
  profile_type: 'personal' | 'trainer' | 'athlete';
  is_active: boolean;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: Date | null;
  weight_unit: 'kg' | 'lbs';
  distance_unit: 'km' | 'miles';
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  muscle_groups: string[];
  equipment: string[];
  instructions: string[];
  description: string | null;
  difficulty_level: number;
  is_compound: boolean;
  is_bodyweight: boolean;
  video_url: string | null;
  image_url: string | null;
  tips: string[];
  common_mistakes: string[];
  variations: string[];
  is_active: boolean;
  created_by_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

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
  reps: number | null;
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

export interface WorkoutSession {
  id: number;
  profile_id: number;
  routine_id: number | null;
  name: string | null;
  started_at: Date;
  completed_at: Date | null;
  duration_minutes: number | null;
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
  created_at: Date;
  updated_at: Date;
}

export interface WorkoutSet {
  id: number;
  session_id: number;
  exercise_id: number;
  routine_exercise_id: number | null;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  rpe: number | null;
  rest_time_seconds: number | null;
  notes: string | null;
  is_warmup: boolean;
  is_completed: boolean;
  completed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PersonalRecord {
  id: number;
  profile_id: number;
  exercise_id: number;
  record_type: '1rm' | 'volume' | 'reps' | 'time' | 'distance';
  value: number;
  unit: string;
  reps: number | null;
  achieved_at: Date;
  session_id: number | null;
  notes: string | null;
  is_estimated: boolean;
  created_at: Date;
}

// Enums and types
export type ExerciseCategory = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'arms' 
  | 'legs' 
  | 'core' 
  | 'cardio' 
  | 'flexibility' 
  | 'functional' 
  | 'olympic';

export type ProfileType = 'personal' | 'trainer' | 'athlete';
export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'miles';
export type RecordType = '1rm' | 'volume' | 'reps' | 'time' | 'distance';

// Input types for creating entities (omit auto-generated fields)
export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'> & {
  password: string; // Plain password (will be hashed)
};

export type CreateUserProfileInput = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;

export type CreateExerciseInput = Omit<Exercise, 'id' | 'created_at' | 'updated_at'>;

export type CreateRoutineInput = Omit<Routine, 'id' | 'created_at' | 'updated_at'>;

export type CreateRoutineExerciseInput = Omit<RoutineExercise, 'id' | 'created_at' | 'updated_at'>;

export type CreateWorkoutSessionInput = Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>;

export type CreateWorkoutSetInput = Omit<WorkoutSet, 'id' | 'created_at' | 'updated_at'>;

export type CreatePersonalRecordInput = Omit<PersonalRecord, 'id' | 'created_at'>;

// Update types (all fields optional except ID)
export type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type UpdateUserProfileInput = Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type UpdateExerciseInput = Partial<Omit<Exercise, 'id' | 'created_at' | 'updated_at'>>;

export type UpdateRoutineInput = Partial<Omit<Routine, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;

export type UpdateRoutineExerciseInput = Partial<Omit<RoutineExercise, 'id' | 'routine_id' | 'created_at' | 'updated_at'>>;

export type UpdateWorkoutSessionInput = Partial<Omit<WorkoutSession, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;

export type UpdateWorkoutSetInput = Partial<Omit<WorkoutSet, 'id' | 'session_id' | 'created_at' | 'updated_at'>>;

// Search and query types
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface SearchOptions extends PaginationOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ExerciseSearchOptions extends SearchOptions {
  category?: ExerciseCategory;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty_level?: number;
  is_bodyweight?: boolean;
}

export interface RoutineSearchOptions extends SearchOptions {
  profile_id: number;
  is_favorite?: boolean;
  tags?: string[];
  difficulty_level?: number;
}

// Profile-aware query helpers
export interface ProfileAwareQuery {
  profile_id: number;
}

// Database utility types
export interface DatabaseResult<T> {
  rows: T[];
  rowCount: number;
}

export interface TransactionClient {
  query: <T = any>(text: string, params?: any[]) => Promise<DatabaseResult<T>>;
}