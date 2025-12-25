import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { saveData, getData, deleteData, clearAllData } from '../../components/utils/secureStorage';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { localStyles } from './styles';
import { RootStackParamList } from '../../navigation';
import PrivacyConsentScreen from '../../components/layout/PrivacyConsentScreen';


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Login({ navigation }: Props) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Bubble animations
  const bubble1X = useRef(new Animated.Value(0)).current;
  const bubble1Y = useRef(new Animated.Value(0)).current;
  const bubble1Scale = useRef(new Animated.Value(1)).current;
  
  const bubble2X = useRef(new Animated.Value(0)).current;
  const bubble2Y = useRef(new Animated.Value(0)).current;
  const bubble2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkBiometricAvailability();
    checkLoggedIn();
    checkPrivacyConsent();
  }, []);


    const checkPrivacyConsent = async () => {
    try {
      const accepted = await getData('privacy_accepted');
      if (!accepted) {
        // First time user - show privacy consent
        setShowPrivacyConsent(true);
      } else {
        setPrivacyChecked(true);
      }
    } catch (error) {
      console.error('Error checking privacy consent:', error);
      setShowPrivacyConsent(true);
    }
  };

  const handlePrivacyAccept = () => {
    setShowPrivacyConsent(false);
    setPrivacyChecked(true);
  };

  const handlePrivacyDecline = () => {
    Alert.alert(
      'Impossible de continuer',
      'L\'application nécessite votre accord pour fonctionner. Si vous avez des questions sur nos pratiques de confidentialité, contactez privacy@iibs.sn',
      [
        { text: 'Revoir la politique', onPress: () => {} },
        { 
          text: 'Quitter l\'app', 
          onPress: () => {
            // On mobile, you can't force close the app
            // But you can show the consent again
            setShowPrivacyConsent(true);
          }
        }
      ]
    );
  };


  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Empreinte digitale');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris');
        } else {
          setBiometricType('Code de l\'appareil');
        }
      }
    } catch (error) {
      console.log('Erreur vérification biométrique:', error);
    }
  };

  const checkLoggedIn = async () => {
    const loggedIn = await getData("userLogin");
    if (loggedIn) {
      const roleName = await getData("userRole") || '';
      const otherRoleName = await getData("otherRoleLibelle") || '';
      const email = await getData("userEmail") || '';
      const classeId = await getData("classe_id") || '';

      if (otherRoleName) {
        navigation.replace('ChooseScreen', {
          userLogin: loggedIn,
          userRole: roleName,
          email: email,
          classeId: classeId,
        });
        return;
      }
      
      if (roleName === 'etudiant') {
        navigation.replace('HomeStudent', {
          userLogin: loggedIn,
          userRole: roleName,
          firstLogin: 0,
          email,
          classeId,
        });
      } else if (roleName === 'professeur') {
        navigation.replace('HomeProfesseur', {
          userLogin: loggedIn,
          userRole: roleName,
          firstLogin: 0,
          email,
        });
      }
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    startBubbleAnimations();
  }, []);

  const startBubbleAnimations = () => {
    const animateBubble1 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubble1X, {
            toValue: Math.random() * 200 - 100, 
            duration: 3000 + Math.random() * 2000, 
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Y, {
            toValue: Math.random() * 100 - 50,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Scale, {
            toValue: 0.8 + Math.random() * 0.8,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bubble1X, {
            toValue: 0,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Y, {
            toValue: 0,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Scale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(animateBubble1, Math.random() * 2000 + 1000);
      });
    };

    const animateBubble2 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubble2X, {
            toValue: Math.random() * 80 - 40,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble2Y, {
            toValue: Math.random() * 80 - 40,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble2Scale, {
            toValue: 0.7 + Math.random() * 0.8, 
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bubble2X, {
            toValue: 0,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble2Y, {
            toValue: 0,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble2Scale, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(animateBubble2, Math.random() * 3000 + 1500);
      });
    };

    setTimeout(animateBubble1, 500);
    setTimeout(animateBubble2, 1200);
  };

  const showSuccessToast = (msg: string) => {
    Alert.alert('Succès', msg);
  };

  const showErrorToast = (msg: string) => {
    Alert.alert('Erreur', msg);
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      // Check again if biometric is still available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        // Biometric not available anymore (damaged, disabled, etc.)
        Alert.alert(
          "Biométrie non disponible",
          "L'authentification biométrique n'est plus disponible sur cet appareil. Veuillez contacter l'administration pour désactiver cette exigence.",
          [{ text: "OK" }]
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authentifiez-vous avec ${biometricType}`,
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
        fallbackLabel: 'Utiliser le code',
      });

      return result.success;
    } catch (error) {
      console.log('Erreur authentification biométrique:', error);
      Alert.alert(
        "Erreur biométrique",
        "Impossible d'utiliser l'authentification biométrique. Veuillez contacter l'administration.",
        [{ text: "OK" }]
      );
      return false;
    }
  };

  const saveBiometricData = async (userDocId: string, deviceId: string) => {
    try {
      const userRef = doc(db, 'users', userDocId);
      await updateDoc(userRef, {
        biometric_device_id: deviceId,
        biometric_enabled: true,
        biometric_registered_at: new Date().toISOString(),
      });
    } catch (error) {
      console.log('Erreur sauvegarde données biométriques:', error);
    }
  };

  const getDeviceId = async (): Promise<string> => {
    try {
      let deviceId = await getData('device_id');
      if (!deviceId) {
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await saveData('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.log('Erreur génération device ID:', error);
      return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  const navigateToHome = (userData: any) => {
    const { username, roleName, firstLogin, email, otherRoleName, hasSecondRole } = userData;

    if (firstLogin == 1) {
      navigation.navigate('ChangePassword', {
        userLogin: username,
        userRole: roleName,
        firstLogin,
      });
    } else {
      if (hasSecondRole && otherRoleName) {
        navigation.navigate('ChooseScreen', {
          userLogin: username,
          userRole: roleName,
          email: email,
          classeId: userData.classeId,
        });
      } else if (roleName == 'etudiant') {
        navigation.navigate('HomeStudent', {
          userLogin: username,
          userRole: roleName,
          firstLogin,
          email: email,
          classeId: userData.classeId,
        });
      } else if (roleName == 'professeur') {
        navigation.navigate('HomeProfesseur', {
          userLogin: username,
          userRole: roleName,
          firstLogin,
          email: email,
          specialite: userData.specialite,
          statut: userData.statut,
        });
      } else if (roleName == 'admin') {
        navigation.navigate('AdminPanel', {
          userLogin: username,
          userRole: roleName,
          email: email,
          firstLogin,
        });
      } else {
        Alert.alert("Rôle utilisateur non pris en charge.");
      }
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showErrorToast("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "users"),
        where("login", "==", username.trim()),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocSnapshot = querySnapshot.docs[0];
        const userDoc = userDocSnapshot.data();
        const userDocId = userDocSnapshot.id;
        const email = userDoc.email;
        const firstLogin = userDoc.first_login;
        const roleId = userDoc.role_id;
        const otherRoleId = userDoc.role_id1;
        const biometricEnabled = userDoc.biometric_enabled || false;
        const savedDeviceId = userDoc.biometric_device_id || null;

        // Get current device ID
        const currentDeviceId = await getDeviceId();

        // STEP 1: Verify Firebase Authentication (password check)
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found') {
            // Try creating the account
            try {
              await createUserWithEmailAndPassword(auth, email, password);
            } catch (createError: any) {
              showErrorToast("Erreur de connexion, veuillez vérifier vos identifiants.");
              setLoading(false);
              return;
            }
          } else if (authError.code === 'auth/wrong-password') {
            showErrorToast("Mot de passe incorrect.");
            setLoading(false);
            return;
          } else {
            showErrorToast("Erreur de connexion, veuillez vérifier vos identifiants.");
            setLoading(false);
            return;
          }
        }

        // STEP 2: Password verified! Now check biometric requirements
        if (biometricEnabled && biometricAvailable) {
          // Check if this is the registered device
          if (savedDeviceId && savedDeviceId !== currentDeviceId) {
            Alert.alert(
              "Nouvel appareil détecté",
              "Ce compte est lié à un autre appareil. Si vous avez changé de téléphone, veuillez contacter l'administration pour réinitialiser votre appareil.",
              [
                { text: "OK", onPress: () => {} }
              ]
            );
            setLoading(false);
            return;
          }

          // Perform biometric authentication
          const biometricSuccess = await authenticateWithBiometric();
          
          if (!biometricSuccess) {
            showErrorToast("Authentification biométrique échouée.");
            setLoading(false);
            return;
          }
        }

        // STEP 3: Get role data
        const roleDoc = await getDoc(doc(db, "roles", roleId as string));
        let roleData = roleDoc.data();

        let OtherRoleData = null;
        let otherRoleName = '';
        
        if(otherRoleId){
          const OtherRoleDoc = await getDoc(doc(db, "roles", otherRoleId as string));
          OtherRoleData = OtherRoleDoc.data();
          otherRoleName = OtherRoleData?.libelle?.toLowerCase() || '';
        }

        if (!roleData) {          
          const roleQuery = query(
            collection(db, "roles"),
            where("id", "==", roleId)
          );
          
          const roleQuerySnapshot = await getDocs(roleQuery);
          
          if (!roleQuerySnapshot.empty) {
            roleData = roleQuerySnapshot.docs[0].data();
          } else {
            const numericRoleId = parseInt(roleId);
            if (!isNaN(numericRoleId)) {
              const numericQuery = query(
                collection(db, "roles"),
                where("id", "==", numericRoleId)
              );
              
              const numericQuerySnapshot = await getDocs(numericQuery);
              
              if (!numericQuerySnapshot.empty) {
                roleData = numericQuerySnapshot.docs[0].data();
              }
            }
          }
        }

        if (!roleData) {
          showErrorToast("Erreur: Rôle utilisateur non trouvé.");
          setLoading(false);
          return;
        }

        const roleName = roleData.libelle?.toLowerCase() || '';

        await saveData('userLogin', username.trim());
        await saveData('userRole', roleName);
        await saveData('userEmail', email);
        await saveData('userPhoto', userDoc.profilePhotoUrl || '');

        if (otherRoleId && otherRoleName) {
          await saveData('otherRoleLibelle', otherRoleName);
        } else {
          await deleteData('otherRoleLibelle');
        }

        if (roleName === 'etudiant') {
          await saveData('classe_id', userDoc.classe_id || '');

          if (userDoc.classe2_id && userDoc.classe2_id.trim() !== '') {
            await saveData('classe2_id', userDoc.classe2_id);
          }

          await saveData('filiere', userDoc.filiere_id || '');
          await saveData('niveau', userDoc.niveau_id || '');

        } else if (roleName === 'professeur') {
          await saveData('specialite', userDoc.specialite || '');
          await saveData('statut', userDoc.statut || '');
          await saveData('auth_uid', userDoc.auth_uid || ''); 
          await deleteData('classe_id');
          await deleteData('filiere');
          await deleteData('niveau');
        }

        // STEP 5: Offer to enable biometric if not already enabled
                // STEP 5: Handle different roles
        if (roleName == 'etudiant' || roleName == 'professeur') {
          // Offer biometric for students and professors only
          if (biometricAvailable && !biometricEnabled) {
            Alert.alert(
              "Sécurité renforcée",
              `Voulez-vous activer l'authentification par ${biometricType} pour sécuriser votre compte et éviter le partage?`,
              [
                {
                  text: "Plus tard",
                  style: "cancel",
                  onPress: () => {
                    setLoading(false);
                    const userData = {
                      username,
                      roleName,
                      firstLogin,
                      email,
                      otherRoleName, 
                      hasSecondRole: !!otherRoleId,
                      ...(roleName === 'etudiant' && { classeId: userDoc.classe_id }),
                      ...(roleName === 'professeur' && { 
                        specialite: userDoc.specialite,
                        statut: userDoc.statut 
                      })
                    };
                    navigateToHome(userData);
                  }
                },
                {
                  text: "Activer",
                  onPress: async () => {
                    const biometricSuccess = await authenticateWithBiometric();
                    if (biometricSuccess) {
                      await saveBiometricData(userDocId, currentDeviceId);
                      showSuccessToast(`${biometricType} activé avec succès!`);
                    }
                    setLoading(false);
                    const userData = {
                      username,
                      roleName,
                      firstLogin,
                      email,
                      otherRoleName, 
                      hasSecondRole: !!otherRoleId,
                      ...(roleName === 'etudiant' && { classeId: userDoc.classe_id }),
                      ...(roleName === 'professeur' && { 
                        specialite: userDoc.specialite,
                        statut: userDoc.statut 
                      })
                    };
                    navigateToHome(userData);
                  }
                }
              ]
            );
          } else {
            setLoading(false);
            const userData = {
              username,
              roleName,
              firstLogin,
              email,
              otherRoleName, 
              hasSecondRole: !!otherRoleId,
              ...(roleName === 'etudiant' && { classeId: userDoc.classe_id }),
              ...(roleName === 'professeur' && { 
                specialite: userDoc.specialite,
                statut: userDoc.statut 
              })
            };
            navigateToHome(userData);
          }
        } else if (roleName == 'admin') {
          // Admin login - no biometric required
          setLoading(false);
          const userData = {
            username,
            roleName,
            firstLogin,
            email,
            otherRoleName, 
            hasSecondRole: !!otherRoleId,
          };
          navigateToHome(userData);
        } else {
          // Unknown role
          showErrorToast("Rôle utilisateur non pris en charge.");
          setLoading(false);
        }

      } else {
        showErrorToast("Identifiants invalides, veuillez réessayer.");
        setLoading(false);
      }

    } catch (error) {
      console.log('Login error:', error);
      showErrorToast("Erreur serveur, veuillez réessayer plus tard.");
      setLoading(false);
    }
  };

   if (!privacyChecked) {
    return (
      <PrivacyConsentScreen
        visible={showPrivacyConsent}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white"/>
      <View style={localStyles.container}>
        <View />
        
        <Animated.View 
          style={[
            localStyles.circle1,
            {
              transform: [
                { translateX: bubble1X },
                { translateY: bubble1Y },
                { scale: bubble1Scale }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            localStyles.circle2,
            {
              transform: [
                { translateX: bubble2X },
                { translateY: bubble2Y },
                { scale: bubble2Scale }
              ]
            }
          ]} 
        />
        
        <KeyboardAvoidingView 
          style={localStyles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={localStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                localStyles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={localStyles.headerSection}>
                <Animated.View 
                  style={[
                    localStyles.logoContainer,
                    { transform: [{ scale: logoScale }] }
                  ]}
                >
                  <Image
                    source={require('../../assets/logo8.png')}
                    style={localStyles.logo}
                    resizeMode="contain"
                  />
                </Animated.View>
                
                <Text style={localStyles.schoolName}>
                  Institut Informatique Business School
                </Text>
                <Text style={localStyles.welcomeText}>
                  Connectez-vous à votre espace étudiant
                </Text>
                {biometricAvailable && (
                  <Text style={styles.biometricInfo}>
                    🔒 {biometricType} disponible
                  </Text>
                )}
              </View>

              <View style={localStyles.loginForm}>
                <View style={localStyles.inputGroup}>
                  <Text style={localStyles.inputLabel}>Nom d'utilisateur</Text>
                  <View style={localStyles.inputWrapper}>
                    <TextInput
                      style={[
                        localStyles.textInput,
                        username.length > 0 && localStyles.inputFocused
                      ]}
                      placeholder="Saisissez votre nom d'utilisateur"
                      placeholderTextColor="#A0A0A0"
                      value={username}
                      onChangeText={(text) => setUsername(text.replace(/[^\w.@-]/g, ''))}
                      editable={!loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={localStyles.inputGroup}>
                  <Text style={localStyles.inputLabel}>Mot de passe</Text>
                  <View style={localStyles.inputWrapper}>
                    <TextInput
                      style={[
                        localStyles.textInput,
                        password.length > 0 && localStyles.inputFocused
                      ]}
                      placeholder="Saisissez votre mot de passe"
                      placeholderTextColor="#A0A0A0"
                      value={password}
                      onChangeText={(text) => setPassword(text)}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={localStyles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <Text style={localStyles.eyeIconText}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    localStyles.loginButton,
                    loading && localStyles.loginButtonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={localStyles.loadingContainer}>
                      <ActivityIndicator 
                        size="small"
                        color="#FFFFFF"
                      />
                      <Text style={localStyles.loginButtonText}>Connexion...</Text>
                    </View>
                  ) : (
                    <Text style={localStyles.loginButtonText}>Se connecter</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={localStyles.forgotPassword}>
                  <Text 
                    style={localStyles.forgotPasswordText} 
                    onPress={() => navigation.navigate('ChangePassword' as never)}
                  >
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  biometricInfo: {
    fontSize: 14,
    color: '#059669',
    marginTop: 8,
    fontWeight: '600',
  },
});