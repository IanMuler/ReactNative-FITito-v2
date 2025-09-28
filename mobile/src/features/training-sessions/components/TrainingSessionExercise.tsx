import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradientItem } from '@/components';
import { TrainingSessionExercise as TrainingSessionExerciseType, PerformedSet } from '../types';
import { ExerciseSetInput } from './ExerciseSetInput';

interface TrainingSessionExerciseProps {
  exercise: TrainingSessionExerciseType;
  exerciseIndex: number;
  buttonsActive: Record<string, boolean>;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: keyof PerformedSet, value: any) => void;
  onToggleButton: (exerciseIndex: number, setIndex: number, type: 'RP' | 'DS' | 'P') => void;
}

export const TrainingSessionExercise: React.FC<TrainingSessionExerciseProps> = ({
  exercise,
  exerciseIndex,
  buttonsActive,
  onUpdateSet,
  onToggleButton,
}) => {
  const handleUpdateSet = (setIndex: number, field: keyof PerformedSet, value: any) => {
    onUpdateSet(exerciseIndex, setIndex, field, value);
  };

  const completedSets = exercise.performed_sets.filter(set => 
    set.reps && set.weight && set.rir
  ).length;

  return (
    <LinearGradientItem>
      <View style={styles.container}>
        {/* Exercise Header */}
        <View style={styles.header}>
          {exercise.exercise_image && (
            <Image 
              source={{ uri: exercise.exercise_image }} 
              style={styles.exerciseImage}
            />
          )}
          <View style={styles.headerContent}>
            <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
            <Text style={styles.progressText}>
              {completedSets}/{exercise.planned_sets.length} series completadas
            </Text>
          </View>
        </View>

        {/* Sets */}
        <View style={styles.setsContainer}>
          {exercise.planned_sets.map((plannedSet, setIndex) => {
            const performedSet = exercise.performed_sets[setIndex] || {
              reps: '',
              weight: '',
              rir: '',
              rp: plannedSet.rp ? plannedSet.rp.map(() => ({ value: '', time: 0 })) : undefined,
              ds: plannedSet.ds ? plannedSet.ds.map(() => ({ reps: '', peso: '' })) : undefined,
              partials: plannedSet.partials ? { reps: '' } : undefined,
              isCompleted: false,
            };

            return (
              <ExerciseSetInput
                key={setIndex}
                plannedSet={plannedSet}
                performedSet={performedSet}
                setIndex={setIndex}
                exerciseIndex={exerciseIndex}
                buttonsActive={buttonsActive}
                onUpdateSet={handleUpdateSet}
                onToggleButton={onToggleButton}
              />
            );
          })}
        </View>

        {/* Exercise Notes */}
        {exercise.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notas:</Text>
            <Text style={styles.notesText}>{exercise.notes}</Text>
          </View>
        )}

        {/* Completion Status */}
        {exercise.is_completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Ejercicio completado</Text>
          </View>
        )}
      </View>
    </LinearGradientItem>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressText: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  setsContainer: {
    marginBottom: 15,
  },
  notesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  notesLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    color: '#B0BEC5',
    fontSize: 14,
    lineHeight: 20,
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
});