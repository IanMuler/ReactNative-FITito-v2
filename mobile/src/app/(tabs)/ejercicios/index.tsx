import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RadialGradientBackground from '@/components/RadialGradientBackground';
import LinearGradientItem from '@/components/LinearGradientItem';
import Menu, { MenuItem } from '@/components/Menu';
import {
  useExerciseList,
  useExerciseActions,
  useExerciseModal,
  useExerciseNavigation,
  useExerciseMenu
} from '@/features/exercises/hooks';
import { exerciseListStyles } from '@/features/exercises/styles';

const ExercisesPage: React.FC = () => {
  /* Hooks  */
  const { exercises, refreshing, onRefresh } = useExerciseList();
  const { deleteExercise } = useExerciseActions();
  const { modalVisible, exerciseToDelete, openDeleteModal, closeModal } = useExerciseModal();
  const { navigateToAddExercise, navigateToEditExercise } = useExerciseNavigation();
  const { generateMenuOptions } = useExerciseMenu({
    onEdit: navigateToEditExercise,
    onDelete: openDeleteModal,
  });

  /* Handlers */
  const handleDeleteExercise = async () => {
    if (exerciseToDelete) {
      await deleteExercise(exerciseToDelete.id);
      closeModal();
    }
  };

  /* Subcomponents */
  const headerSection = (
    <View style={exerciseListStyles.header}>
      <Text style={exerciseListStyles.title}>Ejercicios</Text>
    </View>
  );

  const exerciseItems = (
    <ScrollView 
      contentContainerStyle={exerciseListStyles.scrollViewContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
        />
      }
    >
      {exercises.map((exercise, index) => (
        <LinearGradientItem
          key={index}
          styles={{ dayContainer: { ...exerciseListStyles.exerciseContainer, zIndex: -index } }}
        >
          <View style={exerciseListStyles.exerciseContent} testID={`exercise-${exercise.name}`}>
            <View style={exerciseListStyles.exerciseTextContainer}>
              <Image
                source={{ uri: exercise.image }}
                style={exerciseListStyles.exerciseImage}
              />
              <Text style={exerciseListStyles.exerciseText}>{exercise.name}</Text>
            </View>
            <View style={exerciseListStyles.ellipsisContainer}>
              <Menu trigger={
                <Ionicons
                  name="ellipsis-vertical"
                  size={24}
                  color="#FFFFFF"
                  testID="ellipsis-vertical"
                />}
              >
                {generateMenuOptions(exercise).map((option, index) => (
                  <MenuItem key={index} text={option.label} onPress={option.onPress} testID={option.testID} />
                ))}
              </Menu>
            </View>
          </View>
        </LinearGradientItem>
      ))}
    </ScrollView>
  );

  const addButton = (
    <TouchableOpacity
      style={exerciseListStyles.button}
      onPress={navigateToAddExercise}
    >
      <Text style={exerciseListStyles.buttonText}>Añadir</Text>
    </TouchableOpacity>
  );

  const deleteModalSection = exerciseToDelete && (
    <Modal
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={exerciseListStyles.modalBackground}>
        <View style={exerciseListStyles.modalContainer}>
          <Text style={exerciseListStyles.modalTitle}>Confirmar eliminación</Text>
          <Text style={exerciseListStyles.modalText}>
            ¿Estás seguro de que quieres eliminar este ejercicio?
          </Text>
          <View style={exerciseListStyles.modalButtonsContainer}>
            <TouchableOpacity
              style={exerciseListStyles.modalButton}
              onPress={closeModal}
            >
              <Text style={exerciseListStyles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={exerciseListStyles.modalButton}
              onPress={handleDeleteExercise}
              testID="confirm-delete"
            >
              <Text style={exerciseListStyles.modalButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* Conditional rendering with JSX fragments */
  return (
    <View style={exerciseListStyles.container} testID="exercises-screen">
      <RadialGradientBackground />
      {headerSection}
      {exerciseItems}
      {addButton}
      {deleteModalSection}
    </View>
  );
};

export default ExercisesPage;