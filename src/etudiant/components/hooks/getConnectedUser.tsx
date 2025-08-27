import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, doc, DocumentReference } from 'firebase/firestore';
import { db, getUserSnapchot } from '../../../firebaseConfig';

const useUserRef = () => {
  const [userRef, setUserRef] = useState<DocumentReference | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRef = async () => {
    try {
      setLoading(true);
      setError(null);

      const userLogin = await AsyncStorage.getItem('userLogin');
      
      if (!userLogin) {
        throw new Error('Utilisateur non trouvé');
      }

     
      const querySnapshot: any = await getUserSnapchot();
      
      if (querySnapshot.empty) {
        throw new Error('Utilisateur non trouvé dans la base de données');
      }

      const userDoc = querySnapshot.docs[0];
      userDoc.data()
      const userDocId = userDoc.id;
      const docRef = doc(db, "users", userDocId);
      
      setUserRef(docRef);

    } catch (err: any) {
      setError(err.message);
      setUserRef(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRef();
  }, []);

  const refetch = () => {
    fetchUserRef();
  };

  return {
    userRef,    
    loading,   
    error,      
    refetch     
  };
};

export default useUserRef;