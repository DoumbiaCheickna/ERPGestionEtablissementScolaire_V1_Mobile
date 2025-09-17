import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Linking, Platform, Dimensions, Button, Modal, FlatList } from 'react-native';
import TopNavBar from '../../../components/layout/topBar';
import BottomNavBar from '../../../components/layout/bottomBar';
import { theme } from '../../../styles/globalStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { useStudentMatieres } from '../../../components/hooks/matieresStudent';
import { Slot, useStudentCourses } from '../../../components/hooks/coursStudent'; 
import { Cstyles } from '../allCourses/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { HomeStyles } from "./styles";
import { styles as eStyles } from '../allCourses/styles'
import { db, getUserSnapchot } from '../../../firebaseConfig';
import { MatieresStyles } from '../matieres/styles';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';

// Interface for course records with matricule
interface CourseRecord {
  matiere_id: string;
  matricule: string;
}

interface ClassOption {
  id: string;
  label: string;
  value: string;
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

type Props = NativeStackScreenProps<RootStackParamList, 'HomeStudent'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeStudent({ navigation }: Props) {
  // Class selector states
  const [selectedClasseId, setSelectedClasseId] = useState<string>('');
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const { matieres, loading: matieresLoading, refreshUserMatieres } = useStudentMatieres();
  const { coursesByDay, loading: coursesLoading, refreshCourses } = useStudentCourses(); 
  const [emargedCourses, setEmargedCourses] = useState<CourseRecord[]>([]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isNearSchool, setIsNearSchool] = useState(false);
  const [userMatricule, setUserMatricule] = useState('');
  const [nextCourse, setNextCourse] = useState<Slot | null>(null);
  const [courseAbsenceStatus, setCourseAbsenceStatus] = useState<Record<string, boolean>>({});
  const [courseEmargedStatus, setCourseEmargedStatus] = useState<Record<string, boolean>>({});

  const [isRefreshing, setIsRefreshing] = useState(false);


  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshCourses(),
        refreshUserMatieres()
      ]);
      
    } catch (error) {
      // Show error alert once
      Alert.alert('Erreur', 'Échec de l\'actualisation des données', [
        { text: 'OK', style: 'default' }
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const SCHOOL_COORDINATES = {
    latitude: 14.717022,
    longitude: -17.4674526,
    radius: 40
  };

  // Load available classes from AsyncStorage and get class labels
  const loadAvailableClasses = async () => {
    try {
      const classe_id = await AsyncStorage.getItem('classe_id');
      const classe2_id = await AsyncStorage.getItem('classe2_id');
      
      const classes: ClassOption[] = [];
      
      if (classe_id && classe_id.trim() !== '') {
        // Get class label from Firestore
        const classeLabel = await getClassLabel(classe_id);
        classes.push({
          id: 'classe1',
          label: classeLabel || 'Classe Principale',
          value: classe_id
        });
      }
      
      if (classe2_id && classe2_id.trim() !== '') {
        // Get class label from Firestore
        const classe2Label = await getClassLabel(classe2_id);
        classes.push({
          id: 'classe2',
          label: classe2Label || 'Classe Secondaire',
          value: classe2_id
        });
      }

      setAvailableClasses(classes);
      
      // Load saved preference or set default
      const savedPreference = await AsyncStorage.getItem('active_classe_id');
      if (savedPreference && classes.some(c => c.value == savedPreference)) {
        setSelectedClasseId(savedPreference);
      } else if (classes.length > 0) {
        // Set default to first available class (not 'all')
        const firstClass = classes.find(c => c.value !== 'all') || classes[0];
        setSelectedClasseId(firstClass.value);
        await AsyncStorage.setItem('active_classe_id', firstClass.value);
      }

    } catch (error) {
      console.error('Error loading classes from storage:', error);
    }
  };

  
  // Get class label from Firestore
  const getClassLabel = async (classeId: string): Promise<string> => {
    try {
      const classeDocRef = doc(db, 'classes', classeId);
      const classeDoc = await getDoc(classeDocRef);
      
      if (classeDoc.exists()) {
        const classeData = classeDoc.data();
        return classeData.libelle || classeId;
      }
      return classeId;
    } catch (error) {
      console.error('Error fetching class label:', error);
      return classeId;
    }
  };

  const handleClassSelection = async (classOption: ClassOption) => {
    setSelectedClasseId(classOption.value);
    setModalVisible(false);
    
    // Store the selected class preference and clear previous selection
    try {
      // Clear previous selection
      await AsyncStorage.removeItem('active_classe_id');
      
      // Set new selection
      await AsyncStorage.setItem('active_classe_id', classOption.value);
      
      // Refresh data based on selected class
      const activeClass: any = await AsyncStorage.getItem('active_classe_id');

      if(activeClass == classOption.value) {
        refreshData();
      }
    } catch (error) {
      console.error('Error saving class preference:', error);
    }
  };

  const getSelectedClassLabel = () => {
    const selectedClass = availableClasses.find(cls => cls.value === selectedClasseId);
    return selectedClass ? selectedClass.label : 'Sélectionner une classe';
  };

  // Filter courses based on selected class
  const getFilteredCourses = () => {
    const todayDayName = dayNames[today.getDay()];
    const todayCoursesAll = coursesByDay.filter((d: any) => d.title == todayDayName).flatMap((d: any) => d.data) || [];
    
    if (selectedClasseId == 'all') {
      return todayCoursesAll;
    } else {
      // You might need to modify your course data structure to include class_id
      // For now, we'll filter based on the selected class
      return todayCoursesAll; // This should be filtered by class_id once available
    }
  };

  useEffect(() => {
    const initApp = async () => {
      await getMatricule();
      await loadAvailableClasses();
      await requestLocationPermission();
    };
    
    initApp();
  }, []);

  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const todayDayName = dayNames[today.getDay()];
  const currentTime = today.getHours() * 60 + today.getMinutes();
  const todayStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
  
  // Use filtered courses instead of all today courses
  const todayCourses = getFilteredCourses();


  // ... rest of your existing useEffect hooks and functions remain the same ...
  
  // Check for expired courses and mark as absent
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
        
        const nextDayCourses = getFilteredCourses(); // You might need to modify this for next day
        
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

  }, [coursesByDay, emargedCourses, coursesLoading, userMatricule, selectedClasseId]);

  useEffect(() => {
    if (!locationPermissionGranted) return;

    let locationInterval: ReturnType<typeof setInterval> | null = null;

    const startLocationTracking = () => {
      if (locationInterval) clearInterval(locationInterval);
      
      const currentCourse = getCurrentCourse();
      const intervalTime = currentCourse ? 5 * 60 * 1000 : 15 * 60 * 1000;
      
      locationInterval = setInterval(() => {
        getCurrentLocationSilent(); 
      }, intervalTime);

      // Run once immediately
      getCurrentLocationSilent();
    };

    startLocationTracking();

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [locationPermissionGranted, todayCourses, nextCourse]);

  useEffect(() => {
    const loadAbsenceStatus = async () => {
      if (!userMatricule || todayCourses.length === 0) return;

      const statusMap: Record<string, boolean> = {};
      
      for (const course of todayCourses) {
        try {
          const isAbsent = await isStudentAbsentForCourse(course.matiere_id);
          statusMap[course.matiere_id] = isAbsent;
        } catch (error) {
          console.error(`Error checking absence for course ${course.matiere_id}:`, error);
          statusMap[course.matiere_id] = false;
        }
      }
      
      setCourseAbsenceStatus(statusMap);
    };

    const loadPresenceStatus = async () => {
      if (!userMatricule || todayCourses.length === 0) return;

      const statusMap: Record<string, boolean> = {};
      
      for (const course of todayCourses) {
        try {
          const isPresent = await isStudentEmargedForCourse(course.matiere_id);
          statusMap[course.matiere_id] = isPresent;
        } catch (error) {
          console.error(`Error checking presence for course ${course.matiere_id}:`, error);
          statusMap[course.matiere_id] = false;
        }
      }
      setCourseEmargedStatus(statusMap);
    };

    loadPresenceStatus();
    loadAbsenceStatus();
  }, [userMatricule, todayCourses]);

  // All your existing functions remain the same...
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
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Highest,
        timeInterval: 10000,
      });
      const { latitude, longitude } = location.coords;
      checkIfNearSchool(latitude, longitude);
    } catch (error) {
      setIsNearSchool(false);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation. Veuillez réessayer.');
    }
  };


  const getCurrentLocationSilent = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({ 
      accuracy: Location.Accuracy.Balanced, 
      timeInterval: 5000, 
    });
    const { latitude, longitude } = location.coords;
    checkIfNearSchool(latitude, longitude);
  } catch (error) {
    setIsNearSchool(false);
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

  const isStudentEmargedForCourse = async (matiereId: string): Promise<boolean> => {
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

  const isStudentAbsentForCourse = async (matiereId: string): Promise<boolean> => {
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

  const isStudentEmargedForCourseSync = (matiereId: string): boolean => {
    return courseEmargedStatus[matiereId] || false;
  };
  
  const isStudentAbsentForCourseSync = (matiereId: string): boolean => {
    return courseAbsenceStatus[matiereId] || false;
  };

  // Save emarged course with matricule
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
    const isAlreadyEmarged = isStudentEmargedForCourseSync(matiereId);
    const isTimeExpired = isCourseTimeExpired(endTime);
    return !isAlreadyEmarged && !isTimeExpired;
  };

  const getEmargerButtonStatus = (matiereId: string, endTime: string, startTime: string, indisponible: number) => {
    if (!userMatricule) {
      return { 
        text: 'Chargement...', 
        style: HomeStyles.expiredButton, 
        textStyle: HomeStyles.expiredButtonText, 
        disabled: true 
      };
    }

    const isAvailable = indisponible != 1
    const isAlreadyEmarged = isStudentEmargedForCourseSync(matiereId);
    const isAbsent = isStudentAbsentForCourseSync(matiereId); // Use sync version
    const isTimeExpired = isCourseTimeExpired(endTime);
    const isNotStarted = isCourseNotStarted(startTime);

    if (!isAvailable) return {
      text: 'Cours Indisponible',
      style: HomeStyles.expiredButton,
      textStyle: HomeStyles.expiredButtonText,
      disabled: true
    };
    
    if (isAlreadyEmarged) return { 
      text: '✓ Émargé', 
      style: HomeStyles.emargedButton, 
      textStyle: HomeStyles.emargedButtonText, 
      disabled: true 
    };
    if (isAbsent && isTimeExpired) return { 
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
    
    if (isTimeExpired && !isAbsent) return { 
      text: 'Expiré', 
      style: HomeStyles.expiredButton, 
      textStyle: HomeStyles.expiredButtonText, 
      disabled: true 
    };
    
    return { 
      text: '✓ Emarger', 
      style: [HomeStyles.modernEmargerButton], 
      textStyle: [Cstyles.emargerButtonText, HomeStyles.emargerButtonTextModern], 
      disabled: false 
    };
  };

  const handleEmargerPress = async (matiereId: string, endTime: string, courseLibelle: string, course: any, startTime: string) => {
    if (!locationPermissionGranted) {
      Alert.alert('Permission requise', 'Veuillez accorder la permission de localisation pour continuer.', [{ text: 'Accorder permission', onPress: () => requestLocationPermission() }]);
      return;
    }
    if (!isNearSchool) {
      Alert.alert('Localisation requise', 'Vous devez être sur le campus de l\'école pour émarger ! 📍', [{ text: 'Vérifier à nouveau', onPress: () => getCurrentLocation() }, { text: 'OK', style: 'cancel' }]);
      return;
    }
    if (!canEmarger(matiereId, endTime)) {
      Alert.alert('Information', isStudentEmargedForCourseSync(matiereId) ? 'Vous avez déjà émargé pour ce cours aujourd\'hui.' : 'Le temps d\'émargement pour ce cours est expiré.');
      return;
    }

    // Navigate to scanner with success callback and course information
    navigation.navigate('Scanner', { 
      matiereId, 
      courseLibelle,
      // Pass additional course information for the modal
      courseInfo: {
        start: course.start,
        end: course.end,
        enseignant: course.enseignant,
        class_ids: course.class_ids,
        classes: course.classes,
        salle: course.salle
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
          <Text style={HomeStyles.welcomeText}>Accueil</Text>
          <Text style={HomeStyles.dateText}>Aujourd'hui • {todayDayName} {todayStr}</Text>
          
          {availableClasses.length > 0 && (
              <TouchableOpacity 
                style={HomeStyles.classSelector}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={HomeStyles.classSelectorContent}>
                  <Text style={HomeStyles.classSelectorLabel}>Classe:</Text>
                  <Text style={HomeStyles.classSelectorValue} numberOfLines={1}>
                    {getSelectedClassLabel()}
                  </Text>
                  <Text style={HomeStyles.classSelectorIcon}>▼</Text>
                </View>
              </TouchableOpacity>
            )}

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

        {/* Class Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={HomeStyles.modalOverlay}>
            <View style={HomeStyles.modalContent}>
              <Text style={HomeStyles.modalTitle}>Sélectionner une classe</Text>
              
              <FlatList
                data={availableClasses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      HomeStyles.modalItem,
                      selectedClasseId === item.value && HomeStyles.modalItemSelected
                    ]}
                    onPress={() => handleClassSelection(item)}
                  >
                    <Text style={[
                      HomeStyles.modalItemText,
                      selectedClasseId === item.value && HomeStyles.modalItemTextSelected
                    ]}>
                      {item.label}
                    </Text>
                    {selectedClasseId === item.value && (
                      <Text style={HomeStyles.modalItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
              
              <TouchableOpacity
                style={HomeStyles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={HomeStyles.modalCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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

         <TouchableOpacity 
            style={[
              MatieresStyles.refreshButton,
              isRefreshing && { opacity: 0.6 }
            ]}
            onPress={refreshData}
            activeOpacity={0.7}
            disabled={isRefreshing}
          >
            <Text style={MatieresStyles.refreshButtonText}>
              {isRefreshing ? '🔄 Actualisation...' : '🔄 Actualiser Les données'}
            </Text>
          </TouchableOpacity>

        {nextCourse && (
          <View style={eStyles.nextCourseContainer}>
            <View style={MatieresStyles.badgeContainer}>
                <View style={MatieresStyles.badgeIcon}>
                  <Text style={MatieresStyles.badgeIconText}>📖</Text>
                </View>
                <Text style={MatieresStyles.badgeText}>Prochain Cours</Text>
                <View style={MatieresStyles.badgeCount}>
                  <Text style={MatieresStyles.badgeCountText}>{matieres.length}</Text>
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
                <Text style={eStyles.nextCourseText}>{nextCourse.enseignant}</Text>
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
              <Text style={MatieresStyles.badgeIconText}>📖</Text>
            </View>
            <Text style={MatieresStyles.badgeText}>Mes Cours du Jour</Text>
            <View style={MatieresStyles.badgeCount}>
              <Text style={MatieresStyles.badgeCountText}>{matieres.length}</Text>
            </View>
          </View>
        </View>
          
        {/* Today Courses Section */}
        {todayCourses.length > 0 && (
          <View style={HomeStyles.courseGrid}>
            {todayCourses.map((item: any, index: number) => {
              const buttonStatus = getEmargerButtonStatus(item.matiere_id, item.end, item.start, item.indisponible);
              const coursStatus = getCoursStatus(item.start, item.end);

              return (
                
                <View 
                  key={`${item.matiere_id}-${index}`} 
                  style={[
                    MatieresStyles.matiereCard,
                    index % 2 === 0 ? MatieresStyles.matiereCardLeft : MatieresStyles.matiereCardRight
                  ]}
                >
                  {/* Card Header */}
                  <View style={MatieresStyles.cardHeader}>
                    <View style={MatieresStyles.matiereIconContainer}>
                      <Text style={MatieresStyles.matiereIcon}>🎓</Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={MatieresStyles.cardContent}>
                    <Text style={MatieresStyles.matiereTitle} numberOfLines={2}>
                      {item.matiere_libelle}
                    </Text>

                    <View style={MatieresStyles.professorInfo}>
                      <Text style={MatieresStyles.professorIcon}>👨‍🏫</Text>
                      <Text style={MatieresStyles.professorName} numberOfLines={1}>
                        {item.enseignant}
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
                    onPress={() =>
                      handleEmargerPress(
                        item.matiere_id,
                        item.end,
                        item.matiere_libelle,
                        item,
                        item.start
                      )
                    }
                    disabled={
                      buttonStatus.disabled ||
                      !locationPermissionGranted ||
                      !isNearSchool
                    }
                  >
                      <Text style={buttonStatus.textStyle}>
                        {!locationPermissionGranted
                          ? 'Permission requise 📍'
                          : !isNearSchool
                            ? "Aller à l'école! 🏫"
                            : buttonStatus.text}
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

                  {/* Card Footer */}
                  <View style={MatieresStyles.cardFooter}>
                    <TouchableOpacity 
                      style={MatieresStyles.viewCoursesButton}
                      onPress={() => goToQRCode(item.matiere_id, item.matiere_libelle)}
                    >
                      <Text style={MatieresStyles.viewCoursesText}>Afficher QR</Text>
                      <Text style={MatieresStyles.arrowIcon}>→</Text>
                    </TouchableOpacity>
                  </View>
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