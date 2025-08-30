import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Linking, Platform, Dimensions, Button } from 'react-native';
import TopNavBar from '../../components/layout/topBar';
import BottomNavBar from '../../components/layout/bottomBar';
import MatiereDetailsModal from '../../components/modals/MatiereDetailsModal';
import { theme } from '../../../styles/globalStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { useMatieres } from '../../components/hooks/matieres';
import { Slot, useUserCourses } from '../../components/hooks/cours'; 
import { Cstyles } from '../allCourses/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { styles as eStyles } from '../allCourses/styles'
import { getUserSnapchot } from '../../../firebaseConfig';
import { MatieresStyles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'MatieresStudent'>;

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
}

export default function MatieresStudent({ navigation }: Props) {
  const { matieres, loading: matieresLoading, refreshMatieres } = useMatieres();
  const { coursesByDay, loading: coursesLoading, refreshCourses } = useUserCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [selectedMatiereIndex, setSelectedMatiereIndex] = useState(0);

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
          id: course.matiere_id, // Using matiere_id as id
          matiere_id: course.matiere_id,
          start: course.start,
          end: course.end,
          salle: course.salle,
          type: course.type || 'Cours', // Default type if not provided
          day: day.title
        }));
      allCourses.push(...dayCourses);
    });
    
    return allCourses;
  };

  // FIXED: Get next course for a specific matiere
  const getNextCourseForMatiere = (matiereId: string): Course | null => {
    const currentTime = today.getHours() * 60 + today.getMinutes();
    let nextCourse: Course | null = null;
    let minTimeDifference = Infinity;

    // Get all courses for this matiere across all days
    const allMatiereCourses = getCoursesForMatiere(matiereId);

    // First, try to find upcoming courses for today
    const todayMatiereCourses = allMatiereCourses.filter(course => course.day === todayDayName);
    
    todayMatiereCourses.forEach(course => {
      try {
        const timeParts = course.start.split(':');
        const startHours = parseInt(timeParts[0]);
        const startMinutes = parseInt(timeParts[1]);
        
        if (!isNaN(startHours)) {
          const courseStartTime = startHours * 60 + startMinutes;
          const timeDifference = courseStartTime - currentTime;

          // Only consider future courses (timeDifference > 0)
          if (timeDifference > 0 && timeDifference < minTimeDifference) {
            minTimeDifference = timeDifference;
            nextCourse = course;
          }
        }
      } catch (error) {
        console.error("Error parsing course time:", course.start, error);
      }
    });

    // If no upcoming courses found for today, look for next day's courses
    if (!nextCourse) {
      const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const currentDayIndex = dayOrder.indexOf(todayDayName);
      
      // Search through the next 7 days
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const nextDayIndex = (currentDayIndex + dayOffset) % 7;
        const nextDayName = dayOrder[nextDayIndex];
        
        const nextDayMatiereCourses = allMatiereCourses.filter(course => course.day === nextDayName);
        
        if (nextDayMatiereCourses.length > 0) {
          // Find the earliest course of the next day
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Image source={require('../../../assets/iibs-logo.png')} style={{ width: 100, height: 100, marginTop: 20 }}/>
        <Text style={MatieresStyles.loadingText}>Chargement des matières...</Text>
      </View>
    );
  }

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
          <Text style={MatieresStyles.welcomeText}>Mes Matières</Text>
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
                  <Text style={MatieresStyles.statNumber}>
                    {coursesByDay.reduce((total: number, day: any) => total + day.data.length, 0)}
                  </Text>
                  <Text style={MatieresStyles.statLabel}>Cours Total</Text>
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

        {/* Matières Grid Section */}
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
                    {/* Card Header */}
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

                    {/* Card Content */}
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

                      {/* Stats */}
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

                      {/* Next Course Info */}
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
              <TouchableOpacity style={MatieresStyles.refreshButton}>
                <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavBar activeScreen="Matieres" />

      {/* Matiere Details Modal - FIXED PROPS */}
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
    </View>
  );
}