import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileSwitch() {
  const [activeProfile, setActiveProfile] = useState<'Ian' | 'Meli'>('Ian');

  const switchProfile = (profile: 'Ian' | 'Meli') => {
    setActiveProfile(profile);
    // TODO: Implementar lógica de cambio de perfil con backend
    console.log(`Switched to profile: ${profile}`);
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => switchProfile(activeProfile === 'Ian' ? 'Meli' : 'Ian')}
    >
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <Ionicons name="person" size={16} color="white" />
        <Text style={styles.profileText}>{activeProfile}</Text>
        <Ionicons name="swap-horizontal" size={16} color="white" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  profileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});