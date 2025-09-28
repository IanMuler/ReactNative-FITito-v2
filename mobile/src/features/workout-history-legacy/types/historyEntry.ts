/* Legacy History Types - Exact replica from original AsyncStorage format */

export type RPDetail = {
  value: string;
  time: number;
};

export type DSDetail = {
  reps: string;
  peso: string;
};

export type PartialDetail = {
  reps: string;
};

export type SetDetail = {
  reps: string;
  weight: string;
  rir?: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
};

export type PerformedSetDetail = {
  reps: string;
  weight: string;
  rir?: string;
  rp?: RPDetail[];
  ds?: DSDetail[];
  partials?: PartialDetail;
};

export type ExerciseDetail = {
  name: string;
  sets: SetDetail[];
  image: string;
  performedSets?: PerformedSetDetail[];
};

export type HistoryEntry = {
  date: string;
  exerciseDetails: ExerciseDetail[];
};

export type LegacyHistoryResponse = {
  success: boolean;
  data: HistoryEntry[];
};