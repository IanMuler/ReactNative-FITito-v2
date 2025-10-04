import React from "react";
import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sesion-de-entrenamiento" />
      <Stack.Screen name="asignar-entreno" />
      <Stack.Screen name="configurar-entreno" />
      <Stack.Screen name="historico" />
    </Stack>
  );
}