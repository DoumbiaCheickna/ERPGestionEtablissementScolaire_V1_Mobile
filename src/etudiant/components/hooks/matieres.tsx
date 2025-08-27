import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from '../../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Matiere = {
  id: string;
  title: string;
  professeurNom: string;
  professeurPrenom: string;
  professeurFullName: string;
};

export const useMatieres = () => { 
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
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
        setMatieres([]);
        setLoading(false);
        return;
      }

      // Get the classe ID
      const classeDoc = classSnapshot.docs[0];
      const classeId = classeDoc.id;

      // Step 2: Query all EDT documents for this classe
      const edtsRef = collection(db, "edts");
      const edtQuery = query(
        edtsRef,
        where("class_id", "==", classeId)
      );
      
      const edtSnapshot = await getDocs(edtQuery);
      
      if (edtSnapshot.empty) {
        setMatieres([]);
        setLoading(false);
        return;
      }

      // Step 3: Extract all unique matiere IDs from all EDT slots
      const uniqueMatiereIds = new Set<string>();
      
      edtSnapshot.forEach((edtDoc) => {
        const edtData = edtDoc.data();
        const slots = edtData.slots || [];
        
        slots.forEach((slot: any) => {
          if (slot.matiere_id && slot.matiere_id.trim() !== '') {
            uniqueMatiereIds.add(slot.matiere_id);
          }
        });
      });

      if (uniqueMatiereIds.size == 0) {
        setMatieres([]);
        setLoading(false);
        return;
      }

      // Step 4: Query affectations_professeurs collection
      const affectationsRef = collection(db, "affectations_professeurs");
      const affectationsSnapshot = await getDocs(affectationsRef);
      
      if (affectationsSnapshot.empty) {
        setMatieres([]);
        setLoading(false);
        return;
      }

      // Step 5: Find matching matières and professors
      const matièresData: Matiere[] = [];
      
      for (const affectationDoc of affectationsSnapshot.docs) {
        try {
          const affectationData = affectationDoc.data();
          const classes = affectationData.classes || [];
          const profDocId = affectationData.prof_doc_id;
          
          // Find the classe that matches our classeId in the classes array
          const matchingClasse = classes.find((classe: any) => classe.classe_id == classeId);

          
          if (matchingClasse) {
            const matieresIds = matchingClasse.matieres_ids || [];            
            // Check each matiere_id in uniqueMatiereIds against this affectation
            for (const uniqueMatiereId of uniqueMatiereIds) {
              if (matieresIds.includes(uniqueMatiereId)) {
                try {
                  // Fetch matière libellé from matieres collection
                  const matiereDocRef = doc(db, "matieres", uniqueMatiereId);
                  const matiereDoc = await getDoc(matiereDocRef);
                  
                  let matiereTitle = 'Matière sans nom';
                  if (matiereDoc.exists()) {
                    const matiereData = matiereDoc.data();
                    matiereTitle = matiereData.libelle || 'Matière sans nom';
                  }
                  
                  // Fetch professor information using prof_doc_id
                  const professeurInfo = profDocId 
                    ? await fetchProfesseurInfo(profDocId)
                    : { nom: '', prenom: '' };

                  const fullName = professeurInfo.nom && professeurInfo.prenom 
                    ? `${professeurInfo.prenom} ${professeurInfo.nom}`
                    : professeurInfo.nom || professeurInfo.prenom || 'Professeur non assigné';

                  // Check if this matière is already added (avoid duplicates)
                  const existingMatiere = matièresData.find(m => m.id === uniqueMatiereId);
                  if (!existingMatiere) {
                    matièresData.push({
                      id: uniqueMatiereId,
                      title: matiereTitle,
                      professeurNom: professeurInfo.nom,
                      professeurPrenom: professeurInfo.prenom,
                      professeurFullName: fullName
                    });
                  }
                } catch (error) {
                  console.error(`Error processing matière ${uniqueMatiereId}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error processing affectation ${affectationDoc.id}:`, error);
        }
      }

      setMatieres(matièresData);
      
    } catch (error) {
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