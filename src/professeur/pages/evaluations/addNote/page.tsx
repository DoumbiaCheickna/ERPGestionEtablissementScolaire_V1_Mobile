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
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import TopNavBar from '../../../../components/layout/topBar';
import BottomNavBar from '../../../../components/layout/bottomBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/index';
import { db } from '../../../../firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { localStyles } from './styles'

import { 
  collection, 
  query, 
  where,
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion,
  getDocs,
  setDoc,
  arrayRemove,
  getDoc,
  addDoc
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import {  Cstyles as styles } from '../../enseignments/styles'; 
import { MatieresStyles } from '../../enseignments/styles';
import { Cstyles } from '../../allCourses/styles';

const { width: screenWidth } = Dimensions.get('window');

// Interfaces
interface Student {
  id: string;
  nom: string;
  prenom: string;
  login: string;
  email?: string;
  classe: string;
  telephone?: string;
}

interface Evaluation {
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
  created_at: Date;
  notes: NoteEntry[];
}

interface NoteEntry {
  student_id: string;
  student_name: string;
  note: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddNote'>;

export default function AddNote({ navigation }: Props) {
  const route = useRoute();
  const { evaluation }: any = route.params;
  const [loading, setLoading] = useState(true);
  const [alreadyLoaded, setAlreadyLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluationDocId, setEvaluationDocId] = useState('');
  const [studentNotes, setStudentNotes] = useState<Record<string, number>>({});

  const [students, setStudents] = useState<Student[]>([]);
 
  useEffect(() => {
    initializeUser();
    fetchStudents();
    fetchEvaluationAndNotes();
  }, [evaluation?.classe_id]);

  const fetchEvaluationAndNotes = async () => {
    try {
      const evaluationsRef = collection(db, "evaluations");
      
      const q = query(
        evaluationsRef,
        where("evaluationId", "==", evaluation.evaluationId),
        where("date", "==", evaluation.date),
        where("prof_id", "==", evaluation.prof_id),
        where("matiere_id", "==", evaluation.matiere_id),
        where("matiere_libelle", "==", evaluation.matiere_libelle)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const evalDoc = querySnapshot.docs[0];
        setEvaluationDocId(evalDoc.id);
        
        // Load existing notes
        const evalData = evalDoc.data();
        if (evalData.notes && Array.isArray(evalData.notes)) {
          const notesMap: Record<string, number> = {};
          evalData.notes.forEach((note: NoteEntry) => {
            notesMap[note.student_id] = note.note;
          });
          setStudentNotes(notesMap);
        }
      } else {
        Alert.alert("Erreur", "Évaluation non trouvée");
      }
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      Alert.alert("Erreur", "Impossible de charger l'évaluation");
    }
  };

  const fetchStudents = async () => {
    if (!evaluation?.classe_id) return;

    if (!alreadyLoaded) {
      setLoading(true);
    }
    try {
      const usersRef = collection(db, "users");

      const q1 = query(
        usersRef,
        where("role_libelle", "==", "Etudiant"),
        where("classe_id", "==", evaluation.classe_id)
      );

      const q2 = query(
        usersRef,
        where("role_libelle", "==", "Etudiant"),
        where("classe2_id", "==", evaluation.classe_id)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const studentsMap = new Map<string, Student>();

      // Helper to add student without duplicates
      const addStudent = (doc: any) => {
        const data = doc.data();
        studentsMap.set(doc.id, {
          id: doc.id,
          nom: data.nom || "",
          prenom: data.prenom || "",
          login: data.login || "",
          email: data.email || "",
          classe: data.classe || "",
          telephone: data.telephone || ""
        });
      };

      snap1.forEach(addStudent);
      snap2.forEach(addStudent);

      // Convert map → array
      const studentsData = Array.from(studentsMap.values());

      // Sort students by last name, then first name
      studentsData.sort((a, b) => {
        const lastNameCompare = a.nom.localeCompare(b.nom);
        if (lastNameCompare === 0) {
          return a.prenom.localeCompare(b.prenom);
        }
        return lastNameCompare;
      });

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      Alert.alert("Erreur", "Impossible de charger les étudiants");
    } finally {
      setLoading(false);
      setAlreadyLoaded(true);
    }
  };

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
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
    fetchEvaluationAndNotes();
    setRefreshing(false);
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0).toUpperCase()}${nom.charAt(0).toUpperCase()}`;
  };

  const getAvatarColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    return colors[index % colors.length];
  };

  const openNoteModal = (student: Student) => {
    setSelectedStudent(student);
    if (studentNotes[student.id]) {
      setNoteValue(studentNotes[student.id].toString());
    } else {
      setNoteValue('');
    }
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedStudent(null);
    setNoteValue('');
  };

  const addNoteForStudent = async () => {
    if (!selectedStudent) return;
    if (!evaluationDocId) {
      Alert.alert("Erreur", "Document d'évaluation introuvable");
      return;
    }

    // Validate note
    const note = parseFloat(noteValue);
    if (isNaN(note) || note < 0 || note > 20) {
      Alert.alert('Erreur', 'Veuillez entrer une note valide entre 0 et 20');
      return;
    }

    setSubmitting(true);
    try {
      const evaluationRef = doc(db, "evaluations", evaluationDocId);
      
      // Get current evaluation data
      const evalDoc = await getDoc(evaluationRef);
      if (!evalDoc.exists()) {
        Alert.alert("Erreur", "Évaluation non trouvée");
        return;
      }

      const currentData = evalDoc.data();
      const currentNotes: NoteEntry[] = currentData.notes || [];

      // Check if student already has a note
      const existingNoteIndex = currentNotes.findIndex(
        (n: NoteEntry) => n.student_id === selectedStudent.id
      );

      const newNoteEntry: NoteEntry = {
        student_id: selectedStudent.id,
        student_name: `${selectedStudent.prenom} ${selectedStudent.nom}`,
        note: note
      };

      let updatedNotes: NoteEntry[];
      if (existingNoteIndex >= 0) {
        // Update existing note
        updatedNotes = [...currentNotes];
        updatedNotes[existingNoteIndex] = newNoteEntry;
      } else {
        // Add new note
        updatedNotes = [...currentNotes, newNoteEntry];
      }

      // Update Firestore
      await updateDoc(evaluationRef, {
        notes: updatedNotes
      });

      // Update local state
      setStudentNotes(prev => ({
        ...prev,
        [selectedStudent.id]: note
      }));

      Alert.alert(
        'Succès', 
        existingNoteIndex >= 0 
          ? 'La note a été mise à jour avec succès' 
          : 'La note a été ajoutée avec succès'
      );

      closeNoteModal();
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Erreur', "Impossible d'ajouter la note");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../../assets/Book loading.json')}
          autoPlay
          loop={true}
          style={{ width: 170, height: 170 }}
        />
        <Image 
          source={require('../../../../assets/logo8.png')} 
          style={{ width: 250, height: 250, marginTop: -50 }}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Chargement des étudiants...</Text>
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
              <Text style={styles.headerTitle}>Ajouter des notes</Text>
              <Text style={styles.headerSubtitle}>{evaluation.classe_libelle}</Text>
              <Text style={styles.headerSubtitle}>{evaluation.titre}</Text>
            </View>
            
            <View style={styles.headerRight}>
              <Text style={styles.studentCount}>{students.length}</Text>
            </View>
          </View>
  
          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {students.length > 0 ? (
              <View style={styles.studentsList}>
                {students.map((student, index) => (
                  <TouchableOpacity
                    key={student.id}
                    style={styles.studentCard}
                    activeOpacity={0.7}
                    onPress={() => openNoteModal(student)}
                  >
                    {/* Avatar */}
                    <View 
                      style={[
                        styles.avatar,
                        { backgroundColor: getAvatarColor(index) }
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {getInitials(student.nom, student.prenom)}
                      </Text>
                    </View>
                    
                    {/* Student Info */}
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {student.prenom} {student.nom}
                      </Text>
                      <Text style={styles.studentLogin}>@{student.login}</Text>
                      {studentNotes[student.id] !== undefined && (
                        <Text style={localStyles.existingNote}>
                          Note: {studentNotes[student.id]}/20
                        </Text>
                      )}
                    </View>
                    
                    {/* Note indicator or Arrow */}
                    {studentNotes[student.id] !== undefined ? (
                      <View style={localStyles.noteIndicator}>
                        <Text style={localStyles.noteIndicatorText}>
                          {studentNotes[student.id]}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.arrow}>›</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Aucun étudiant trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  Cette classe ne contient aucun étudiant pour le moment
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchStudents}
                >
                  <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
          
      </ScrollView>

      {/* Add Note Modal */}
      <Modal 
        visible={showNoteModal} 
        animationType="slide" 
        transparent={true}
        onRequestClose={closeNoteModal}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            {/* Modal Header */}
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>Ajouter une note</Text>
              <TouchableOpacity onPress={closeNoteModal}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Student Info */}
            {selectedStudent && (
              <View style={localStyles.studentInfoBox}>
                <View 
                  style={[
                    localStyles.modalAvatar,
                    { backgroundColor: getAvatarColor(students.findIndex(s => s.id === selectedStudent.id)) }
                  ]}
                >
                  <Text style={localStyles.modalAvatarText}>
                    {getInitials(selectedStudent.nom, selectedStudent.prenom)}
                  </Text>
                </View>
                <View style={localStyles.studentDetails}>
                  <Text style={localStyles.studentNameModal}>
                    {selectedStudent.prenom} {selectedStudent.nom}
                  </Text>
                  <Text style={localStyles.studentLoginModal}>
                    @{selectedStudent.login}
                  </Text>
                </View>
              </View>
            )}

            {/* Note Input */}
            <View style={localStyles.inputContainer}>
              <Text style={localStyles.inputLabel}>Note (sur 20)</Text>
              <TextInput
                style={localStyles.input}
                placeholder="Ex: 15.5"
                keyboardType="decimal-pad"
                value={noteValue}
                onChangeText={setNoteValue}
                maxLength={5}
                autoFocus={true}
              />
              <Text style={localStyles.inputHint}>
                Entrez une note entre 0 et 20
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={localStyles.buttonContainer}>
              <TouchableOpacity 
                style={localStyles.cancelButton}
                onPress={closeNoteModal}
                disabled={submitting}
              >
                <Text style={localStyles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  localStyles.submitButton,
                  submitting && localStyles.submitButtonDisabled
                ]}
                onPress={addNoteForStudent}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={localStyles.submitButtonText}>
                    {studentNotes[selectedStudent?.id || ''] !== undefined ? 'Modifier' : 'Ajouter'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar activeScreen="AddNote" />
    </View>
  );
}

