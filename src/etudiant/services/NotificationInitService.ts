// src/services/notificationInitService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, getUserSnapchot } from '../../firebaseConfig';

// --- Configuration du gestionnaire de notifications Expo ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// --- Interface pour les données de notification ---
interface NotificationDataAbsence {
  type?: string;
  matiereId?: string;
  courseName?: string;
  screen?: string;
  [key: string]: any;
}

// --- Enregistrer l'utilisateur pour les notifications push ---
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission requise', 
        'Les notifications push sont nécessaires pour recevoir les alertes d\'absence.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    try {
      const expoPushToken = await Notifications.getExpoPushTokenAsync();
      token = expoPushToken.data;
      
      // Stocker le token localement
      await AsyncStorage.setItem('expoPushToken', token);
      
      // Sauvegarder le token dans Firestore (utilise les deux champs pour compatibilité)
      await updateUserPushToken(token);
      
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token push:', error);
    }
  } else {
    Alert.alert('Erreur', 'Les notifications push nécessitent un appareil physique');
  }

  return token;
};

// --- Sauvegarder le token push dans le document utilisateur ---
const updateUserPushToken = async (pushToken: string): Promise<void> => {
  try {
    const querySnapshot: any = await getUserSnapchot();
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(db, 'users', userDoc.id);
      // Save to both fields for compatibility
      await updateDoc(userRef, { 
        pushToken,
        expoPushToken: pushToken, // Added for absence service compatibility
        lastTokenUpdate: new Date()
      });
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token push:', error);
  }
};

// --- Fonction améliorée pour envoyer une notification push ---
export const sendPushNotification = async (
  title: string, 
  body: string, 
  data?: NotificationDataAbsence, 
  targetToken?: string
): Promise<any> => {
  try {
    let pushToken: any = targetToken;
    
    if (!pushToken) {
      pushToken = await AsyncStorage.getItem('expoPushToken');
    }
    
    if (!pushToken) {
      console.warn('No push token available for notification');
      return null;
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      badge: 1,
      priority: 'high' as const,
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    // Log the result for debugging
    
    // Handle potential errors
    if (result.errors) {
      console.error('Push notification errors:', result.errors);
    }
    
    // Vérifier la réception après 15 secondes
    if (result.data && result.data.id) {
      setTimeout(async () => {
        await checkPushReceipt(result.data.id);
      }, 15000);
    }
    
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification push:', error);
    throw error;
  }
};

// --- Fonction de test de notification améliorée ---
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord les permissions
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'Veuillez activer les notifications pour tester cette fonctionnalité.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Option 1: Notification locale immédiate (toujours fonctionne)
    const localNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test de notification",
        body: "Félicitations ! Vos notifications fonctionnent parfaitement.",
        data: {
          type: 'test',
          timestamp: Date.now(),
        },
        sound: 'default',
      },
      trigger: null, // Notification immédiate
    });


    // Option 2: Notification push (si le token existe)
    try {
      const pushToken = await AsyncStorage.getItem('expoPushToken');
      if (pushToken) {
        const pushResult = await sendPushNotification(
          "Test de notification push",
          "Votre système de notifications push est opérationnel !",
          {
            type: 'test_push',
            timestamp: Date.now(),
          }
        );
        
       
      } else {
        console.log('Pas de token push disponible, seule la notification locale a été envoyée');
      }
    } catch (pushError) {
      console.warn('Erreur avec la notification push, mais la notification locale fonctionne:', pushError);
    }

    // Afficher un message de confirmation
    Alert.alert(
      'Test envoyé',
      'Une notification de test a été envoyée. Vous devriez la recevoir dans quelques secondes.',
      [{ text: 'OK' }]
    );

    return true;
  } catch (error) {
    console.error('Erreur lors du test de notification:', error);
    Alert.alert(
      'Erreur de test',
      'Impossible d\'envoyer la notification de test. Vérifiez vos permissions.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

// --- Vérifier si la notification a été livrée ---
const checkPushReceipt = async (receiptId: string): Promise<void> => {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: [receiptId] }),
    });
    
    const receipts = await response.json();
  } catch (error) {
    console.error('Erreur lors de la vérification du reçu:', error);
  }
};

// --- Envoyer une notification à un utilisateur spécifique (compatible avec les deux champs) ---
export const sendNotificationToUser = async (
  userId: string, 
  title: string, 
  body: string, 
  data?: NotificationDataAbsence
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn('User not found:', userId);
      return;
    }
    
    const userData = userSnap.data();
    // Try both token field names for compatibility
    const pushToken = userData.expoPushToken || userData.pushToken;
    
    if (!pushToken) {
      console.warn('No push token found for user:', userId);
      return;
    }
    
    await sendPushNotification(title, body, data, pushToken);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de notification à l\'utilisateur:', error);
  }
};

// --- Envoyer des notifications en masse (compatible avec les deux champs) ---
export const sendBulkNotifications = async (
  userIds: string[], 
  title: string, 
  body: string, 
  data?: NotificationDataAbsence
): Promise<void> => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Try both token field names for compatibility
        const pushToken = userData.expoPushToken || userData.pushToken;
        
        if (pushToken) {
          notifications.push({
            to: pushToken,
            sound: 'default',
            title,
            body,
            data: data || {},
            badge: 1,
            priority: 'high',
            channelId: 'default',
          });
        }
      }
    }
    
    if (notifications.length > 0) {
      
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });
      
      const result = await response.json();
    } else {
      console.warn('No valid tokens found for bulk notifications');
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications en masse:', error);
  }
};

// --- Configurer les écouteurs de notifications ---
export const setupNotificationListeners = (): void => {
  // Écouter les notifications reçues quand l'app est au premier plan
  // Écouter les interactions avec les notifications
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Réponse de notification:', response);
    
    const notificationData = response.notification.request.content.data;
    if (notificationData.screen) {
      // Gérer la navigation basée sur les données de notification
      console.log('Naviguer vers:', notificationData.screen, notificationData);
    }
  });
};

// --- Planifier une notification locale ---
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  trigger: any,
  data?: NotificationDataAbsence
): Promise<string> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Erreur lors de la planification de la notification locale:', error);
    throw error;
  }
};

// --- Annuler une notification planifiée ---
export const cancelScheduledNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la notification:', error);
  }
};

// --- Obtenir toutes les notifications planifiées ---
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications planifiées:', error);
    return [];
  }
};

// --- Fonction utilitaire pour rafraîchir le token si nécessaire ---
export const refreshPushTokenIfNeeded = async (): Promise<void> => {
  try {
    const storedToken = await AsyncStorage.getItem('expoPushToken');
    const newToken = await Notifications.getExpoPushTokenAsync();
    
    if (storedToken !== newToken.data) {
      await AsyncStorage.setItem('expoPushToken', newToken.data);
      await updateUserPushToken(newToken.data);
    }
  } catch (error) {
    console.error('Error refreshing push token:', error);
  }
};