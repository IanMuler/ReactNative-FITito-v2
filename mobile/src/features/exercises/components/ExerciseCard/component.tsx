import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradientItem from '@/components/LinearGradientItem';
import Menu, { MenuItem } from '@/components/Menu';
import { ExerciseCardProps } from './types';
import styles from './styles';

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  onEdit,
  onDelete,
}) => {
  /* Menu options */
  const options = [
    { 
      label: "Editar", 
      onPress: () => onEdit(exercise), 
      testID: "menu-option-edit" 
    },
    { 
      label: "Eliminar", 
      onPress: () => onDelete(exercise), 
      testID: "menu-option-delete" 
    },
  ];

  return (
    <LinearGradientItem
      key={exercise.id}
      styles={{ 
        dayContainer: { 
          ...styles.exerciseContainer, 
          zIndex: -index 
        } 
      }}
    >
      <View style={styles.exerciseContent} testID={`exercise-${exercise.name}`}>
        <View style={styles.exerciseTextContainer}>
          <Image
            source={{ uri: exercise.image }}
            style={styles.exerciseImage}
          />
          <Text style={styles.exerciseText}>{exercise.name}</Text>
        </View>
        <View style={styles.ellipsisContainer}>
          <Menu trigger={
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color="#FFFFFF"
              testID="ellipsis-vertical"
            />}
          >
            {options.map((option, index) => (
              <MenuItem 
                key={index} 
                text={option.label} 
                onPress={option.onPress} 
                testID={option.testID} 
              />
            ))}
          </Menu>
        </View>
      </View>
    </LinearGradientItem>
  );
};

export default ExerciseCard;