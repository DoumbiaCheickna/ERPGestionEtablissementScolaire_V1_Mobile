import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  ScrollView,
  Pressable,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { db, getUserSnapchot } from '../../../firebaseConfig';
import { styles } from './styles';
import AbsenceJustificationModal from './AbsenceJustificationModal';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Absences'>;

interface AbsenceData {
  matiere_libelle: string;
  matiere_id: string;
  nom_complet: string;
  matricule: string;
  timestamp: Date;
  type: string;
  start: string;
  date: string;
  end: string;
  enseignant?: string;
  salle?: string;
  annee?: string;
  semestre?: string;
  isHidden?: boolean;
  justification: {
    contenu: string;
    documents: string;
    dateJustification: string;
    statut: string;
  }
}

export default function Absences({ navigation }: Props) {
  const [absences, setAbsences] = useState<AbsenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userMatricule, setUserMatricule] = useState('');

  const refreshAbsences = () => {
    getAbsences();
  };


  const getAbsences = useCallback(async () => {
    try {
      const userSnap = await getUserSnapchot();
      const userDoc = userSnap?.docs[0];
      const userData = userDoc?.data();

      if (!userData?.matricule) {
        setAbsences([]);
        setUserMatricule('');
        return;
      }

      const matricule = userData.matricule;
      setUserMatricule(matricule);

      const emargementsRef = collection(db, 'emargements');
      const querySnapshot = await getDocs(emargementsRef);

      if (querySnapshot.empty) {
        setAbsences([]);
        return;
      }

      let userEmargements: AbsenceData[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data[matricule] && Array.isArray(data[matricule])) {
          userEmargements = [...userEmargements, ...data[matricule]];
        }
      });

      const absencesList = userEmargements
        .filter((emargement) => emargement.type === 'absence' && !emargement.isHidden)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.date);
          const dateB = new Date(b.timestamp || b.date);
          return dateB.getTime() - dateA.getTime();
        });

      setAbsences(absencesList);
    } catch (err) {
      console.error('Error fetching absences:', err);
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserMatricule = useCallback(async () => {
    try {
      const userSnap = await getUserSnapchot();
      const userDoc = userSnap?.docs[0];
      const userData = userDoc?.data();
      
      if (userData?.matricule) {
        setUserMatricule(userData.matricule);
      }
    } catch (error) {
      console.error('Error getting user matricule:', error);
    }
  }, []);

  useEffect(() => {
    getAbsences();
    getUserMatricule();
  }, [getAbsences, getUserMatricule]);

  const handleAbsenceTap = useCallback((absence: AbsenceData) => {
    setSelectedAbsence(absence);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedAbsence(null);
  }, []);

  const formatTime = useCallback((timestamp: any) => {
    if (!timestamp) return 'Date inconnue';
    
    try {
      const absenceDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - absenceDate.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) {
        return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
      } else if (diffInHours > 0) {
        return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
      } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        if (diffInMinutes > 0) {
          return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
        }
        return 'Il y a quelques instants';
      }
    } catch (err) {
      return 'Date inconnue';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  }, []);

  const AbsenceItem = React.memo(({ absence }: { absence: AbsenceData }) => {
    return (
      <View style={styles.swipeContainer}>
        <Pressable
          onPress={() => handleAbsenceTap(absence)}
          style={({ pressed }) => [
            styles.absenceItem,
            pressed && styles.pressedAbsence,
          ]}
        >
          <View style={styles.absenceContent}>
            <View style={styles.absenceHeader}>
              <Text style={styles.absenceTitle}>{absence.matiere_libelle}</Text>
              {absence.justification?.statut !== "Approuvée" && (
                <View style={styles.absenceBadge}>
                  <Text style={styles.absenceBadgeText}>ABSENCE</Text>
                </View>
              )}
            </View>

            <Text style={styles.absenceTime}>
              {absence.start} - {absence.end}
            </Text>

            <Text style={styles.absenceDate}>
              {formatDate(absence.date)}
            </Text>

            {absence.enseignant && (
              <Text style={styles.absenceTeacher}>
                Prof: {absence.enseignant}
              </Text>
            )}

            {absence.salle && (
              <Text style={styles.absenceRoom}>
                Salle: {absence.salle}
              </Text>
            )}

            <Text style={styles.absenceTimestamp}>
              {formatTime(absence.timestamp)}
            </Text>

            {absence.justification?.statut == 'Approuvée' ? (
              <View style={styles.absenceBadgeJustified}>
                <Text style={styles.absenceBadgeTextJustified}>Absence Justifiée</Text>
              </View>
            ) : absence.justification?.statut == 'En cours' ? (
              <View style={styles.absenceBadgeWaiting}>
                <Text style={styles.absenceBadgeTextWaiting}>En cours</Text>
              </View>
            ) : absence.justification?.statut == 'Rejetée' ? (
              <View style={styles.absenceBadgeRejected}>
                <Text style={styles.absenceBadgeTextRejected}>Rejetée</Text>
              </View>
            ) : (
              <Text style={{color: 'red', fontSize: 10}}>
                Veuillez justifier l'absence
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    );
  });

  if (loading) {
    return (
        <View style={styles.safeArea}>
            <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Absences</Text>
            </View>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#666" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
            </SafeAreaView>
        </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Absences ({absences.length})</Text>
        </View>

        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {absences.length > 0 ? (
            absences.map((absence, index) => (
              <AbsenceItem 
                key={`${absence.matiere_id}_${absence.date}_${absence.start}_${index}`}
                absence={absence}
              />
            ))
          ) : (
            <View style={styles.noAbsencesContainer}>
              <MaterialCommunityIcons name="calendar-check" size={40} color="gray" />
              <Text style={styles.noAbsencesText}>Aucune absence enregistrée</Text>
            </View>
          )}
        </ScrollView>

        <AbsenceJustificationModal
          visible={modalVisible}
          absence={selectedAbsence}
          onClose={handleCloseModal}
          userMatricule={userMatricule}
          refreshAbsences={getAbsences}
        />
      </SafeAreaView>
    </View>
  );
}
