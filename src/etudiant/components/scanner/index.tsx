import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Overlay } from './overlay';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { EmargementSuccessModal } from './EmargementSuccessModal';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // adjust path
import AsyncStorage from '@react-native-async-storage/async-storage';
type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

export default function Scanner({ navigation, route }: Props) {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [courseInfo, setCourseInfo] = useState<{
    matiere_id: string;
    libelle: string;
    start: string;
    end: string;
    enseignant: string;
    salle: string;
  } | null>(null);

  // FIXED: Extract the callback properly
  const { matiereId, courseLibelle, courseInfo: routeCourseInfo } = route.params; 

  const lastScanTime = useRef<number>(0);
  const SCAN_COOLDOWN = 2000;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }

    setScanned(false);
    setIsProcessing(false);
    lastScanTime.current = 0;

    if (routeCourseInfo) {
      setCourseInfo({
        matiere_id: matiereId,
        libelle: courseLibelle || 'Cours',
        start: routeCourseInfo.start,
        end: routeCourseInfo.end,
        enseignant: routeCourseInfo.enseignant,     
        salle: routeCourseInfo.salle   
      });
    }

    return () => {
      setScanned(false);
      setIsProcessing(false);
      setToast(null);
    };
  }, [permission, matiereId, routeCourseInfo]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Permission caméra non accordée</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Demander la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

const saveEmargedCourse = async (
  matiere_id: string,
  matiere_libelle: string,
  start: string,
  end: string,
  salle: string
) => {
  try {
      const userLogin = await AsyncStorage.getItem("userLogin");
      if (!userLogin) throw new Error("No user matricule found");

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("login", "==", userLogin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("User not found in Firestore");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const enseignant = courseInfo?.enseignant;

      const emargement = {
        matiere_id,
        matiere_libelle,
        enseignant,
        start,
        end,
        date: new Date().toDateString(),
        type: "presence",
        timestamp: new Date(),
        salle,
      };


      const currentEmargements = userData.emargements || [];

      const filtered = currentEmargements.filter((e: any) => {
        return !(
          e.matiere_id == emargement.matiere_id &&
          e.matiere_libelle == emargement.matiere_libelle &&
          e.enseignant == emargement.enseignant &&
          e.start == emargement.start &&
          e.end == emargement.end &&
          e.date == emargement.date &&
          e.type == emargement.type &&
          e.salle == emargement.salle
        );
      });

      const updatedEmargements = [...filtered, emargement];

      await setDoc(
        userDoc.ref,
        { emargements: updatedEmargements },
        { merge: true }
      );

    } catch (error) {
      console.error("Error saving emargement:", error);
    }
};


  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    const currentTime = Date.now();
    
    if (scanned || isProcessing) {
      return;
    }

    if (currentTime - lastScanTime.current < SCAN_COOLDOWN) {
      return;
    }

    setScanned(true);
    setIsProcessing(true);
    lastScanTime.current = currentTime;

    try {
      if (data.startsWith('EMARGER:')) {
        const finalCourseInfo = courseInfo || {
          matiere_id: matiereId,
          libelle: courseLibelle || 'Cours',
          start: routeCourseInfo?.start || '08:00',
          end: routeCourseInfo?.end || '10:00',
          enseignant: routeCourseInfo?.enseignant || 'Enseignant',
          type: 'presence',
          salle: routeCourseInfo?.salle as string
        };
        
        setCourseInfo(finalCourseInfo);

        saveEmargedCourse(finalCourseInfo.matiere_id, finalCourseInfo.libelle, finalCourseInfo.start, finalCourseInfo.end, finalCourseInfo.salle)

        setShowSuccessModal(true);
      } else {
        Alert.alert('QR code invalide pour ce cours');
        resetScanStates();
      }
    } catch (error) {
      console.error('Emargement error:', error);
      Alert.alert('Erreur lors de l\'émargement');
      resetScanStates();
    }
  };

  const resetScanStates = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  // FIXED: Only navigate back when modal closes
  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Navigate back to Home after modal closes
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <Overlay />

      <View style={styles.buttonContainer}>
        <Text style={styles.instruction}>
          Scanner le QR code pour émarger
        </Text>
      </View>

      {scanned && !showSuccessModal && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetScanStates}
        >
          <Text style={styles.resetButtonText}>Scanner à nouveau</Text>
        </TouchableOpacity>
      )}

      {isProcessing && !showSuccessModal && (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>Traitement en cours...</Text>
        </View>
      )}

      <EmargementSuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        courseLibelle={courseInfo?.libelle || courseLibelle || 'Cours'}
        start={courseInfo?.start || '08:00'}
        end={courseInfo?.end || '10:00'}
        enseignant={courseInfo?.enseignant || 'Enseignant'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  courseInfo: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 10,
  },
  text: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 10,
  },
  resetButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});