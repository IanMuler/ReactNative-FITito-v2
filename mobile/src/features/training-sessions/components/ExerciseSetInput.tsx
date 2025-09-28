import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { PerformedSet, SetConfiguration } from '../types';

interface ExerciseSetInputProps {
  plannedSet: SetConfiguration;
  performedSet: PerformedSet;
  setIndex: number;
  exerciseIndex: number;
  buttonsActive: Record<string, boolean>;
  onUpdateSet: (setIndex: number, field: keyof PerformedSet, value: any) => void;
  onToggleButton: (exerciseIndex: number, setIndex: number, type: 'RP' | 'DS' | 'P') => void;
}

export const ExerciseSetInput: React.FC<ExerciseSetInputProps> = ({
  plannedSet,
  performedSet,
  setIndex,
  exerciseIndex,
  buttonsActive,
  onUpdateSet,
  onToggleButton,
}) => {
  const rpKey = `${exerciseIndex}-${setIndex}-RP`;
  const dsKey = `${exerciseIndex}-${setIndex}-DS`;
  const pKey = `${exerciseIndex}-${setIndex}-P`;

  const isRPActive = buttonsActive[rpKey];
  const isDSActive = buttonsActive[dsKey];
  const isPActive = buttonsActive[pKey];

  const hasRPConfig = plannedSet.rp && plannedSet.rp.length > 0;
  const hasDSConfig = plannedSet.ds && plannedSet.ds.length > 0;
  const hasPartialsConfig = !!plannedSet.partials;

  return (
    <View style={styles.container}>
      {/* Set Header */}
      <View style={styles.setHeader}>
        <Text style={styles.setNumber}>Serie {setIndex + 1}</Text>
        <Text style={styles.plannedInfo}>
          {plannedSet.reps} reps × {plannedSet.weight}kg × RIR {plannedSet.rir}
        </Text>
      </View>

      {/* Basic Input Fields */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            value={performedSet.reps}
            onChangeText={(value: string) => onUpdateSet(setIndex, 'reps', value)}
            placeholder={plannedSet.reps}
            style={styles.input}
            keyboardType="numeric"
            placeholderTextColor="#a5a5a5"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            value={performedSet.weight}
            onChangeText={(value: string) => onUpdateSet(setIndex, 'weight', value)}
            placeholder={plannedSet.weight}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholderTextColor="#a5a5a5"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>RIR</Text>
          <TextInput
            value={performedSet.rir}
            onChangeText={(value: string) => onUpdateSet(setIndex, 'rir', value)}
            placeholder={plannedSet.rir}
            style={styles.input}
            keyboardType="numeric"
            placeholderTextColor="#a5a5a5"
          />
        </View>
      </View>

      {/* Advanced Technique Buttons */}
      <View style={styles.buttonRow}>
        {hasRPConfig && (
          <TouchableOpacity
            style={[
              styles.techniqueButton,
              isRPActive && styles.techniqueButtonActive
            ]}
            onPress={() => onToggleButton(exerciseIndex, setIndex, 'RP')}
          >
            <Text style={[
              styles.techniqueButtonText,
              isRPActive && styles.techniqueButtonTextActive
            ]}>
              RP
            </Text>
          </TouchableOpacity>
        )}

        {hasDSConfig && (
          <TouchableOpacity
            style={[
              styles.techniqueButton,
              isDSActive && styles.techniqueButtonActive
            ]}
            onPress={() => onToggleButton(exerciseIndex, setIndex, 'DS')}
          >
            <Text style={[
              styles.techniqueButtonText,
              isDSActive && styles.techniqueButtonTextActive
            ]}>
              DS
            </Text>
          </TouchableOpacity>
        )}

        {hasPartialsConfig && (
          <TouchableOpacity
            style={[
              styles.techniqueButton,
              isPActive && styles.techniqueButtonActive
            ]}
            onPress={() => onToggleButton(exerciseIndex, setIndex, 'P')}
          >
            <Text style={[
              styles.techniqueButtonText,
              isPActive && styles.techniqueButtonTextActive
            ]}>
              P
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Advanced Technique Inputs */}
      {isRPActive && (
        <View style={styles.advancedInputs}>
          <Text style={styles.advancedLabel}>Rest Pause:</Text>
          {(performedSet.rp || []).map((rp, rpIndex) => (
            <View key={rpIndex} style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  value={rp.value}
                  onChangeText={(value: string) => {
                    const newRP = [...(performedSet.rp || [])];
                    newRP[rpIndex] = { ...newRP[rpIndex], value };
                    onUpdateSet(setIndex, 'rp', newRP);
                  }}
                  placeholder="0"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tiempo (s)</Text>
                <TextInput
                  value={rp.time.toString()}
                  onChangeText={(value: string) => {
                    const newRP = [...(performedSet.rp || [])];
                    newRP[rpIndex] = { ...newRP[rpIndex], time: parseInt(value) || 0 };
                    onUpdateSet(setIndex, 'rp', newRP);
                  }}
                  placeholder="15"
                  style={styles.input}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {isDSActive && (
        <View style={styles.advancedInputs}>
          <Text style={styles.advancedLabel}>Drop Set:</Text>
          {(performedSet.ds || []).map((ds, dsIndex) => (
            <View key={dsIndex} style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  value={ds.reps}
                  onChangeText={(value: string) => {
                    const newDS = [...(performedSet.ds || [])];
                    newDS[dsIndex] = { ...newDS[dsIndex], reps: value };
                    onUpdateSet(setIndex, 'ds', newDS);
                  }}
                  placeholder="0"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput
                  value={ds.peso}
                  onChangeText={(value: string) => {
                    const newDS = [...(performedSet.ds || [])];
                    newDS[dsIndex] = { ...newDS[dsIndex], peso: value };
                    onUpdateSet(setIndex, 'ds', newDS);
                  }}
                  placeholder="0"
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {isPActive && (
        <View style={styles.advancedInputs}>
          <Text style={styles.advancedLabel}>Parciales:</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reps</Text>
            <TextInput
              value={performedSet.partials?.reps || ''}
              onChangeText={(value: string) => {
                onUpdateSet(setIndex, 'partials', { reps: value });
              }}
              placeholder="0"
              style={styles.input}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  setNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  plannedInfo: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  techniqueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  techniqueButtonActive: {
    backgroundColor: '#2196F3',
  },
  techniqueButtonText: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  techniqueButtonTextActive: {
    color: '#FFFFFF',
  },
  advancedInputs: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
  },
  advancedLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});