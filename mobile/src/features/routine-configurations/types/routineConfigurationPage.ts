/* Types for Configure Training Day Page */

import { RPDetail, DSDetail, PartialDetail } from './routineConfiguration';

export interface ExerciseDetail {
  name: string;
  sets: {
    reps: string;
    weight: string;
    rir: string;
    rp?: RPDetail[];
    ds?: DSDetail[];
    partials?: PartialDetail;
  }[];
  image: string;
}

/* UI State Types */
export interface ButtonsActiveState {
  [key: string]: boolean;
}

/* Form Validation Types */
export interface ValidationState {
  isValid: boolean;
  errors: string[];
}