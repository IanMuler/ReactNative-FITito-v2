import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PortalProvider } from '@gorhom/portal';
import Toast from 'react-native-toast-message';
import { ProfileProvider } from '@/features/profile';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    // You can add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PortalProvider>
        <ProfileProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <Toast />
        </ProfileProvider>
      </PortalProvider>
    </QueryClientProvider>
  );
}