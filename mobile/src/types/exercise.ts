export interface Exercise {
  id: number;
  name: string;
  image: string;
  created_at: string;
}

export interface CreateExerciseDto {
  name: string;
  image: string;
}

export interface UpdateExerciseDto {
  name: string;
  image: string;
}