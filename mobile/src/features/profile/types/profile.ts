export interface Profile {
  id: number;
  user_id: number;
  profile_name: string;
  display_name: string | null;
  profile_type: 'personal' | 'trainer' | 'athlete';
  is_active: boolean;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: Date | null;
  weight_unit: 'kg' | 'lbs';
  distance_unit: 'km' | 'miles';
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ProfileContextType {
  currentProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  switchProfile: (profileId: number) => void;
  refreshProfiles: () => void;
}

// Mock profiles para desarrollo (hasta conectar con backend real)
export const MOCK_PROFILES: Profile[] = [
  {
    id: 1,
    user_id: 1,
    profile_name: 'Ian',
    display_name: 'Ian',
    profile_type: 'personal',
    is_active: true,
    avatar_url: null,
    bio: null,
    date_of_birth: null,
    weight_unit: 'kg',
    distance_unit: 'km',
    settings: {},
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    user_id: 1,
    profile_name: 'Meli',
    display_name: 'Meli',
    profile_type: 'personal',
    is_active: false,
    avatar_url: null,
    bio: null,
    date_of_birth: null,
    weight_unit: 'kg',
    distance_unit: 'km',
    settings: {},
    created_at: new Date(),
    updated_at: new Date(),
  },
];