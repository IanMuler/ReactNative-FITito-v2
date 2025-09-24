import { Exercise } from '../../types';

export interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}