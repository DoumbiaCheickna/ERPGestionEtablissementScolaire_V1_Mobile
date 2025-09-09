// Updated useMatieres hook with caching
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Matiere = {
  id: string;
  title: string;
  professeurNom: string;
  professeurPrenom: string;
  professeurFullName: string;
};

// Global cache for matieres
let matieresCache: Matiere[] = [];
let matieresLoaded = false;

export const useStudentMatieres = () => { 
  const [matieres, setMatieres] = useState<Matiere[]>(matieresCache);
  const [loading, setLoading] = useState(!matieresLoaded);
  const [userFiliereId, setUserFiliereId] = useState<string>('');
  const [userNiveauId, setUserNiveauId] = useState<string>('');

  // Get user data from AsyncStorage
  const getUserData = async () => {
    try {
      const filiereId = await AsyncStorage.getItem('filiere');
      const niveauId = await AsyncStorage.getItem('niveau');

      if (filiereId && niveauId) {
        setUserFiliereId(filiereId);
        setUserNiveauId(niveauId);
        return { filiereId, niveauId };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Fetch professor information
  const fetchProfesseurInfo = async (professeurId: string) => {
    try {
      const userDocRef = doc(db, "users", professeurId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          nom: userData.nom || '',
          prenom: userData.prenom || ''
        };
      }
      return { nom: '', prenom: '' };
    } catch (error) {
      return { nom: '', prenom: '' };
    }
  };

  const fetchUserMatières = async (filiereId: string, niveauId: string) => {
    try {
      // If already loaded, use cache
      if (matieresLoaded) {
        setMatieres(matieresCache);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Step 1: Find the classe with matching filiere_id and niveau_id
      const classesRef = collection(db, "classes");
      const classQuery = query(
        classesRef,
        where("filiere_id", "==", filiereId),
        where("niveau_id", "==", niveauId)
      );
      const classSnapshot = await getDocs(classQuery);

      if (classSnapshot.empty) {
        const emptyResult: Matiere[] = [];
        setMatieres(emptyResult);
        matieresCache = emptyResult;
        matieresLoaded = true;
        setLoading(false);
        return;
      }

      const classeDoc = classSnapshot.docs[0];
      const classeId = classeDoc.id;

      // Step 2: Query all EDT docs for this classe
      const edtsRef = collection(db, "edts");
      const edtQuery = query(edtsRef, where("class_id", "==", classeId));
      const edtSnapshot = await getDocs(edtQuery);

      if (edtSnapshot.empty) {
        const emptyResult: Matiere[] = [];
        setMatieres(emptyResult);
        matieresCache = emptyResult;
        matieresLoaded = true;
        setLoading(false);
        return;
      }

      // Step 3: Collect all unique matiere IDs from slots
      const uniqueMatiereIds = new Set<string>();
      edtSnapshot.forEach((edtDoc) => {
        const edtData = edtDoc.data();
        const slots = edtData.slots || [];
        slots.forEach((slot: any) => {
          if (slot.matiere_id && slot.matiere_id.trim() !== "") {
            uniqueMatiereIds.add(slot.matiere_id);
          }
        });
      });

      if (uniqueMatiereIds.size === 0) {
        const emptyResult: Matiere[] = [];
        setMatieres(emptyResult);
        matieresCache = emptyResult;
        matieresLoaded = true;
        setLoading(false);
        return;
      }

      // Step 4: Query affectations_professeurs ONCE
      const affectationsRef = collection(db, "affectations_professeurs");
      const affectationsSnapshot = await getDocs(affectationsRef);

      const matièresData: Matiere[] = [];

      for (const matiereId of uniqueMatiereIds) {
        try {
          // Fetch matière info
          const matiereDocRef = doc(db, "matieres", matiereId);
          const matiereDoc = await getDoc(matiereDocRef);

          let matiereTitle = "Matière sans nom";
          if (matiereDoc.exists()) {
            const matiereData = matiereDoc.data();
            matiereTitle = matiereData.libelle || "Matière sans nom";
          }

          // Find professor via affectations
          let professeurInfo = { nom: "", prenom: "" };

          // If professor found, fetch user info
          let fullName = "Professeur non assigné";
          for (const affectationDoc of affectationsSnapshot.docs) {
            const affectationData = affectationDoc.data();
            const classes = affectationData.classes || [];
            const profDocId = affectationData.prof_doc_id;

            const matchingClasse = classes.find(
              (classe: any) => classe.classe_id === classeId
            );

            if (
              matchingClasse &&
              matchingClasse.matieres_ids.includes(matiereId) &&
              profDocId
            ) {
              const prof = await fetchProfesseurInfo(profDocId);
              professeurInfo = prof;
              fullName = prof.nom && prof.prenom
                ? `${prof.prenom} ${prof.nom}`
                : prof.nom || prof.prenom || "Professeur non assigné";
              break;
            }
          }

          matièresData.push({
            id: matiereId,
            title: matiereTitle,
            professeurNom: professeurInfo.nom,
            professeurPrenom: professeurInfo.prenom,
            professeurFullName: fullName,
          });
        } catch (err) {
          console.error("Error fetching matiere", matiereId, err);
        }
      }

      // Cache the results
      matieresCache = matièresData;
      matieresLoaded = true;
      setMatieres(matièresData);
    } catch (error) {
      console.error(error);
      setMatieres([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    const userData = await getUserData();
    
    if (userData && userData.filiereId && userData.niveauId) {
      await fetchUserMatières(userData.filiereId, userData.niveauId);
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
    userFiliereId,
    userNiveauId,
    refreshMatieres
  };
};
