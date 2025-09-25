import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { DAY_NAMES } from "@/features/routines/types";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";

const HistoricoScreen = () => {
  const { date } = useLocalSearchParams<{ date: string }>(); // formato: DD/MM/YYYY
  
  // Parse date to get day name
  const parsedDate = date ? new Date(date.split('/').reverse().join('-')) : new Date();
  const dayName = DAY_NAMES[parsedDate.getDay()];

  return (
    <View style={styles.container} testID="historico-screen">
      <RadialGradientBackground />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title} testID="historico-title">
          Histórico de {dayName} {date}
        </Text>
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            📊 Historial de Entrenamientos
          </Text>
          <Text style={styles.description}>
            Aquí podrás ver el historial detallado de entrenamientos completados, incluyendo ejercicios realizados, pesos, series, repeticiones y técnicas avanzadas utilizadas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "transparent",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
  },
  description: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default HistoricoScreen;