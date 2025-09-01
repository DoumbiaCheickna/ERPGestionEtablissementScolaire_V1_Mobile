import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
  Pressable,
  Animated,
  Alert
} from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import useUserRef from '../../components/hooks/getConnectedUser';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { db, getUserSnapchot } from '../../../firebaseConfig';
import { styles } from './styles';
import AbsenceJustificationModal from './AbsenceJustificationModal';


const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3; 

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
  justification: {
    contenu: string;
    documents: string;
    dateJustification: string;
    statut: string;
  }
}

export default function Absences({navigation}: Props) {
    const [absences, setAbsences] = useState<AbsenceData[]>([]);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(true);
    const [longPressedAbsence, setLongPressedAbsence] = useState<string | null>(null);
    const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
    const [showOptions, setShowOptions] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState<AbsenceData | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [userMatricule, setUserMatricule] = useState('');

    

    const getAbsences = useCallback(async () => {
        try {
            // First get the user's matricule
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

            // Get all documents from emargements collection
            const emargementsRef = collection(db, 'emargements');
            const querySnapshot = await getDocs(emargementsRef);

            if (querySnapshot.empty) {
                setAbsences([]);
                return;
            }

            let userEmargements: AbsenceData[] = [];

            // Loop through each document to find the one containing our matricule
            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                if (data[matricule] && Array.isArray(data[matricule])) {
                    userEmargements = [...userEmargements, ...data[matricule]];                   
                }
            });

            if (userEmargements.length === 0) {
                setAbsences([]);
                return;
            }

            // Filter only absences and sort by timestamp (newest first)
            const absencesList = userEmargements
                .filter(emargement => emargement.type == 'absence')
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

    // Call getUserMatricule in useEffect
    useEffect(() => {
        getAbsences();
        getUserMatricule();
    }, [getAbsences, getUserMatricule]);

    // Add this function to handle absence tap
    const handleAbsenceTap = useCallback((absence: AbsenceData) => {
        setSelectedAbsence(absence);
        setModalVisible(true);
    }, []);

    // Add this function to close modal
    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setSelectedAbsence(null);
    }, []);
    // Animation values
    const scaleAnim = useMemo(() => new Animated.Value(1), []);

    

    useEffect(() => {
        getAbsences();
    }, [getAbsences]);

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

    // Delete absence via swipe
// Replace your existing getAbsences function with this one:


    // Also update your deleteAbsence function to use the same pattern:
    const deleteAbsence = useCallback(async (absenceToDelete: AbsenceData) => {
        const originalAbsences = [...absences];
        try {
            // Optimistic update
            const optimisticAbsences = absences.filter(absence => 
                !(absence.matiere_id == absenceToDelete.matiere_id &&
                absence.date == absenceToDelete.date &&
                absence.start == absenceToDelete.start &&
                absence.end == absenceToDelete.end &&
                absence.type == absenceToDelete.type)
            );
            setAbsences(optimisticAbsences);

            // Get all documents from emargements collection
            const emargementsRef = collection(db, 'emargements');
            const querySnapshot = await getDocs(emargementsRef);

            let targetDoc = null;
            let targetDocRef = null;

            // Loop through each document to find the one containing our matricule
            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                if (data[userMatricule] && Array.isArray(data[userMatricule])) {
                    targetDoc = data;
                    targetDocRef = docSnapshot.ref;
                }
            });

            if (!targetDoc || !targetDocRef) {
                setAbsences(originalAbsences);
                Alert.alert('Erreur', 'Document utilisateur introuvable');
                return;
            }

            const userEmargements: AbsenceData[] = targetDoc[userMatricule];

            // Remove the specific absence from emargements
            const updatedEmargements = userEmargements.filter(emargement =>
                !(emargement.matiere_id === absenceToDelete.matiere_id &&
                emargement.date === absenceToDelete.date &&
                emargement.start === absenceToDelete.start &&
                emargement.end === absenceToDelete.end &&
                emargement.type === absenceToDelete.type)
            );

            // Update the document with new emargements for this matricule
            await updateDoc(targetDocRef, {
                [userMatricule]: updatedEmargements,
            });

            Alert.alert('Absence supprimée');

        } catch (err) {
            console.error('Error deleting absence:', err);
            setAbsences(originalAbsences);
            Alert.alert('Erreur lors de la suppression');
        }
    }, [absences, userMatricule]);

    // Also update your deleteAllAbsences function:
    const deleteAllAbsences = useCallback(async () => {
        const originalAbsences = [...absences];

        try {
            setAbsences([]);

            // Get all documents from emargements collection
            const emargementsRef = collection(db, 'emargements');
            const querySnapshot = await getDocs(emargementsRef);

            let targetDoc = null;
            let targetDocRef = null;

            // Loop through each document to find the one containing our matricule
            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                if (data[userMatricule] && Array.isArray(data[userMatricule])) {
                    targetDoc = data;
                    targetDocRef = docSnapshot.ref;
                }
            });

            if (!targetDoc || !targetDocRef) {
                setAbsences(originalAbsences);
                Alert.alert('Erreur', 'Document utilisateur introuvable');
                return;
            }

            const userEmargements: AbsenceData[] = targetDoc[userMatricule];

            // Remove all absences, keep only presences
            const updatedEmargements = userEmargements.filter(emargement => 
                emargement.type !== 'absence'
            );

            // Update the document with new emargements for this matricule
            await updateDoc(targetDocRef, {
                [userMatricule]: updatedEmargements,
            });

            Alert.alert("Toutes les absences ont été supprimées");

        } catch (err) {
            console.error('Error deleting all absences:', err);
            setAbsences(originalAbsences);
            Alert.alert("Erreur lors de la suppression de toutes les absences");
        }
    }, [absences, userMatricule]);

    const confirmDeleteAllAbsences = useCallback(() => {
        if(absences.length === 0){
            Alert.alert("Pas d'absences à supprimer");
            return;
        }

        // Check if there are any non-approved absences
        const nonApprovedAbsences = absences.filter(absence => 
            absence.justification?.statut !== "Approuvée"
        );

        if (nonApprovedAbsences.length > 0) {
            Alert.alert(
                "Suppression impossible",
                "Toutes les absences ne sont pas encore justifiées pour être supprimées"
            );
            return;
        }

        Alert.alert(
            "Confirmation",
            "Voulez-vous vraiment supprimer toutes les absences ?",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: deleteAllAbsences
                }
            ]
        );
    }, [deleteAllAbsences, absences]);

    // Handle long press for options
    const handleLongPress = useCallback((absence: AbsenceData, event: any) => {
        const { pageY } = event.nativeEvent;
        const absenceKey = `${absence.matiere_id}_${absence.date}_${absence.start}`;
        
        setLongPressedAbsence(absenceKey);
        setOptionsPosition({ 
            x: width / 2, 
            y: Math.min(pageY, height - 200)
        });
        setShowOptions(true);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [scaleAnim]);

    // Close options when tapping outside
    const handleOutsidePress = useCallback(() => {
        if (showOptions) {
            setShowOptions(false);
            setLongPressedAbsence(null);
        }
    }, [showOptions]);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Swipeable absence item component
    const SwipeableAbsenceItem = React.memo(({ absence, index }: { absence: AbsenceData, index: number }) => {
        const absenceKey = `${absence.matiere_id}_${absence.date}_${absence.start}`;
        const isLongPressed = longPressedAbsence === absenceKey;
        const isSwipeable = absence.justification?.statut == "Approuvée"; // Only swipeable if not approved
        
        const animationValues = useMemo(() => ({
            translateX: new Animated.Value(0),
            deleteOpacity: new Animated.Value(0)
        }), []);

        const { translateX, deleteOpacity } = animationValues;
        const alertShowing = React.useRef(false);

        const onGestureEvent = Animated.event(
            [{ nativeEvent: { translationX: translateX } }],
            { useNativeDriver: true }
        );

        const onHandlerStateChange = ({ nativeEvent }: any) => {
            // Only handle swipe if absence is swipeable
            if (!isSwipeable) return;

            if (nativeEvent.state === State.END) {
                if (Math.abs(nativeEvent.translationX) > SWIPE_THRESHOLD) {
                    if (alertShowing.current) {
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true,
                        }).start();
                        return;
                    }
                    
                    alertShowing.current = true;
                    
                    Animated.timing(translateX, {
                        toValue: -width,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        Alert.alert(
                            'Confirmer la suppression',
                            'Voulez-vous vraiment supprimer cette absence ?',
                            [
                                { 
                                    text: 'Annuler', 
                                    style: 'cancel',
                                    onPress: () => {
                                        alertShowing.current = false;
                                        Animated.spring(translateX, {
                                            toValue: 0,
                                            useNativeDriver: true,
                                        }).start();
                                    }
                                },
                                { 
                                    text: 'Supprimer', 
                                    style: 'destructive',
                                    onPress: () => {
                                        alertShowing.current = false;
                                        deleteAbsence(absence);
                                    }
                                }
                            ],
                            { 
                                cancelable: false,
                                onDismiss: () => {
                                    alertShowing.current = false;
                                }
                            }
                        );
                    });
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
                
                Animated.timing(deleteOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();

            } else if (nativeEvent.state === State.ACTIVE && isSwipeable) {
                const opacity = Math.min(Math.abs(nativeEvent.translationX) / SWIPE_THRESHOLD, 1);
                deleteOpacity.setValue(opacity);
            }
        };

        return (
            <View style={styles.swipeContainer}>
                {/* Delete background - only show if swipeable */}
                {isSwipeable && (
                    <Animated.View 
                        style={[
                            styles.deleteBackground,
                            { opacity: deleteOpacity }
                        ]}
                    >
                        <Ionicons name="trash-outline" size={24} color="white" />
                        <Text style={styles.deleteText}>Supprimer</Text>
                    </Animated.View>
                )}

                {/* Swipeable absence - only enable gesture if swipeable */}
                <PanGestureHandler
                    onGestureEvent={isSwipeable ? onGestureEvent : undefined}
                    onHandlerStateChange={isSwipeable ? onHandlerStateChange : undefined}
                    activeOffsetX={isSwipeable ? [-10, 10] : undefined}
                    enabled={isSwipeable} // Disable gesture handler if not swipeable
                >
                    <Animated.View style={{ transform: [{ translateX: isSwipeable ? translateX : new Animated.Value(0) }] }}>
                        <Pressable
                            onPress={() => {
                                if (absence.justification?.statut != "Approuvée") {
                                    handleAbsenceTap(absence);
                                }
                            }}
                            onLongPress={isSwipeable ? (event) => handleLongPress(absence, event) : undefined}
                            delayLongPress={500}
                            style={({ pressed }) => [
                                styles.absenceItem,
                                pressed && styles.pressedAbsence,
                                isLongPressed && styles.longPressedAbsence,
                                !isSwipeable && styles.nonSwipeableAbsence 
                            ]}
                        >
                            <Animated.View 
                                style={[
                                    styles.absenceContent,
                                    isLongPressed && { transform: [{ scale: scaleAnim }] }
                                ]}
                            >
                                <View style={styles.absenceHeader}>
                                    <Text style={styles.absenceTitle}>
                                        {absence.matiere_libelle}
                                    </Text>
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
                                        <Text style={styles.absenceBadgeTextJustified}>Absence Jusitifiée</Text>
                                    </View>
                                ) : absence.justification?.statut == 'En cours' ? (
                                    <View style={styles.absenceBadgeWaiting}>
                                        <Text style={styles.absenceBadgeTextWaiting}>En cours</Text>
                                    </View>
                                ) : absence.justification?.statut == 'Rejetée' ? (
                                    <View style={styles.absenceBadgeRejected}>
                                        <Text style={styles.absenceBadgeTextRejected}>Rejetée</Text>
                                    </View>
                                ): (
                                    <View>
                                        <Text style={{color: 'red', fontSize: 10}}>Veillez justifier l'absence</Text>
                                    </View>
                                )}
                            </Animated.View>
                        </Pressable>
                    </Animated.View>
                </PanGestureHandler>
            </View>
        );
    });

    if (loading) {
        return (
            <GestureHandlerRootView style={styles.safeArea}>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Absences</Text>
                        <View style={styles.headerRight} />
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#666" />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                </SafeAreaView>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={styles.safeArea}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Absences ({absences.length})</Text>
                    <TouchableOpacity 
                        style={styles.deleteAll} 
                        onPress={confirmDeleteAllAbsences}
                    >
                        <Text style={styles.deleteAllText}>
                            Tout supprimer
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {absences.length > 0 ? (
                        absences.map((absence, index) => (
                            <SwipeableAbsenceItem 
                                key={`${absence.matiere_id}_${absence.date}_${absence.start}_${index}`}
                                absence={absence} 
                                index={index} 
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
                />
            </SafeAreaView>
        </GestureHandlerRootView>

        
    );
}
