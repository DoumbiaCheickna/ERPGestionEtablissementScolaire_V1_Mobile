import React, { useState, useEffect } from 'react';
import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import TopNavBar from '../../../components/layout/topBar';
import BottomNavBar from '../../../components/layout/bottomBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { useProfesseurMatieres } from '../../../components/hooks/matieresProfesseur';
import { Slot, useProfesseurCourses } from '../../../components/hooks/coursProfesseur'; 
import { Cstyles } from '../allCourses/styles';
import { saveData, getData, deleteData, clearAllData } from '../../../components/utils/secureStorage';
import { HomeStyles } from "./styles";
import { styles as eStyles } from '../allCourses/styles'
import { db } from '../../../firebaseConfig';
import { MatieresStyles } from '../enseignments/styles';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import CahierTexteModal from '../../../components/modals/CahierTexteModal';
import {
  getCoursStatus,
  requestLocationPermission,
  handleLocationPermissionDenied,
  checkIfNearSchool,
  isCourseTimeExpired,
  isCourseNotStarted,
  isProfesseurEmargedForCourse,
  getTodayInfo,
  findNextCourse
} from '../../../components/utils/sharedHomeUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeProfesseur'>;

const { width: screenWidth } = Dimensions.get('window');

export default function HomeProfesseur({ navigation }: Props) {
  const { matieres, loading: matieresLoading, refreshMatieres, userDocId } = useProfesseurMatieres();
  const { coursesByDay, loading: coursesLoading, refreshCourses } = useProfesseurCourses(); 
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isNearSchool, setIsNearSchool] = useState(false);
  const [nextCourse, setNextCourse] = useState<Slot | null>(null);
  const [professorName, setProfessorName] = useState('');
  const [courseEmargedStatus, setCourseEmargedStatus] = useState<Record<string, boolean>>({});
  const [cahierTexteModalVisible, setCahierTexteModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const refreshData = () => {
    refreshCourses();
    refreshMatieres();
  };

  const isCourseTimePassed = (endTime: string): boolean => {
    return isCourseTimeExpired(endTime);
  };

  const handleOpenCahierTexte = (course: any) => {
    setSelectedCourse(course);
    setCahierTexteModalVisible(true);
  };

  useEffect(() => {
    const initApp = async () => {
      await getProfessorInfo();
      await requestLocationPermission(setLocationPermissionGranted, getCurrentLocation);
    };
    
    initApp();
  }, []);

  const { today, dayNames, todayDayName, currentTime, todayStr } = getTodayInfo();
  const todayCourses = coursesByDay.filter((d:any)=>d.title==todayDayName).flatMap((d:any)=>d.data) || [];

  useEffect(() => {
    const closestCourse = findNextCourse(coursesByDay, todayDayName, currentTime, todayCourses);
    setNextCourse(closestCourse);
  }, [coursesByDay, coursesLoading]);

  useEffect(() => {
    const loadPresenceStatus = async () => {
      if (!userDocId || todayCourses.length === 0) return;

      const statusMap: Record<string, boolean> = {};
      
      for (const course of todayCourses) {
        try {
          const isPresent = await isProfesseurEmargedForCourse(course.matiere_id, course.start, course.end);
          const courseKey = `${course.matiere_id}-${course.start}-${course.end}`;
          statusMap[courseKey] = isPresent;
        } catch (error) {
          console.error(`Error checking presence for course ${course.matiere_id}:`, error);
          const courseKey = `${course.matiere_id}-${course.start}-${course.end}`;
          statusMap[courseKey] = false;
        }
      }
      setCourseEmargedStatus(statusMap);
    };

    loadPresenceStatus();
  }, [userDocId, todayCourses]);

  useEffect(() => {
    if (!locationPermissionGranted) return;

    let locationInterval: ReturnType<typeof setInterval>;

    const updateLocationInterval = () => {
      if (locationInterval) clearInterval(locationInterval);

      locationInterval = setInterval(() => {
        getCurrentLocation();
      }, 10 * 60 * 1000);

      getCurrentLocation();
    };

    updateLocationInterval();

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [locationPermissionGranted, todayCourses, nextCourse]);

  const getCurrentLocation = async () => {
    try {
      const Location = require('expo-location');
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });
      const { latitude, longitude } = location.coords;
      checkIfNearSchool(latitude, longitude, setIsNearSchool);
    } catch (error) {
      setIsNearSchool(false);
    }
  };

  const getProfessorInfo = async () => {
    try {
      const userLogin = await getData('userLogin');
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

  const isProfesseurEmargedForCourseSync = (matiereId: string, startTime: string, endTime: string): boolean => {
    const courseKey = `${matiereId}-${startTime}-${endTime}`;
    return courseEmargedStatus[courseKey] || false;
  };

  const canEmarger = (matiereId: string, endTime: string, startTime: string) => {
    const isAlreadyEmarged = isProfesseurEmargedForCourseSync(matiereId, startTime, endTime);
    const isTimeExpired = isCourseTimeExpired(endTime);
    return !isAlreadyEmarged && !isTimeExpired;
  };

  const getEmargerButtonStatus = (matiereId: string, endTime: string, startTime: string, indisponible: number) => {
    if (!userDocId) {
      return { 
        text: 'Chargement...', 
        style: HomeStyles.expiredButton, 
        textStyle: HomeStyles.expiredButtonText, 
        disabled: true 
      };
    }

    const isAvailable = indisponible != 1;
    const isAlreadyEmarged = isProfesseurEmargedForCourseSync(matiereId, startTime, endTime);
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
    
    if (isNotStarted) return { 
      text: 'Bientôt', 
      style: HomeStyles.expiredButton, 
      textStyle: HomeStyles.expiredButtonText, 
      disabled: true 
    };
    
    if (isTimeExpired && !isAlreadyEmarged) return { 
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
      Alert.alert('Permission requise', 'Veuillez accorder la permission de localisation pour continuer.', [{ text: 'Accorder permission', onPress: () => requestLocationPermission(setLocationPermissionGranted, getCurrentLocation) }]);
      return;
    }
    if (!isNearSchool) {
      Alert.alert('Localisation requise', 'Vous devez être sur le campus de l\'école pour continuer !', [{ text: 'Vérifier à nouveau', onPress: () => getCurrentLocation() }, { text: 'OK', style: 'cancel' }]);
      return;
    }
    if (!canEmarger(matiereId, endTime, startTime)) {
      Alert.alert('Information', isProfesseurEmargedForCourseSync(matiereId, startTime, endTime) ? 'Vous avez déjà émargé pour ce cours aujourd\'hui.' : 'Le temps d\'émargement pour ce cours est expiré.');
      return;
    }

    navigation.navigate('Scanner', { 
      matiereId, 
      courseLibelle,
      courseInfo: {
        start: course.start,
        end: course.end,
        enseignant: professorName,
        salle: course.salle,
        classes: course.combined_classes || course.classe_libelle,
        class_ids: course.class_ids || [course.class_id]
      }
    });
  };

  const confirmRendreDisponible = async (course: any) => {
    Alert.alert("Confirmer", "Voulez-vous vraiment rendre ce cours disponible pour toutes les classes concernées ?", [
      { text: "Annuler", style: "destructive" },
      { text: "Oui", onPress: () => rendreDisponible(course) }
    ]);
  };

  const rendreDisponible = async (course: any) => {
    try {
      const today = new Date();
      const currentDay = today.getDay() === 0 ? 7 : today.getDay();

      const edtsRef = collection(db, 'edts');
      const edtsSnapshot = await getDocs(edtsRef);

      let updatedCount = 0;

      for (const edtDoc of edtsSnapshot.docs) {
        const edtData = edtDoc.data();
        const slots = edtData.slots || [];

        const slotIndex = slots.findIndex((slot: any) => 
          slot.day == currentDay &&
          slot.start == course.start &&
          slot.end == course.end &&
          slot.matiere_id == course.matiere_id &&
          slot.matiere_libelle == course.matiere_libelle
        );

        if (slotIndex !== -1) {
          if(slots[slotIndex].indisponible != 1) {
            Alert.alert('Information', 'Ce cours est déjà disponible.');
            return;
          }
          slots[slotIndex] = { ...slots[slotIndex], indisponible: 0 };
          updatedCount++;

          await updateDoc(doc(db, 'edts', edtDoc.id), {
            slots: slots
          });
        }
      }

      if (updatedCount > 0) {
        Alert.alert(
          'Succès', 
          `Le cours a été rendu disponible pour ${updatedCount} classe(s).`,
          [{ text: 'OK', onPress: () => refreshData() }]
        );
      } else {
        Alert.alert('Information', 'Aucun cours correspondant trouvé dans les emplois du temps.');
      }
    } catch (error) {
      console.error('Error making course available:', error);
      Alert.alert('Erreur', 'Impossible de rendre le cours disponible. Veuillez réessayer.');
    }
  };

  const confirmRendreIndisponible = async (course: any) => {
    Alert.alert("Confirmer", "Voulez-vous vraiment rendre ce cours indisponible pour toutes les classes concernées ?", [
      { text: "Annuler", style: "destructive" },
      { text: "Oui", onPress: () => rendreIndisponible(course) }
    ]);
  };

  const rendreIndisponible = async (course: any) => {
    try {
      const today = new Date();
      const currentDay = today.getDay() === 0 ? 7 : today.getDay();

      const edtsRef = collection(db, 'edts');
      const edtsSnapshot = await getDocs(edtsRef);

      let updatedCount = 0;

      for (const edtDoc of edtsSnapshot.docs) {
        const edtData = edtDoc.data();
        const slots = edtData.slots || [];

        const slotIndex = slots.findIndex((slot: any) => 
          slot.day == currentDay &&
          slot.start == course.start &&
          slot.end == course.end &&
          slot.matiere_id == course.matiere_id &&
          slot.matiere_libelle == course.matiere_libelle
        );

        if (slotIndex !== -1) {
          if(slots[slotIndex].indisponible == 1) {
            Alert.alert('Information', 'Ce cours est déjà marqué comme indisponible.');
            return;
          }
          slots[slotIndex] = { ...slots[slotIndex], indisponible: 1 };
          updatedCount++;

          await updateDoc(doc(db, 'edts', edtDoc.id), {
            slots: slots
          });
        }
      }

      if (updatedCount > 0) {
        Alert.alert(
          'Succès', 
          `Le cours a été rendu indisponible pour ${updatedCount} classe(s).`,
          [{ text: 'OK', onPress: () => refreshData() }]
        );
      } else {
        Alert.alert('Information', 'Aucun cours correspondant trouvé dans les emplois du temps.');
      }
    } catch (error) {
      console.error('Error making course unavailable:', error);
      Alert.alert('Erreur', 'Impossible de rendre le cours indisponible. Veuillez réessayer.');
    }
  };

  const goToQRCode = (matiereId: string, courseLibelle: string) => {
    if (!matiereId) return Alert.alert('Erreur', 'ID du cours manquant');
    navigation.navigate('QRCodeScreenProf', { matiereId, courseLibelle });
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
        <View style={HomeStyles.headerSection}>
          <Text style={HomeStyles.welcomeText}>Accueil Professeur</Text>
          <Text style={HomeStyles.dateText}>Aujourd'hui • {todayDayName} {todayStr}</Text>
          <Text style={HomeStyles.professorName}>Bienvenue, M. {professorName}</Text>
          
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
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 2,
          }} />
          
          <Image 
            source={require('../../../assets/school.png')} 
            style={{
              width: screenWidth * 1.1,
              height: 480,
              borderRadius: 25,
            }}
            resizeMode="cover"
          />
          
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
                <Text style={eStyles.nextCourseText}>
                  Classe{nextCourse.class_ids && nextCourse.class_ids.length > 1 ? 's' : ''}: {nextCourse.combined_classes || nextCourse.classe_libelle}
                </Text>
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
          
        {todayCourses.length > 0 && (
          <View style={HomeStyles.courseGrid}>
            {todayCourses.map((item: any, index: number) => {
              const emargerButtonStatus = getEmargerButtonStatus(item.matiere_id, item.end, item.start, item.indisponible || 0);
              const coursStatus = getCoursStatus(item.start, item.end);
              
              return (
                <View key={`${item.matiere_id}-${index}`} style={[
                  MatieresStyles.matiereCard,
                  index % 2 === 0 ? MatieresStyles.matiereCardLeft : MatieresStyles.matiereCardRight
                ]}>
                  <View style={MatieresStyles.cardHeader}>
                    <View style={MatieresStyles.matiereIconContainer}>
                      <Text style={MatieresStyles.matiereIcon}>🎓</Text>
                    </View>
                  </View>

                  <View style={MatieresStyles.cardContent}>
                    <Text style={MatieresStyles.matiereTitle} numberOfLines={2}>
                      {item.matiere_libelle}
                    </Text>
                    
                    <View style={MatieresStyles.professorInfo}>
                      <Text style={MatieresStyles.professorIcon}>👨‍🎓</Text>
                      <Text style={{fontSize: 12}}>
                        {item.combined_classes || item.classe_libelle}
                      </Text>
                    </View>

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
                        style={[emargerButtonStatus.style]} 
                        onPress={() => handleEmargerPress(
                          item.matiere_id, 
                          item.end, 
                          item.matiere_libelle, 
                          item, 
                          item.start
                        )}
                        disabled={emargerButtonStatus.disabled || !locationPermissionGranted || !isNearSchool}
                      >
                        <Text style={emargerButtonStatus.textStyle}>
                          {!locationPermissionGranted ? 'Permission requise 📍' : 
                           !isNearSchool ? "Aller à l'école! 🏫" : 
                           emargerButtonStatus.text}
                        </Text>
                      </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      item.indisponible == 1 ? MatieresStyles.availableCourse : MatieresStyles.unavailableCourse
                    ]}
                    onPress={() =>
                     item.indisponible == 1 ? confirmRendreDisponible(item) : 
                     confirmRendreIndisponible(item)}
                  >
                    <Text style={MatieresStyles.viewCoursesText}>
                      {item.indisponible == 1 ? 'Rendre Disponible' : 'Rendre Indisponible'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      HomeStyles.cahierTexteButton,
                      isCourseTimePassed(item.end) && HomeStyles.cahierTexteButtonDisabled
                    ]}
                    onPress={() => handleOpenCahierTexte(item)}
                    disabled={isCourseTimePassed(item.end)}
                  >
                    <Text style={HomeStyles.cahierTexteButtonText}>
                       Cahier de Texte
                    </Text>
                  </TouchableOpacity>

                  </View>

                  <View style={MatieresStyles.cardFooter}>
                    <TouchableOpacity 
                      style={MatieresStyles.viewCoursesButton}
                      onPress={() => goToQRCode(item.matiere_id, item.matiere_libelle)}
                    >
                      <Text style={MatieresStyles.viewCoursesText}>Générer QR Code</Text>
                      <Text style={MatieresStyles.arrowIcon}>→</Text>
                    </TouchableOpacity>
                    {item.class_ids && item.class_ids.length > 1 && (
                    <View style={{
                      backgroundColor: '#E3F2FD',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginVertical: 5,
                      borderRadius: 12,
                      alignSelf: 'flex-start',
                      marginTop: 8
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: '#d29819ff',
                        fontWeight: '500'
                      }}>
                        {item.class_ids.length} 
                        classes combinées
                      </Text>
                    </View>
                  )}
                  
                    <Text style={
                      coursStatus.type == 'warning' ? HomeStyles.statusWarning :
                      coursStatus.type == 'primary' ? HomeStyles.statusPrimary :
                      HomeStyles.statusSuccess
                    }>
                      {coursStatus.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

      {selectedCourse && (
        <CahierTexteModal
          visible={cahierTexteModalVisible}
          onClose={() => {
            setCahierTexteModalVisible(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
        />
      )}
      <BottomNavBar activeScreen="HomeProfesseur"/>
    </View>
  );
}