import React from "react";
import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View } from "react-native";
import ProfileSwitch from "@/components/ProfileSwitch";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <ProfileSwitch />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarInactiveTintColor: "#A5A5A5",
          tabBarStyle: {
            backgroundColor: "#121623",
            borderTopColor: "#121623",
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerShown: false,
        }}
      >
        {/* "redirect" is a special screen that redirects to the first screen in the list */}
        {/* This is useful for setting the index screen of a tab navigator */}
        <Tabs.Screen name="index" redirect />
        <Tabs.Screen
          name="rutina"
          options={{
            title: "Rutinas",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "calendar" : "calendar-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="dias-entreno"
          options={{
            title: "Días de entreno",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "walk" : "walk-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ejercicios"
          options={{
            title: "Ejercicios",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "barbell" : "barbell-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}