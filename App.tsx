// App.tsx
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation';
{/* import { setupScheduledCourseNotifications } from './src/etudiant/services/backgroundTaskService'; */}
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/etudiant/services/NotificationInitService';
import { startAutomaticAbsenceService, stopAutomaticAbsenceService } from './src/etudiant/utils/emargement';

export default function App() {
  const absenceServiceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize notification system
    const initializeNotifications = async () => {
      try {
        await registerForPushNotificationsAsync();
        setupNotificationListeners();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

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
        // Refresh course notifications when app becomes active
        {/*etupScheduledCourseNotifications().catch(console.error);*/}
        
        // Restart absence service if it was stopped
        if (!absenceServiceRef.current) {
          absenceServiceRef.current = startAutomaticAbsenceService(30);
        }
      } else if (nextAppState === 'background') {
        // Keep service running in background for now
        // Could implement background task handling here if needed
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return <AppNavigator />;
}