import { QueryClient } from '@tanstack/react-query';
import { routineApi } from '@/features/routines/services/routineApi';
import { exerciseApi } from '@/features/exercises/services/exerciseApi';
import { routineConfigurationApi } from '@/features/routine-configurations/services/routineConfigurationApi';

export const dataPrefetchService = {
  // Prefetch all critical data for offline use
  prefetchCriticalData: async (queryClient: QueryClient, profileId: number) => {
    console.log('📦 Prefetching critical data for offline use...');

    try {
      // 1. Prefetch routine weeks
      await queryClient.prefetchQuery({
        queryKey: ['routine-weeks', profileId],
        queryFn: () => routineApi.getWeekSchedule(profileId),
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      });

      // 2. Prefetch exercise library
      await queryClient.prefetchQuery({
        queryKey: ['exercises'],
        queryFn: () => exerciseApi.getAll(),
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (exercises don't change often)
      });

      // 3. Prefetch exercise configurations for each day
      const routineWeeks = await routineApi.getWeekSchedule(profileId);

      for (const week of routineWeeks) {
        if (!week.is_rest_day && week.id) {
          await queryClient.prefetchQuery({
            queryKey: ['routine-configuration', week.id, profileId],
            queryFn: () => routineConfigurationApi.getConfiguration(week.id, profileId),
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          });
        }
      }

      console.log('✅ Critical data prefetched successfully');
    } catch (error) {
      // Check if this is expected offline behavior
      if (error instanceof Error && error.message === 'OFFLINE_MODE') {
        console.log('📴 [Offline] Using cached data, will refresh when online');
      } else {
        console.error('❌ Failed to prefetch critical data:', error);
      }
    }
  },

  // Call this when user logs in or profile changes
  onProfileChange: (queryClient: QueryClient, profileId: number) => {
    dataPrefetchService.prefetchCriticalData(queryClient, profileId);
  },
};
