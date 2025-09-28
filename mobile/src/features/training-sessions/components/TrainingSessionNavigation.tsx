import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrainingSession } from '../types';

interface TrainingSessionNavigationProps {
  session: TrainingSession;
  currentExerciseIndex: number;
  onExerciseChange: (index: number) => void;
  isCurrentExerciseComplete: boolean;
}

export const TrainingSessionNavigation: React.FC<TrainingSessionNavigationProps> = ({
  session,
  currentExerciseIndex,
  onExerciseChange,
  isCurrentExerciseComplete,
}) => {
  const canGoNext = currentExerciseIndex < session.exercises.length - 1;
  const canGoPrevious = currentExerciseIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      onExerciseChange(currentExerciseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      onExerciseChange(currentExerciseIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Exercise Indicators */}
      <View style={styles.indicatorsContainer}>
        {session.exercises.map((exercise, index) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.indicator,
              index === currentExerciseIndex && styles.indicatorActive,
              exercise.is_completed && styles.indicatorCompleted,
            ]}
            onPress={() => onExerciseChange(index)}
          >
            <Text style={[
              styles.indicatorText,
              index === currentExerciseIndex && styles.indicatorTextActive,
              exercise.is_completed && styles.indicatorTextCompleted,
            ]}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            !canGoPrevious && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={!canGoPrevious}
        >
          <Text style={[
            styles.navButtonText,
            !canGoPrevious && styles.navButtonTextDisabled,
          ]}>
            ← Anterior
          </Text>
        </TouchableOpacity>

        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentExerciseIndex + 1} de {session.exercises.length}
          </Text>
          <Text style={styles.exerciseName}>
            {session.exercises[currentExerciseIndex]?.exercise_name}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            !canGoNext && styles.navButtonDisabled,
            !isCurrentExerciseComplete && styles.navButtonWarning,
          ]}
          onPress={handleNext}
          disabled={!canGoNext}
        >
          <Text style={[
            styles.navButtonText,
            !canGoNext && styles.navButtonTextDisabled,
            !isCurrentExerciseComplete && styles.navButtonTextWarning,
          ]}>
            Siguiente →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Completion Warning */}
      {!isCurrentExerciseComplete && canGoNext && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Completa todas las series antes de continuar
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    margin: 20,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  indicatorActive: {
    backgroundColor: '#2196F3',
  },
  indicatorCompleted: {
    backgroundColor: '#4CAF50',
  },
  indicatorText: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  indicatorTextActive: {
    color: '#FFFFFF',
  },
  indicatorTextCompleted: {
    color: '#FFFFFF',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonWarning: {
    backgroundColor: '#FF9800',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: '#666666',
  },
  navButtonTextWarning: {
    color: '#FFFFFF',
  },
  progressInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 20,
  },
  progressText: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 5,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  warningText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
  },
});