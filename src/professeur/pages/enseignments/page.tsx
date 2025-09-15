import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Linking, Platform, Dimensions, Button } from 'react-native';
import TopNavBar from '../../../components/layout/topBar';
import BottomNavBar from '../../../components/layout/bottomBar';
import MatiereDetailsModal from '../../../components/modals/MatiereDetailsModal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { useProfesseurMatieres } from '../../../components/hooks/matieresProfesseur';
import { useProfesseurCourses } from '../../../components/hooks/coursProfesseur'; 
import { MatieresStyles } from './styles';
import LottieView from 'lottie-react-native';
import StudentsModal from './StudentsModal';

type Props = NativeStackScreenProps<RootStackParamList, 'MatieresClassesProfesseur'>;

interface Course {
  id: string;
  matiere_id: string;
  start: string;
  end: string;
  salle: string;
  type: string;
  day?: string;
}

interface Matiere {
  id: string;
  title: string;
  professeurFullName: string;
  description?: string;
  classes?: Array<{
    classe_id: string;
    classe_libelle: string;
  }>;
}

export default function MatieresClassesProfesseur({ navigation }: Props) {
  const { matieres, loading: matieresLoading, refreshMatieres, classes } = useProfesseurMatieres();
  const { coursesByDay, loading: coursesLoading, refreshCourses } = useProfesseurCourses();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'matieres' | 'classes'>('matieres'); // New state for view mode
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [selectedMatiereIndex, setSelectedMatiereIndex] = useState(0);

  // Add this near your other useState declarations
const [studentsModalVisible, setStudentsModalVisible] = useState(false);
const [selectedClassId, setSelectedClassId] = useState('');
const [selectedClassName, setSelectedClassName] = useState('');

// Function to open modal for a class
const handleOpenStudentsModal = (classId: string, className: string) => {
  setSelectedClassId(classId);
  setSelectedClassName(className);
  setStudentsModalVisible(true);
};

// Function to close modal
const handleCloseStudentsModal = () => {
  setStudentsModalVisible(false);
  setSelectedClassId('');
  setSelectedClassName('');
};


  const refreshData = () => {
    refreshCourses();
    refreshMatieres()
  }

  // Get today's date info
  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const todayDayName = dayNames[today.getDay()];
  const todayStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;

  // Get course statistics for each matiere
  const getMatiereStats = (matiereId: string) => {
    let totalCourses = 0;
    let todayCourses = 0;
    
    coursesByDay.forEach((day: any) => {
      const dayCourses = day.data.filter((course: any) => course.matiere_id === matiereId);
      totalCourses += dayCourses.length;
      
      if (day.title === todayDayName) {
        todayCourses += dayCourses.length;
      }
    });
    
    return { totalCourses, todayCourses };
  };

  // Get all courses for a specific matiere - FIXED FUNCTION
  const getCoursesForMatiere = (matiereId: string): Course[] => {
    const allCourses: Course[] = [];
    
    coursesByDay.forEach((day: any) => {
      const dayCourses = day.data
        .filter((course: any) => course.matiere_id === matiereId)
        .map((course: any) => ({
          id: course.matiere_id,
          matiere_id: course.matiere_id,
          start: course.start,
          end: course.end,
          salle: course.salle,
          type: course.type || 'Cours',
          day: day.title
        }));
      allCourses.push(...dayCourses);
    });
    
    return allCourses;
  };

  // Get next course for a specific matiere
  const getNextCourseForMatiere = (matiereId: string): Course | null => {
    const currentTime = today.getHours() * 60 + today.getMinutes();
    let nextCourse: Course | null = null;
    let minTimeDifference = Infinity;

    const allMatiereCourses = getCoursesForMatiere(matiereId);
    const todayMatiereCourses = allMatiereCourses.filter(course => course.day === todayDayName);
    
    todayMatiereCourses.forEach(course => {
      try {
        const timeParts = course.start.split(':');
        const startHours = parseInt(timeParts[0]);
        const startMinutes = parseInt(timeParts[1]);
        
        if (!isNaN(startHours)) {
          const courseStartTime = startHours * 60 + startMinutes;
          const timeDifference = courseStartTime - currentTime;

          if (timeDifference > 0 && timeDifference < minTimeDifference) {
            minTimeDifference = timeDifference;
            nextCourse = course;
          }
        }
      } catch (error) {
        console.error("Error parsing course time:", course.start, error);
      }
    });

    if (!nextCourse) {
      const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const currentDayIndex = dayOrder.indexOf(todayDayName);
      
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const nextDayIndex = (currentDayIndex + dayOffset) % 7;
        const nextDayName = dayOrder[nextDayIndex];
        
        const nextDayMatiereCourses = allMatiereCourses.filter(course => course.day === nextDayName);
        
        if (nextDayMatiereCourses.length > 0) {
          let earliestCourse: Course | null = null;
          let earliestTime = Infinity;
          
          nextDayMatiereCourses.forEach(course => {
            try {
              const timeParts = course.start.split(':');
              const startHours = parseInt(timeParts[0]);
              const startMinutes = parseInt(timeParts[1]);
              
              if (!isNaN(startHours)) {
                const courseStartTime = startHours * 60 + startMinutes;
                
                if (courseStartTime < earliestTime) {
                  earliestTime = courseStartTime;
                  earliestCourse = course;
                }
              }
            } catch (error) {
              console.error("Error parsing course time:", course.start, error);
            }
          });
          
          if (earliestCourse) {
            nextCourse = earliestCourse;
            break; 
          }
        }
      }
    }

    if (!nextCourse && todayMatiereCourses.length > 0) {
      nextCourse = todayMatiereCourses[0];
    }

    return nextCourse;
  };

  // NEW: Group matieres by classes
  const getMatieresByClass = () => {
    const matieresByClass: Record<string, { className: string; matieres: Matiere[] }> = {};
    
    matieres.forEach(matiere => {
      if (matiere.classes && matiere.classes.length > 0) {
        matiere.classes.forEach(classe => {
          if (!matieresByClass[classe.classe_id]) {
            matieresByClass[classe.classe_id] = {
              className: classe.classe_libelle,
              matieres: []
            };
          }
          
          // Check if matiere already exists in this class to avoid duplicates
          const existingMatiere = matieresByClass[classe.classe_id].matieres.find(m => m.id === matiere.id);
          if (!existingMatiere) {
            matieresByClass[classe.classe_id].matieres.push(matiere);
          }
        });
      }
    });
    
    return matieresByClass;
  };

  // NEW: Get statistics for a class
  const getClassStats = (classId: string, classMatieres: Matiere[]) => {
    let totalCourses = 0;
    let todayCourses = 0;
    
    classMatieres.forEach(matiere => {
      const stats = getMatiereStats(matiere.id);
      totalCourses += stats.totalCourses;
      todayCourses += stats.todayCourses;
    });
    
    return { totalCourses, todayCourses, totalMatieres: classMatieres.length };
  };

  // Handle matiere card press
  const handleMatierePress = (matiere: Matiere, index: number) => {
    setSelectedMatiere(matiere);
    setSelectedMatiereIndex(index);
    setModalVisible(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMatiere(null);
  };

  const loading = matieresLoading || coursesLoading;

  if (loading) {
    return (
      <View style={MatieresStyles.loading}>
        <LottieView
          source={require('../../../assets/Book loading.json')}
          autoPlay
          loop={true}
          style={{ width: 170, height: 170 }}
        />
        <Image 
          source={require('../../../assets/logo8.png')} 
          style={{ width: 250, height: 250, marginTop: -50 }}
          resizeMode='contain'
        />
        <Text style={MatieresStyles.loadingText}>Chargement des matières...</Text>
      </View>
    );
  }

  const matieresByClass = getMatieresByClass();

  return (
    <View style={MatieresStyles.container}>
      <TopNavBar />

      <ScrollView 
        style={MatieresStyles.scrollView}
        contentContainerStyle={MatieresStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={MatieresStyles.headerSection}>
          <Text style={MatieresStyles.welcomeText}>Mes Matières et Classes</Text>
          <Text style={MatieresStyles.dateText}>Aujourd'hui • {todayDayName} {todayStr}</Text>
        </View>

        {/* Modern Hero Section */}
        <View style={MatieresStyles.heroSection}>
          <View style={MatieresStyles.heroOverlay} />
          <Image 
            source={require('../../../assets/school.png')} 
            style={MatieresStyles.heroImage}
            resizeMode="cover"
          />
          
          <View style={MatieresStyles.heroContent}>
            <View style={MatieresStyles.heroCard}>
              <Text style={MatieresStyles.heroTitle}>
                📚 Centre d'Apprentissage
              </Text>
              <Text style={MatieresStyles.heroSubtitle}>
                Découvrez toutes vos matières et suivez votre progression
              </Text>
              
              <View style={MatieresStyles.statsRow}>
                <View style={MatieresStyles.statItem}>
                  <Text style={MatieresStyles.statNumber}>{matieres.length}</Text>
                  <Text style={MatieresStyles.statLabel}>Matières</Text>
                </View>
                <View style={MatieresStyles.statItem}>
                  <Text style={MatieresStyles.statNumber}>{Object.keys(matieresByClass).length}</Text>
                  <Text style={MatieresStyles.statLabel}>Classes</Text>
                </View>
                <View style={MatieresStyles.statItem}>
                  <Text style={MatieresStyles.statNumber}>
                    {coursesByDay
                      .filter((d: any) => d.title === todayDayName)
                      .reduce((total: number, day: any) => total + day.data.length, 0)
                    }
                  </Text>
                  <Text style={MatieresStyles.statLabel}>Aujourd'hui</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* NEW: View Mode Toggle */}
        <View style={MatieresStyles.viewToggleContainer}>
          <TouchableOpacity 
            style={[
              MatieresStyles.toggleButton,
              viewMode === 'matieres' && MatieresStyles.toggleButtonActive
            ]}
            onPress={() => setViewMode('matieres')}
            activeOpacity={0.7}
          >
            <Text style={[
              MatieresStyles.toggleButtonText,
              viewMode === 'matieres' && MatieresStyles.toggleButtonTextActive
            ]}>
              📖 Par Matières
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              MatieresStyles.toggleButton,
              viewMode === 'classes' && MatieresStyles.toggleButtonActive
            ]}
            onPress={() => setViewMode('classes')}
            activeOpacity={0.7}
          >
            <Text style={[
              MatieresStyles.toggleButtonText,
              viewMode === 'classes' && MatieresStyles.toggleButtonTextActive
            ]}>
              🎓 Par Classes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on view mode */}
        {viewMode === 'matieres' ? (
          // Original Matières View
          <View style={MatieresStyles.matieresSection}>
            <View style={MatieresStyles.sectionHeader}>
              <View style={MatieresStyles.badgeContainer}>
                <View style={MatieresStyles.badgeIcon}>
                  <Text style={MatieresStyles.badgeIconText}>📖</Text>
                </View>
                <Text style={MatieresStyles.badgeText}>Toutes les Matières</Text>
                <View style={MatieresStyles.badgeCount}>
                  <Text style={MatieresStyles.badgeCountText}>{matieres.length}</Text>
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

            {matieres.length > 0 ? (
              <View style={MatieresStyles.matieresGrid}>
                {matieres.map((matiere, index) => {
                  const stats = getMatiereStats(matiere.id);
                  const nextCourse: Course | null = getNextCourseForMatiere(matiere.id);
                  
                  return (
                    <TouchableOpacity 
                      key={matiere.id} 
                      style={[
                        MatieresStyles.matiereCard,
                        index % 2 === 0 ? MatieresStyles.matiereCardLeft : MatieresStyles.matiereCardRight
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleMatierePress(matiere, index)}
                    >
                      <View style={MatieresStyles.cardHeader}>
                        <View style={MatieresStyles.matiereIconContainer}>
                          <Text style={MatieresStyles.matiereIcon}>
                            {index % 6 === 0 ? '💻' : 
                             index % 6 === 1 ? '📊' : 
                             index % 6 === 2 ? '🔬' : 
                             index % 6 === 3 ? '🎨' : 
                             index % 6 === 4 ? '📐' : '📚'}
                          </Text>
                        </View>
                        <View style={MatieresStyles.cardActions}>
                          <TouchableOpacity style={MatieresStyles.favoriteButton}>
                            <Text style={MatieresStyles.favoriteIcon}>♥</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={MatieresStyles.cardContent}>
                        <Text style={MatieresStyles.matiereTitle} numberOfLines={2}>
                          {matiere.title}
                        </Text>
                        
                        <View style={MatieresStyles.professorInfo}>
                          <Text style={MatieresStyles.professorIcon}>👨‍🏫</Text>
                          <Text style={MatieresStyles.professorName} numberOfLines={1}>
                            {matiere.professeurFullName}
                          </Text>
                        </View>

                        <View style={MatieresStyles.classInfo}>
                          <Text style={MatieresStyles.className}>
                            {matiere.classes.map(c => c.classe_libelle).join(', ')}
                          </Text>
                        </View>

                        <View style={MatieresStyles.matiereStats}>
                          <View style={MatieresStyles.statChip}>
                            <Text style={MatieresStyles.statChipText}>
                              {stats.totalCourses} cours
                            </Text>
                          </View>
                          {stats.todayCourses > 0 && (
                            <View style={[MatieresStyles.statChip, MatieresStyles.todayChip]}>
                              <Text style={[MatieresStyles.statChipText, MatieresStyles.todayChipText]}>
                                {stats.todayCourses} aujourd'hui
                              </Text>
                            </View>
                          )}
                        </View>

                        {nextCourse && (
                          <View style={MatieresStyles.nextCourseInfo}>
                            <Text style={MatieresStyles.nextCourseLabel}>Prochain:</Text>
                            <Text style={MatieresStyles.nextCourseTime}>
                              🕐 {nextCourse.start} | {nextCourse.end}
                            </Text>
                            <Text style={MatieresStyles.nextCourseLocation}>
                              📍 {nextCourse.salle}
                            </Text>
                            {nextCourse.day && nextCourse.day !== todayDayName ? (
                              <Text style={MatieresStyles.nextCourseDay}>
                                📅 {nextCourse.day}
                              </Text>
                            ) : (
                               <Text style={MatieresStyles.nextCourseDay}>
                                📅 {nextCourse.day} prochain
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={MatieresStyles.emptyState}>
                <Text style={MatieresStyles.emptyIcon}>📚</Text>
                <Text style={MatieresStyles.emptyText}>Aucune matière trouvée</Text>
                <Text style={MatieresStyles.emptySubtext}>Vos matières apparaîtront ici une fois configurées</Text>
                <TouchableOpacity style={MatieresStyles.refreshButton} onPress={refreshData}>
                  <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // NEW: Classes View
          <View style={MatieresStyles.matieresSection}>
            <View style={MatieresStyles.sectionHeader}>
              <View style={MatieresStyles.badgeContainer}>
                <View style={MatieresStyles.badgeIcon}>
                  <Text style={MatieresStyles.badgeIconText}>🎓</Text>
                </View>
                <Text style={MatieresStyles.badgeText}>Toutes les Classes</Text>
                <View style={MatieresStyles.badgeCount}>
                  <Text style={MatieresStyles.badgeCountText}>{Object.keys(matieresByClass).length}</Text>
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

            {Object.keys(matieresByClass).length > 0 ? (
              <View style={MatieresStyles.classesContainer}>
                {Object.entries(matieresByClass).map(([classId, classData], classIndex) => {
                  const classStats = getClassStats(classId, classData.matieres);
                  
                  return (
                    <View key={classId} style={MatieresStyles.classCard}>
                      {/* Class Header */}
                      <View style={MatieresStyles.classHeader}>
                        <View style={MatieresStyles.classIconContainer}>
                          <Text style={MatieresStyles.classIcon}>🎓</Text>
                        </View>
                        <View style={MatieresStyles.classInfo}>
                          <Text style={MatieresStyles.className} numberOfLines={2}>
                            {classData.className}
                          </Text>
                          <Text style={MatieresStyles.classStats}>
                            {classStats.totalMatieres} matières • {classStats.totalCourses} cours
                            {classStats.todayCourses > 0 && ` • ${classStats.todayCourses} aujourd'hui`}
                          </Text>
                        </View>
                        
                      </View>
                       <TouchableOpacity 
                          style={MatieresStyles.ViewStudentsButton}
                          onPress={() => handleOpenStudentsModal(classId, classData.className)}
                        >
                          <Text style={{color: '#ffff'}}>Voir Etudiants</Text>
                        </TouchableOpacity>

                      {/* Matieres in this class */}
                      <View style={MatieresStyles.classMatieres}>
                        {classData.matieres.map((matiere, matiereIndex) => {
                          const stats = getMatiereStats(matiere.id);
                          const nextCourse = getNextCourseForMatiere(matiere.id);
                          
                          return (
                            <TouchableOpacity
                              key={matiere.id}
                              style={MatieresStyles.classMatiere}
                              onPress={() => handleMatierePress(matiere, matiereIndex)}
                              activeOpacity={0.8}
                            >
                              <View style={MatieresStyles.classMatiereHeader}>
                                <Text style={MatieresStyles.classMatiereIcon}>
                                  {matiereIndex % 6 === 0 ? '💻' : 
                                   matiereIndex % 6 === 1 ? '📊' : 
                                   matiereIndex % 6 === 2 ? '🔬' : 
                                   matiereIndex % 6 === 3 ? '🎨' : 
                                   matiereIndex % 6 === 4 ? '📐' : '📚'}
                                </Text>
                                <Text style={MatieresStyles.classMatiereTitle} numberOfLines={1}>
                                  {matiere.title}
                                </Text>
                              </View>
                              
                              <View style={MatieresStyles.classMatiereStats}>
                                <Text style={MatieresStyles.classMatiereStatText}>
                                  {stats.totalCourses} cours
                                </Text>
                                {stats.todayCourses > 0 && (
                                  <Text style={MatieresStyles.classMatiereTodayText}>
                                    {stats.todayCourses} aujourd'hui
                                  </Text>
                                )}
                              </View>

                              {nextCourse && (
                                <Text style={MatieresStyles.classMatiereNext}>
                                  Prochain: {nextCourse.start} - {nextCourse.salle}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={MatieresStyles.emptyState}>
                <Text style={MatieresStyles.emptyIcon}>🎓</Text>
                <Text style={MatieresStyles.emptyText}>Aucune classe trouvée</Text>
                <Text style={MatieresStyles.emptySubtext}>Vos classes apparaîtront ici une fois configurées</Text>
                <TouchableOpacity style={MatieresStyles.refreshButton} onPress={refreshData}>
                  <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeScreen="Matieres" />

      {/* Matiere Details Modal */}
      <MatiereDetailsModal
        visible={modalVisible}
        onClose={handleCloseModal}
        matiere={selectedMatiere}
        courses={selectedMatiere ? getCoursesForMatiere(selectedMatiere.id) : []}
        nextCourse={selectedMatiere ? getNextCourseForMatiere(selectedMatiere.id) : null}
        totalCourses={selectedMatiere ? getMatiereStats(selectedMatiere.id).totalCourses : 0}
        todayCourses={selectedMatiere ? getMatiereStats(selectedMatiere.id).todayCourses : 0}
        matiereIndex={selectedMatiereIndex}
      />

      {/* Students Modal */}
      <StudentsModal
        visible={studentsModalVisible}
        onClose={handleCloseStudentsModal}
        classId={selectedClassId}
        className={selectedClassName}
      />
    </View>
  );
}