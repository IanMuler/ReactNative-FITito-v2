import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ExerciseFormProps } from './types';
import styles from './styles';

const ExerciseForm: React.FC<ExerciseFormProps> = ({
  exercise,
  isLoading,
  onSave,
}) => {
  /* State */
  const [exerciseName, setExerciseName] = useState(exercise?.name || "");
  const [exerciseImage, setExerciseImage] = useState<string | null>(
    exercise?.image || null
  );

  /* Derived data */
  const isEditing = !!exercise;
  const isFormValid = exerciseName.trim() && exerciseImage;

  /* Effects */
  useEffect(() => {
    if (exercise) {
      setExerciseName(exercise.name);
      setExerciseImage(exercise.image);
    }
  }, [exercise]);

  /* Handlers */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setExerciseImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!exerciseName.trim() || !exerciseImage) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    onSave({
      name: exerciseName.trim(),
      image: exerciseImage,
    });
  };

  return (
    <View style={styles.formContainer}>
      <ScrollView>
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
          (!isFormValid || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleSave}
        disabled={!isFormValid || isLoading}
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

export default ExerciseForm;