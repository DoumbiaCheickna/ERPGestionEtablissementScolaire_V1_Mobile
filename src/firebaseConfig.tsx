import { collection, doc, DocumentData, getDoc, getDocs, getFirestore, query, QuerySnapshot, updateDoc, where } from "firebase/firestore";
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { 
  initializeAuth,
  //@ts-ignore
  getReactNativePersistence,
 } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";
import { saveData, getData, deleteData, clearAllData } from './components/utils/secureStorage';

const firebaseConfig = {
  apiKey: "AIzaSyAk9ReRsOP3615ysayTcfdEpXyIHv4eCAE",
  authDomain: "gestiondesetablissementsco.firebaseapp.com",
  projectId: "gestiondesetablissementsco",
  storageBucket: "gestiondesetablissementsco.appspot.com",
  messagingSenderId: "359588684947",
  appId: "1:359588684947:web:79020fc0da0c3cf2c85966",
  measurementId: "G-T3NGPP7S81"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage = getStorage(app);




export const getUserSnapchot = async (): Promise<QuerySnapshot<DocumentData> | null> => {
        
  const userLogin = await getData('userLogin');

  if (!userLogin) {
    return null;
  }

  const userQuery = query(
    collection(db, "users"),
    where("login", "==", userLogin)
  );

  return await getDocs(userQuery);
  
}

export const getUserData = async (userLogin: string) => {
        
  const userQuery = query(
    collection(db, "users"),
    where("login", "==", userLogin)
  );

  const snapshot = await getDocs(userQuery);
  const doc = snapshot.docs[0]
  return doc.data() as any;
  
}


export const getClasseSnapshot = async (
  userClasseId: string
): Promise<QuerySnapshot<DocumentData> | null> => {

  if (!userClasseId) {
    Alert.alert('Aucune classe trouvée');
    return null;
  }

  const classeQuery = query(
    collection(db, "classes"),
    where("__name__", "==", userClasseId)
  );

  return await getDocs(classeQuery);
};

export const getMatiereSnapshot = async (
  matiereId: string
): Promise<QuerySnapshot<DocumentData> | null> => {

  if (!matiereId) {
    Alert.alert('Aucune matiere trouvée');
    return null;
  }

  // Query the collection by document ID
  const matiereQuery = query(
    collection(db, "matieres"),
    where("__name__", "==", matiereId)
  );

  return await getDocs(matiereQuery);

};



export const getFiliereSnapshot = async (): Promise<QuerySnapshot<DocumentData> | null> => {
  const filiereId = await getData('filiere');

  if (!filiereId) {
    Alert.alert('Aucune filière trouvée');
    return null;
  }

  const filiereQuery = query(
    collection(db, "filieres"),
    where("id", "==", filiereId)
  );

  return await getDocs(filiereQuery);
};

export const getNiveauSnapshot = async (): Promise<QuerySnapshot<DocumentData> | null> => {
  const niveauId = await getData('niveau');

  if (!niveauId) {
    Alert.alert('Aucun niveau trouvé');
    return null;
  }

  const niveauQuery = query(
    collection(db, "niveaux"),
    where("id", "==", niveauId)
  );

  return await getDocs(niveauQuery);
};

export async function FindUserClassName(filiereId?: string, niveauId?: string): Promise<string> {
  if (!filiereId || !niveauId) {
    return "Classe non trouvée";
  }

  try {
    // First: search in classes collection
    const classQuery = query(
      collection(db, "classes"),
      where("filiere_id", "==", filiereId),
      where("niveau_id", "==", niveauId)
    );

    const classSnapshot = await getDocs(classQuery);

    if (!classSnapshot.empty) {
      const classData = classSnapshot.docs[0].data();
      return classData.libelle || "Classe inconnue";
    }

    // If no class found, fetch filiere + niveau separately
    const [filiereSnapshot, niveauSnapshot] = await Promise.all([
      getDocs(query(collection(db, "filieres"), where("id", "==", filiereId))),
      getDocs(query(collection(db, "niveaux"), where("id", "==", niveauId)))
    ]);

    if (!filiereSnapshot.empty && !niveauSnapshot.empty) {
      const filiereData = filiereSnapshot.docs[0].data();
      const niveauData = niveauSnapshot.docs[0].data();
      return `${filiereData.libelle} - ${niveauData.libelle}`;
    }

    return "Classe non trouvée";
  } catch (error) {
    return "Erreur de chargement";
  }
}
export async function updateUserLogin(newLogin: string, userId: string | null) {
  if (!userId) {
    Alert.alert("Erreur", "Informations utilisateur non disponibles");
    return false;
  }

  try {
    // Check if login already exists
    const loginQuery = query(
      collection(db, "users"),
      where("login", "==", newLogin)
    );

    const loginSnapshot = await getDocs(loginQuery);

    if (!loginSnapshot.empty) {
      Alert.alert("Erreur", "Ce nom d'utilisateur est déjà utilisé");
      return false;
    }

    // Update user document
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { login: newLogin });

    // Update AsyncStorage
    await saveData("userLogin", newLogin);

    Alert.alert("Succès", "Nom d'utilisateur mis à jour avec succès");
    return true;
  } catch (error) {
    Alert.alert("Erreur", "Impossible de mettre à jour le nom d'utilisateur");
    return false;
  }
}

export const findRoleName = async (roleId: string): Promise<string> => {
    try {
        if (!roleId) {
            return 'Rôle inconnu';
        }
        
        const roleDoc = await getDoc(doc(db, "roles", roleId));
        
        if (!roleDoc.exists()) {
            console.warn(`Role document not found for ID: ${roleId}`);
            return 'Rôle inconnu';
        }
        
        const roleData = roleDoc.data();
        return roleData?.libelle?.toLowerCase() || 'Rôle inconnu';
    } catch (error) {
        return 'Erreur de rôle';
    }
}

export const findClasseName = async (classeId: string): Promise<string> => {
    try {
        if (!classeId) {
            return 'Classe inconnue';
        }
        
        const classeDoc = await getDoc(doc(db, "classes", classeId));
        
        if (!classeDoc.exists()) {
            console.warn(`Class document not found for ID: ${classeId}`);
            return 'Classe inconnue';
        }
        
        const classeData = classeDoc.data();
        return classeData?.libelle?.toLowerCase() || 'Classe inconnue';
    } catch (error) {
        return 'Erreur de classe';
    }
}

export const findUserName = async (userId: string): Promise<string> => {
    try {
        if (!userId) {
            return 'Utilisateur inconnu';
        }
        
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (!userDoc.exists()) {
            console.warn(`User document not found for ID: ${userId}`);
            return 'Utilisateur inconnu';
        }
        
        const userData = userDoc.data();
        const prenom = userData?.prenom || '';
        const nom = userData?.nom || '';
        
        if (!prenom && !nom) {
            return 'Utilisateur inconnu';
        }
        
        return `${prenom} ${nom}`.trim();
    } catch (error) {
        return 'Erreur utilisateur';
    }
}