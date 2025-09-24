import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/features/profile';

export default function ProfileSwitch() {
  const { currentProfile, profiles, switchProfile } = useProfile();

  const handleSwitchProfile = () => {
    if (!currentProfile) return;
    
    // Find the next profile to switch to
    const nextProfile = profiles.find(p => p.id !== currentProfile.id);
    if (nextProfile) {
      switchProfile(nextProfile.id);
      console.log(`Switched from ${currentProfile.profile_name} to ${nextProfile.profile_name}`);
    }
  };

  // Show loading state while profile is loading
  if (!currentProfile) {
    return (
      <TouchableOpacity style={styles.container}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.gradient}
        >
          <Ionicons name="person" size={16} color="white" />
          <Text style={styles.profileText}>...</Text>
          <Ionicons name="swap-horizontal" size={16} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleSwitchProfile}
      testID="profile-switch-button"
    >
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <Ionicons name="person" size={16} color="white" />
        <Text style={styles.profileText} testID="profile-switch-text">
          {currentProfile.profile_name}
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