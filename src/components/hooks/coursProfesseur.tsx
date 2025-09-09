// Updated useProfesseurCourses hook for professors
import { useState, useEffect, useCallback } from 'react';
import { getDoc, collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Slot {
  day: number;
  start: string;
  end: string;
  matiere_libelle: string;
  enseignant: string;
  salle: string;
  matiere_id: string;
  class_id: string;
  classe_libelle: string;
  prof_doc_id?: string; // Add this field
}

export interface DayCourses {
  title: string;
  data: Slot[];
}

const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

// Global cache for courses
let coursesCache: DayCourses[] = [];
let coursesLoaded = false;

export const useProfesseurCourses = () => {
  const [coursesByDay, setCoursesByDay] = useState<DayCourses[]>(coursesCache);
  const [loading, setLoading] = useState(!coursesLoaded);
  const [error, setError] = useState<string | null>(null);

  // Get user document ID from AsyncStorage and users collection
  const getUserDocId = async () => {
    try {
      const userLogin = await AsyncStorage.getItem('userLogin');
      if (!userLogin) return null;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('login', '==', userLogin));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          docId: userDoc.id,
          userData: userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user doc ID:', error);
      return null;
    }
  };

  const fetchCourses = useCallback(async () => {
    // If already loaded, use cache
    if (coursesLoaded) {
      setCoursesByDay(coursesCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userInfo = await getUserDocId();
      if (!userInfo) {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const { docId: profDocId, userData } = userInfo;
      const professorName = userData.nom && userData.prenom 
        ? `${userData.prenom} ${userData.nom}` 
        : userData.nom || userData.prenom || 'Professeur';

      // Find the affectation document for this professor
      const affectationsRef = collection(db, "affectations_professeurs");
      const affectationQuery = query(affectationsRef, where("prof_doc_id", "==", profDocId));
      const affectationSnapshot = await getDocs(affectationQuery);

      if (affectationSnapshot.empty) {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const affectationDoc = affectationSnapshot.docs[0];
      const affectationData = affectationDoc.data();
      const classes = affectationData.classes || [];

      // Check academic year validity
      const anneeId = affectationData.annee_id;
      const anneeDocRef = doc(db, 'annees_scolaires', anneeId);
      const anneeDoc = await getDoc(anneeDocRef);

      if (!anneeDoc.exists()) {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const anneeData = anneeDoc.data();
      const dateDebut = anneeData.date_debut.toDate();  
      const dateFin = anneeData.date_fin.toDate();  
      const now = new Date();

      if (now < dateDebut || now > dateFin) {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const slotsByDay: DayCourses[] = dayNames.map(day => ({
        title: day,
        data: []
      }));

      // For each class the professor teaches
      for (const classe of classes) {
        const classId = classe.classe_id;
        const classeLibelle = classe.classe_libelle;
        const matiereIds = classe.matieres_ids || [];

        // Get EDT for this class
        const edtsRef = collection(db, 'edts');
        const edtQuery = query(edtsRef, where('class_id', '==', classId));
        const edtsSnap = await getDocs(edtQuery);

        if (!edtsSnap.empty) {
          edtsSnap.forEach(docSnap => {
            const edts = docSnap.data();
            const slots: any[] = edts.slots || [];

            // Filter slots that belong to this professor's subjects AND professor
            const professorSlots = slots.filter(slot => {
              // Check if this slot belongs to professor's subjects
              const belongsToProf = matiereIds.includes(slot.matiere_id);
              
              // Additional check: if prof_doc_id exists in slot, use it for exact matching
              const profMatches = slot.prof_doc_id 
                ? slot.prof_doc_id === profDocId 
                : slot.enseignant === professorName; // Fallback to name matching
              
              return belongsToProf && profMatches;
            });

            professorSlots.forEach(slot => {
              const dayIndex = slot.day - 1;
              if (dayIndex >= 0 && dayIndex < 6) {
                slotsByDay[dayIndex].data.push({
                  day: slot.day,
                  start: slot.start,
                  end: slot.end,
                  matiere_libelle: slot.matiere_libelle,
                  enseignant: slot.enseignant,
                  salle: slot.salle,
                  matiere_id: slot.matiere_id,
                  class_id: classId,
                  classe_libelle: classeLibelle,
                  prof_doc_id: slot.prof_doc_id || profDocId, // Store professor doc ID
                });
              }
            });
          });
        }
      }

      // Cache the results
      coursesCache = slotsByDay;
      coursesLoaded = true;
      setCoursesByDay(slotsByDay);

    } catch (error) {
      console.error("Error fetching professor courses:", error);
      setError('Failed to fetch courses');
      setCoursesByDay([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Add refresh function for manual refresh
  const refreshCourses = useCallback(() => {
    // Clear cache and force reload
    coursesLoaded = false;
    coursesCache = [];
    fetchCourses();
  }, [fetchCourses]);

  return { 
    coursesByDay, 
    loading, 
    error, 
    refreshCourses 
  };
};