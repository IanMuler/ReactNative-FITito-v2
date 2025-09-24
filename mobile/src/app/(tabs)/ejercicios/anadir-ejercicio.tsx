import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RadialGradientBackground from '@/components/RadialGradientBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExerciseActions, useExerciseList } from '@/features/exercises/hooks';
import { Exercise } from '@/features/exercises/types';

const AddExercisePage: React.FC = () => {
  const { name, image } = useLocalSearchParams<{
    name: string;
    image: string;
  }>();
  
  const [exerciseName, setExerciseName] = useState(name || "");
  const [exerciseImage, setExerciseImage] = useState<string | null>(image || null);
  const router = useRouter();
  
  const { exercises } = useExerciseList();
  const { createExercise, updateExercise } = useExerciseActions();

  useEffect(() => {
    if (name && image) {
      setExerciseName(name as string);
      setExerciseImage(image as string);
    }
  }, [name, image]);

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
    if (!exerciseImage) return; // Add guard for null image
    
    const newExercise = {
      name: exerciseName,
      image: exerciseImage,
    };

    const nameExists = exercises.some(
      (exercise: Exercise) =>
        exercise.name === exerciseName && exercise.name !== name
    );

    if (nameExists) {
      Alert.alert("Error", "Ya existe un ejercicio con ese nombre.");
      return;
    }

    if (name) {
      // Editing existing exercise - find by name and update
      const exerciseToUpdate = exercises.find(ex => ex.name === name);
      if (exerciseToUpdate) {
        await updateExercise(exerciseToUpdate.id, newExercise);
      }
    } else {
      // Creating new exercise
      await createExercise(newExercise);
    }
    
    router.back();
  };

  return (
    <View style={styles.container}>
      <RadialGradientBackground />
      <ScrollView>
        <Text testID="title" style={styles.title}>
          {name ? "Editar ejercicio" : "Añadir ejercicio"}
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
          />
        </View>
        <View>
          <Text style={styles.label}>Imagen:</Text>
          <TouchableOpacity testID="button-pick-image" style={styles.imagePicker} onPress={pickImage}>
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
          (!exerciseName || !exerciseImage) && styles.buttonDisabled,
        ]}
        onPress={saveExercise}
        disabled={!exerciseName || !exerciseImage}
      >
        <Text style={styles.buttonText} testID="button-save-exercise-text">
          {name ? "Guardar cambios" : "Añadir"}
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
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddExercisePage;