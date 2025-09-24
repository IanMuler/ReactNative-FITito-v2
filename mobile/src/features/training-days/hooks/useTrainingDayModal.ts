import { useState } from 'react';
import { TrainingDay } from '../types';

export const useTrainingDayModal = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [trainingDayToDelete, setTrainingDayToDelete] = useState<TrainingDay | null>(null);

  const openDeleteModal = (trainingDay: TrainingDay) => {
    setTrainingDayToDelete(trainingDay);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTrainingDayToDelete(null);
  };

  return {
    modalVisible,
    trainingDayToDelete,
    openDeleteModal,
    closeModal,
  };
};