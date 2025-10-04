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
