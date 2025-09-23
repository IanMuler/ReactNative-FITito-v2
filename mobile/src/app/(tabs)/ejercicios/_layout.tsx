//app/(tabs)/ejercicios/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="anadir-ejercicio" />
    </Stack>
  );
}