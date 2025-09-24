import { useRouter } from 'expo-router';
import { TrainingDay } from '../types';

export const useTrainingDayNavigation = () => {
  const router = useRouter();

  const navigateToAddTrainingDay = () => {
    router.push('/dias-entreno/anadir-dia');
  };

  const navigateToEditTrainingDay = (trainingDay: TrainingDay) => {
    router.push({
      pathname: '/dias-entreno/anadir-dia',
      params: { name: trainingDay.name, id: trainingDay.id.toString() },
    });
  };

  return {
    navigateToAddTrainingDay,
    navigateToEditTrainingDay,
  };
};