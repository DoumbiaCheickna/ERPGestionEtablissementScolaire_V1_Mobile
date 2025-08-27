import { useState, useEffect } from 'react';
import { getDoc, collection, query, where, getDocs, doc } from 'firebase/firestore';
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

export const useUserCourses = () => {
  const [coursesByDay, setCoursesByDay] = useState<DayCourses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userLogin = await AsyncStorage.getItem('userLogin');

      
      if (!userLogin || userLogin.trim() == '') {
        setCoursesByDay([]);
        setLoading(false);
        return;
      }

      const userQuerySnapshot: any = await getUserSnapchot(); 
      
      if (userQuerySnapshot.empty) { 
        setCoursesByDay([]);
        setLoading(false);
        return;
      }

      const userDoc = userQuerySnapshot.docs[0];
      const userData = userDoc.data();
      const userClasseId = userData.classe_id;


      const edtsRef = collection(db, 'edts');
      const edtQuery = query(edtsRef, where('class_id', '==', userClasseId));

      const existingClass = await getClasseSnapshot(userClasseId);

      if(existingClass?.empty){
        setCoursesByDay([]);
        setLoading(false);
        return;
      }
      
      const edtsSnap = await getDocs(edtQuery);
      
      
      if (edtsSnap.empty) {
        setCoursesByDay([]);
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

      setCoursesByDay(slotsByDay);
      
    } catch (error) {
      setError('Failed to fetch courses');
      setCoursesByDay([]);
    } finally {
      setLoading(false);
    }
  };

  fetchCourses();
}, []);

  return { coursesByDay, loading, error };
};