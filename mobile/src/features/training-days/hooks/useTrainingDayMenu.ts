import { TrainingDay } from '../types';

interface UseTrainingDayMenuProps {
  onEdit: (trainingDay: TrainingDay) => void;
  onDelete: (trainingDay: TrainingDay) => void;
}

export const useTrainingDayMenu = ({ onEdit, onDelete }: UseTrainingDayMenuProps) => {
  const generateMenuOptions = (trainingDay: TrainingDay) => [
    { 
      label: "Editar", 
      onPress: () => onEdit(trainingDay), 
      testID: `menu-option-edit-${trainingDay.name}` 
    },
    { 
      label: "Eliminar", 
      onPress: () => onDelete(trainingDay), 
      testID: `menu-option-delete-${trainingDay.name}` 
    },
  ];

  return {
    generateMenuOptions,
  };
};