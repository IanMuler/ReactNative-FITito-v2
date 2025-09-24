import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LinearGradientItemProps {
  children: ReactNode;
  styles?: {
    dayContainer?: ViewStyle;
  };
}

const LinearGradientItem: React.FC<LinearGradientItemProps> = ({ children, styles }) => {
  return (
    <View style={styles?.dayContainer}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={{ borderRadius: 10, padding: 15 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

export default LinearGradientItem;