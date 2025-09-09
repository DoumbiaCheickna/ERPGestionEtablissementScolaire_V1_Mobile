// src/components/modals/MatiereDetailsModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');


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
}

interface MatiereDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  matiere: Matiere | null;
  courses: Course[];
  nextCourse: Course | null;
  totalCourses: number;
  todayCourses: number;
  matiereIndex: number;
}

const MatiereDetailsModal: React.FC<MatiereDetailsModalProps> = ({
  visible,
  onClose,
  matiere,
  courses,
  nextCourse,
  totalCourses,
  todayCourses,
  matiereIndex
}) => {
  if (!matiere) return null;
  

  const getMatiereIcon = (index: number) => {
    const icons = ['💻', '📊', '🔬', '🎨', '📐', '📚'];
    return icons[index % icons.length];
  };

  // Check if course has ended
  const isCourseEnded = (course: Course | null) => {
    if (!course || !course.end) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    try {
      const endTimeParts = course.end.split(':');
      const endHours = parseInt(endTimeParts[0]);
      const endMinutes = parseInt(endTimeParts[1]);
      const courseEndTime = endHours * 60 + endMinutes;
      
      return currentTime > courseEndTime;
    } catch (error) {
      return false;
    }
  };

  const isToday = (courseDay: any) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayDay = dayOfWeek + 1
    return todayDay == courseDay;

  }

  const courseEnded = nextCourse && isCourseEnded(nextCourse);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalCard}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>
                {getMatiereIcon(matiereIndex)}
              </Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {matiere.title}
              </Text>
              <Text style={styles.professor}>
                👨‍🏫 {matiere.professeurFullName}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalCourses}</Text>
              <Text style={styles.statLabel}>Cours Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{todayCourses}</Text>
              <Text style={styles.statLabel}>Aujourd'hui</Text>
            </View>
          </View>

          {/* Next Course, Ended Course, or No Course */}
          {nextCourse ? (
            courseEnded && isToday(nextCourse.day)  ? (
              <View style={styles.endedCourse}>
                <Text style={styles.endedLabel}>✅ Cours Aujourd'hui terminé</Text>
                <View style={styles.courseDetails}>
                  <Text style={styles.courseTime}>
                    🕐 {nextCourse.start} - {nextCourse.end}
                  </Text>
                  <Text style={styles.courseLocation}>
                    📍 {nextCourse.salle}
                  </Text>
                  <Text style={styles.courseType}>
                    📖 {nextCourse.type}
                  </Text>
                </View>
              </View>
            ) :  (
              <View style={styles.nextCourse}>
                <Text style={styles.nextLabel}>🔔 Prochain Cours</Text>
                <View style={styles.courseDetails}>
                  <Text style={styles.courseTime}>
                    🕐 {nextCourse.start} - {nextCourse.end}
                  </Text>
                  <Text style={styles.courseLocation}>
                    📍 {nextCourse.salle}
                  </Text>
                  <Text style={styles.courseType}>
                    📖 {nextCourse.day}
                  </Text>
                </View>
              </View>
            )
          ) : (
            <View style={styles.noCourse}>
              <Text style={styles.noCourseText}>😴 Pas de cours aujourd'hui</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: width - 40,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 40,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 28,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    lineHeight: 22,
  },
  professor: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary || '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  nextCourse: {
    backgroundColor: '#E8F5E8',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  nextLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  courseDetails: {
    gap: 8,
  },
  courseTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  courseLocation: {
    fontSize: 14,
    color: '#666',
  },
  courseType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  noCourse: {
    backgroundColor: '#FFF3E0',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noCourseText: {
    fontSize: 16,
    color: '#F57C00',
    fontWeight: '500',
  },
  endedCourse: {
    backgroundColor: '#F0F8F0',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  endedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
});

export default MatiereDetailsModal;