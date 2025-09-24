import { useCallback, useMemo } from 'react';
import { Exercise } from '../types';

interface MenuOption {
  label: string;
  onPress: () => void;
  testID: string;
}

interface UseExerciseMenuProps {
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export const useExerciseMenu = ({ onEdit, onDelete }: UseExerciseMenuProps) => {
  
  /* Menu options generator */
  const generateMenuOptions = useCallback((exercise: Exercise): MenuOption[] => [
    { 
      label: "Editar", 
      onPress: () => onEdit(exercise), 
      testID: "menu-option-edit" 
    },
    { 
      label: "Eliminar", 
      onPress: () => onDelete(exercise), 
      testID: "menu-option-delete" 
    },
  ], [onEdit, onDelete]);

  return {
    generateMenuOptions,
  };
};