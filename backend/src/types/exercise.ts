export enum ExerciseCategory {
  CARDIO = 'cardio',
  STRENGTH = 'strength',
  FLEXIBILITY = 'flexibility',
  SPORTS = 'sports'
}

export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  muscle_groups: string[];
  equipment: string[];
  instructions: string[];
  description?: string;
  difficulty_level: number; // 1-5
  is_compound: boolean;
  is_bodyweight: boolean;
  video_url?: string;
  image_url?: string;
  tips: string[];
  common_mistakes: string[];
  variations: string[];
  is_active: boolean;
  created_by_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExerciseDto {
  name: string;
  category: ExerciseCategory;
  muscle_groups: string[];
  equipment?: string[];
  instructions?: string[];
  description?: string;
  difficulty_level?: number;
  is_compound?: boolean;
  is_bodyweight?: boolean;
  video_url?: string;
  image_url?: string;
  tips?: string[];
  common_mistakes?: string[];
  variations?: string[];
  is_active?: boolean;
  created_by_admin?: boolean;
}

export interface UpdateExerciseDto {
  name?: string;
  category?: ExerciseCategory;
  muscle_groups?: string[];
  equipment?: string[];
  instructions?: string[];
  description?: string;
  difficulty_level?: number;
  is_compound?: boolean;
  is_bodyweight?: boolean;
  video_url?: string;
  image_url?: string;
  tips?: string[];
  common_mistakes?: string[];
  variations?: string[];
  is_active?: boolean;
}

export interface ExerciseFilters {
  category?: ExerciseCategory;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty_level?: number;
  is_compound?: boolean;
  is_bodyweight?: boolean;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}