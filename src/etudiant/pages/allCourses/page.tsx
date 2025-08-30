import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import TopNavBar from '../../components/layout/topBar';
import BottomNavBar from '../../components/layout/bottomBar';
import CustomCalendar from '../../components/hooks/calendar'; 
import MatiereDetailsModal from '../../components/modals/MatiereDetailsModal';
import { theme } from '../../../styles/globalStyles';
import { useUserCourses, Slot } from '../../components/hooks/cours'; 
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { Cstyles, styles } from './styles';
import { getCoursStatus } from '../home/page';
import { HomeStyles } from '../home/styles';
import { MatieresStyles } from '../matieres/styles';
import LottieView from 'lottie-react-native';

interface DropdownItem {
  label: string;
  value: string;
}

interface Matiere {
  id: string;
  title: string;
  professeurFullName: string;
}

const CustomDropdown = ({ 
  selectedValue, 
  onValueChange, 
  items, 
  placeholder,
  style 
}: {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: DropdownItem[];
  placeholder: string;
  style?: any;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find(item => item.value === selectedValue);

  return (
    <View style={style}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un jour</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedValue === item.value && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedValue == item.value && styles.selectedDropdownItemText
                  ]}>
                    {item.label}
                  </Text>
                  {selectedValue == item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

type Props = NativeStackScreenProps<RootStackParamList, 'AllCoursesStudent'>;

export default function AllCoursesStudent({ navigation }: Props) {
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | any>();
    const [filterMode, setFilterMode] = useState<'dropdown' | 'calendar'>('calendar');
    const [nextCourse, setNextCourse] = useState<Slot | null>(null);
    const [todayCourses, setTodayCourses] = useState<Slot[]>([]);
    
    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
    const [selectedMatiereCourses, setSelectedMatiereCourses] = useState<Slot[]>([]);
    const [selectedMatiereIndex, setSelectedMatiereIndex] = useState(0);
    
    const { coursesByDay, loading: coursesLoading, refreshCourses, error } = useUserCourses(); 

  const  refreshData = () => {
    refreshCourses();
  }
  useEffect(() => {
    if (coursesByDay && coursesByDay.length > 0) {
      
      const today = new Date();
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const todayDayName = dayNames[today.getDay()];
      const currentTime = today.getHours() * 60 + today.getMinutes();
      
      // Get today's courses
      const todayCoursesList = coursesByDay
        .filter((d: any) => d.title == todayDayName)
        .flatMap((d: any) => d.data) || [];
      
      setTodayCourses(todayCoursesList);
      
      let closestCourse: any = null;
      let minTimeDifference = Infinity;
      
      // First, try to find upcoming courses for today
      todayCoursesList.forEach(course => {
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
      
      if (!closestCourse && todayCoursesList.length > 0) {
        closestCourse = { ...todayCoursesList[0], day: todayDayName };
      }
      
      setNextCourse(closestCourse);
    }
  }, [coursesByDay, coursesLoading]);

  const handleCourseCardPress = (course: Slot, index: number) => {
    // Create a matiere object from the course data
    const matiere: Matiere = {
      id: course.matiere_id,
      title: course.matiere_libelle,
      professeurFullName: course.enseignant
    };

    // Get all courses for this matiere
    const allMatieresCourses = coursesByDay
      ?.flatMap((day: any) => day.data || [])
      .filter((c: Slot) => c.matiere_id === course.matiere_id) || [];

    // Get today's courses for this matiere
    const today = new Date();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayDayName = dayNames[today.getDay()];
    
    const todayMatiereCourses = coursesByDay
      ?.filter((d: any) => d.title === todayDayName)
      .flatMap((d: any) => d.data || [])
      .filter((c: Slot) => c.matiere_id === course.matiere_id) || [];

    setSelectedMatiere(matiere);
    setSelectedMatiereCourses(allMatieresCourses);
    setSelectedMatiereIndex(index);
    setModalVisible(true);
  };

  const handleDateSelect = (date: Date, dayName: string) => {
    setSelectedDate(date);
    setSelectedDay(dayName);
    setFilterMode('calendar');
  };

  const handleDropdownDaySelect = (day: string) => {
    setSelectedDay(day);
    setSelectedDate(null);
    setFilterMode('dropdown');
  };

  const dayItems: DropdownItem[] = [
    { label: "Tous les jours", value: "" },
    { label: "Lundi", value: "Lundi" },
    { label: "Mardi", value: "Mardi" },
    { label: "Mercredi", value: "Mercredi" },
    { label: "Jeudi", value: "Jeudi" },
    { label: "Vendredi", value: "Vendredi" },
    { label: "Samedi", value: "Samedi" },
  ];

  const getFilteredCoursesByDay = () => {
    if (!coursesByDay || coursesByDay.length === 0) return [];
    if (!selectedDay) return coursesByDay;
    return coursesByDay.filter(section => section?.title == selectedDay);
  };

  const filteredCoursesByDay = getFilteredCoursesByDay();
  const totalCourses = filteredCoursesByDay.reduce((total, day) => total + (day?.data?.length || 0), 0);

  // Get next course for selected matiere
  const getNextCourseForMatiere = (matiereId: string) => {
    const today = new Date();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayDayName = dayNames[today.getDay()];
    const currentTime = today.getHours() * 60 + today.getMinutes();

    // Get all courses for this matiere
    const matiereCourses = coursesByDay
      ?.flatMap((day: any) => day.data?.map((course: Slot) => ({ ...course, day: day.title })) || [])
      .filter((course: any) => course.matiere_id === matiereId) || [];

    // Find next upcoming course
    let nextCourse = null;
    let minTimeDifference = Infinity;

    // First check today's courses
    const todayMatiereCourses = matiereCourses.filter((course: any) => course.day === todayDayName);
    
    todayMatiereCourses.forEach((course: any) => {
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
        console.error("Error parsing course time:", error);
      }
    });

    // If no upcoming course today, find next day's first course
    if (!nextCourse && matiereCourses.length > 0) {
      const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const currentDayIndex = dayOrder.indexOf(todayDayName);
      
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const nextDayIndex = (currentDayIndex + dayOffset) % 7;
        const nextDayName = dayOrder[nextDayIndex];
        
        const nextDayMatiereCourses = matiereCourses.filter((course: any) => course.day === nextDayName);
        
        if (nextDayMatiereCourses.length > 0) {
          // Get the earliest course of that day
          nextCourse = nextDayMatiereCourses.reduce((earliest: any, current: any) => {
            try {
              const currentTimeParts = current.start.split(':');
              const currentStartTime = parseInt(currentTimeParts[0]) * 60 + parseInt(currentTimeParts[1]);
              
              const earliestTimeParts = earliest.start.split(':');
              const earliestStartTime = parseInt(earliestTimeParts[0]) * 60 + parseInt(earliestTimeParts[1]);
              
              return currentStartTime < earliestStartTime ? current : earliest;
            } catch (error) {
              return earliest;
            }
          });
          break;
        }
      }
    }

    return nextCourse;
  };

  const renderCourseCard = (item: Slot, index: number) => (
    <TouchableOpacity 
      key={item.matiere_id} 
      style={[MatieresStyles.matiereCard]}
      onPress={() => handleCourseCardPress(item, index)}
      activeOpacity={0.7}
    >
      {/* Card Header */}
      <View style={MatieresStyles.cardHeader}>
        <View style={MatieresStyles.matiereIconContainer}>
          <Text style={MatieresStyles.matiereIcon}>📚</Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={MatieresStyles.cardContent}>
        <Text style={MatieresStyles.matiereTitle} numberOfLines={2}>
          {item.matiere_libelle}
        </Text>

        <View style={MatieresStyles.professorInfo}>
          <Text style={MatieresStyles.professorIcon}>👨‍💻</Text>
          <Text style={MatieresStyles.professorName} numberOfLines={1}>
            {item.enseignant}
          </Text>
        </View>

        <View style={MatieresStyles.matiereStats}>
          <View style={MatieresStyles.statChip}>
            <Text style={MatieresStyles.statChipText}>
              {item.start} - {item.end}
            </Text>
          </View>
          <View style={[MatieresStyles.statChip, MatieresStyles.todayChip]}>
            <Text style={[MatieresStyles.statChipText, MatieresStyles.todayChipText]}>
              📍 {item.salle}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCoursesInRows = (courses: Slot[]) => {
    if (!courses || courses.length === 0) return null;
    
    const rows = [];
    for (let i = 0; i < courses.length; i += 2) {
      const rowCourses = courses.slice(i, i + 2);
      rows.push(
        <View key={i} style={Cstyles.columnWrapper}>
          {rowCourses.map((course, index) => course && renderCourseCard(course, i + index))}
        </View>
      );
    }
    return rows;
  };

  const clearFilters = () => {
    setSelectedDay('');
    setSelectedDate(null);
    setFilterMode('dropdown');
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <TopNavBar />
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Erreur</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
        <BottomNavBar activeScreen={'AllCourses'} />
      </View>
    );
  }

  const loading = coursesLoading
  console.log(loading)

  if (loading) return (
    <View style={HomeStyles.loading}>
        <LottieView
          source={require('../../../assets/Book loading.json')}
          autoPlay
          loop={true}
          style={{ width: 170, height: 170 }}
        />
      <Image source={require('../../../assets/iibs-logo.png')} style={{ width: 100, height: 100, marginTop: 20 }}/>
      <Text style={HomeStyles.loadingText}>Chargement des données...</Text>
    </View>
  );
  

  return (
    <View style={Cstyles.container}>
      <TopNavBar />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>📚 Mon emploi du temps</Text>
          <Text style={styles.dateText}>Cours du Lundi au Samedi</Text>
        </View>
        {nextCourse && (
          <View style={styles.nextCourseContainer}>
              <View style={MatieresStyles.badgeContainer}>
                <View style={MatieresStyles.badgeIcon}>
                  <Text style={MatieresStyles.badgeIconText}>📖</Text>
                </View>
                <Text style={MatieresStyles.badgeText}>Prochain cours</Text>
                <View style={MatieresStyles.badgeCount}>
                  <Text style={MatieresStyles.badgeCountText}>💻</Text>
                </View>
              </View>
            <View style={styles.nextCourseCard}>
              <Image 
                source={require('../../../assets/classroom.jpg')} 
                style={styles.classroomImage}
                resizeMode="cover"
              />
              <View style={styles.nextCourseInfo}>
                <Text style={styles.nextCourseTitle}>{nextCourse.matiere_libelle}</Text>
                <Text style={styles.nextCourseText}>{nextCourse.enseignant}</Text>
                <Text style={styles.nextCourseText}>{nextCourse.start} - {nextCourse.end}</Text>
                <Text style={styles.nextCourseText}>{nextCourse.salle}</Text>
                <Text style={styles.nextCourseDay}>{nextCourse.day}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Courses Section */}
        {todayCourses.length > 0 && (
          <View style={styles.todayCoursesContainer}>
              <View style={MatieresStyles.sectionHeader}>
                <View style={MatieresStyles.badgeContainer}>
                  <View style={MatieresStyles.badgeIcon}>
                    <Text style={MatieresStyles.badgeIconText}>📖</Text>
                  </View>
                  <Text style={MatieresStyles.badgeText}>Cours du Jour</Text>
                  <View style={MatieresStyles.badgeCount}>
                    <Text style={MatieresStyles.badgeCountText}>🔬</Text>
                  </View>
                </View>
              </View>

            
            {todayCourses.map((course, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.todayCourseCard}
                onPress={() => handleCourseCardPress(course, index)}
                activeOpacity={0.7}
              >
                <Text style={styles.todayCourseTitle}>{course.matiere_libelle}</Text>
                <Text style={styles.todayCourseText}>Prof: {course.enseignant}</Text>
                <Text style={styles.todayCourseTime}>{course.start} - {course.end}</Text>
                 {(() => {
                    const status = getCoursStatus(course.start, course.end);
                    return (
                      <Text
                        style={[
                          status.type == 'warning'
                            ? HomeStyles.statusWarning
                            : status.type == 'primary'
                            ? HomeStyles.statusPrimary
                            : HomeStyles.statusSuccess, 
                            {textAlign: 'left'}
                        ]}
                      >
                        {status.label}
                      </Text>
                    );
                  })()}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter Toggle Buttons */}
        <View style={styles.filterToggleContainer}>
        
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              filterMode === 'calendar' && styles.activeToggleButton
            ]}
            onPress={() => setFilterMode('calendar')}
          >
            <Text style={[
              styles.toggleButtonText,
              filterMode === 'calendar' && styles.activeToggleButtonText
            ]}>
              📅 Calendrier
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              filterMode == 'dropdown' && styles.activeToggleButton
            ]}
            onPress={() => {
              setFilterMode('dropdown');
              setSelectedDate(null);
            }}
          >
            <Text style={[
              styles.toggleButtonText,
              filterMode === 'dropdown' && styles.activeToggleButtonText
            ]}>
              📋 Liste
            </Text>
          </TouchableOpacity>

        </View>

        {/* Dropdown Filter Section */}
        {filterMode == 'dropdown' && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Filtrer par jour</Text>
              <CustomDropdown
                selectedValue={selectedDay}
                onValueChange={handleDropdownDaySelect}
                items={dayItems}
                placeholder="Tous les jours"
              />
            </View>
          </View>
        )}

        {/* Calendar Section */}
        {filterMode == 'calendar' && (
          <CustomCalendar 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        )}

        {/* Clear Filter Button */}
        {(selectedDay || selectedDate) && (
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
            <Text style={styles.clearFilterText}>🗑️ Effacer les filtres</Text>
          </TouchableOpacity>
        )}

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des cours...</Text>
          </View>
        ) : (
          <>
            {/* Schedule Badge */}
            <View style={[MatieresStyles.badgeContainer]}>
              <Text style={[MatieresStyles.badgeText]}>
                {selectedDay ? 
                  (selectedDate ? 
                    `Planning ${selectedDay} ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}` : 
                    `Planning ${selectedDay}`
                  ) : 
                  'Planning hebdomadaire'
                }
              </Text>
              <View style={MatieresStyles.badgeCount}>
                <Text style={MatieresStyles.badgeCountText}>{totalCourses}</Text>
              </View>
            </View>

            {/* Render filtered courses */}
            {filteredCoursesByDay.length > 0 ? (
              filteredCoursesByDay.map((section, index) => (
                <View key={index}>
                  <View style={[MatieresStyles.badgeContainerDays]}>
                    <Text style={[MatieresStyles.badgeText]}>
                      {section.title} 📚
                      {selectedDate && ` - ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`}
                    </Text>
                    <View style={MatieresStyles.badgeCount}>
                      <Text style={MatieresStyles.badgeCountText}>{section.data.length}</Text>
                    </View>
                  </View>
                  {renderCoursesInRows(section.data)}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>Aucun cours trouvé</Text>
                <Text style={styles.emptySubtext}>
                  {selectedDay ? 
                    (selectedDate ? 
                      `Aucun cours programmé pour ${selectedDay} ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}` :
                      `Aucun cours programmé pour ${selectedDay}`
                    ) : 
                    'Aucun cours disponible cette semaine'
                  }
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Matiere Details Modal */}
      <MatiereDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        matiere={selectedMatiere}
        courses={selectedMatiereCourses as any}
        nextCourse={selectedMatiere ? getNextCourseForMatiere(selectedMatiere.id) : null}
        totalCourses={selectedMatiereCourses.length}
        todayCourses={selectedMatiere ? 
          coursesByDay
            ?.filter((d: any) => {
              const today = new Date();
              const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
              return d.title === dayNames[today.getDay()];
            })
            .flatMap((d: any) => d.data || [])
            .filter((c: Slot) => c.matiere_id === selectedMatiere.id).length || 0
          : 0
        }
        matiereIndex={selectedMatiereIndex}
      />

      <BottomNavBar activeScreen={'AllCoursesStudent'} />
    </View>
  );
}