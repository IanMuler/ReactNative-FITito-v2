import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { LinearGradientItem } from '@/components';

interface TrainingSessionActionsProps {
  isSessionComplete: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  isCancelling: boolean;
  onSaveProgress: () => void;
  onCompleteSession: () => void;
  onCancelSession: () => void;
}

export const TrainingSessionActions: React.FC<TrainingSessionActionsProps> = ({
  isSessionComplete,
  hasUnsavedChanges,
  isSaving,
  isCompleting,
  isCancelling,
  onSaveProgress,
  onCompleteSession,
  onCancelSession,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCompleteSession = () => {
    if (!isSessionComplete) {
      Alert.alert(
        'Sesión incompleta',
        'Aún tienes ejercicios por completar. ¿Estás seguro de que quieres finalizar la sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', style: 'destructive', onPress: onCompleteSession },
        ]
      );
    } else {
      onCompleteSession();
    }
  };

  const handleCancelSession = () => {
    Alert.alert(
      'Cancelar sesión',
      'Se perderá todo el progreso de esta sesión. ¿Estás seguro?',
      [
        { text: 'No cancelar', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: onCancelSession },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Save Progress Button */}
      {hasUnsavedChanges && (
        <LinearGradientItem>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={onSaveProgress}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Guardando...' : '💾 Guardar progreso'}
            </Text>
          </TouchableOpacity>
        </LinearGradientItem>
      )}

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        {/* Complete Session Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.completeButton,
            (isCompleting || isCancelling) && styles.buttonDisabled,
            !isSessionComplete && styles.incompleteButton,
          ]}
          onPress={handleCompleteSession}
          disabled={isCompleting || isCancelling}
        >
          <Text style={[
            styles.actionButtonText,
            !isSessionComplete && styles.incompleteButtonText,
          ]}>
            {isCompleting ? 'Finalizando...' : isSessionComplete ? '✅ Finalizar sesión' : '⚠️ Finalizar incompleta'}
          </Text>
        </TouchableOpacity>

        {/* Cancel Session Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cancelButton,
            (isCompleting || isCancelling) && styles.buttonDisabled,
          ]}
          onPress={handleCancelSession}
          disabled={isCompleting || isCancelling}
        >
          <Text style={styles.cancelButtonText}>
            {isCancelling ? 'Cancelando...' : '❌ Cancelar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Completion Status */}
      <View style={styles.statusContainer}>
        {isSessionComplete ? (
          <View style={styles.completeStatus}>
            <Text style={styles.completeStatusText}>
              ✅ Todos los ejercicios completados
            </Text>
          </View>
        ) : (
          <View style={styles.incompleteStatus}>
            <Text style={styles.incompleteStatusText}>
              ⏳ Sesión en progreso
            </Text>
          </View>
        )}
      </View>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Tienes cambios sin guardar
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  incompleteButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  incompleteButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  completeStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  completeStatusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  incompleteStatus: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  incompleteStatusText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  warningText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
  },
});