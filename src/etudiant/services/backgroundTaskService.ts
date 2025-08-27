import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, getUserSnapchot } from '../../firebaseConfig';
import { Platform } from 'react-native';

interface CourseSlot {
  matiere_id: string;
  matiere_libelle: string;
  start: string; // 'HH:mm'
  end: string;
  enseignant: string;
  salle: string;
  day: number; // 1 = Monday, 7 = Sunday
}


// Schedule notifications 5 minutes before each course for the next 7 days
export const scheduleWeeklyCourseNotifications = async (): Promise<void> => {
  try {
    const querySnapshot: any = await getUserSnapchot();
    if (!querySnapshot || querySnapshot.empty) return;

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const classeId = userData.classe_id;
    if (!classeId) return;

    const edtData = await getClassSchedule(classeId);
    if (!edtData?.slots?.length) return;

    const now = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      targetDate.setHours(0, 0, 0, 0);

      const targetJSDay = targetDate.getDay();
      const targetFrenchDay = targetJSDay == 0 ? 7 : targetJSDay;

      const dayCourses = edtData.slots.filter(
        (slot: CourseSlot) => slot.day == targetFrenchDay
      );

      for (const course of dayCourses) {
        const [startHours, startMinutes] = course.start.split(':').map(Number);
        if (isNaN(startHours) || isNaN(startMinutes)) continue;

        const notificationDate = new Date(targetDate);
        notificationDate.setHours(startHours, startMinutes, 0, 0); 

        if (notificationDate > now) {
          const notificationId = `course_${course.matiere_id}_${notificationDate.getTime()}`;

          // Schedule notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Début de Cours ! 🎓',
              body: `Le cours de ${course.matiere_libelle} a commencé  (${course.salle || 'Salle non spécifiée'})`,
              data: {
                type: 'course_started',
                matiereId: course.matiere_id,
                courseName: course.matiere_libelle,
                salle: course.salle,
                enseignant: course.enseignant,
                screen: 'Home',
              },
              sound: 'default',
            },
            trigger: {
              date: notificationDate,
            } as any,
            identifier: notificationId,
          });
        }
      }
    }

    await AsyncStorage.setItem('lastNotificationSchedule', now.toISOString());
  } catch (error) {
    console.error('❌ Error scheduling weekly notifications:', error);
  }
};

const getClassSchedule = async (classeId: string) => {
  try {
    const edtsQuery = query(collection(db, 'edts'), where('class_id', '==', classeId));
    const edtsSnapshot = await getDocs(edtsQuery);
    if (edtsSnapshot.empty) return null;
    return edtsSnapshot.docs[0].data();
  } catch {
    return null;
  }
};

// Check if we need to reschedule notifications (run each time app opens)
export const checkAndRescheduleIfNeeded = async (): Promise<void> => {
  try {
    const lastSchedule = await AsyncStorage.getItem('lastNotificationSchedule');
    const now = new Date();
    if (!lastSchedule || now.getTime() - new Date(lastSchedule).getTime() > 12 * 60 * 60 * 1000) {
      // Reschedule if never scheduled or last schedule >12h ago
      await scheduleWeeklyCourseNotifications();
    }
  } catch {
    await scheduleWeeklyCourseNotifications();
  }
};

// Setup notifications & permissions
export const setupScheduledCourseNotifications = async (): Promise<void> => {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      } as any),
    });

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('course-notifications', {
        name: 'Course Notifications',
        description: 'Notifications for course start times',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableLights: true,
        lightColor: '#FF0000',
      });
    }

    await checkAndRescheduleIfNeeded();
  } catch (error) {
    console.error('❌ Error setting up notifications:', error);
  }
};
