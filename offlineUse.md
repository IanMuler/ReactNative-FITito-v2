# Offline-First Strategy for FITito

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Research Summary](#research-summary)
- [Proposed Architecture](#proposed-architecture)
- [Implementation Plan](#implementation-plan)
- [Conflict Resolution Strategy](#conflict-resolution-strategy)
- [Technical Specifications](#technical-specifications)
- [Migration Path](#migration-path)

---

## Problem Statement

### Use Case: Gym Workout Session (No Internet)

FITito users need to work out in gyms with no internet connectivity. The app must provide:

1. **View Schedule** - Display weekly routine with assigned training days
2. **View Workout Configuration** - Access exercise lists, sets, reps, and rest times for the day
3. **Start Session** - Create and track an active workout session
4. **Record Progress** - Save completed sets with weights and reps
5. **End Session** - Complete the workout and generate history
6. **Sync Later** - Automatically sync all data when internet returns

### Critical Data Requirements

**Data that MUST be available offline:**
- ✅ Routine weeks (7 days with assigned routines/training days)
- ✅ Exercise configurations for each day (exercises, sets, reps, rest times)
- ✅ Exercise library (names, muscle groups, instructions)
- ✅ Active training session state
- ✅ Completed sets and workout progress
- ✅ Historical workout sessions (last 30 days)

**Operations that MUST work offline:**
- ✅ Read routine schedule
- ✅ Read exercise configurations
- ✅ Create workout session (start training)
- ✅ Update workout session progress (record sets)
- ✅ Complete workout session (finish training)
- ✅ View workout history

---

## Research Summary

### Industry Best Practices (2025)

Based on research from React Native community and mobile development best practices:

#### 1. Offline-First Architecture Principles

**Definition**: Build your app assuming network unreliability is the default, not an exception.

**Core Concept**:
- Local database is the **source of truth** during offline periods
- Backend synchronization happens in the background when connected
- User experience remains consistent regardless of connectivity

#### 2. Storage Solutions for React Native

| Solution | Use Case | Pros | Cons |
|----------|----------|------|------|
| **AsyncStorage** | Simple key-value data (<6MB) | Easy to use, built-in, async | Limited storage, slow for complex queries |
| **expo-sqlite** | Structured relational data | SQL queries, unlimited storage, fast | More complex setup, requires SQL knowledge |
| **WatermelonDB** | Large datasets, complex relationships | Lazy loading, separate thread, optimized for performance | Heavy library, steep learning curve |
| **TanStack Query + AsyncStorage Persister** | API caching with offline support | Works with existing React Query setup, automatic persistence | Not a full offline database solution |

#### 3. Synchronization Patterns

**Pull-Based Sync** (Recommended for FITito):
- App fetches data from server on demand or periodically
- Best for brief connectivity interruptions
- Simple conflict resolution

**Push-Based Sync**:
- Server notifies app when data changes
- Requires WebSocket or push notifications
- More complex but real-time

**Bidirectional Sync** (Recommended for FITito):
- App both fetches and sends data
- Queue mutations while offline, replay when online
- Handles both read and write operations

#### 4. Conflict Resolution Strategies

| Strategy | How It Works | Best For | Trade-offs |
|----------|--------------|----------|------------|
| **Last Write Wins (LWW)** | Latest timestamp wins | Simple forms, non-critical data | May lose user changes |
| **Client Wins** | Local changes always override server | User-generated content | Can cause data inconsistency |
| **Server Wins** | Server data always overrides local | Financial data, pricing | Frustrating UX if user loses work |
| **Manual Resolution** | User chooses which version to keep | Critical data, conflicting edits | Requires UI for conflict resolution |
| **Merge-Based** | Combine both versions intelligently | Notes, lists, audit logs | Complex logic, not always possible |
| **Version-Based (Git-like)** | Track parent versions, detect conflicts | Collaborative editing | Most complex implementation |

---

## Proposed Architecture

### Approach: Hybrid Offline-First with TanStack Query

**Why this approach:**
1. ✅ Already using TanStack Query throughout the app
2. ✅ Minimal refactoring required
3. ✅ Native support for offline persistence via AsyncStorage
4. ✅ Built-in mutation queue and retry logic
5. ✅ Automatic background sync when connectivity returns

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FITito Mobile App                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           React Components (UI Layer)               │  │
│  └────────────────┬────────────────────────────────────┘  │
│                   │                                        │
│  ┌────────────────▼────────────────────────────────────┐  │
│  │     TanStack Query Hooks (State Management)         │  │
│  │  - useQuery (read data)                             │  │
│  │  - useMutation (write data)                         │  │
│  │  - Optimistic updates                               │  │
│  └────────────┬────────────────────┬───────────────────┘  │
│               │                    │                       │
│  ┌────────────▼──────────┐  ┌─────▼──────────────────┐   │
│  │  Query Cache          │  │  Mutation Queue        │   │
│  │  (Read operations)    │  │  (Write operations)    │   │
│  │  - Routine weeks      │  │  - Start session       │   │
│  │  - Exercise configs   │  │  - Update progress     │   │
│  │  - Exercise library   │  │  - Complete session    │   │
│  │  - Workout history    │  │  - Pending syncs       │   │
│  └────────────┬──────────┘  └─────┬──────────────────┘   │
│               │                    │                       │
│  ┌────────────▼────────────────────▼───────────────────┐  │
│  │         AsyncStorage Persister                      │  │
│  │  - Persists cache to device storage                 │  │
│  │  - Persists pending mutations                       │  │
│  │  - 24-hour cache time                               │  │
│  └────────────┬────────────────────┬───────────────────┘  │
│               │                    │                       │
│  ┌────────────▼──────────┐  ┌─────▼──────────────────┐   │
│  │  NetInfo              │  │  Sync Manager          │   │
│  │  - Detect online      │  │  - Auto-retry failed   │   │
│  │  - Detect offline     │  │  - Background sync     │   │
│  │  - Network state      │  │  - Conflict detection  │   │
│  └────────────┬──────────┘  └─────┬──────────────────┘   │
│               │                    │                       │
│               └────────────┬───────┘                       │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Internet      │
                    │   Available?    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend API    │
                    │  (Vercel)       │
                    └─────────────────┘
```

### Data Flow

#### Reading Data (Online → Offline)

```
1. App launches → Check network → NetInfo detects "online"
2. TanStack Query fetches data from API
3. Data cached in memory (Query Cache)
4. Data persisted to AsyncStorage (for offline use)
5. User goes offline → NetInfo detects "offline"
6. App continues reading from Query Cache (no API calls)
7. User sees cached data seamlessly
```

#### Writing Data (Offline → Online)

```
1. User offline → Starts workout session
2. useMutation queues the operation (not sent to API)
3. Mutation stored in AsyncStorage with isSynced: false
4. App shows optimistic update (instant UI feedback)
5. User completes workout → More mutations queued
6. User regains connectivity → NetInfo detects "online"
7. TanStack Query automatically retries all queued mutations
8. Backend responds → Mutations marked as synced
9. Query cache invalidated → Fresh data fetched
```

---

## Implementation Plan

### Phase 1: Setup Offline Infrastructure (Week 1)

#### 1.1 Install Required Packages

```bash
npm install @tanstack/react-query-persist-client
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
```

**Package Purposes:**
- `@tanstack/react-query-persist-client` - Persist TanStack Query cache to AsyncStorage
- `@react-native-async-storage/async-storage` - Key-value storage for React Native
- `@react-native-community/netinfo` - Detect network connectivity changes

#### 1.2 Configure TanStack Query with Persistence

**File**: `mobile/src/app/_layout.tsx`

```typescript
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Configure online manager to detect network state
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Create persister for AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000, // Persist at most once per second
});

// Create Query Client with offline-friendly defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 24 hours
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Retry failed queries (useful when coming back online)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus (mobile doesn't have window focus)
      refetchOnWindowFocus: false,

      // Refetch on network reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations (critical for offline sync)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
    >
      {/* Rest of app */}
    </PersistQueryClientProvider>
  );
}
```

#### 1.3 Create Network Status Hook

**File**: `mobile/src/hooks/useNetworkStatus.ts`

```typescript
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useOnlineManager } from '@tanstack/react-query';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
      setIsConnected(!!state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  return {
    isOnline,
    isConnected,
    isOffline: !isOnline,
  };
};
```

#### 1.4 Create Offline Indicator Component

**File**: `mobile/src/components/OfflineIndicator.tsx`

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const OfflineIndicator = () => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📴 Sin conexión - Modo offline</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### Phase 2: Implement Offline Mutations Queue (Week 2)

#### 2.1 Create Offline Mutation Manager

**File**: `mobile/src/services/offlineMutationManager.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'react-native-uuid';

export interface OfflineMutation {
  id: string;
  type: 'CREATE_SESSION' | 'UPDATE_SESSION' | 'COMPLETE_SESSION' | 'UPDATE_ROUTINE';
  payload: any;
  timestamp: string;
  isSynced: boolean;
  retryCount: number;
}

const OFFLINE_MUTATIONS_KEY = '@fitito_offline_mutations';

export const offlineMutationManager = {
  // Queue a mutation for later sync
  queueMutation: async (type: OfflineMutation['type'], payload: any): Promise<string> => {
    const mutation: OfflineMutation = {
      id: uuidv4(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      isSynced: false,
      retryCount: 0,
    };

    const existing = await offlineMutationManager.getPendingMutations();
    const updated = [...existing, mutation];
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(updated));

    return mutation.id;
  },

  // Get all pending mutations
  getPendingMutations: async (): Promise<OfflineMutation[]> => {
    const data = await AsyncStorage.getItem(OFFLINE_MUTATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Mark mutation as synced
  markMutationSynced: async (mutationId: string): Promise<void> => {
    const mutations = await offlineMutationManager.getPendingMutations();
    const updated = mutations.map((m) =>
      m.id === mutationId ? { ...m, isSynced: true } : m
    );
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(updated));
  },

  // Remove synced mutations
  clearSyncedMutations: async (): Promise<void> => {
    const mutations = await offlineMutationManager.getPendingMutations();
    const pending = mutations.filter((m) => !m.isSynced);
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(pending));
  },

  // Get unsynced count
  getUnsyncedCount: async (): Promise<number> => {
    const mutations = await offlineMutationManager.getPendingMutations();
    return mutations.filter((m) => !m.isSynced).length;
  },
};
```

#### 2.2 Enhance Training Session Mutations for Offline

**File**: `mobile/src/features/training-sessions/hooks/useTrainingSession.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineMutationManager } from '@/services/offlineMutationManager';
import { sessionHistoryApi } from '../services/sessionHistoryApi';

export const useTrainingSession = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const startSessionMutation = useMutation({
    mutationFn: async (sessionData: CreateSessionDto) => {
      if (isOnline) {
        // Online: Send to API immediately
        return await sessionHistoryApi.createSession(sessionData);
      } else {
        // Offline: Queue mutation and return optimistic response
        const mutationId = await offlineMutationManager.queueMutation(
          'CREATE_SESSION',
          sessionData
        );

        // Return optimistic session with temporary ID
        return {
          id: `temp_${mutationId}`,
          ...sessionData,
          status: 'active',
          created_at: new Date().toISOString(),
          _isOptimistic: true,
        };
      }
    },
    onSuccess: (data) => {
      // Update cache with new session (optimistic or real)
      queryClient.setQueryData(['active-session', data.profile_id], data);

      Toast.show({
        type: 'success',
        text1: isOnline ? 'Sesión iniciada' : 'Sesión guardada (offline)',
      });
    },
  });

  return {
    startSession: startSessionMutation.mutate,
    isStarting: startSessionMutation.isPending,
  };
};
```

### Phase 3: Background Sync When Online (Week 3)

#### 3.1 Create Background Sync Service

**File**: `mobile/src/services/backgroundSync.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';
import { offlineMutationManager } from './offlineMutationManager';
import { sessionHistoryApi } from '@/features/training-sessions/services/sessionHistoryApi';
import { routineApi } from '@/features/routines/services/routineApi';

export const backgroundSyncService = {
  // Initialize background sync
  initialize: () => {
    NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('📡 Network restored, syncing offline changes...');
        await backgroundSyncService.syncPendingMutations();
      }
    });
  },

  // Sync all pending mutations
  syncPendingMutations: async () => {
    const mutations = await offlineMutationManager.getPendingMutations();
    const pending = mutations.filter((m) => !m.isSynced);

    console.log(`🔄 Syncing ${pending.length} pending mutations...`);

    for (const mutation of pending) {
      try {
        await backgroundSyncService.syncMutation(mutation);
        await offlineMutationManager.markMutationSynced(mutation.id);
        console.log(`✅ Synced mutation ${mutation.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync mutation ${mutation.id}:`, error);
        // Will retry on next sync
      }
    }

    // Clean up synced mutations
    await offlineMutationManager.clearSyncedMutations();
  },

  // Sync individual mutation
  syncMutation: async (mutation: OfflineMutation) => {
    switch (mutation.type) {
      case 'CREATE_SESSION':
        return await sessionHistoryApi.createSession(mutation.payload);

      case 'UPDATE_SESSION':
        return await sessionHistoryApi.updateSession(
          mutation.payload.sessionId,
          mutation.payload.data
        );

      case 'COMPLETE_SESSION':
        return await sessionHistoryApi.completeSession(
          mutation.payload.sessionId,
          mutation.payload.profileId
        );

      case 'UPDATE_ROUTINE':
        return await routineApi.updateRoutineWeek(
          mutation.payload.routineWeekId,
          mutation.payload.update
        );

      default:
        throw new Error(`Unknown mutation type: ${mutation.type}`);
    }
  },
};

// Initialize on app start
backgroundSyncService.initialize();
```

#### 3.2 Add Sync Status to UI

**File**: `mobile/src/components/SyncStatus.tsx`

```typescript
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineMutationManager } from '@/services/offlineMutationManager';

export const SyncStatus = () => {
  const { isOnline } = useNetworkStatus();
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    const checkUnsynced = async () => {
      const count = await offlineMutationManager.getUnsyncedCount();
      setUnsyncedCount(count);
    };

    checkUnsynced();
    const interval = setInterval(checkUnsynced, 5000);

    return () => clearInterval(interval);
  }, []);

  if (unsyncedCount === 0) return null;

  return (
    <View style={styles.container}>
      {!isOnline ? (
        <Text style={styles.text}>
          ⏳ {unsyncedCount} cambios pendientes de sincronizar
        </Text>
      ) : (
        <View style={styles.syncing}>
          <ActivityIndicator color="#4CAF50" />
          <Text style={[styles.text, styles.syncingText]}>
            Sincronizando {unsyncedCount} cambios...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#856404',
    fontSize: 12,
  },
  syncing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncingText: {
    color: '#4CAF50',
  },
});
```

### Phase 4: Pre-cache Critical Data (Week 4)

#### 4.1 Create Data Prefetch Service

**File**: `mobile/src/services/dataPrefetch.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';
import { routineApi } from '@/features/routines/services/routineApi';
import { exerciseApi } from '@/features/exercises/services/exerciseApi';
import { routineConfigurationApi } from '@/features/routine-configurations/services/routineConfigurationApi';

export const dataPrefetchService = {
  // Prefetch all critical data for offline use
  prefetchCriticalData: async (queryClient: QueryClient, profileId: number) => {
    console.log('📦 Prefetching critical data for offline use...');

    try {
      // 1. Prefetch routine weeks
      await queryClient.prefetchQuery({
        queryKey: ['routine-weeks', profileId],
        queryFn: () => routineApi.getWeekSchedule(profileId),
        cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      });

      // 2. Prefetch exercise library
      await queryClient.prefetchQuery({
        queryKey: ['exercises'],
        queryFn: () => exerciseApi.getAll(),
        cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days (exercises don't change often)
      });

      // 3. Prefetch exercise configurations for each day
      const routineWeeks = await routineApi.getWeekSchedule(profileId);

      for (const week of routineWeeks) {
        if (!week.is_rest_day && week.id) {
          await queryClient.prefetchQuery({
            queryKey: ['routine-configuration', week.id, profileId],
            queryFn: () => routineConfigurationApi.getConfiguration(week.id, profileId),
            cacheTime: 1000 * 60 * 60 * 24, // 24 hours
          });
        }
      }

      console.log('✅ Critical data prefetched successfully');
    } catch (error) {
      console.error('❌ Failed to prefetch critical data:', error);
    }
  },

  // Call this when user logs in or profile changes
  onProfileChange: (queryClient: QueryClient, profileId: number) => {
    dataPrefetchService.prefetchCriticalData(queryClient, profileId);
  },
};
```

#### 4.2 Integrate Prefetch on App Launch

**File**: `mobile/src/app/(tabs)/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/features/profile';
import { dataPrefetchService } from '@/services/dataPrefetch';

export default function TabLayout() {
  const queryClient = useQueryClient();
  const { profileId } = useProfile();

  useEffect(() => {
    if (profileId) {
      // Prefetch critical data when profile is available
      dataPrefetchService.prefetchCriticalData(queryClient, profileId);
    }
  }, [profileId, queryClient]);

  return (
    // Tab layout JSX
  );
}
```

---

## Conflict Resolution Strategy

### Strategy Matrix for FITito

| Data Type | Conflict Strategy | Reasoning |
|-----------|-------------------|-----------|
| **Routine Configuration** | Server Wins | Admin/trainer controls routines, user shouldn't override |
| **Exercise Library** | Server Wins | Centralized exercise database, no user modifications |
| **Workout Sessions** | Client Wins + Merge | User workout data is sacred, merge by fields (start time, exercises) |
| **Exercise Sets** | Client Wins | User's recorded weights/reps should never be lost |
| **Completed Dates** | Last Write Wins | Simple boolean, timestamp determines winner |

### Implementation: Smart Merge for Workout Sessions

**Scenario**: User starts a workout offline, server has no record.

```typescript
// File: mobile/src/services/conflictResolver.ts

export const conflictResolver = {
  resolveWorkoutSession: async (
    localSession: WorkoutSession,
    serverSession: WorkoutSession | null
  ): Promise<WorkoutSession> => {
    // No server session = no conflict, use local
    if (!serverSession) {
      return localSession;
    }

    // Both exist = merge strategy
    return {
      ...serverSession, // Server data as base
      exercises: localSession.exercises, // User's recorded exercises (Client Wins)
      completed_sets: localSession.completed_sets, // User's sets (Client Wins)
      notes: localSession.notes, // User's notes (Client Wins)
      completed_at: localSession.completed_at || serverSession.completed_at, // Latest completion
      updated_at: new Date().toISOString(), // Mark as just merged
    };
  },
};
```

### User Notification for Conflicts

```typescript
// Show toast when conflict is resolved
Toast.show({
  type: 'info',
  text1: '🔄 Datos sincronizados',
  text2: 'Tu sesión de entrenamiento se guardó correctamente',
});
```

---

## Technical Specifications

### Required NPM Packages

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x", // Already installed
    "@tanstack/react-query-persist-client": "^5.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "@react-native-community/netinfo": "^11.x",
    "react-native-uuid": "^2.x"
  }
}
```

### AsyncStorage Keys Convention

```typescript
// Cache keys
@fitito_query_cache           // TanStack Query cached data
@fitito_offline_mutations     // Pending mutations queue
@fitito_active_session_{profileId}  // Active workout session

// Session state
@fitito_last_sync_timestamp   // Last successful sync time
@fitito_prefetch_version      // Track when data was prefetched
```

### Data Size Estimates

| Data Type | Size per Item | Items | Total Size | Cache Time |
|-----------|---------------|-------|------------|------------|
| Routine Week | ~500 bytes | 7 | ~3.5 KB | 24 hours |
| Exercise Config | ~2 KB | 7 | ~14 KB | 24 hours |
| Exercise Library | ~300 bytes | 100 | ~30 KB | 7 days |
| Workout Session | ~5 KB | 1 active | ~5 KB | Until synced |
| History Sessions | ~5 KB | 30 | ~150 KB | 24 hours |
| **Total** | - | - | **~200 KB** | - |

**Conclusion**: Well within AsyncStorage 6MB limit, no need for SQLite initially.

---

## Migration Path

### Step-by-Step Rollout Plan

#### Week 1: Infrastructure Setup
- [ ] Install npm packages
- [ ] Configure TanStack Query persistence
- [ ] Add NetInfo integration
- [ ] Create OfflineIndicator component
- [ ] Test: Verify cache persists after app restart

#### Week 2: Offline Mutations
- [ ] Create offlineMutationManager service
- [ ] Update training session mutations for offline support
- [ ] Implement optimistic updates
- [ ] Add mutation queue UI (SyncStatus component)
- [ ] Test: Start session offline, verify it queues

#### Week 3: Background Sync
- [ ] Create backgroundSyncService
- [ ] Implement sync on network restore
- [ ] Add error handling and retry logic
- [ ] Test: Queue mutations offline, go online, verify sync

#### Week 4: Data Prefetching
- [ ] Create dataPrefetchService
- [ ] Prefetch routine weeks, exercises, configurations
- [ ] Add prefetch on profile change
- [ ] Test: Go offline immediately, verify all data available

#### Week 5: Conflict Resolution
- [ ] Implement conflict detection
- [ ] Add conflict resolver service
- [ ] Handle edge cases (duplicate sessions, stale data)
- [ ] Test: Create conflicts, verify resolution

#### Week 6: Testing & Polish
- [ ] E2E testing: Full offline workout flow
- [ ] Performance testing: Large mutation queues
- [ ] Battery testing: Background sync impact
- [ ] UX polish: Loading states, error messages

---

## Success Criteria

### Functional Requirements

✅ **Offline Reading**
- User can view routine schedule with no internet
- User can view exercise configurations with no internet
- User can view workout history with no internet

✅ **Offline Writing**
- User can start a workout session with no internet
- User can record sets and progress with no internet
- User can complete a workout session with no internet

✅ **Automatic Sync**
- All offline changes sync automatically when online
- User is notified of sync status
- No data loss during sync

✅ **Conflict Resolution**
- Conflicts are detected and resolved automatically
- User is notified when conflicts occur
- User data (workout sessions) is never lost

### Performance Requirements

- App launches in <2 seconds with cached data
- Offline operations have <100ms response time
- Background sync completes in <5 seconds for typical queue
- Battery impact of background sync <2% per hour

### User Experience Requirements

- Clear offline indicator when no connection
- Sync status visible during synchronization
- Toast notifications for successful sync
- Error messages explain issues clearly

---

## Next Steps

1. **Review this document** with the team
2. **Approve the architecture** and implementation plan
3. **Start Week 1 implementation** (infrastructure setup)
4. **Iterative testing** after each week
5. **Production rollout** after Week 6 testing

---

## References

- [TanStack Query Persistence Docs](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- [AsyncStorage Persister Docs](https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister)
- [NetInfo Docs](https://github.com/react-native-netinfo/react-native-netinfo)
- [Building Offline-First Apps - DEV Community](https://dev.to/zidanegimiga/building-offline-first-applications-with-react-native-3626)
- [React Native Offline First - Relevant Software](https://relevant.software/blog/react-native-offline-first/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: FITito Development Team
