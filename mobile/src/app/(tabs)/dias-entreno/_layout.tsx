import { Stack } from 'expo-router';

export default function TrainingDaysLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="anadir-dia" />
    </Stack>
  );
}