// Types for routine day configurations

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

export interface SetConfiguration {
  reps: string;
  weight: string;
  rir: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
}

export interface ExerciseConfiguration {
  config_id?: number;
  routine_week_id: number;
  training_day_id?: number;
  exercise_id: number;
  exercise_name: string;
  exercise_image?: string;
  order_index: number;
  sets_config: SetConfiguration[];
  notes?: string;
}

export interface RoutineWeekInfo {
  id: number;
  day_name: string;
  routine_id?: number;
  routine_name?: string;
}

export interface RoutineDayConfiguration {
  routine_week: RoutineWeekInfo;
  exercises: ExerciseConfiguration[];
}

// API Types
export interface CreateRoutineConfigurationDto {
  profile_id: number;
  exercises: {
    exercise_id: number;
    training_day_id?: number;
    sets_config: SetConfiguration[];
    notes?: string;
  }[];
}

export interface UpdateRoutineConfigurationDto extends CreateRoutineConfigurationDto {}

export interface InitializeRoutineConfigurationDto {
  profile_id: number;
  training_day_id: number;
}