import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

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
