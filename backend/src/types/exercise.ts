/**
 * Exercise Types
 * Simple structure matching current database schema
 */

export interface Exercise {
  id: number;
  name: string;
  image: string;
  created_at: Date;
}

export interface CreateExerciseDto {
  name: string;
  image: string;
}

export interface UpdateExerciseDto {
  name?: string;
  image?: string;
}
