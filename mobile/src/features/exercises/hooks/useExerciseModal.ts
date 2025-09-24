import { useState, useCallback } from 'react';
import { Exercise } from '../types';

export const useExerciseModal = () => {
  /* State */
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  /* Handlers */
  const openDeleteModal = useCallback((exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setExerciseToDelete(null);
  }, []);

  const resetModal = useCallback(() => {
    setModalVisible(false);
    setExerciseToDelete(null);
  }, []);

  return {
    // State
    modalVisible,
    exerciseToDelete,
    
    // Actions
    openDeleteModal,
    closeModal,
    resetModal,
  };
};