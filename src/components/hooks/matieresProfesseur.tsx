// Updated useProfesseurMatieres hook for professors - FIXED VERSION
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Matiere = {
  id: string; // Primary ID (first encountered)
  ids?: string[]; // All matiere IDs with this title
  title: string;
  professeurNom: string;
  professeurPrenom: string;
  professeurFullName: string;
  classes: Array<{
    classe_id: string;
    classe_libelle: string;
  }>;
};

// Global cache for matieres
let matieresCache: Matiere[] = [];
let matieresLoaded = false;

export const useProfesseurMatieres = () => { 
  const [matieres, setMatieres] = useState<Matiere[]>(matieresCache);
  const [loading, setLoading] = useState(!matieresLoaded);
  const [userDocId, setUserDocId] = useState<string>('');
  const [matieresByClass, setMatieresByClass] = useState<Record<string, { className: string; matieres: Matiere[] }>>({});
  
  const [loadingClasses, setLoadingClasses] = useState(true);

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
        const docId = userDoc.id;
        setUserDocId(docId);
        return docId;
      }
      return null;
    } catch (error) {
      console.error('Error getting user doc ID:', error);
      return null;
    }
  };

  // Fetch professor's subjects from affectations_professeurs
  const fetchProfesseurMatières = async (profDocId: string) => {
    try {
      // If already loaded, use cache
      if (matieresLoaded) {
        setMatieres(matieresCache);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Find the affectation document for this professor
      const affectationsRef = collection(db, "affectations_professeurs");
      const affectationQuery = query(affectationsRef, where("prof_doc_id", "==", profDocId));
      const affectationSnapshot = await getDocs(affectationQuery);

      if (affectationSnapshot.empty) {
        const emptyResult: Matiere[] = [];
        setMatieres(emptyResult);
        matieresCache = emptyResult;
        matieresLoaded = true;
        setLoading(false);
        return;
      }

      const affectationDoc = affectationSnapshot.docs[0];
      const affectationData = affectationDoc.data();
      const classes = affectationData.classes || [];

      // FIXED: Use a Map to track unique matieres BY TITLE (not ID) and their associated classes
      const matieresMap = new Map<string, {
        id: string; // Will use first ID encountered
        ids: string[]; // Track all matiere IDs with this title
        title: string;
        professeurNom: string;
        professeurPrenom: string;
        professeurFullName: string;
        classes: Array<{
          classe_id: string;
          classe_libelle: string;
        }>;
      }>();

      // Get professor info once (the current user)
      const userDocRef = doc(db, "users", profDocId);
      const userDoc = await getDoc(userDocRef);
      
      let professeurInfo = { nom: "", prenom: "" };
      if (userDoc.exists()) {
        const userData = userDoc.data();
        professeurInfo = {
          nom: userData.nom || '',
          prenom: userData.prenom || ''
        };
      }

      const fullName = professeurInfo.nom && professeurInfo.prenom
        ? `${professeurInfo.prenom} ${professeurInfo.nom}`
        : professeurInfo.nom || professeurInfo.prenom || "Professeur";

      // Process each class and its matieres
      for (const classe of classes) {
        const matiereIds = classe.matieres_ids || [];
        
        for (const matiereId of matiereIds) {
          try {
            // Fetch matière info
            const matiereDocRef = doc(db, "matieres", matiereId);
            const matiereDoc = await getDoc(matiereDocRef);

            let matiereTitle = "Matière sans nom";
            if (matiereDoc.exists()) {
              const matiereData = matiereDoc.data();
              matiereTitle = matiereData.libelle || "Matière sans nom";
            }

            if (matieresMap.has(matiereTitle)) {
              // Add this matiere ID and class to the existing entry
              const existingMatiere = matieresMap.get(matiereTitle)!;
              
              // Add the matiere ID if not already tracked
              if (!existingMatiere.ids.includes(matiereId)) {
                existingMatiere.ids.push(matiereId);
              }
              
              // Check if this class is not already in the list
              const classExists = existingMatiere.classes.some(
                c => c.classe_id === classe.classe_id
              );
              
              if (!classExists) {
                existingMatiere.classes.push({
                  classe_id: classe.classe_id,
                  classe_libelle: classe.classe_libelle
                });
              }
            } else {
              // Create new matiere entry with this title
              matieresMap.set(matiereTitle, {
                id: matiereId, // Use first ID as primary
                ids: [matiereId], // Track all IDs with this title
                title: matiereTitle,
                professeurNom: professeurInfo.nom,
                professeurPrenom: professeurInfo.prenom,
                professeurFullName: fullName,
                classes: [{
                  classe_id: classe.classe_id,
                  classe_libelle: classe.classe_libelle
                }]
              });
            }
          } catch (err) {
            console.error("Error fetching matiere", matiereId, err);
          }
        }
      }

      // Convert Map to Array
      const matièresData = Array.from(matieresMap.values());

      // Cache the results
      matieresCache = matièresData;
      matieresLoaded = true;
      setMatieres(matièresData);
    } catch (error) {
      console.error('Error fetching professor matieres:', error);
      setMatieres([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    const profDocId = await getUserDocId();
    
    if (profDocId) {
      await fetchProfesseurMatières(profDocId);
    } else {
      setLoading(false);
    }
  };

  const refreshMatieres = () => {
    // Clear cache and force reload
    matieresLoaded = false;
    matieresCache = [];
    initializeData();
  };

  useEffect(() => {
    initializeData();
  }, []);

  return {
    matieres,
    loading,
    userDocId,
    refreshMatieres,
    classes: matieres.flatMap(m => m.classes)
  };
};