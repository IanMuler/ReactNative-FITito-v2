import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradientItem from '@/components/LinearGradientItem';
import Menu, { MenuItem } from '@/components/Menu';
import RadialGradientBackground from '@/components/ui/RadialGradientBackground';
import {
  useTrainingDayList,
  useTrainingDayActions,
  useTrainingDayModal,
  useTrainingDayNavigation,
  useTrainingDayMenu,
  trainingDayListStyles
} from '@/features/training-days';

const TrainingDaysPage: React.FC = () => {
  /* Hooks */
  const { trainingDays, isLoading, refreshing, onRefresh } = useTrainingDayList();
  const { deleteTrainingDay } = useTrainingDayActions();
  const { modalVisible, trainingDayToDelete, openDeleteModal, closeModal } = useTrainingDayModal();
  const { navigateToAddTrainingDay, navigateToEditTrainingDay } = useTrainingDayNavigation();
  const { generateMenuOptions } = useTrainingDayMenu({
    onEdit: navigateToEditTrainingDay,
    onDelete: openDeleteModal,
  });

  /* Handlers */
  const handleDeleteTrainingDay = async () => {
    if (trainingDayToDelete) {
      await deleteTrainingDay(trainingDayToDelete.id);
      closeModal();
    }
  };

  /* Subcomponents */
  const headerSection = (
    <View style={trainingDayListStyles.header}>
      <Text style={trainingDayListStyles.title} testID="title">
        Días de entreno
      </Text>
    </View>
  );

  const loadingState = (
    <View style={trainingDayListStyles.centered}>
      <Text style={trainingDayListStyles.loadingText}>Cargando días de entreno...</Text>
    </View>
  );

  const emptyState = (
    <View style={trainingDayListStyles.centered}>
      <Text style={trainingDayListStyles.emptyText}>
        No tienes días de entreno creados
      </Text>
      <TouchableOpacity
        style={trainingDayListStyles.emptyButton}
        onPress={navigateToAddTrainingDay}
        testID="empty-state-add-button"
      >
        <Text style={trainingDayListStyles.emptyButtonText}>
          Crear primer día
        </Text>
      </TouchableOpacity>
    </View>
  );

  const trainingDayItems = (
    <ScrollView
      contentContainerStyle={trainingDayListStyles.scrollViewContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
        />
      }
    >
      {trainingDays.map((trainingDay, index) => (
        <LinearGradientItem
          key={trainingDay.id}
          styles={{
            dayContainer: {
              ...trainingDayListStyles.trainingDayContainer,
              zIndex: -index
            }
          }}
        >
          <View
            style={trainingDayListStyles.trainingDayContent}
            testID={`training-day-${trainingDay.name}`}
          >
            <Text style={trainingDayListStyles.trainingDayText}>
              {trainingDay.name}
            </Text>
            <View style={trainingDayListStyles.ellipsisContainer}>
              <Menu trigger={
                <Ionicons
                  name="ellipsis-vertical"
                  size={24}
                  color="#FFFFFF"
                  testID="ellipsis-vertical"
                />
              }>
                {generateMenuOptions(trainingDay).map((option, optionIndex) => (
                  <MenuItem
                    key={optionIndex}
                    text={option.label}
                    onPress={option.onPress}
                    testID={option.testID}
                  />
                ))}
              </Menu>
            </View>
          </View>
        </LinearGradientItem>
      ))}
    </ScrollView>
  );

  const deleteModal = trainingDayToDelete && (
    <Modal
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={trainingDayListStyles.modalBackground}>
        <View style={trainingDayListStyles.modalContainer}>
          <Text style={trainingDayListStyles.modalTitle}>
            Confirmar eliminación
          </Text>
          <Text style={trainingDayListStyles.modalText}>
            ¿Estás seguro de que quieres eliminar este día de entreno?
          </Text>
          <View style={trainingDayListStyles.modalButtonsContainer}>
            <TouchableOpacity
              style={trainingDayListStyles.modalButton}
              onPress={closeModal}
              testID="cancel-delete"
            >
              <Text style={trainingDayListStyles.modalButtonText}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={trainingDayListStyles.modalButton}
              onPress={handleDeleteTrainingDay}
              testID="confirm-delete"
            >
              <Text style={trainingDayListStyles.modalButtonText}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const addButton = (
    <TouchableOpacity
      style={trainingDayListStyles.button}
      onPress={navigateToAddTrainingDay}
      testID="button-add-training-day"
    >
      <Text style={trainingDayListStyles.buttonText}>
        Añadir
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={trainingDayListStyles.container}>
      <RadialGradientBackground />
      {headerSection}

      {isLoading ? loadingState : (
        trainingDays.length === 0 ? emptyState : (
          <>
            {trainingDayItems}
            {addButton}
          </>
        )
      )}

      {deleteModal}
    </View>
  );
};

export default TrainingDaysPage;