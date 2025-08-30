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
import { styles as eStyles } from '../allCourses/styles'
import { getUserSnapchot } from '../../../firebaseConfig';
import { MatieresStyles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'MatieresStudent'>;


export default function MatieresStudent({ navigation }: Props) {
  const { matieres, loading: matieresLoading, refreshMatieres } = useMatieres();
  const { coursesByDay, loading: coursesLoading, refreshCourses } = useUserCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Get next course for a specific matiere
  const getNextCourseForMatiere = (matiereId: string) => {
    const currentTime = today.getHours() * 60 + today.getMinutes();
    let nextCourse = null;
    let minTimeDifference = Infinity;

    // Check today's courses first
    const todayCourses = coursesByDay
      .filter((d: any) => d.title == todayDayName)
      .flatMap((d: any) => d.data)
      .filter((course: any) => course.matiere_id == matiereId);

    todayCourses.forEach((course: any) => {
      try {
        const timeParts = course.start.split(':');
        const startHours = parseInt(timeParts[0]);
        const startMinutes = parseInt(timeParts[1]);
        
        if (!isNaN(startHours)) {
          const courseStartTime = startHours * 60 + startMinutes;
          const timeDifference = courseStartTime - currentTime;

          if (timeDifference > 0 && timeDifference < minTimeDifference) {
            minTimeDifference = timeDifference;
            nextCourse = { ...course, day: todayDayName };
          }
        }

      } catch (error) {
        console.error("Error parsing course time:", course.start, error);
      }
    });

    return nextCourse;
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
                const nextCourse: any = getNextCourseForMatiere(matiere.id);
                
                return (
                  <TouchableOpacity 
                    key={matiere.id} 
                    style={[
                      MatieresStyles.matiereCard,
                      index % 2 === 0 ? MatieresStyles.matiereCardLeft : MatieresStyles.matiereCardRight
                    ]}
                    activeOpacity={0.8}
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
                            🕐 {nextCourse.start}
                          </Text>
                          <Text style={MatieresStyles.nextCourseLocation}>
                            📍 {nextCourse.salle}
                          </Text>
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
    </View>
  );
}

