// App.tsx
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation';
import { setupScheduledCourseNotifications } from './src/etudiant/services/backgroundTaskService';
import { registerForPushNotificationsAsync } from './src/etudiant/services/NotificationInitService';
import { startAutomaticAbsenceService  } from './src/etudiant/utils/emargement';

export default function App() {
  useEffect(() => {
    // Register device for push notifications
    registerForPushNotificationsAsync().catch(console.error);

    // Start automatic absence tracking loop
    startAutomaticAbsenceService();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState == 'active') {
        setupScheduledCourseNotifications().catch(console.error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return <AppNavigator />;
}
