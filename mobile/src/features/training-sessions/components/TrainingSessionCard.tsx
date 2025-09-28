import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradientItem } from '@/components';
import { TrainingSession } from '../types';

interface TrainingSessionCardProps {
  session: TrainingSession;
  onPress: () => void;
  onCancel?: () => void;
}

export const TrainingSessionCard: React.FC<TrainingSessionCardProps> = ({
  session,
  onPress,
  onCancel,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionDuration = () => {
    const start = new Date(session.start_time);
    const lastActivity = new Date(session.last_activity);
    const diffMs = lastActivity.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const completedExercises = session.exercises.filter(ex => ex.is_completed).length;
  const totalExercises = session.exercises.length;

  return (
    <LinearGradientItem>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.routineName}>{session.routine_name}</Text>
          <Text style={styles.dayName}>{session.day_name}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {completedExercises}/{totalExercises} ejercicios
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(completedExercises / totalExercises) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.timeText}>
            Iniciado: {formatTime(session.start_time)}
          </Text>
          <Text style={styles.durationText}>
            {getSessionDuration()} min
          </Text>
        </View>
        
        {onCancel && (
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </LinearGradientItem>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  header: {
    marginBottom: 10,
  },
  routineName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayName: {
    color: '#B0BEC5',
    fontSize: 14,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  durationText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cancelText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
  },
});