import { Exercise } from '../../types';

export interface ExerciseFormProps {
  exercise?: Exercise;
  isLoading: boolean;
  onSave: (data: { name: string; image: string }) => void;
}

export interface ExerciseFormData {
  name: string;
  image: string;
}