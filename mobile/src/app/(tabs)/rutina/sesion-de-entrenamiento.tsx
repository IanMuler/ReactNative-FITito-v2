import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";

const SesionDeEntrenamientoScreen = () => {
  const { sessionId } = useLocalSearchParams();

  return (
    <View style={styles.container} testID="sesion-de-entrenamiento-screen">
      <RadialGradientBackground />
      <View style={styles.header}>
        <Text style={styles.title}>Sesión de Entrenamiento</Text>
        <Text style={styles.subtitle}>
          Sesión {sessionId || "Nueva"}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          🏃‍♂️ Entrenamiento en Curso
        </Text>
        <Text style={styles.description}>
          Aquí podrás registrar las series realizadas, pesos, repeticiones, RIR, y técnicas avanzadas durante tu sesión de entrenamiento.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "transparent",
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
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

export default SesionDeEntrenamientoScreen;