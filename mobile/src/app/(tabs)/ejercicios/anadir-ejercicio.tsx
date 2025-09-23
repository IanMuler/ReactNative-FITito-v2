// app/(tabs)/ejercicios/anadir-ejercicio.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import RadialGradientBackground from "@/components/RadialGradientBackground";
import { exerciseApi } from "@/services/exerciseApi";
import { useRouter, useLocalSearchParams } from "expo-router";
import Toast from 'react-native-toast-message';

const AddExerciseScreen = () => {
  const { id, name, image } = useLocalSearchParams<{
    id?: string;
    name?: string;
    image?: string;
  }>();
  
  const [exerciseName, setExerciseName] = useState(name || "");
  const [exerciseImage, setExerciseImage] = useState<string | null>(
    image || null
  );
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if we're editing (id exists) or creating
  const isEditing = !!id;

  useEffect(() => {
    if (name && image) {
      setExerciseName(name as string);
      setExerciseImage(image as string);
    }
  }, [name, image]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: exerciseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Toast.show({
        type: 'success',
        text1: 'Ejercicio creado',
        text2: 'El ejercicio se creó correctamente',
      });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Error al crear el ejercicio',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; image: string } }) => 
      exerciseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Toast.show({
        type: 'success',
        text1: 'Ejercicio actualizado',
        text2: 'El ejercicio se actualizó correctamente',
      });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Error al actualizar el ejercicio',
      });
    },
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setExerciseImage(result.assets[0].uri);
    }
  };

  const saveExercise = async () => {
    if (!exerciseName.trim() || !exerciseImage) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const exerciseData = {
      name: exerciseName.trim(),
      image: exerciseImage,
    };

    if (isEditing && id) {
      updateMutation.mutate({
        id: parseInt(id),
        data: exerciseData,
      });
    } else {
      createMutation.mutate(exerciseData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <ScrollView>
        <Text testID="title" style={styles.title}>
          {isEditing ? "Editar ejercicio" : "Añadir ejercicio"}
        </Text>
        <View>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            testID="input-exercise-name"
            style={styles.input}
            placeholder="Nombre del ejercicio"
            placeholderTextColor="#A5A5A5"
            value={exerciseName}
            onChangeText={setExerciseName}
            editable={!isLoading}
          />
        </View>
        <View>
          <Text style={styles.label}>Imagen:</Text>
          <TouchableOpacity 
            testID="button-pick-image" 
            style={[styles.imagePicker, isLoading && styles.disabled]} 
            onPress={pickImage}
            disabled={isLoading}
          >
            <Text style={styles.imagePickerText}>Seleccionar Imagen</Text>
          </TouchableOpacity>
          {exerciseImage && (
            <Image
              testID="image-exercise"
              source={{ uri: exerciseImage }}
              style={styles.selectedImage}
            />
          )}
        </View>
      </ScrollView>
      <TouchableOpacity
        testID="button-save-exercise"
        style={[
          styles.button,
          ((!exerciseName || !exerciseImage) || isLoading) && styles.buttonDisabled,
        ]}
        onPress={saveExercise}
        disabled={!exerciseName || !exerciseImage || isLoading}
      >
        <Text style={styles.buttonText} testID="button-save-exercise-text">
          {isLoading 
            ? (isEditing ? "Guardando..." : "Añadiendo...") 
            : (isEditing ? "Guardar cambios" : "Añadir")
          }
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141A30",
    padding: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1F2940",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
  },
  imagePicker: {
    backgroundColor: "#1F2940",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  selectedImage: {
    height: 200,
    width: 200,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: "center",
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A5A5A5",
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddExerciseScreen;