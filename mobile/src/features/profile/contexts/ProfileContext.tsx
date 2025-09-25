import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, ProfileContextType, MOCK_PROFILES } from '../types';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  /* State */
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [isLoading, setIsLoading] = useState(true);

  /* Initialize with active profile */
  useEffect(() => {
    // Find the active profile or default to first
    const activeProfile = profiles.find(p => p.is_active) || profiles[0];
    setCurrentProfile(activeProfile);
    setIsLoading(false);
  }, [profiles]);

  /* Switch profile */
  const switchProfile = (profileId: number) => {
    const newProfile = profiles.find(p => p.id === profileId);
    if (newProfile && newProfile.id !== currentProfile?.id) {
      // Update current profile state
      setCurrentProfile(newProfile);
      
      // Update is_active status in profiles array
      const updatedProfiles = profiles.map(p => ({
        ...p,
        is_active: p.id === profileId
      }));
      setProfiles(updatedProfiles);
      
      // TODO: Persist to backend when connected
      console.log(`Switched to profile: ${newProfile.display_name || newProfile.profile_name}`);
    }
  };

  /* Refresh profiles */
  const refreshProfiles = () => {
    // TODO: Fetch from backend when connected
    console.log('Refreshing profiles...');
    setProfiles(MOCK_PROFILES);
  };

  const value: ProfileContextType = {
    currentProfile,
    profiles,
    isLoading,
    profileId: currentProfile?.id || 1, // Default to 1 if no profile
    switchProfile,
    refreshProfiles,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

/* Custom hook to use profile context */
export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};