// Updated useUserCourses hook with caching
import { useState, useEffect, useCallback } from 'react';
import { getDoc, collection, query, where, getDocs, doc, Timestamp } from 'firebase/firestore';
import { db, getClasseSnapshot, getUserSnapchot } from '../../../firebaseConfig'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Slot {
  day: number;
  start: string;
  end: string;
  matiere_libelle: string;
  enseignant: string;
  salle: string;
  matiere_id: string;
}

export interface DayCourses {
  title: string;
  data: Slot[];
}

const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

// Global cache for courses
let coursesCache: DayCourses[] = [];
let coursesLoaded = false;

export const useUserCourses = () => {
  const [coursesByDay, setCoursesByDay] = useState<DayCourses[]>(coursesCache);
  const [loading, setLoading] = useState(!coursesLoaded);
  const [error, setError] = useState<string | null>(null);

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
      const userLogin = await AsyncStorage.getItem('userLogin');

      if (!userLogin || userLogin.trim() === '') {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const userQuerySnapshot: any = await getUserSnapchot(); 
      if (userQuerySnapshot.empty) { 
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const userDoc = userQuerySnapshot.docs[0];
      const userData = userDoc.data();
      const userClasseId = userData.classe_id;

      const existingClass = await getClasseSnapshot(userClasseId);
      if (existingClass?.empty) {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      const edtsRef = collection(db, 'edts');
      const edtQuery = query(edtsRef, where('class_id', '==', userClasseId));
      const edtsSnap = await getDocs(edtQuery);

      if (edtsSnap.empty) {
        const emptyResult: DayCourses[] = [];
        setCoursesByDay(emptyResult);
        coursesCache = emptyResult;
        coursesLoaded = true;
        setLoading(false);
        return;
      }

      // Check academic year validity
      const edtsDoc = edtsSnap.docs[0].data();
      const edtsAnnee = edtsDoc.annee;

      const anneeDocRef = doc(db, 'annees_scolaires', edtsAnnee);
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

      edtsSnap.forEach(docSnap => {
        const edts = docSnap.data();
        const slots: Slot[] = edts.slots || [];

        slots.forEach(slot => {
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
            });
          }
        });
      });

      // Cache the results
      coursesCache = slotsByDay;
      coursesLoaded = true;
      setCoursesByDay(slotsByDay);

    } catch (error) {
      console.error("Error fetching courses:", error);
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