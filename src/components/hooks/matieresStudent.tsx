// Fixed useUserMatieres hook with proper deduplication for multiple classes
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db, getUserSnapchot } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Matiere = {
  id: string;
  title: string;
  professeurNom: string;
  professeurPrenom: string;
  professeurFullName: string;
  classeIds: string[]; // Changed to array to track multiple classes
};

export type UserData = {
  id: string;
  login: string;
  nom: string;
  prenom: string;
  classe_id?: string;
  classe2_id?: string;
  [key: string]: any;
};

// Global cache
let userDataCache: UserData | null = null;
let matieresCache: Matiere[] = [];
let userDataLoaded = false;
let matieresLoaded = false;



export const useStudentMatieres = () => {
  const [userData, setUserData] = useState<UserData | null>(userDataCache);
  const [matieres, setMatieres] = useState<Matiere[]>(matieresCache);
  const [loading, setLoading] = useState(!userDataLoaded || !matieresLoaded);

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
      console.error("Error fetching professor info:", error);
      return { nom: '', prenom: '' };
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      // If already loaded, use cache
      if (userDataLoaded && userDataCache) {
        setUserData(userDataCache);
        return userDataCache;
      }

      const userSnapshot = await getUserSnapchot();
      
      if (!userSnapshot || userSnapshot.empty) {
        userDataCache = null;
        userDataLoaded = true;
        setUserData(null);
        return null;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data() as UserData;
      userData.id = userDoc.id;

      // Cache the user data
      userDataCache = userData;
      userDataLoaded = true;
      setUserData(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      userDataCache = null;
      userDataLoaded = true;
      setUserData(null);
      return null;
    }
  };

  // Fetch matieres for a specific class
  const fetchMatieresForClass = async (classeId: string): Promise<Matiere[]> => {
    try {
      // Step 1: Query all EDT docs for this classe
      const edtsRef = collection(db, "edts");
      const edtQuery = query(edtsRef, where("class_id", "==", classeId));
      const edtSnapshot = await getDocs(edtQuery);

      if (edtSnapshot.empty) {
        return [];
      }

      // Step 2: Collect all unique matiere IDs from slots
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
        return [];
      }

      // Step 3: Query affectations_professeurs ONCE
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
            classeIds: [classeId], // Initialize with current class as array
          });
        } catch (err) {
          console.error("Error fetching matiere", matiereId, err);
        }
      }

      return matièresData;
    } catch (error) {
      console.error("Error fetching matieres for class", classeId, error);
      return [];
    }
  };

  // Fetch all matieres for user's classes
  const fetchUserMatieres = async (userData: UserData) => {
    try {
      // If already loaded, use cache
      if (matieresLoaded) {
        setMatieres(matieresCache);
        return;
      }

      const activeClass: any = await AsyncStorage.getItem('active_classe_id');
      const allMatieres: Matiere[] = [];
      

      // Fetch matieres for classe_id if it exists
      if (activeClass) {
        const classeMatieres = await fetchMatieresForClass(activeClass);
        allMatieres.push(...classeMatieres);
      }



      // FIXED: Remove duplicates based on matiere id ONLY and merge class information
      const matieresMap = new Map<string, Matiere>();
      
      allMatieres.forEach((matiere) => {
        if (matieresMap.has(matiere.id)) {
          // If matiere already exists, merge the classeIds
          const existingMatiere = matieresMap.get(matiere.id)!;
          existingMatiere.classeIds = [...new Set([...existingMatiere.classeIds, ...matiere.classeIds])];
        } else {
          // Create a new matiere with classeIds as array
          matieresMap.set(matiere.id, { 
            ...matiere, 
            classeIds: [...matiere.classeIds] // Ensure it's a copy
          });
        }
      });
      
      const uniqueMatieres = Array.from(matieresMap.values());

      // Cache the results
      matieresCache = uniqueMatieres;
      matieresLoaded = true;
      setMatieres(uniqueMatieres);
    } catch (error) {
      console.error("Error fetching user matieres:", error);
      setMatieres([]);
    }
  };

  // Initialize data
  const initializeData = async () => {
    try {
      setLoading(true);
      
      // First get user data
      const user = await fetchUserData();
      
      if (user && (user.classe_id || user.classe2_id)) {
        // Then get matieres for user's classes
        await fetchUserMatieres(user);
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh function to clear cache and reload
  const refreshUserMatieres = () => {
    // Clear all caches
    userDataLoaded = false;
    matieresLoaded = false;
    userDataCache = null;
    matieresCache = [];
    
    // Reinitialize
    initializeData();
  };

  // FIXED: Get matieres for specific class
  const getMatieresForClass = (classeId: string): Matiere[] => {
    return matieres.filter(matiere => matiere.classeIds.includes(classeId));
  };

  useEffect(() => {
    initializeData();
  }, []);

  return {
    userData,
    matieres,
    loading,
    refreshUserMatieres,
    getMatieresForClass, // Helper function to get matieres by class
    // Additional helpers
    classe1Matieres: userData?.classe_id ? getMatieresForClass(userData.classe_id) : [],
    classe2Matieres: userData?.classe2_id ? getMatieresForClass(userData.classe2_id) : [],
  };
};