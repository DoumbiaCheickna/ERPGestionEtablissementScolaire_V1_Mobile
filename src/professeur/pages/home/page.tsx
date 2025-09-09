import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Linking, Platform, Dimensions, Button } from 'react-native';
import TopNavBar from '../../../components/layout/topBar';
import BottomNavBar from '../../../components/layout/bottomBar';
import { theme } from '../../../styles/globalStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { useProfesseurMatieres } from '../../../components/hooks/matieresProfesseur';
import { Slot, useProfesseurCourses } from '../../../components/hooks/coursProfesseur'; 
import { Cstyles } from '../allCourses/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { HomeStyles } from "./styles";
import { styles as eStyles } from '../allCourses/styles'
import { db } from '../../../firebaseConfig';
import { MatieresStyles } from '../enseignments/styles';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import LottieView from 'lottie-react-native';

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

type Props = NativeStackScreenProps<RootStackParamList, 'HomeProfesseur'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeProfesseur({ navigation }: Props) {

  const { matieres, loading: matieresLoading, refreshMatieres, userDocId } = useProfesseurMatieres();
  const { coursesByDay, loading: coursesLoading, refreshCourses } = useProfesseurCourses(); 
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isNearSchool, setIsNearSchool] = useState(false);
  const [nextCourse, setNextCourse] = useState<Slot | null>(null);
  const [unavailableCourses, setUnavailableCourses] = useState<Set<string>>(new Set());
  const [professorName, setProfessorName] = useState('');

  const refreshData = () => {
    refreshCourses();
    refreshMatieres();
  }

  const SCHOOL_COORDINATES = {
    latitude: 14.717022,
    longitude: -17.4674526,
    radius: 40
  };

  useEffect(() => {
    const initApp = async () => {
      await getProfessorInfo();
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

  // Find next course
  useEffect(() => {
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
  }, [coursesByDay, coursesLoading]);

  useEffect(() => {
    if (!locationPermissionGranted) return;

    let locationInterval: ReturnType<typeof setInterval>;

    const updateLocationInterval = () => {
      if (locationInterval) clearInterval(locationInterval);

      locationInterval = setInterval(() => {
        getCurrentLocation();
      }, 10 * 60 * 1000); // Check every 10 minutes for professors

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
      'La permission de localisation est recommandée pour vérifier que vous êtes sur le campus IIBS.',
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
          text: 'Continuer sans',
          style: 'cancel'
        }
      ]
    );
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      checkIfNearSchool(latitude, longitude);
    } catch (error) {
      setIsNearSchool(false);
    }
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

  const getProfessorInfo = async () => {
    try {
      const userLogin = await AsyncStorage.getItem('userLogin');
      if (!userLogin) return;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('login', '==', userLogin));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const fullName = userData.nom && userData.prenom 
          ? `${userData.prenom} ${userData.nom}` 
          : userData.nom || userData.prenom || 'Professeur';
        setProfessorName(fullName);
      }
    } catch (error) {
      console.error('Error getting professor info:', error);
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

  const getCourseKey = (course: Slot) => {
    return `${course.matiere_id}-${course.class_id}-${course.start}-${course.end}`;
  };

  const handleIndisponiblePress = async (course: Slot) => {
    const courseKey = getCourseKey(course);
    
    if (unavailableCourses.has(courseKey)) {
      Alert.alert('Information', 'Vous avez déjà marqué ce cours comme indisponible.');
      return;
    }

    Alert.alert(
      'Confirmer indisponibilité',
      `Voulez-vous vraiment marquer le cours "${course.matiere_libelle}" comme indisponible?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Confirmer',
          onPress: () => markCourseUnavailable(course, courseKey),
          style: 'destructive'
        }
      ]
    );
  };

  const markCourseUnavailable = async (course: Slot, courseKey: string) => {
    try {
      if (!userDocId) return;

      const userDocRef = doc(db, 'users', userDocId);
      const today = new Date().toDateString();
      
      const indisponibiliteRecord = {
        type: 'indisponibilite',
        matiere_id: course.matiere_id,
        class_id: course.class_id,
        date: today,
        start: course.start,
        end: course.end,
        salle: course.salle,
        matiere_libelle: course.matiere_libelle,
        timestamp: new Date().toISOString()
      };

      await updateDoc(userDocRef, {
        indisponibilites: arrayUnion(indisponibiliteRecord)
      });

      setUnavailableCourses(prev => new Set(prev).add(courseKey));
      
      Alert.alert('Succès', 'Cours marqué comme indisponible avec succès.');
    } catch (error) {
      console.error('Error marking course unavailable:', error);
      Alert.alert('Erreur', 'Impossible de marquer le cours comme indisponible.');
    }
  };

  const getIndisponibleButtonStatus = (course: Slot, endTime: string, startTime: string) => {
    const courseKey = getCourseKey(course);
    const isAlreadyUnavailable = unavailableCourses.has(courseKey);
    const isTimeExpired = isCourseTimeExpired(endTime);
    const isNotStarted = isCourseNotStarted(startTime);
    
    if (isAlreadyUnavailable) return { 
      text: '❌ Indisponible', 
      style: HomeStyles.absentButton, 
      textStyle: HomeStyles.absentButtonText, 
      disabled: true 
    };
    
    if (isTimeExpired) return { 
      text: 'Terminé', 
      style: HomeStyles.expiredButton, 
      textStyle: HomeStyles.expiredButtonText, 
      disabled: true 
    };
    
    return { 
      text: '❌ Indisponible', 
      style: [HomeStyles.modernEmargerButton, { backgroundColor: '#FF5722' }], 
      textStyle: [Cstyles.emargerButtonText, HomeStyles.emargerButtonTextModern], 
      disabled: false 
    };
  };
  

  const goToQRCode = (matiereId: string, courseLibelle: string) => {
    if (!matiereId) return Alert.alert('Erreur', 'ID du cours manquant');
    navigation.navigate('QRCodeScreen', { matiereId, courseLibelle });
  };

  {/* 
  const goToStudentList = (matiereId: string, courseLibelle: string, classId: string) => {
    if (!matiereId || !classId) return Alert.alert('Erreur', 'Informations du cours manquantes');
    // Navigate to student list for this course/class
    navigation.navigate('StudentList', { matiereId, courseLibelle, classId });
  };

  */}
  const loading = matieresLoading || coursesLoading;

  if (loading) return (
    <View style={HomeStyles.loading}>
       <LottieView
          source={require('../../../assets/Book loading.json')}
          autoPlay
          loop={true}
          style={{ width: 170, height: 170 }}
        />
      <Image 
        source={require('../../../assets/logo8.png')} 
        style={{ width: 250, height: 250, marginTop: -50 }}
        resizeMode="contain"
      />
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
          <Text style={HomeStyles.welcomeText}>Accueil Professeur</Text>
          <Text style={HomeStyles.dateText}>Aujourd'hui • {todayDayName} {todayStr}</Text>
          <Text style={HomeStyles.professorName}>Bienvenue, M. {professorName}</Text>
          
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
                IIBS Campus - Espace Professeur
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
                    {isNearSchool ? '🏫' : '🏠'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {isNearSchool ? 'Campus' : 'À distance'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

         <TouchableOpacity 
            style={MatieresStyles.refreshButton}
            onPress={refreshData}
            activeOpacity={0.7}
          >
            <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser Les données</Text>
          </TouchableOpacity>

        {nextCourse && (
          <View style={eStyles.nextCourseContainer}>
            <View style={MatieresStyles.badgeContainer}>
                <View style={MatieresStyles.badgeIcon}>
                  <Text style={MatieresStyles.badgeIconText}>👨‍🏫</Text>
                </View>
                <Text style={MatieresStyles.badgeText}>Prochain Cours</Text>
                <View style={MatieresStyles.badgeCount}>
                  <Text style={MatieresStyles.badgeCountText}>1</Text>
                </View>
            </View>
            <View style={eStyles.nextCourseCard}>
              <Image 
                source={require('../../../assets/classroom.jpg')} 
                style={eStyles.classroomImage}
                resizeMode="cover"
              />
              <View style={eStyles.nextCourseInfo}>
                <Text style={eStyles.nextCourseTitle}>{nextCourse.matiere_libelle}</Text>
                <Text style={eStyles.nextCourseText}>Classe: {nextCourse.classe_libelle}</Text>
                <Text style={eStyles.nextCourseText}>{nextCourse.start} - {nextCourse.end}</Text>
                <Text style={eStyles.nextCourseText}>{nextCourse.salle}</Text>
                <Text style={eStyles.nextCourseDay}>{nextCourse.day}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={MatieresStyles.sectionHeader}>
          <View style={MatieresStyles.badgeContainer}>
            <View style={MatieresStyles.badgeIcon}>
              <Text style={MatieresStyles.badgeIconText}>👨‍🏫</Text>
            </View>
            <Text style={MatieresStyles.badgeText}>Mes Cours du Jour</Text>
            <View style={MatieresStyles.badgeCount}>
              <Text style={MatieresStyles.badgeCountText}>{todayCourses.length}</Text>
            </View>
          </View>
        </View>
          
        {/* Today Courses Section */}
        {todayCourses.length > 0 && (
          <View style={HomeStyles.courseGrid}>
            {todayCourses.map((item: any, index: number) => {
              const buttonStatus = getIndisponibleButtonStatus(item, item.end, item.start);
              const coursStatus = getCoursStatus(item.start, item.end);

              return (
                <View 
                  key={`${item.matiere_id}-${item.class_id}-${index}`} 
                  style={[
                    MatieresStyles.matiereCard,
                    index % 2 === 0 ? MatieresStyles.matiereCardLeft : MatieresStyles.matiereCardRight
                  ]}
                >
                  {/* Card Header */}
                  <View style={MatieresStyles.cardHeader}>
                    <View style={MatieresStyles.matiereIconContainer}>
                      <Text style={MatieresStyles.matiereIcon}>👨‍🏫</Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={MatieresStyles.cardContent}>
                    <Text style={MatieresStyles.matiereTitle} numberOfLines={2}>
                      {item.matiere_libelle}
                    </Text>

                    <View style={MatieresStyles.professorInfo}>
                      <Text style={MatieresStyles.professorIcon}>🎓</Text>
                      <Text style={MatieresStyles.professorName} numberOfLines={1}>
                        {item.classe_libelle}
                      </Text>
                    </View>

                    {/* Schedule */}
                    <View style={MatieresStyles.matiereStats}>
                      <View style={MatieresStyles.statChip}>
                        <Text style={MatieresStyles.statChipText}>🕐 {item.start} - {item.end}</Text>
                      </View>
                      <View style={[MatieresStyles.statChip, MatieresStyles.todayChip]}>
                        <Text style={[MatieresStyles.statChipText, MatieresStyles.todayChipText]}>
                          📍 {item.salle}
                        </Text>
                      </View>
                    </View>

                    

                    <TouchableOpacity
                      style={buttonStatus.style}
                      onPress={() => handleIndisponiblePress(item)}
                      disabled={buttonStatus.disabled}
                    >
                      <Text style={buttonStatus.textStyle}>
                        {buttonStatus.text}
                      </Text>
                    </TouchableOpacity>

                    {/* Status label */}
                    <Text
                      style={
                        coursStatus.type == 'warning'
                          ? HomeStyles.statusWarning
                          : coursStatus.type == 'primary'
                          ? HomeStyles.statusPrimary
                          : HomeStyles.statusSuccess
                      }
                    >
                      {coursStatus.label}
                    </Text>
                  </View>

                  {/* Card Footer 
                  <View style={MatieresStyles.cardFooter}>
                    <TouchableOpacity 
                      style={MatieresStyles.viewCoursesButton}
                      onPress={() => goToStudentList(item.matiere_id, item.matiere_libelle, item.class_id)}
                    >
                      <Text style={MatieresStyles.viewCoursesText}>Voir Étudiants</Text>
                      <Text style={MatieresStyles.arrowIcon}>→</Text>
                    </TouchableOpacity>
                  </View>
                  */}
                </View>
              );
            })}
          </View>
        )}

        {/* Show message if no courses today */}
        {todayCourses.length === 0 && (
          <View style={HomeStyles.sectionContainer}>
            <View style={HomeStyles.emptyState}>
              <Text style={HomeStyles.emptyIcon}>📅</Text>
              <Text style={HomeStyles.emptyText}>Aucun cours aujourd'hui</Text>
              <Text style={HomeStyles.emptySubtext}>Profitez de votre journée libre!</Text>
            </View>
          </View>
        )}

      </ScrollView>

      <BottomNavBar activeScreen="HomeStudent"/>
    </View>
  );
}