import * as SecureStore from 'expo-secure-store';

export const saveData = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`❌ Error saving ${key}:`, error);
    throw error;
  }
};

export const getData = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`❌ Error reading ${key}:`, error);
    return null;
  }
};

export const deleteData = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`❌ Error deleting ${key}:`, error);
    throw error;
  }
};


export const clearAllData = async (): Promise<void> => {
  const keys = [
    'userLogin',
    'userRole',
    'userEmail',
    'userPhoto',
    'otherRoleLibelle',
    'classe_id',
    'classe2_id',
    'filiere',
    'niveau',
    'specialite',
    'statut',
    'auth_uid',
    'device_id',
  ];

  try {
    await Promise.all(keys.map(key => deleteData(key)));
    console.log('✅ All data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};


export const isLoggedIn = async (): Promise<boolean> => {
  const userLogin = await getData('userLogin');
  return userLogin !== null;
};

export const getCurrentUser = async () => {
  return {
    login: await getData('userLogin'),
    role: await getData('userRole'),
    email: await getData('userEmail'),
    photo: await getData('userPhoto'),
    classeId: await getData('classe_id'),
    classe2Id: await getData('classe2_id'),
    filiere: await getData('filiere'),
    niveau: await getData('niveau'),
    specialite: await getData('specialite'),
    statut: await getData('statut'),
  };
};

export default {
  saveData,
  getData,
  deleteData,
  clearAllData,
  isLoggedIn,
  getCurrentUser,
};