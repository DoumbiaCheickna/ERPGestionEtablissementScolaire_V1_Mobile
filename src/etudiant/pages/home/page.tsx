import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Linking, Platform, Dimensions, Button } from 'react-native';
import TopNavBar from '../../components/layout/topBar';
import BottomNavBar from '../../components/layout/bottomBar';
import { theme } from '../../../styles/globalStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { useMatieres } from '../../components/hooks/matieres';
import { Slot, useUserCourses } from '../../components/hooks/cours'; 
import { Cstyles } from '../allCourses/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { HomeStyles } from "./styles";
import { styles as eStyles } from '../allCourses/styles'
import { getUserSnapchot } from '../../../firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Interface for course records with matricule
interface CourseRecord {
  matiereId: string;
  matricule: string;
}

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
  }
};

export default function Home({ navigation }: Props) {
  const { matieres, loading: matieresLoading } = useMatieres();
  const { coursesByDay, loading: coursesLoading } = useUserCourses(); 
  const [emargedCourses, setEmargedCourses] = useState<CourseRecord[]>([]);
  const [absentCourses, setAbsentCourses] = useState<CourseRecord[]>([]);
  const [processedCourses, setProcessedCourses] = useState<CourseRecord[]>([]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isNearSchool, setIsNearSchool] = useState(false);
  const [userMatricule, setUserMatricule] = useState('');
  const [nextCourse, setNextCourse] = useState<Slot | null>(null);

  const SCHOOL_COORDINATES = {
    latitude: 14.717022,
    longitude: -17.4674526,
    radius: 40
  };

  useEffect(() => {
    const initApp = async () => {
      await getMatricule();
      loadEmargedCourses();
      loadAbsentCourses();
      loadProcessedCourses();
      await requestLocationPermission();
    };
    
    initApp();
  }, []);

  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const todayDayName = dayNames[today.getDay()];
  const currentTime = today.getHours() * 60 + today.getMinutes();
  const todayStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
  const todayCourses = coursesByDay.filter((d:any)=>d.title==todayDayName).flatMap((d:any)=>d.data) || [];

  // Check for expired courses and mark as absent
  useEffect(() => {
    const checkExpiredCourses = () => {
      todayCourses.forEach((course: any) => {
        const matiereId = course.matiere_id;
        const isExpired = isCourseTimeExpired(course.end);
        const isNotEmarged = !isStudentEmargedForCourse(matiereId, userMatricule);
        const isNotProcessed = !isStudentProcessedForCourse(matiereId, userMatricule);
        
        if (isExpired && isNotEmarged && isNotProcessed && userMatricule) {
          // Automatically record absence for expired courses
          recordAbsence(matiereId, course.matiere_libelle);
        }
      });
    };

    // Check every minute for expired courses
    const interval = setInterval(checkExpiredCourses, 60000);
    
    // Also check immediately
    if (!coursesLoading && coursesByDay.length > 0 && userMatricule) {
      checkExpiredCourses();
    }

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
    
    setNextCourse(closestCourse);

    return () => clearInterval(interval);

  }, [coursesByDay, emargedCourses, processedCourses, coursesLoading, userMatricule]);

  useEffect(() => {
    if (!locationPermissionGranted) return;

    let locationInterval: ReturnType<typeof setInterval>;

    const updateLocationInterval = () => {
      const currentCourse = getCurrentCourse();

      if (locationInterval) clearInterval(locationInterval);

      locationInterval = setInterval(() => {
        getCurrentLocation();
      }, currentCourse ? 5 * 60 * 1000 : 15 * 60 * 1000); 

      // run immediately
      getCurrentLocation();
    };

    updateLocationInterval();

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [locationPermissionGranted, todayCourses, nextCourse]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermissionGranted(true);
        getCurrentLocation();
      } else if (status === 'denied') {
        handleLocationPermissionDenied();
      }
    } catch (error) {
      handleLocationPermissionDenied();
    }
  };

  const handleLocationPermissionDenied = () => {
    Alert.alert(
      'Permission requise',
      'La permission de localisation est obligatoire pour vérifier que vous êtes sur le campus IIBS.',
      [
        {
          text: 'Réessayer',
          onPress: () => requestLocationPermission()
        },
        {
          text: 'Paramètres',
          onPress: () => Linking.openSettings()
        },
        {
          text: 'Quitter',
          onPress: () => {
            Alert.alert('Information', 'L\'application ne peut pas fonctionner sans la permission de localisation.');
          },
          style: 'destructive'
        }
      ],
      { cancelable: false }
    );
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = location.coords;
      checkIfNearSchool(latitude, longitude);
    } catch (error) {
      setIsNearSchool(false);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation. Veuillez réessayer.');
    }
  };

  const getCurrentCourse = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const runningCourse = todayCourses.find(course => {
      const [startH, startM] = course.start.split(':').map(Number);
      const [endH, endM] = course.end.split(':').map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;
      return currentMinutes >= startTime && currentMinutes <= endTime;
    });

    return runningCourse || null;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  const checkIfNearSchool = (userLat: number, userLon: number) => {
    const distance = calculateDistance(userLat, userLon, SCHOOL_COORDINATES.latitude, SCHOOL_COORDINATES.longitude);
    const nearSchool = distance <= SCHOOL_COORDINATES.radius;
    setIsNearSchool(nearSchool);
  };

  // Helper functions to check if a specific student has emarged/processed a course
  const isStudentEmargedForCourse = (matiereId: string, matricule: string): boolean => {
    return emargedCourses.some(record => 
      record.matiereId === matiereId && record.matricule === matricule
    );
  };

  const isStudentAbsentForCourse = (matiereId: string, matricule: string): boolean => {
    return absentCourses.some(record => 
      record.matiereId === matiereId && record.matricule === matricule
    );
  };

  const isStudentProcessedForCourse = (matiereId: string, matricule: string): boolean => {
    return processedCourses.some(record => 
      record.matiereId === matiereId && record.matricule === matricule
    );
  };

  // Load emarged courses from storage
  const loadEmargedCourses = async () => {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem(`emarged_courses_${today}`);
      if (stored) {
        setEmargedCourses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading emarged courses:', error);
    }
  };

  // Load absent courses from storage
  const loadAbsentCourses = async () => {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem(`absent_courses_${today}`);
      if (stored) {
        setAbsentCourses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading absent courses:', error);
    }
  };

  // Load processed courses from storage
  const loadProcessedCourses = async () => {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem(`processed_courses_${today}`);
      if (stored) {
        setProcessedCourses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading processed courses:', error);
    }
  };

  // Save emarged course with matricule
  const saveEmargedCourse = async (matiereId: string) => {
    try {
      if (!userMatricule) {
        console.error('User matricule not available');
        return;
      }

      const today = new Date().toDateString();
      const newEmargedRecord: CourseRecord = { matiereId, matricule: userMatricule };
      const newProcessedRecord: CourseRecord = { matiereId, matricule: userMatricule };
      
      const updatedEmarged = [...emargedCourses, newEmargedRecord];
      const updatedProcessed = [...processedCourses, newProcessedRecord];
      
      setEmargedCourses(updatedEmarged);
      setProcessedCourses(updatedProcessed);
      
      await AsyncStorage.setItem(`emarged_courses_${today}`, JSON.stringify(updatedEmarged));
      await AsyncStorage.setItem(`processed_courses_${today}`, JSON.stringify(updatedProcessed));
    } catch (error) {
      console.error('Error saving emarged course:', error);
    }
  };

  const getMatricule = async () => {
    try {
      const userSnapshot: any = await getUserSnapchot();
      const userDoc = userSnapshot?.docs[0];
      const userData = userDoc?.data();
      const matricule = userData.matricule;
      setUserMatricule(matricule);
      return matricule;
    } catch (error) {
      console.error('Error getting matricule:', error);
      return '';
    }
  };

  // Save absent course with matricule
  const saveAbsentCourse = async (matiereId: string) => {
    try {
      if (!userMatricule) {
        console.error('User matricule not available');
        return;
      }

      const today = new Date().toDateString();
      const newAbsentRecord: CourseRecord = { matiereId, matricule: userMatricule };
      const newProcessedRecord: CourseRecord = { matiereId, matricule: userMatricule };
      
      const updatedAbsent = [...absentCourses, newAbsentRecord];
      const updatedProcessed = [...processedCourses, newProcessedRecord];
      
      setAbsentCourses(updatedAbsent);
      setProcessedCourses(updatedProcessed);
      
      await AsyncStorage.setItem(`absent_courses_${today}`, JSON.stringify(updatedAbsent));
      await AsyncStorage.setItem(`processed_courses_${today}`, JSON.stringify(updatedProcessed));
    } catch (error) {
      console.error('Error saving absent course:', error);
    }
  };

  // Record absence using your handleAbsence function
  const recordAbsence = async (matiereId: string, courseTitle: string) => {
    try {
      await saveAbsentCourse(matiereId);
    } catch (error) {
      console.error('Error recording absence:', error);
    }
  };

  const isCourseTimeExpired = (endTime: string) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const coursEndTime = endHour * 60 + endMinute;
    return currentTime > coursEndTime;
  };

  const isCourseNotStarted = (startTime: string) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const courseStartTime = startHour * 60 + startMinute;
    return currentTime < courseStartTime;
  };

  const canEmarger = (matiereId: string, endTime: string) => {
    const isAlreadyEmarged = isStudentEmargedForCourse(matiereId, userMatricule);
    const isTimeExpired = isCourseTimeExpired(endTime);
    return !isAlreadyEmarged && !isTimeExpired;
  };

  const getEmargerButtonStatus = (matiereId: string, endTime: string, startTime: string) => {
    if (!userMatricule) {
      return { 
        text: 'Chargement...', 
        style: HomeStyles.expiredButton, 
        textStyle: HomeStyles.expiredButtonText, 
        disabled: true 
      };
    }

    const isAlreadyEmarged = isStudentEmargedForCourse(matiereId, userMatricule);
    const isAbsent = isStudentAbsentForCourse(matiereId, userMatricule);
    const isTimeExpired = isCourseTimeExpired(endTime);
    const isNotStarted = isCourseNotStarted(startTime);
    
    if (isAlreadyEmarged) return { 
      text: '✓ Émargé', 
      style: HomeStyles.emargedButton, 
      textStyle: HomeStyles.emargedButtonText, 
      disabled: true 
    };
    
    if (isAbsent) return { 
      text: '❌ Absent', 
      style: HomeStyles.absentButton, 
      textStyle: HomeStyles.absentButtonText, 
      disabled: true 
    };
    
    if (isNotStarted) return { 
      text: 'Bientôt', 
      style: HomeStyles.expiredButton, 
      textStyle: HomeStyles.expiredButtonText, 
      disabled: true 
    };
    
    if (isTimeExpired) return { 
      text: 'Expiré', 
      style: HomeStyles.expiredButton, 
      textStyle: HomeStyles.expiredButtonText, 
      disabled: true 
    };
    
    return { 
      text: '✓ Emarger', 
      style: [Cstyles.emargerButton, HomeStyles.modernEmargerButton], 
      textStyle: [Cstyles.emargerButtonText, HomeStyles.emargerButtonTextModern], 
      disabled: false 
    };
  };


const handleEmargerPress = async (matiereId: string, endTime: string, courseLibelle: string, course: any) => {

    if (!locationPermissionGranted) {
      Alert.alert('Permission requise', 'Veuillez accorder la permission de localisation pour continuer.', [{ text: 'Accorder permission', onPress: () => requestLocationPermission() }]);
      return;
    }
    if (!isNearSchool) {
      Alert.alert('Localisation requise', 'Vous devez être sur le campus de l\'école pour émarger ! 📍', [{ text: 'Vérifier à nouveau', onPress: () => getCurrentLocation() }, { text: 'OK', style: 'cancel' }]);
      return;
    }
    if (!canEmarger(matiereId, endTime)) {
      Alert.alert('Information', isStudentEmargedForCourse(matiereId, userMatricule) ? 'Vous avez déjà émargé pour ce cours aujourd\'hui.' : 'Le temps d\'émargement pour ce cours est expiré.');
      return;
    }

    // Navigate to scanner with success callback and course information
    navigation.navigate('Scanner', { 
      matiereId, 
      onEmargementSuccess: async () => {
        try {
          // Call the emargement success function and wait for it
          await saveEmargedCourse(matiereId);
          console.log('Emargement saved successfully for:', matiereId);
        } catch (error) {
          console.error('Error in emargement success callback:', error);
          Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour locale.');
        }
      }, 
      courseLibelle,
      // Pass additional course information for the modal
      courseInfo: {
        start: course.start,
        end: course.end,
        enseignant: course.enseignant,
      }
    });
  };

  const goToQRCode = (matiereId: string, courseLibelle: string) => {
    if (!matiereId) return Alert.alert('Erreur', 'ID du cours manquant');
    navigation.navigate('QRCodeScreen', { matiereId, courseLibelle });
  };

  const loading = matieresLoading || coursesLoading;

  if (loading) return (
    <View style={HomeStyles.loading}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Image source={require('../../../assets/iibs-logo.png')} style={{ width: 100, height: 100, marginTop: 20 }}/>
      <Text style={HomeStyles.loadingText}>Chargement des données...</Text>
    </View>
  );
  
  return (
    <View style={HomeStyles.container}>
      <TopNavBar/>
      
      <ScrollView 
        style={HomeStyles.scrollView}
        contentContainerStyle={HomeStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={HomeStyles.headerSection}>
          <Text style={HomeStyles.welcomeText}>Accueil</Text>
          <Text style={HomeStyles.dateText}>Aujourd'hui • {todayDayName} {todayStr}</Text>
          
          {/* Location Status Indicator */}
          <View style={HomeStyles.locationStatus}>
            <Text style={[
              HomeStyles.locationStatusText, 
              { color: isNearSchool ? '#4CAF50' : '#F44336' }
            ]}>
              {locationPermissionGranted 
                ? (isNearSchool ? '📍 Sur le campus' : '📍 Hors campus') 
                : '📍 Permission requise'
              }
            </Text>
          </View>
        </View>

        {/* Modern Hero Section with School Image */}
        <View style={{
          position: 'relative',
          borderRadius: 25,
          overflow: 'hidden',
          elevation: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        }}>
          {/* Background Gradient Overlay */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 2,
          }} />
          
          {/* School Image as Background */}
          <Image 
            source={require('../../../assets/school.png')} 
            style={{
              width: screenWidth * 1.1,
              height: 480,
              borderRadius: 25,
            }}
            resizeMode="cover"
          />
          
          {/* Content Overlay */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 25,
            zIndex: 3,
          }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 20,
              padding: 20,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                IIBS Campus
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                marginBottom: 15,
              }}>
                Institut Informatique Business School
              </Text>
              
              {/* Quick Stats Row */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginTop: 10,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>
                    {todayCourses.length}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Cours
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4CAF50' }}>
                    {matieres.length}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Matières
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: isNearSchool ? '#4CAF50' : '#FF9800' 
                  }}>
                    {isNearSchool ? '📍' : '🚶'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {isNearSchool ? 'Campus' : 'Hors Campus'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {nextCourse && (
          <View style={eStyles.nextCourseContainer}>
            <Text style={eStyles.sectionTitle}>Prochain cours</Text>
            <View style={eStyles.nextCourseCard}>
              <Image 
                source={require('../../../assets/classroom.jpg')} 
                style={eStyles.classroomImage}
                resizeMode="cover"
              />
              <View style={eStyles.nextCourseInfo}>
                <Text style={eStyles.nextCourseTitle}>{nextCourse.matiere_libelle}</Text>
                <Text style={eStyles.nextCourseText}>{nextCourse.enseignant}</Text>
                <Text style={eStyles.nextCourseText}>{nextCourse.start} - {nextCourse.end}</Text>
                <Text style={eStyles.nextCourseText}>{nextCourse.salle}</Text>
                <Text style={eStyles.nextCourseDay}>{nextCourse.day}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today Courses Section */}
        {todayCourses.length > 0 && (
          <View>
            <View style={[Cstyles.badgeContainer, HomeStyles.modernBadge]}>
              <View style={HomeStyles.badgeIcon}>
                <Text style={HomeStyles.badgeIconText}>🕐</Text>
              </View>
              <Text style={[Cstyles.badgeText, HomeStyles.badgeTextModern]}>Emargement Cours du jour</Text>
              <View style={HomeStyles.badgeCount}>
                <Text style={HomeStyles.badgeCountText}>{todayCourses.length}</Text>
              </View>
            </View>

            <View style={HomeStyles.courseGrid}>
              {todayCourses.map((item: any, index: any) => {
                const buttonStatus = getEmargerButtonStatus(item.matiere_id, item.end, item.start);
                
                return (
                  <View key={`${item.matiere_id}-${index}`} style={[
                    Cstyles.squareCard, 
                    HomeStyles.courseCard,
                    index % 2 === 0 ? HomeStyles.courseCardLeft : HomeStyles.courseCardRight
                  ]}>
                    <View style={HomeStyles.courseHeader}>
                      <Text style={HomeStyles.courseIcon}>🎓</Text>
                      <Text style={[Cstyles.courseTitle, HomeStyles.modernCourseTitle]}>
                        {item.matiere_libelle}
                      </Text>
                    </View>
                    
                    <View style={HomeStyles.courseInfo}>
                      <Text style={[Cstyles.courseText, HomeStyles.modernCourseText]}>
                        👨‍🏫 {item.enseignant}
                      </Text>
                      <Text style={[Cstyles.courseSubtitle, HomeStyles.modernCourseSubtitle]}>
                        🕐 {item.start} - {item.end}
                      </Text>
                      <Text style={[Cstyles.courseSubtitle, HomeStyles.modernCourseSubtitle]}>
                        🏫 {item.salle}
                      </Text>
                    </View>
                    
                   <TouchableOpacity
                      style={buttonStatus.style}
                      onPress={() => handleEmargerPress(item.matiere_id, item.end, item.matiere_libelle, item)}
                    >
                      <Text style={buttonStatus.textStyle}>
                        {!locationPermissionGranted 
                          ? 'Permission requise 📍' 
                          : !isNearSchool 
                            ? 'Aller à l\'école! 🏫' 
                            : buttonStatus.text
                        }
                      </Text>
                    </TouchableOpacity>
                    
                    {(() => {
                      const status = getCoursStatus(item.start, item.end);
                      return (
                        <Text
                          style={
                            status.type == 'warning'
                              ? HomeStyles.statusWarning
                              : status.type == 'primary'
                              ? HomeStyles.statusPrimary
                              : HomeStyles.statusSuccess
                          }
                        >
                          {status.label}
                        </Text>
                      );
                    })()}
                    {/* 
                    <TouchableOpacity 
                      style={[HomeStyles.qrButton]}
                      onPress={() => goToQRCode(item.matiere_id, item.matiere_libelle)}
                    >
                      <Text style={HomeStyles.qrButtonText}>
                        📱 Afficher QR
                      </Text>
                    </TouchableOpacity>
                    */}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Show message if no courses today */}
        {todayCourses.length === 0 && (
          <View style={HomeStyles.sectionContainer}>
            <View style={[Cstyles.badgeContainer, HomeStyles.modernBadge]}>
              <View style={HomeStyles.badgeIcon}>
                <Text style={HomeStyles.badgeIconText}>🕐</Text>
              </View>
              <Text style={[Cstyles.badgeText, HomeStyles.badgeTextModern]}>Cours du jour</Text>
              <View style={HomeStyles.badgeCount}>
                <Text style={HomeStyles.badgeCountText}>0</Text>
              </View>
            </View>

            <View style={HomeStyles.emptyState}>
              <Text style={HomeStyles.emptyIcon}>📅</Text>
              <Text style={HomeStyles.emptyText}>Aucun cours aujourd'hui</Text>
              <Text style={HomeStyles.emptySubtext}>Profitez de votre journée libre!</Text>
            </View>
          </View>
        )}

        {/* Matières Section */}
        <View style={HomeStyles.sectionContainer}>
          <View style={[Cstyles.badgeContainer, HomeStyles.modernBadge]}>
            <View style={HomeStyles.badgeIcon}>
              <Text style={HomeStyles.badgeIconText}>📚</Text>
            </View>
            <Text style={[Cstyles.badgeText, HomeStyles.badgeTextModern]}>Mes Matières</Text>
            <View style={HomeStyles.badgeCount}>
              <Text style={HomeStyles.badgeCountText}>{matieres.length}</Text>
            </View>
          </View>
          
          {matieres.length > 0 ? (
            <View>
              {matieres.map((item) => (
                <View key={item.id} style={HomeStyles.matiereCard}>
                  <View style={HomeStyles.matiereHeader}>
                    <View style={HomeStyles.matiereIconContainer}>
                      <Text style={HomeStyles.matiereIcon}>📖</Text>
                    </View>
                    <View style={HomeStyles.matiereContent}>
                      <Text style={HomeStyles.matiereTitle}>{item.title}</Text>
                      <Text style={HomeStyles.professeurText}>👨‍🏫 {item.professeurFullName}</Text>
                    </View>
                    <View style={HomeStyles.matiereArrow}>
                      <Text style={HomeStyles.arrowText}>›</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={HomeStyles.emptyState}>
              <Text style={HomeStyles.emptyIcon}>📚</Text>
              <Text style={HomeStyles.emptyText}>Aucune matière trouvée</Text>
              <Text style={HomeStyles.emptySubtext}>Vos matières apparaîtront ici</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <BottomNavBar activeScreen="Home"/>
    </View>
  );
}