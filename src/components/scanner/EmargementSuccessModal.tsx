import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Dimensions, StyleSheet, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc, arrayUnion, query, getDocs, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface EmargementSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  courseLibelle: string;
  start: string;
  end: string;
  enseignant: string;
  matiereId: string;
  userRole: string;
  userDocId?: string;
  classId?: string;
}

// Function to calculate hours between two times
const calculateHours = (start: string, end: string): number => {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return parseFloat((durationMinutes / 60).toFixed(2));
};

export const EmargementSuccessModal: React.FC<EmargementSuccessModalProps> = ({ 
  visible, 
  onClose, 
  courseLibelle, 
  start, 
  end, 
  enseignant, 
  matiereId,
  userRole,
  userDocId,
  classId
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 5000);
    } else {
      // Clear timeout if modal is hidden
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, onClose]);


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Lottie Success Animation */}
          <LottieView 
            source={require('../../assets/Success.json')} 
            autoPlay 
            loop={true} 
            style={{ width: 170, height: 170 }} 
          />
          
          {/* Course Information */}
          <View style={styles.contentContainer}>
            <Text style={styles.courseTitle}>{courseLibelle}</Text>
            <View style={styles.courseDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🕐</Text>
                <Text style={styles.detailText}>{start} - {end}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>👨‍🏫</Text>
                <Text style={styles.detailText}>{enseignant}</Text>
              </View>
            </View>
            <Text style={styles.successMessage}>
              Vous avez émargé le cours avec succès
            </Text>
          </View>
          
          {/* IIBS Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/iibs-logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.smalltext}>Retour dans 5 secondes...</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    width: screenWidth * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 15,
  },
  courseDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  successMessage: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  logoText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  smalltext: {
    fontSize: 11,
    color: '#000000',
  },
});