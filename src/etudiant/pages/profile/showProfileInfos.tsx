import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { auth, db, updateUserLogin } from '../../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/globalStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/index';
import { updatePassword } from "firebase/auth";
import { getUserSnapchot, FindUserClassName } from '../../../firebaseConfig';
import Toast from '../../components/layout/toast';
import { styles } from './styles'
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import LottieView from 'lottie-react-native';


interface UserProfileInfo {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  login: string;
  filiereId: string;
  telephone: string;
  niveauId: string;
  className: string;
  avatar?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ShowProfileInfos'>;

export default function ProfileSettings({ navigation }: Props) {
  const [userInfo, setUserInfo] = useState<UserProfileInfo | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  
  // Modal states
  const [passwordModalVisible, setPasswordModalVisible] = useState<boolean>(false);
  const [loginModalVisible, setLoginModalVisible] = useState<boolean>(false);
  
  // Form states
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [newLogin, setNewLogin] = useState<string>('');
  
  // Loading states for updates
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);
  const [updatingLogin, setUpdatingLogin] = useState<boolean>(false);

  useEffect(() => {
    fetchUserProfileInfo();
  }, []);

    const fetchUserProfileInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const userSnapshot = await getUserSnapchot(); // <-- await here

        if (!userSnapshot || userSnapshot.empty) {
          setError('Utilisateur non trouvé');
          return;
        }

        const userData = userSnapshot.docs[0].data();
        const userId = userSnapshot.docs[0].id;

        const className = await FindUserClassName(userData.filiere_id, userData.niveau_id);

        setUserInfo({
          id: userId,
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          email: userData.email || '',
          login: userData.login || '',
          filiereId: userData.filiere_id || '',
          telephone: userData.telephone || '',
          niveauId: userData.niveau_id || '',
          className: className,
          avatar: userData.avatar
        });

      } catch (error) {
        setError('Erreur lors du chargement des informations');
        Alert.alert('Erreur', 'Impossible de charger les informations du profil');
      } finally {
        setLoading(false);
      }
  };



const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    const fileName = uri.split("/").pop() || `avatar_${Date.now()}.jpg`;
    const newPath = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.copyAsync({ from: uri, to: newPath });

      // Update local state
      setProfilePic(newPath);

      // Update userInfo state too
      setUserInfo(prev => prev ? { ...prev, avatar: newPath } : prev);

      if (userInfo?.id) {
        const userDocRef = doc(db, "users", userInfo.id);
        await updateDoc(userDocRef, { avatar: newPath });
      }

    } catch (e) {
      console.error("Error saving image:", e);
    }
  }
};




 const handleUpdatePassword = async () => {
  if (!newPassword || !confirmPassword) {
    Alert.alert('Erreur', 'Veuillez remplir tous les champs');
    return;
  }

  if (newPassword !== confirmPassword) {
    Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    return;
  }

  if (newPassword.length < 6) {
    Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  try {
    setUpdatingPassword(true);

    if (!userInfo?.id || !auth.currentUser) {
      Alert.alert('Erreur', 'Utilisateur non connecté ou données manquantes');
      return;
    }

    const userDocRef = doc(db, "users", userInfo.id);
    await updateDoc(userDocRef, {
      password: newPassword
    });

    await updatePassword(auth.currentUser, newPassword);

    setToast({message: 'Mot de passe mis à jour avec succès', type: 'success'});
    setPasswordModalVisible(false);
    setNewPassword('');
    setConfirmPassword('');

  } catch (error: any) {
    if (error.code === "auth/requires-recent-login") {
      Alert.alert(
        "Erreur",
        "Vous devez vous reconnecter avant de changer le mot de passe."
      );
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le mot de passe');
    }
  } finally {
    setUpdatingPassword(false);
  }
};


  const handleUpdateLogin = async () => {
    if (!newLogin) {
      Alert.alert('Erreur', 'Veuillez saisir un nouveau nom d\'utilisateur');
      return;
    }

    if (newLogin == userInfo?.login) {
      Alert.alert('Information', 'Le nouveau nom d\'utilisateur est identique à l\'ancien');
      return;
    }

    setUpdatingLogin(true);

    try {
      const success = await updateUserLogin(newLogin, userInfo?.id || null);

      if (success) {
        setUserInfo(prev => prev ? { ...prev, login: newLogin } : null);
        setLoginModalVisible(false);
        setNewLogin('');
      }

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le nom d\'utilisateur');
    } finally {
      setUpdatingLogin(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  const openLoginModal = () => {
    setNewLogin(userInfo?.login || '');
    setLoginModalVisible(true);
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres du profil</Text>
          <View style={styles.placeholder} />
        </View>
           <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../../assets/loading.json')}
            autoPlay
            loop={false}
            style={{ width: 170, height: 170 }}
          />
          <Image 
            source={require('../../../assets/iibs-logo.png')}
            style={{ width: 100, height: 100, marginTop: 20 }}
          />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
        
     
      </View>
    );
  }

  if (error || !userInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres du profil</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || 'Erreur de chargement'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfileInfo}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres du profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
            <Image source={{ uri: userInfo.avatar }} style={styles.avatarImage} />

          <TouchableOpacity onPress={pickImage} style={styles.changeAvatarButton}>
            <Text style={styles.changeAvatarText}>
              <Ionicons name='image' style={{color:  '#ffff'}}>
              </Ionicons>
              Changer la photo</Text>
          </TouchableOpacity>

          <Text style={styles.fullName}>{userInfo.prenom} {userInfo.nom}</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          
          {/* Edit Password */}
          <TouchableOpacity style={styles.settingItem} onPress={openPasswordModal}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={'#3b82f6'} />
              <Text style={styles.settingItemText}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Edit Login */}
          <TouchableOpacity style={styles.settingItem} onPress={openLoginModal}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="person-outline" size={20} color={'#8b5cf6'} />
              <Text style={styles.settingItemText}>Changer le nom d'utilisateur</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Account Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
               <Ionicons name='person-outline' style={{color:  '#3b82f6'}}>
              </Ionicons>Nom d'utilisateur actuel
            </Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userInfo.login}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
               <Ionicons name='send-outline' style={{color:  '#3b82f6'}}>
              </Ionicons>
              Email
            </Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userInfo.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
              
            <Text style={styles.infoLabel}>
              <Ionicons name='phone-portrait-outline' style={{color:  '#f59e63ff'}}>
              </Ionicons>
              Téléphone
            </Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userInfo.telephone}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
               <Ionicons name='home-outline' style={{color:  '#54c985ff'}}>
              </Ionicons>Classe</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userInfo.className}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le mot de passe</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={(text) => setNewPassword(text)}
                  secureTextEntry
                  placeholder="Saisissez votre nouveau mot de passe"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={(text) => setConfirmPassword(text)}
                  secureTextEntry
                  placeholder="Confirmez votre mot de passe"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={handleUpdatePassword}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Login Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={loginModalVisible}
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le nom d'utilisateur</Text>
              <TouchableOpacity onPress={() => setLoginModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nouveau nom d'utilisateur</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLogin}
                  onChangeText={(text) => {
                    const safeText = text.replace(/[<>]/g, ""); 
                    setNewLogin(safeText);
                  }}
                  placeholder="Saisissez votre nouveau nom d'utilisateur"
                  autoCapitalize="none"
                  autoCorrect={false} 
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setLoginModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={handleUpdateLogin}
                  disabled={updatingLogin}
                >
                  {updatingLogin ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </View>
    
  );
}
