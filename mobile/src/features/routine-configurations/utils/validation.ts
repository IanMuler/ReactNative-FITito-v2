import { ExerciseDetail, ButtonsActiveState } from '../types';

/* Validation and button state utilities */

export const checkIfAllInputsAreFilled = (
  exerciseDetails: ExerciseDetail[], 
  buttonsActive: ButtonsActiveState
): boolean => {
  for (const exercise of exerciseDetails) {
    for (const set of exercise.sets) {
      if (!set.reps || !set.weight || !set.rir) {
        return false;
      }
      if (buttonsActive[`${exerciseDetails.indexOf(exercise)}-${exercise.sets.indexOf(set)}-RP`] &&
        (set.rp?.some(rpDetail => !rpDetail.value || !rpDetail.time) || !set.rp?.length)) {
        return false;
      }
      if (buttonsActive[`${exerciseDetails.indexOf(exercise)}-${exercise.sets.indexOf(set)}-DS`] &&
        (set.ds?.some(dsDetail => !dsDetail.reps || !dsDetail.peso) || !set.ds?.length)) {
        return false;
      }
      if (buttonsActive[`${exerciseDetails.indexOf(exercise)}-${exercise.sets.indexOf(set)}-P`] &&
        (!set.partials || !set.partials.reps)) {
        return false;
      }
    }
  }
  return true;
};

export const initializeButtons = (exerciseDetails: ExerciseDetail[]): ButtonsActiveState => {
  const initialButtonsActive: ButtonsActiveState = {};
  exerciseDetails.forEach((exercise, exerciseIndex) => {
    exercise.sets.forEach((set, setIndex) => {
      if (set.rp && set.rp.length > 0) {
        const keyRP = `${exerciseIndex}-${setIndex}-RP`;
        initialButtonsActive[keyRP] = true;
      }
      if (set.ds && set.ds.length > 0) {
        const keyDS = `${exerciseIndex}-${setIndex}-DS`;
        initialButtonsActive[keyDS] = true;
      }
      if (set.partials) {
        const keyP = `${exerciseIndex}-${setIndex}-P`;
        initialButtonsActive[keyP] = true;
      }
    });
  });
  return initialButtonsActive;
};