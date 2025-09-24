import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../contexts/ProfileContext';

export default function ProfileSwitch() {
  const { currentProfile, profiles, switchProfile } = useProfile();

  const handleProfileSwitch = () => {
    if (!currentProfile) return;
    
    // Find the other profile (not current)
    const otherProfile = profiles.find(p => p.id !== currentProfile.id);
    if (otherProfile) {
      switchProfile(otherProfile.id);
    }
  };

  if (!currentProfile) return null;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleProfileSwitch}
    >
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <Ionicons name="person" size={16} color="white" />
        <Text style={styles.profileText}>
          {currentProfile.display_name || currentProfile.profile_name}
        </Text>
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