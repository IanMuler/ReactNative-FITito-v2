/**
 * Hook to query session history for the current week
 * Returns a Map of dates to session history records
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { SessionHistoryApi, SessionHistoryResponse } from '../services/sessionHistoryApi';

/**
 * Get all dates for the current week (Monday to Sunday)
 */
const getWeekDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday

  // Calculate Monday of current week
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  // Generate all 7 dates from Monday to Sunday
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    // Usar componentes de fecha local en lugar de ISO UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`); // YYYY-MM-DD format
  }

  return dates;
};

/**
 * Hook to get session history for the current week
 * @param profileId - Profile ID to query history for
 * @returns Map of dates to session history records and loading state
 */
export const useSessionHistoryByWeek = (profileId: number) => {
  const weekDates = useMemo(() => getWeekDates(), []);

  // Query session history for each date in the week
  const queries = useQueries({
    queries: weekDates.map((date) => ({
      queryKey: ['session-history', profileId, date],
      queryFn: () => SessionHistoryApi.getSessionHistoryByDate(profileId, date),
      enabled: !!profileId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  // Create a Map of dates to session history
  const sessionHistoryMap = useMemo(() => {
    const map = new Map<string, SessionHistoryResponse>();

    queries.forEach((query, index) => {
      const date = weekDates[index];
      if (query.data) {
        map.set(date, query.data as unknown as SessionHistoryResponse);
      }
    });

    return map;
  }, [queries, weekDates]);

  // Check if any query is loading
  const isLoading = queries.some((query) => query.isLoading);

  // Check if any query has an error
  const hasError = queries.some((query) => query.isError);

  return {
    sessionHistoryMap,
    isLoading,
    hasError,
    weekDates,
  };
};
