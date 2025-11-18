import { Alert, Linking } from 'react-native';
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// School coordinates configuration
export const SCHOOL_COORDINATES = {
  latitude: 14.717022,
  longitude: -17.4674526,
  radius: 40
};

// Course status calculation
export const getCoursStatus = (startTime: string, endTime: string) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const coursStartTime = startHour * 60 + startMinute;
  const coursEndTime = endHour * 60 + endMinute;

  if (currentTime < coursStartTime) {
    return { label: 'Pas commencé', type: 'warning' };
  } else if (currentTime >= coursStartTime && currentTime <= coursEndTime) {
    return { label: 'En cours', type: 'primary' };
  } else {
    return { label: 'Terminé', type: 'success' };
  };
};

// Location permission handling
export const requestLocationPermission = async (
  setLocationPermissionGranted: (granted: boolean) => void,
  getCurrentLocation: () => void
) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationPermissionGranted(true);
      getCurrentLocation();
    } else if (status === 'denied') {
      handleLocationPermissionDenied(setLocationPermissionGranted, getCurrentLocation);
    }
  } catch (error) {
    handleLocationPermissionDenied(setLocationPermissionGranted, getCurrentLocation);
  }
};

export const handleLocationPermissionDenied = (
  setLocationPermissionGranted: (granted: boolean) => void,
  getCurrentLocation: () => void
) => {
  Alert.alert(
    'Permission requise',
    'La permission de localisation est recommandée pour vérifier que vous êtes sur le campus IIBS.',
    [
      {
        text: 'Réessayer',
        onPress: () => requestLocationPermission(setLocationPermissionGranted, getCurrentLocation)
      },
      {
        text: 'Paramètres',
        onPress: () => Linking.openSettings()
      },
      {
        text: 'Continuer sans',
        style: 'cancel'
      }
    ]
  );
};

// Location calculation utilities
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const checkIfNearSchool = (
  userLat: number, 
  userLon: number, 
  setIsNearSchool: (near: boolean) => void
) => {
  const distance = calculateDistance(userLat, userLon, SCHOOL_COORDINATES.latitude, SCHOOL_COORDINATES.longitude);
  const nearSchool = distance <= SCHOOL_COORDINATES.radius;
  setIsNearSchool(nearSchool);
};

// Course time utilities
export const isCourseTimeExpired = (endTime: string) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const coursEndTime = endHour * 60 + endMinute;
  return currentTime > coursEndTime;
};

export const isCourseNotStarted = (startTime: string) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const courseStartTime = startHour * 60 + startMinute;
  return currentTime < courseStartTime;
};

// Professor presence checking
export const isProfesseurEmargedForCourse = async (matiereId: string, startTime: string, endTime: string): Promise<boolean> => {
  try {
    const userLogin = await AsyncStorage.getItem('userLogin');
    if (!userLogin) {
      return false;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('login', '==', userLogin));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return false;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const emargements: any[] = userData.emargements || [];

    const today = new Date().toDateString();

    // Check if there's a presence record for this course today with matching time
    const hasPresence = emargements.some(emargement =>
      emargement.type == 'presence_prof' &&
      emargement.matiere_id == matiereId &&
      emargement.date == today &&
      emargement.start == startTime &&
      emargement.end == endTime
    );
    return hasPresence;

  } catch (error) {
    console.error('Error checking professor presence:', error);
    return false; 
  }
};

// Student presence checking
export const isStudentEmargedForCourse = async (matiereId: string): Promise<boolean> => {
  try {
    const userLogin = await AsyncStorage.getItem('userLogin');
    if (!userLogin) {
      return false;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('login', '==', userLogin));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return false;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const emargements: any[] = userData.emargements || [];

    const today = new Date().toDateString();

    // Check if there's an absence record for this course today
    const hasPresence = emargements.some(emargement =>
      emargement.type == 'presence' &&
      emargement.matiere_id == matiereId &&
      emargement.date == today
    );
    return hasPresence;

  } catch (error) {
    console.error('Error checking student absence:', error);
    return false; 
  }
};

// Student absence checking
export const isStudentAbsentForCourse = async (matiereId: string): Promise<boolean> => {
  try {
    const userLogin = await AsyncStorage.getItem('userLogin');
    if (!userLogin) {
      return false;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('login', '==', userLogin));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return false;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const emargements: any[] = userData.emargements || [];

    const today = new Date().toDateString();

    // Check if there's an absence record for this course today
    const hasAbsence = emargements.some(emargement =>
      emargement.type == 'absence' &&
      emargement.matiere_id == matiereId &&
      emargement.date == today
    );
    return hasAbsence;

  } catch (error) {
    console.error('Error checking student absence:', error);
    return false; 
  }
};

// Date utilities
export const getTodayInfo = () => {
  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const todayDayName = dayNames[today.getDay()];
  const currentTime = today.getHours() * 60 + today.getMinutes();
  const todayStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
  
  return {
    today,
    dayNames,
    todayDayName,
    currentTime,
    todayStr
  };
};

// Next course calculation
export const findNextCourse = (coursesByDay: any[], todayDayName: string, currentTime: number, todayCourses: any[]) => {
  let closestCourse: any = null;
  let minTimeDifference = Infinity;

  todayCourses.forEach(course => {
    try {
      const timeParts = course.start.split(':');
      const startHours = parseInt(timeParts[0]);
      const startMinutes = parseInt(timeParts[1]);
      
      if (isNaN(startHours)) {
        return;
      }
      
      const courseStartTime = startHours * 60 + startMinutes;
      const timeDifference = courseStartTime - currentTime;

      // Only consider future courses (timeDifference > 0)
      if (timeDifference > 0 && timeDifference < minTimeDifference) {
        minTimeDifference = timeDifference;
        closestCourse = course;
      }
    } catch (error) {
      console.error("Error parsing course time:", course.start, error);
    }
  });
  
  // If no upcoming courses found for today, look for next day's courses
  if (!closestCourse) {
    const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const currentDayIndex = dayOrder.indexOf(todayDayName);
    
    // Search through the next 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const nextDayIndex = (currentDayIndex + dayOffset) % 7;
      const nextDayName = dayOrder[nextDayIndex];
      
      const nextDayCourses = coursesByDay
        .filter((d: any) => d.title === nextDayName)
        .flatMap((d: any) => d.data) || [];
      
      if (nextDayCourses.length > 0) {
        // Find the earliest course of the next day
        let earliestCourse: any = null;
        let earliestTime = Infinity;
        
        nextDayCourses.forEach(course => {
          try {
            const timeParts = course.start.split(':');
            const startHours = parseInt(timeParts[0]);
            const startMinutes = parseInt(timeParts[1]);
            
            if (isNaN(startHours)) {
              return;
            }
            
            const courseStartTime = startHours * 60 + startMinutes;
            
            if (courseStartTime < earliestTime) {
              earliestTime = courseStartTime;
              earliestCourse = { ...course, day: nextDayName };
            }
          } catch (error) {
            console.error("Error parsing course time:", course.start, error);
          }
        });
        
        if (earliestCourse) {
          closestCourse = earliestCourse;
          break; 
        }
      }
    }
  } else {
    closestCourse = { ...closestCourse, day: todayDayName };
  }
  
  if (!closestCourse && todayCourses.length > 0) {
    closestCourse = { ...todayCourses[0], day: todayDayName };
  }
  
  return closestCourse;
};