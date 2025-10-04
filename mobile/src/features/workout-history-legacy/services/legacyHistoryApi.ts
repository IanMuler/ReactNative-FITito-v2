/* Legacy History API Service - Transforms session-history to AsyncStorage format */

import { HistoryEntry, ExerciseDetail, SetDetail, PerformedSetDetail } from '../types';
import { fetchHandler } from '@/services/fetchHandler';

/* Helper: Transform session history response to legacy format */
const transformSessionHistoryToLegacy = (sessionHistoryData: any[], originalDate: string): HistoryEntry[] => {
  if (!sessionHistoryData || sessionHistoryData.length === 0) {
    return [];
  }

  return sessionHistoryData.map((session: any) => {
    const exerciseDetails: ExerciseDetail[] = session.session_data?.exercises?.map((exercise: any) => ({
      name: exercise.exercise_name || '',
      image: exercise.exercise_image || '',
      sets: (exercise.sets_config || []).map((set: any) => ({
        reps: set.reps || '',
        weight: set.weight || '',
        rir: set.rir,
        rp: set.rp || [],
        ds: set.ds || [],
        partials: set.partials,
      })) as SetDetail[],
      performedSets: (exercise.performed_sets || []).map((set: any) => ({
        reps: set.reps || '',
        weight: set.weight || '',
        rir: set.rir,
        rp: set.rp || [],
        ds: set.ds || [],
        partials: set.partials,
      })) as PerformedSetDetail[],
    })) || [];

    return {
      date: originalDate, // Use the original DD/MM/YYYY format
      exerciseDetails,
    };
  });
};

export const legacyHistoryApi = {
  /* Get workout history by date in AsyncStorage format */
  getHistoryByDate: async (profileId: number, date: string): Promise<HistoryEntry[]> => {
    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const result = await fetchHandler.get<any[]>('/session-history', {
      profile_id: profileId.toString(),
      date: formattedDate
    });

    // Transform new session-history format to legacy format
    return transformSessionHistoryToLegacy(result || [], date);
  },
};