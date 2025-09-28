import { ExerciseDetail } from '../types';

/* Template generation utilities */

export const createTemplateFromTrainingDay = (trainingDayExercises: any[]): ExerciseDetail[] => {
  return trainingDayExercises.map((tdExercise) => ({
    name: tdExercise.exercise.name,
    sets: [
      {
        reps: "0",
        weight: "0", 
        rir: "0",
        rp: [],
        ds: [],
        partials: undefined
      }
    ],
    image: tdExercise.exercise.image || ""
  }));
};