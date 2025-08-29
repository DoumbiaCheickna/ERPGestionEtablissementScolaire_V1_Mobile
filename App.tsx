// App.tsx
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation';
import { startAutomaticAbsenceService, stopAutomaticAbsenceService } from './src/etudiant/utils/emargement';

export default function App() {
  const absenceServiceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    // Start automatic absence tracking service
    absenceServiceRef.current = startAutomaticAbsenceService(5);

    // Cleanup function
    return () => {
      if (absenceServiceRef.current) {
        stopAutomaticAbsenceService(absenceServiceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        
        if (!absenceServiceRef.current) {
          absenceServiceRef.current = startAutomaticAbsenceService(30);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return <AppNavigator />;
}