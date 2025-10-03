import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  RefreshControl,
  Dimensions,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import BottomNavBar from '../../../components/layout/bottomBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { db } from '../../../firebaseConfig';
import { 
  collection, 
  query, 
  where,
  getDocs,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import {  Cstyles as styles } from '../../../professeur/pages/enseignments/styles'; 
import { MatieresStyles } from '../../../professeur/pages/enseignments/styles';
import { localStyles } from './styles'

const { width: screenWidth } = Dimensions.get('window');

interface NoteEntry {
  student_id: string;
  student_name: string;
  note: number;
  matricule?: string;
}

interface EvaluationWithNote {
  id: string;
  evaluationId: string;
  classe_id: string;
  classe_libelle: string;
  matiere_id: string;
  matiere_libelle: string;
  titre: string;
  description: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  prof_id: string;
  created_at: any;
  myNote: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'VoirNote'>;

export default function VoirNote({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [alreadyLoaded, setAlreadyLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [evaluationsWithNotes, setEvaluationsWithNotes] = useState<EvaluationWithNote[]>([]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMyNotes();
    }
  }, [currentUserId]);

  const initializeUser = async () => {
    try {
      const userLogin = await AsyncStorage.getItem('userLogin');
      if (userLogin) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('login', '==', userLogin));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setCurrentUserId(querySnapshot.docs[0].id);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      Alert.alert("Erreur", "Impossible de récupérer l'utilisateur");
    }
  };

  const fetchMyNotes = async () => {
    if (!currentUserId) return;

    if(!alreadyLoaded){
      setLoading(true)
    }

    try {
      const classe_id = await AsyncStorage.getItem("classe_id");
      
      if (!classe_id) {
        Alert.alert("Erreur", "Classe non trouvée");
        setLoading(false);
        return;
      }

      const evaluationsRef = collection(db, "evaluations");
      const q = query(
        evaluationsRef,
        where("classe_id", "==", classe_id)
      );

      const querySnapshot = await getDocs(q);
      
      const evaluationsWithMyNotes: EvaluationWithNote[] = [];

      querySnapshot.forEach((doc) => {
        const evalData = doc.data();
        
        if (evalData.notes && Array.isArray(evalData.notes)) {
          const myNoteEntry = evalData.notes.find(
            (note: NoteEntry) => note.student_id === currentUserId
          );
          
          
          if (myNoteEntry) {
            evaluationsWithMyNotes.push({
              id: doc.id,
              evaluationId: evalData.evaluationId || '',
              classe_id: evalData.classe_id || '',
              classe_libelle: evalData.classe_libelle || '',
              matiere_id: evalData.matiere_id || '',
              matiere_libelle: evalData.matiere_libelle || '',
              titre: evalData.titre || '',
              description: evalData.description || '',
              date: evalData.date || '',
              heure_debut: evalData.heure_debut || '',
              heure_fin: evalData.heure_fin || '',
              prof_id: evalData.prof_id || '',
              created_at: evalData.created_at,
              myNote: myNoteEntry.note
            });
          }
        }
      });

      evaluationsWithMyNotes.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return b.created_at.toMillis() - a.created_at.toMillis();
        }
        return 0;
      });

      setEvaluationsWithNotes(evaluationsWithMyNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      Alert.alert("Erreur", "Impossible de charger vos notes");
    } finally {
      setLoading(false);
      setAlreadyLoaded(true)
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyNotes();
    setRefreshing(false);
  };

  const getNoteColor = (note: number) => {
    if (note >= 0 && note <= 6) {
      return '#FF4444'; // Red
    } else if (note >= 7 && note <= 11) {
      return '#FF9500'; // Orange
    } else if (note >= 12 && note <= 20) {
      return '#4CAF50'; // Green
    }
    return '#666'; // Default
  };

  const getNoteStatus = (note: number) => {
    if (note >= 0 && note <= 6) {
      return 'Insuffisant';
    } else if (note >= 7 && note <= 11) {
      return 'Passable';
    } else if (note >= 12 && note <= 20) {
      return 'Bien';
    }
    return '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        <Text style={styles.loadingText}>Chargement de vos notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={MatieresStyles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Mes notes</Text>
              <Text style={styles.headerSubtitle}>
                {evaluationsWithNotes.length} évaluation{evaluationsWithNotes.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleRefresh}>
                <Ionicons name="refresh" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
  
          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {evaluationsWithNotes.length > 0 ? (
              <View style={styles.studentsList}>
                {evaluationsWithNotes.map((evaluation) => (
                  <View key={evaluation.id} style={noteDetailsStyles.evaluationContainer}>
                    {/* Main Card */}
                    <View style={styles.studentCard}>
                      {/* Evaluation Info */}
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {evaluation.titre}
                        </Text>
                        <Text style={styles.studentLogin}>
                          {evaluation.matiere_libelle}
                        </Text>
                        <Text style={noteDetailsStyles.dateText}>
                          {evaluation.date} • {evaluation.heure_debut} - {evaluation.heure_fin}
                        </Text>
                      </View>
                      
                      {/* Note indicator */}
                      <View style={[localStyles.noteIndicator, { backgroundColor: getNoteColor(evaluation.myNote) }]}>
                        <Text style={localStyles.noteIndicatorText}>
                          {evaluation.myNote}
                        </Text>
                        <Text style={noteDetailsStyles.noteMaxText}>/20</Text>
                      </View>
                    </View>

                    {/* Details Card */}
                    <View style={noteDetailsStyles.detailsCard}>
                      <View style={noteDetailsStyles.detailRow}>
                        <Ionicons name="school-outline" size={20} color="#666" />
                        <Text style={noteDetailsStyles.detailLabel}>Classe:</Text>
                        <Text style={noteDetailsStyles.detailValue}>{evaluation.classe_libelle}</Text>
                      </View>

                      {evaluation.description && (
                        <View style={noteDetailsStyles.descriptionContainer}>
                          <Ionicons name="document-text-outline" size={20} color="#666" />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={noteDetailsStyles.descriptionLabel}>Description:</Text>
                            <Text style={noteDetailsStyles.descriptionText}>
                              {evaluation.description}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Performance Bar */}
                      <View style={noteDetailsStyles.performanceSection}>
                        <Text style={noteDetailsStyles.performanceLabel}>Performance</Text>
                        <View style={noteDetailsStyles.progressBarContainer}>
                          <View 
                            style={[
                              noteDetailsStyles.progressBar, 
                              { 
                                width: `${(evaluation.myNote / 20) * 100}%`,
                                backgroundColor: getNoteColor(evaluation.myNote)
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[noteDetailsStyles.performanceStatus, { color: getNoteColor(evaluation.myNote) }]}>
                          {getNoteStatus(evaluation.myNote)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>Aucune note disponible</Text>
                <Text style={styles.emptySubtitle}>
                  Vos notes apparaîtront ici une fois qu'elles seront ajoutées par vos professeurs
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <BottomNavBar activeScreen="VoirNote" />
    </View>
  );
}

const noteDetailsStyles = StyleSheet.create({
  evaluationContainer: {
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  performanceSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  performanceStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noteMaxText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
    marginTop: 2,
  },
});