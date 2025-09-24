import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import RadialGradientBackground from '@/components/RadialGradientBackground';
import { useExerciseForm, useImagePicker } from '@/features/exercises/hooks';
import { addExerciseStyles } from '@/features/exercises/styles';

const AddExercisePage: React.FC = () => {
  /* Business Logic Hooks */
  const {
    exerciseName,
    exerciseImage,
    isEditing,
    isFormValid,
    handleNameChange,
    handleImageChange,
    saveExercise,
  } = useExerciseForm();

  /* Image Picker Logic */
  const { pickFromLibrary } = useImagePicker({
    onImageSelected: handleImageChange,
  });

  /* JSX fragments as constants - NO props, use scope variables */
  const formHeaderSection = (
    <Text testID="title" style={addExerciseStyles.title}>
      {isEditing ? "Editar ejercicio" : "Añadir ejercicio"}
    </Text>
  );

  const nameInputSection = (
    <View>
      <Text style={addExerciseStyles.label}>Nombre:</Text>
      <TextInput
        testID="input-exercise-name"
        style={addExerciseStyles.input}
        placeholder="Nombre del ejercicio"
        placeholderTextColor="#A5A5A5"
        value={exerciseName}
        onChangeText={handleNameChange}
      />
    </View>
  );

  const imagePickerSection = (
    <View>
      <Text style={addExerciseStyles.label}>Imagen:</Text>
      <TouchableOpacity testID="button-pick-image" style={addExerciseStyles.imagePicker} onPress={pickFromLibrary}>
        <Text style={addExerciseStyles.imagePickerText}>Seleccionar Imagen</Text>
      </TouchableOpacity>
      {exerciseImage && (
        <Image
          testID="image-exercise"
          source={{ uri: exerciseImage }}
          style={addExerciseStyles.selectedImage}
        />
      )}
    </View>
  );

  const saveButtonSection = (
    <TouchableOpacity
      testID="button-save-exercise"
      style={[
        addExerciseStyles.button,
        !isFormValid && addExerciseStyles.buttonDisabled,
      ]}
      onPress={saveExercise}
      disabled={!isFormValid}
    >
      <Text style={addExerciseStyles.buttonText} testID="button-save-exercise-text">
        {isEditing ? "Guardar cambios" : "Añadir"}
      </Text>
    </TouchableOpacity>
  );

  /* Conditional rendering with JSX fragments */
  return (
    <View style={addExerciseStyles.container}>
      <RadialGradientBackground />
      <ScrollView>
        {formHeaderSection}
        {nameInputSection}
        {imagePickerSection}
      </ScrollView>
      {saveButtonSection}
    </View>
  );
};

export default AddExercisePage;