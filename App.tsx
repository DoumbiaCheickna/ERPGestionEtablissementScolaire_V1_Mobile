// App.tsx
import React, { useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import AppNavigator from './src/navigation';
import messaging from '@react-native-firebase/messaging';
import { startAutomaticAbsenceService, stopAutomaticAbsenceService } from './src/etudiant/utils/emargement';

export default function App() {
  const absenceServiceRef = useRef<NodeJS.Timeout | null>(null);



  // 🔹 Absence service (your existing code)
  useEffect(() => {
    absenceServiceRef.current = startAutomaticAbsenceService(15);

    return () => {
      if (absenceServiceRef.current) {
        stopAutomaticAbsenceService(absenceServiceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !absenceServiceRef.current) {
        absenceServiceRef.current = startAutomaticAbsenceService(30);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return <AppNavigator />;
}
