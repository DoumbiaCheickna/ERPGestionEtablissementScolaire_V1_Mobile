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
  TextInput
} from 'react-native';
import TopNavBar from '../../../components/layout/topBar';
import BottomNavBar from '../../../components/layout/bottomBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { db } from '../../../firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './styles';

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
  getDoc
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { MatieresStyles } from '../../../etudiant/pages/matieres/styles';

const { width: screenWidth } = Dimensions.get('window');

// Interfaces
interface Classe {
  classe_id: string;
  classe_libelle: string;
  filiere_id: string;
  filiere_libelle: string;
  matieres_ids: string[];
  matieres_libelles: string[];
}

interface Matiere {
  matiere_id: string;
  matiere_libelle: string;
}

interface Evaluation {
  id: string;
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
}

interface Slot {
  matiere_id: string;
  matiere_libelle: string;
  day: number;
  start: string;
  end: string;
  enseignant: string;
  salle: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Evaluations'>;

export default function Evaluations({ navigation }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMatiereModal, setShowMatiereModal] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [availableMatieres, setAvailableMatieres] = useState<Matiere[]>([]);
  
  
  // Form states
  const [evaluationTitle, setEvaluationTitle] = useState('');
  const [evaluationDescription, setEvaluationDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [evaluationStartTime, setEvaluationStartTime] = useState('');
  const [evaluationEndTime, setEvaluationEndTime] = useState('');
  const [evaluationType, setEvaluationType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluationDate, setEvaluationDate] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const evaluationTypes = ['Devoir', 'Examen'];

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);


  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadProfessorClasses();
      const unsubscribe = setupEvaluationsListener();
      return unsubscribe;
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
    }
  };


    const handleCancelEvaluation = async (evaluationId: string, classDocId: string) => {
        Alert.alert(
            "Confirmer l'annulation",
            "Êtes-vous sûr de vouloir annuler cette évaluation ?",
            [
            { text: "Non", style: "cancel" },
            { 
                text: "Oui", 
                style: "destructive",
                onPress: async () => {
                try {
                    const evalDocRef = doc(db, "evaluations", classDocId);

                    const docSnap = await getDoc(evalDocRef);
                    if (!docSnap.exists()) {
                        Alert.alert("Erreur", "Évaluation introuvable dans la base de données.");
                        return;
                    }
                                        
                    const evalDocData = (await docSnap.data()) as any;

                    if (!evalDocData || !Array.isArray(evalDocData.evaluations)) {
                    Alert.alert("Erreur", "Évaluation introuvable.");
                    return;
                    }

                    const evalToRemove = evalDocData.evaluations.find(
                    (e: any) => e.evaluationId === evaluationId
                    );

                    if (!evalToRemove) {
                    Alert.alert("Erreur", "Évaluation introuvable dans la base de données.");
                    return;
                    }

                    // Remove it
                    await updateDoc(evalDocRef, {
                    evaluations: arrayRemove(evalToRemove)
                    });

                    Alert.alert("Succès", "Évaluation annulée !");
                } catch (error) {
                    console.error(error);
                    Alert.alert("Erreur", "Impossible d'annuler l'évaluation.");
                }
                }
            }
            ]
        );
    };

    
    const handleAddNote = async (evaluationId: string, classe_id: string) => {

    }





  const loadProfessorClasses = async () => {
    try {
      const affectationsRef = collection(db, 'affectations_professeurs');
      const q = query(affectationsRef, where('prof_doc_id', '==', currentUserId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const affectationDoc = querySnapshot.docs[0];
        const affectationData = affectationDoc.data();
        setClasses(affectationData.classes || []);
      }
    } catch (error) {
      console.error('Error loading professor classes:', error);
    }
  };

    const setupEvaluationsListener = () => {
        const evaluationsRef = collection(db, 'evaluations');

        return onSnapshot(evaluationsRef, (querySnapshot) => {
            let evaluationsData: Evaluation[] = [];

            querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.evaluations && Array.isArray(data.evaluations)) {
                const filtered = data.evaluations.filter(
                (evalItem: any) => evalItem.prof_id === currentUserId
                );
                evaluationsData.push(
                ...filtered.map((evalItem: any) => ({
                    id: evalItem.evaluationId,
                    ...evalItem
                }))
                );
            }
            });

            evaluationsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setEvaluations(evaluationsData);
            setLoading(false);
            setRefreshing(false);

        }, (error) => {
            console.error('Error fetching evaluations:', error);
            setLoading(false);
            setRefreshing(false);
        });
        };



    const handleRefresh = () => {
        setRefreshing(true);
        loadProfessorClasses();
    };

    const handleCreateEvaluation = () => {
        setShowCreateModal(true);
        setShowClassModal(true);
    };

  const handleClassSelect = async (classe: Classe) => {
    setSelectedClasse(classe);
    setShowClassModal(false);
    
    // Load matieres for this class from EDT
    try {
      const edtsRef = collection(db, 'edts');
      const q = query(edtsRef, where('class_id', '==', classe.classe_id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const edtDoc = querySnapshot.docs[0];
        const edtData = edtDoc.data();
        const slots = edtData.slots || [];

        // Extract unique matieres from slots
        const uniqueMatieres = new Map<string, Matiere>();
        slots.forEach((slot: Slot) => {
          if (!uniqueMatieres.has(slot.matiere_id)) {
            uniqueMatieres.set(slot.matiere_id, {
              matiere_id: slot.matiere_id,
              matiere_libelle: slot.matiere_libelle
            });
          }
        });

        setAvailableMatieres(Array.from(uniqueMatieres.values()));
        setShowMatiereModal(true);
      }
    } catch (error) {
      console.error('Error loading matieres:', error);
      Alert.alert('Erreur', 'Impossible de charger les matières');
    }
  };

  const handleMatiereSelect = (matiere: Matiere) => {
    setSelectedMatiere(matiere);
    setShowMatiereModal(false);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedClasse || !selectedMatiere || !evaluationTitle.trim() || !evaluationDate || !evaluationStartTime || !evaluationEndTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      const newEvaluation = {
        evaluationId: `${selectedClasse.classe_id}_${evaluationType}_${selectedMatiere.matiere_libelle}`,
        classe_id: selectedClasse.classe_id,
        classe_libelle: selectedClasse.classe_libelle,
        matiere_id: selectedMatiere.matiere_id,
        matiere_libelle: selectedMatiere.matiere_libelle,
        titre: evaluationTitle.trim(),
        description: evaluationDescription.trim(),
        date: evaluationDate,
        notes: [],
        heure_debut: evaluationStartTime,
        heure_fin: evaluationEndTime,
        prof_id: currentUserId,
        created_at: new Date()
      };

      const evaluationsDocRef = doc(db, 'evaluations', selectedClasse.classe_id);
      await updateDoc(evaluationsDocRef, {
        evaluations: arrayUnion(newEvaluation)
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          // Create document if it doesn't exist
          await setDoc(evaluationsDocRef, {
            evaluations: [newEvaluation]
          });
        } else {
          throw error;
        }
      });

      // Reset form
      setEvaluationTitle('');
      setEvaluationDescription('');
      setEvaluationDate('');
      setEvaluationStartTime('');
      setEvaluationEndTime('');
      setSelectedClasse(null);
      setSelectedMatiere(null);
      setShowCreateModal(false);

      Alert.alert('Succès', 'Évaluation créée avec succès !');
    } catch (error) {
      console.error('Error creating evaluation:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'évaluation');
    } finally {
      setSubmitting(false);
    }
  };

  
    const getEvaluationsState = (evalTimeStart: string, evalTimeEnd: string, evalDate: string) => {
    const now = new Date();

    // Current date and time in comparable format
    const [day, month, year] = evalDate.split('/').map(Number);
    const [startHour, startMinute] = evalTimeStart.split(':').map(Number);
    const [endHour, endMinute] = evalTimeEnd.split(':').map(Number);

    // Create Date objects for start and end
    const startDate = new Date(year, month - 1, day, startHour, startMinute);
    const endDate = new Date(year, month - 1, day, endHour, endMinute);

    if (now < startDate) {
        return { text: "À venir", color: "#A0A0A0" }; // Grey
    } else if (now >= startDate && now <= endDate) {
        return { text: "En cours", color: "#007BFF" }; // Blue
    } else {
        return { text: "Terminé", color: "#28A745" }; // Green
    }
    };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };


    const EvaluationCard = ({ evaluation }: { evaluation: Evaluation }) => {
        // Compute evaluation state here
        const evaluationState = getEvaluationsState(evaluation.heure_debut, evaluation.heure_fin, evaluation.date);

        return (
            <View style={styles.evaluationCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.evaluationIconContainer}>
                        <Text style={styles.evaluationIcon}>📝</Text>
                    </View>
                    <View style={styles.cardHeaderText}>
                        <Text style={styles.evaluationTitle}>{evaluation.titre}</Text>
                        <Text style={styles.evaluationSubtitle}>
                            {evaluation.classe_libelle} • {evaluation.matiere_libelle}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    {evaluation.description && (
                        <Text style={styles.evaluationDescription}>{evaluation.description}</Text>
                    )}
                    
                    <View style={styles.evaluationDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>📅</Text>
                            <Text style={styles.detailText}>{evaluation.date}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🕐</Text>
                            <Text style={styles.detailText}>
                                {evaluation.heure_debut} - {evaluation.heure_fin}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={{ color: evaluationState.color, fontWeight: 'bold' }}>
                                {evaluationState.text}
                            </Text>
                        </View>

                        {evaluationState.text != 'Terminé' && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => handleCancelEvaluation(evaluation.id, evaluation.classe_id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Annuler l'évaluation</Text>
                            </TouchableOpacity>

                        )}
                       
                        <TouchableOpacity
                            style={styles.addNoteButton}
                            onPress={() => handleAddNote(evaluation.id, evaluation.classe_id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.addButtonText}>Ajouter de notes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
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
        <Text style={styles.loadingText}>Chargement des évaluations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNavBar />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Mes Évaluations</Text>
          <Text style={styles.headerSubtitle}>Gérez vos évaluations et examens</Text>
        </View>

        {/* Add Evaluation Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateEvaluation}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>➕ Ajouter une évaluation</Text>
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity 
          style={MatieresStyles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser</Text>
        </TouchableOpacity>

        {/* Evaluations List */}
        <View style={styles.sectionHeader}>
          <View style={MatieresStyles.badgeContainer}>
            <View style={MatieresStyles.badgeIcon}>
              <Text style={MatieresStyles.badgeIconText}>📝</Text>
            </View>
            <Text style={MatieresStyles.badgeText}>Évaluations</Text>
            <View style={MatieresStyles.badgeCount}>
              <Text style={MatieresStyles.badgeCountText}>{evaluations.length}</Text>
            </View>
          </View>
        </View>

        {evaluations.length > 0 ? (
          evaluations.map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Pas d'évaluation pour le moment</Text>
            <Text style={styles.emptySubtext}>Créez votre première évaluation pour vos étudiants</Text>
            <LottieView
                source={require('../../../assets/empty.json')}
                autoPlay
                loop={true}
                style={{ width: 300, height: 300, marginVertical: 20 }}
            />
          </View>
          
        )}
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal visible={showClassModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une classe</Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {classes.map((classe) => (
                <TouchableOpacity
                  key={classe.classe_id}
                  style={styles.classItem}
                  onPress={() => handleClassSelect(classe)}
                >
                  <Text style={styles.classTitle}>{classe.classe_libelle}</Text>
                  <Text style={styles.classSubtitle}>{classe.filiere_libelle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Matiere Selection Modal */}
      <Modal visible={showMatiereModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une matière</Text>
              <TouchableOpacity onPress={() => setShowMatiereModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {availableMatieres.map((matiere) => (
                <TouchableOpacity
                  key={matiere.matiere_id}
                  style={styles.matiereItem}
                  onPress={() => handleMatiereSelect(matiere)}
                >
                  <Text style={styles.matiereTitle}>{matiere.matiere_libelle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Evaluation Modal */}
    <Modal
      visible={showCreateModal && !!selectedClasse && !!selectedMatiere}
      animationType="slide"
    >

        <View style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.fullModalTitle}>Nouvelle Évaluation</Text>
            <TouchableOpacity
              onPress={handleSubmitEvaluation}
              disabled={submitting}
            >
              <Text style={[
                styles.modalSubmitButton,
                submitting && styles.modalSubmitButtonDisabled
              ]}>
                {submitting ? '...' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.fullModalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Classe sélectionnée</Text>
              <Text style={styles.selectedText}>{selectedClasse?.classe_libelle}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Matière sélectionnée</Text>
              <Text style={styles.selectedText}>{selectedMatiere?.matiere_libelle}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Titre de l'évaluation *</Text>
              <TextInput
                style={styles.textInput}
                value={evaluationTitle}
                onChangeText={setEvaluationTitle}
                placeholder="Ex: Examen final, Contrôle continu..."
                maxLength={100}
              />
            </View>

         <View style={styles.formSection}>
            <Text style={styles.formLabel}>Type d'évaluation *</Text>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
                <Text style={styles.dropdownText}>
                {evaluationType || "Sélectionner un type"}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {showTypeDropdown && (
                <View style={styles.dropdownList}>
                {evaluationTypes.map((type) => (
                    <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                        setEvaluationType(type);
                        setShowTypeDropdown(false);
                    }}
                    >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                ))}
                </View>
            )}
         </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description (optionnelle)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={evaluationDescription}
                onChangeText={setEvaluationDescription}
                placeholder="Détails sur l'évaluation..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

           <View style={styles.formSection}>
                <Text style={styles.formLabel}>Date *</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={[styles.dateButtonText, !evaluationDate && styles.placeholderText]}>
                    {evaluationDate || "Sélectionner une date"}
                    </Text>
                    <Text style={styles.dateIcon}>📅</Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                    <DateTimePicker
                    value={selectedDate}
                    style={{marginTop: 10, marginLeft: -10}}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) {
                        setSelectedDate(date);
                        setEvaluationDate(date.toLocaleDateString('fr-FR'));
                        }
                    }}
                    />
                )}
            </View>

          <View style={styles.timeRow}>
            <View style={styles.timeSection}>
                <Text style={styles.formLabel}>Heure début *</Text>
                <TouchableOpacity
                style={styles.textInput}
                onPress={() => setShowStartTimePicker(true)}
                >
                <Text>{evaluationStartTime || "HH:MM"}</Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                <DateTimePicker
                    value={selectedDate}
                    style={{marginTop: 10, marginLeft: -10}}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => {
                    setShowStartTimePicker(false);
                    if (date) {
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        setEvaluationStartTime(`${hours}:${minutes}`);
                    }
                    }}
                />
                )}
            </View>

            <View style={styles.timeSection}>
                <Text style={styles.formLabel}>Heure fin *</Text>
                <TouchableOpacity
                style={styles.textInput}
                onPress={() => setShowEndTimePicker(true)}
                >
                <Text>{evaluationEndTime || "HH:MM"}</Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                <DateTimePicker
                    value={selectedDate}
                    style={{marginTop: 10, marginLeft: -10}}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => {
                    setShowEndTimePicker(false);
                    if (date) {
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        setEvaluationEndTime(`${hours}:${minutes}`);
                    }
                    }}
                />
                )}
            </View>
            </View>
          </ScrollView>
        </View>
      </Modal>




      <BottomNavBar activeScreen="Evaluations" />
    </View>
  );
}
