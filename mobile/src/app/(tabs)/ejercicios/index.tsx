// app/(tabs)/ejercicios/index.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LinearGradientItem from "@/components/LinearGradientItem";
import RadialGradientBackground from "@/components/RadialGradientBackground";
import { useRouter } from "expo-router";
import { exerciseApi } from "@/services/exerciseApi";
import { Ionicons } from "@expo/vector-icons";
import Menu, { MenuItem } from "@/components/Menu";
import { Exercise } from "@/types/exercise";
import Toast from 'react-native-toast-message';

const ExercisesScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch exercises using React Query
  const { data: exercises = [], isLoading, error } = useQuery({
    queryKey: ['exercises'],
    queryFn: exerciseApi.getAll,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: exerciseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setModalVisible(false);
      setExerciseToDelete(null);
      Toast.show({
        type: 'success',
        text1: 'Ejercicio eliminado',
        text2: 'El ejercicio se eliminó correctamente',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo eliminar el ejercicio',
      });
    },
  });

  // Pull to refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['exercises'] });
    setRefreshing(false);
  }, [queryClient]);

  const deleteExercise = async () => {
    if (exerciseToDelete) {
      deleteMutation.mutate(exerciseToDelete.id);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    router.push({
      pathname: "/ejercicios/anadir-ejercicio",
      params: { 
        id: exercise.id.toString(), 
        name: exercise.name, 
        image: exercise.image 
      },
    });
  };

  const options = (exercise: Exercise) => [
    { label: "Editar", onPress: () => handleEditExercise(exercise), testID: "menu-option-edit" },
    { label: "Eliminar", onPress: () => { setExerciseToDelete(exercise); setModalVisible(true); }, testID: "menu-option-delete" },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <RadialGradientBackground />
        <Text style={styles.loadingText}>Cargando ejercicios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <RadialGradientBackground />
        <Text style={styles.errorText}>Error al cargar ejercicios</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="exercises-screen">
      <RadialGradientBackground />
      <View style={styles.header}>
        <Text style={styles.title}>Ejercicios</Text>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#2979FF"]}
          />
        }
      >
        {exercises.map((exercise, index) => (
          <LinearGradientItem
            key={exercise.id}
            styles={{ dayContainer: { ...styles.exerciseContainer, zIndex: -index } }} // zIndex to make sure the menu is on top
          >
            <View style={styles.exerciseContent} testID={`exercise-${exercise.name}`}>
              <View style={styles.exerciseTextContainer}>
                <Image
                  source={{ uri: exercise.image }}
                  style={styles.exerciseImage}
                />
                <Text style={styles.exerciseText}>{exercise.name}</Text>
              </View>
              <View style={styles.ellipsisContainer}>
                <Menu trigger={
                  <Ionicons
                    name="ellipsis-vertical"
                    size={24}
                    color="#FFFFFF"
                    testID="ellipsis-vertical"
                  />}
                >
                  {options(exercise).map((option, index) => (
                    <MenuItem key={index} text={option.label} onPress={option.onPress} testID={option.testID} />
                  ))}
                </Menu>
              </View>
            </View>
          </LinearGradientItem>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/ejercicios/anadir-ejercicio")}
      >
        <Text style={styles.buttonText}>Añadir</Text>
      </TouchableOpacity>

      {exerciseToDelete && (
        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirmar eliminación</Text>
              <Text style={styles.modalText}>
                ¿Estás seguro de que quieres eliminar este ejercicio?
              </Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={deleteExercise}
                  testID="confirm-delete"
                  disabled={deleteMutation.isPending}
                >
                  <Text style={styles.modalButtonText}>
                    {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 18,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  exerciseContainer: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseImage: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  exerciseText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  ellipsisContainer: {
    position: 'relative',
  },
  menuOptionText: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "#1F2940",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "#A5A5A5",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtonsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#2979FF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

export default ExercisesScreen;