import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RadialGradientBackground from "@/components/ui/RadialGradientBackground";

const ManagementScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container} testID="management-screen">
      <RadialGradientBackground />
      <Text style={styles.title}>Gestión de Rutinas</Text>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          ⚙️ Configuraciones y Herramientas
        </Text>
        <Text style={styles.description}>
          Aquí podrás gestionar tus rutinas, exportar datos, configurar preferencias y acceder a herramientas avanzadas de análisis de entrenamientos.
        </Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    marginTop: 25,
    marginLeft: 60,
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
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "#2979FF",
    padding: 10,
    borderRadius: 20,
  },
});

export default ManagementScreen;