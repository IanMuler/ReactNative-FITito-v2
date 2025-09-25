import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Day } from '@/features/routines/types';

interface LinearGradientItemProps {
  children: ReactNode;
  styles?: {
    dayContainer?: ViewStyle;
    activeContainer?: ViewStyle;
    restDayContainer?: ViewStyle;
  };
  day?: Day;
  isActive?: boolean;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

const LinearGradientItem: React.FC<LinearGradientItemProps> = ({ 
  children, 
  styles, 
  day, 
  isActive,
  colors = ["#06041a", "#526080", "#06041a"] as const, // Original project colors
  locations = [0, 0.5, 1] as const,
  start = { x: -0.3, y: 0 },
  end = { x: 1.3, y: 1 }
}) => {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={start}
      end={end}
      style={[
        styles?.dayContainer,
        day?.rest && styles?.restDayContainer,
        isActive && styles?.activeContainer,
      ]}
      testID="linear-gradient-item"
    >
      {children}
    </LinearGradient>
  );
};

export default LinearGradientItem;