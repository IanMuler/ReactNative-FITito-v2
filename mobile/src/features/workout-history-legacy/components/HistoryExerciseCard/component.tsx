/* HistoryExerciseCard Component - Exact replica from original with planned vs performed comparison */

import React from 'react';
import { View, Text } from 'react-native';
import { HistoryExerciseCardProps } from './types';
import { styles } from './styles';

export const HistoryExerciseCard: React.FC<HistoryExerciseCardProps> = ({ 
  exercise, 
  testID 
}) => {
  return (
    <View style={styles.exerciseCard} testID={testID}>
      <Text style={styles.exerciseName} testID={`historico-exercise-name-${exercise.name}`}>
        {exercise.name}
      </Text>
      
      {/* PLANNED SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} testID={`historico-section-planned-${exercise.name}`}>
          Planificado
        </Text>
        {exercise.sets.map((set, setIndex) => (
          <View key={setIndex}>
            <Text style={styles.exerciseInfo} testID={`historico-set-planned-${exercise.name}-${setIndex}`}>
              Set {setIndex + 1}: {set.reps} reps, {set.weight}kg, RIR: {set.rir ?? "N/A"}
            </Text>
            {set.rp && set.rp.length > 0 && set.rp.map((rpDetail, rpIndex) => (
              <Text key={rpIndex} style={styles.exerciseInfo} testID={`historico-rp-planned-${exercise.name}-${rpIndex}`}>
                RP {rpIndex + 1}: {rpDetail.value} reps, Time: {rpDetail.time}"
              </Text>
            ))}
            {set.ds && set.ds.length > 0 && set.ds.map((dsDetail, dsIndex) => (
              <Text key={dsIndex} style={styles.exerciseInfo} testID={`historico-ds-planned-${exercise.name}-${dsIndex}`}>
                DS {dsIndex + 1}: {dsDetail.reps} reps, {dsDetail.peso} kg
              </Text>
            ))}
            {set.partials && (
              <Text style={styles.exerciseInfo} testID={`historico-partials-planned-${exercise.name}-${setIndex}`}>
                Partials: {set.partials.reps} reps
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* PERFORMED SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} testID={`historico-section-performed-${exercise.name}`}>
          Realizado
        </Text>
        {exercise.performedSets?.map((performedSet, setIndex) => (
          <View key={setIndex}>
            <Text style={styles.performedText} testID={`historico-set-performed-${exercise.name}-${setIndex}`}>
              Set {setIndex + 1}: {performedSet.reps} reps, {performedSet.weight} kg, RIR: {performedSet.rir ?? "N/A"}
            </Text>
            {performedSet.rp && performedSet.rp.length > 0 && performedSet.rp.map((rpDetail, rpIndex) => (
              <Text key={rpIndex} style={styles.performedText} testID={`historico-rp-performed-${exercise.name}-${rpIndex}`}>
                RP {rpIndex + 1}: {rpDetail.value} reps, Time: {rpDetail.time}"
              </Text>
            ))}
            {performedSet.ds && performedSet.ds.length > 0 && performedSet.ds.map((dsDetail, dsIndex) => (
              <Text key={dsIndex} style={styles.performedText} testID={`historico-ds-performed-${exercise.name}-${dsIndex}`}>
                DS {dsIndex + 1}: {dsDetail.reps} reps, {dsDetail.peso} kg
              </Text>
            ))}
            {performedSet.partials && (
              <Text style={styles.performedText} testID={`historico-partials-performed-${exercise.name}-${setIndex}`}>
                Partials: {performedSet.partials.reps} reps
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};