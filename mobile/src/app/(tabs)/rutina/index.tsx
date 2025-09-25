import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LinearGradientItem from "@/components/ui/LinearGradientItem";
import Menu, { MenuItem } from "@/components/ui/Menu";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";
import * as Font from "expo-font";
import { useWeekSchedule } from "@/features/routines/hooks";
import type { Day } from "@/features/routines/types";

const RoutineScreen = () => {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const router = useRouter();
  /* Business Logic */
  const {
    days,
    currentDayIndex,
    currentWeek,
    month,
    year,
    isLoading,
    isDayCompletedToday,
    toggleRestDay,
    removeRoutineFromDay,
  } = useWeekSchedule();

  useEffect(() => {
    const loadIcons = async () => {
      await Font.loadAsync({
        ...Ionicons.font,
      });
      setIconsLoaded(true);
    };
    loadIcons();
  }, []);

  /* Event Handlers */
  const assignTrainingDay = (day: Day) => {
    router.push({
      pathname: "/(tabs)/rutina/asignar-entreno",
      params: { dayName: day.name },
    });
  };

  const editTrainingDay = (day: Day) => {
    router.push({
      pathname: "/(tabs)/rutina/configurar-entreno",
      params: { dayName: day.name, trainingDayName: day.trainingDayName },
    });
  };

  const removeTrainingDay = async (day: Day) => {
    console.log(`🗑️ Removing training day: ${day.name}`);
    await removeRoutineFromDay(day.name);
    console.log(`✅ Training day ${day.name} removed completely`);
  };

  const handleDayPress = (dayIndex: number) => {
    if (isDayCompletedToday(days[dayIndex])) {
      const date = new Date();
      date.setDate(date.getDate() - (currentDayIndex - dayIndex));

      router.push({
        pathname: "/(tabs)/rutina/historico",
        params: {
          date: date.toLocaleDateString(),
        },
      });
    }
  };

  /* Derived State */
  const currentDay = days[currentDayIndex] || {};
  const isCurrentDayCompletedToday = isDayCompletedToday(currentDay);
  const isSessionDisabled = isCurrentDayCompletedToday || !currentDay?.trainingDayName;

  const ButtonText = currentDay.rest
    ? "Día de descanso"
    : !currentDay?.trainingDayName
      ? "No hay entrenamiento asignado"
      : isCurrentDayCompletedToday
        ? "Sesión finalizada"
        : "Empezar sesión";

  /* Menu Options */
  const options = (day: Day) => [
    {
      label: day.rest ? "Día de rutina" : "Día de descanso",
      onPress: () => toggleRestDay(day),
      testID: `menu-option-toggle-rest-${day.name}`
    },
    {
      label: "Asignar entreno",
      onPress: () => assignTrainingDay(day),
      testID: `menu-option-assign-${day.name}`
    },
    ...(day.trainingDayName ? [
      {
        label: "Editar entreno",
        onPress: () => editTrainingDay(day),
        testID: `menu-option-edit-${day.name}`
      },
      {
        label: "Remover entreno",
        onPress: () => removeTrainingDay(day),
        testID: `menu-option-remove-${day.name}`
      },
    ] : [])
  ];

  /* JSX Fragments */
  const headerSection = (
    <View style={styles.header}>
      <Text style={styles.title}>Rutina</Text>
      <Text style={styles.subtitle}>
        Semana {currentWeek} - {month} {year}
      </Text>
    </View>
  );

  const floatingSettingsButton = iconsLoaded && (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => router.push("/(tabs)/rutina/management")}
      testID="button-settings"
    >
      <Ionicons name="settings" size={24} color="white" />
    </TouchableOpacity>
  );

  const sessionButton = (
    <TouchableOpacity
      style={[styles.button, isSessionDisabled && styles.disabledButton]}
      onPress={() => router.push("/(tabs)/rutina/sesion-de-entrenamiento")}
      disabled={isSessionDisabled}
      testID="button-start-session"
    >
      <Text style={styles.buttonText}>{ButtonText}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container} testID="routine-screen">
        <RadialGradientBackground />
        {headerSection}
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando rutina...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="routine-screen">
      <RadialGradientBackground />
      {headerSection}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {days.map((day, index) => (
          <LinearGradientItem
            key={index}
            styles={{
              dayContainer: styles.dayContainer,
              restDayContainer: styles.restDayContainer,
              activeContainer: styles.activeDayContainer,
            }}
            day={day}
            isActive={currentDayIndex === index}
          >
            <View style={[styles.dayInnerContainer]} testID={`day-${day.name}`}>
              <View>
                <Text
                  style={[
                    styles.dayText,
                    day.rest && styles.restDayText,
                    currentDayIndex === index && styles.activeDayText,
                  ]}
                >
                  {day.name}
                </Text>
                {day.trainingDayName && (
                  <Text style={styles.trainingDayText}>
                    {day.trainingDayName}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {isDayCompletedToday(day) && (
                  <TouchableOpacity onPress={() => handleDayPress(index)} testID={`day-completed-${day.name}`}>
                    <Ionicons name={"book"} size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <View style={styles.ellipsisContainer}>
                  <Menu trigger={
                    <Ionicons
                      name="ellipsis-vertical"
                      size={24}
                      color="#FFFFFF"
                      testID={`ellipsis-vertical-${day.name}`}
                    />}
                  >
                    {options(day).map((option, index) => (
                      <MenuItem key={index} text={option.label} onPress={option.onPress} testID={option.testID} />
                    ))}
                  </Menu>
                </View>
              </View>
            </View>
          </LinearGradientItem>
        ))}
      </ScrollView>
      {sessionButton}
      {floatingSettingsButton}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  header: {
    marginTop: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    color: "#A5A5A5",
    fontSize: 16,
    marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  dayContainer: {
    padding: 22,
    borderRadius: 10,
    marginBottom: 8,
    opacity: 0.8,
  },
  activeDayContainer: {
    backgroundColor: "#2979FF",
  },
  restDayContainer: {
    backgroundColor: "#A5A5A5",
  },
  dayInnerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayText: {
    color: "#A5A5A5",
    fontSize: 18,
    fontWeight: "bold",
  },
  trainingDayText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 5,
  },
  activeDayText: {
    color: "#FFFFFF",
  },
  restDayText: {
    color: "#6c757d",
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#A5A5A5",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  ellipsisContainer: {
    position: 'relative',
    zIndex: 2,
  },
  floatingButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#2979FF",
    padding: 10,
    borderRadius: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
});

export default RoutineScreen;