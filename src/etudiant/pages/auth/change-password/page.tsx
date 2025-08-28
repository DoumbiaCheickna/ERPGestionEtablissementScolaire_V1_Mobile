import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from '../../../../firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { globalStyles, theme } from '../../../../styles/globalStyles';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ChangePassword() {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userLogin, setUserLogin] = useState<string>('');
  const [showLoginField, setShowLoginField] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  const navigation = useNavigation();

  useEffect(() => {
    // Animation Fade In et Slide up
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
  }, []);

  useEffect(() => {
    async function loadLogin() {
      const login = await AsyncStorage.getItem('userLogin');
      if (login) {
        setUserLogin(login);
        setShowLoginField(false);
      } else {
        // If no login, show login field instead of redirecting
        setShowLoginField(true);
      }
    }
    loadLogin();
  }, [navigation]);

  const showSuccessToast = (msg: string) => {
    Alert.alert('Succès', msg);
  };

  const showErrorToast = (msg: string) => {
    Alert.alert('Erreur', msg);
  };

  const handleChangePassword = async () => {
    if (!userLogin.trim()) {
      showErrorToast("Veuillez entrer votre login.");
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      showErrorToast("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "users"),
        where("login", "==", userLogin)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0];
        const userData = userDocRef.data();
        const login = userData.login;
        const currentPassword = userData.password;

        // Update password and first_login flag in Firestore
        await updateDoc(doc(db, "users", userDocRef.id), {
          password: password,
          first_login: 0,
        });

        if (auth.currentUser && currentPassword) {
          const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        }
        if (auth.currentUser) {
          try {
            await updatePassword(auth.currentUser, password);
          } catch (error) {
            console.error("Erreur mise à jour mot de passe Firebase:", error);
          }
        }

        await AsyncStorage.setItem("userLogin", login);
        showSuccessToast("Mot de passe changé avec succès !");

        // Get role info like in Login screen
        const roleId = userData.role_id;
        const roleDoc = await getDoc(doc(db, "roles", roleId));
        const roleData = roleDoc.data();
        const roleName = roleData?.libelle || '';

        setTimeout(() => {
          if (roleName.toLowerCase() === 'etudiant') {
            navigation.navigate('HomeStudent' as never);
          } 
        }, 1500);

      } else {
        showErrorToast("Utilisateur non trouvé.");
      }
    } catch (error) {
      showErrorToast("Erreur serveur, veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={localStyles.container}>
        {/* Background Gradient */}
        <View />
        
        {/* Cercles décoratives */}
        <View style={localStyles.circle1} />
        <View style={localStyles.circle2} />
        
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
              {/* Back Button */}
              <TouchableOpacity 
                style={localStyles.backButton} 
                onPress={() => navigation.navigate('Login' as never)}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color="#28292bff" />
              </TouchableOpacity>

              {/* Header Section */}
              <View style={localStyles.headerSection}>
                <Animated.View 
                  style={[
                    localStyles.logoContainer,
                    { transform: [{ scale: logoScale }] }
                  ]}
                >
                  <View style={localStyles.logoBackground}>
                    <Image
                      source={require('../../../../assets/iibs-logo.png')}
                      style={localStyles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </Animated.View>
                
                <Text style={localStyles.title}>Changement de mot de passe</Text>
                <Text style={localStyles.subtitle}>
                  {showLoginField 
                    ? "Veuillez entrer votre login et changer votre mot de passe."
                    : "Première connexion détectée. Veuillez changer votre mot de passe."
                  }
                </Text>
              </View>

              {/* Form */}
              <View style={localStyles.changePasswordForm}>
                {showLoginField && (
                  <View style={localStyles.inputGroup}>
                    <Text style={localStyles.inputLabel}>Login</Text>
                    <View style={localStyles.inputWrapper}>
                      <TextInput
                        style={[
                          localStyles.textInput,
                          userLogin.length > 0 && localStyles.inputFocused
                        ]}
                        placeholder="Entrez votre login"
                        placeholderTextColor="#A0A0A0"
                        value={userLogin}
                        onChangeText={(text) => setUserLogin(text.replace(/[^\w.@-]/g, ''))}
                        editable={!loading}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                <View style={localStyles.inputGroup}>
                  <Text style={localStyles.inputLabel}>Nouveau mot de passe</Text>
                  <View style={localStyles.inputWrapper}>
                    <TextInput
                      style={[
                        localStyles.textInput,
                        password.length > 0 && localStyles.inputFocused
                      ]}
                      placeholder="Entrez votre nouveau mot de passe"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => setPassword(text)}
                      editable={!loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={localStyles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={localStyles.eyeIconText}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={localStyles.inputGroup}>
                  <Text style={localStyles.inputLabel}>Confirmer le mot de passe</Text>
                  <View style={localStyles.inputWrapper}>
                    <TextInput
                      style={[
                        localStyles.textInput,
                        confirmPassword.length > 0 && localStyles.inputFocused
                      ]}
                      placeholder="Confirmez votre nouveau mot de passe"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => setConfirmPassword(text)}
                      editable={!loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={localStyles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={localStyles.eyeIconText}>
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    localStyles.changePasswordButton,
                    loading && localStyles.changePasswordButtonDisabled
                  ]}
                  onPress={handleChangePassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={localStyles.loadingContainer}>
                      <ActivityIndicator 
                        size="small"
                        color="#FFFFFF"
                      />
                      <Text style={localStyles.changePasswordButtonText}>Changement...</Text>
                    </View>
                  ) : (
                    <Text style={localStyles.changePasswordButtonText}>Changer le mot de passe</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },

  circle1: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgb(1, 1, 34)',
  },

  circle2: {
    position: 'absolute',
    top: 700,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgb(1, 1, 34)',
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    marginTop: screenHeight * 0.05,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logoContainer: {
    marginBottom: 20,
  },

  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#28292bff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  logo: {
    width: 60,
    height: 60,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  changePasswordForm: {
    marginBottom: 32,
  },

  inputGroup: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  inputWrapper: {
    position: 'relative',
  },

  textInput: {
    height: 54,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  inputFocused: {
    borderColor: '#28292bff',
    backgroundColor: '#ffffff',
  },

  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },

  eyeIconText: {
    fontSize: 16,
  },

  changePasswordButton: {
    height: 54,
    backgroundColor: 'rgb(1, 1, 34)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#28292bff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  changePasswordButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
    elevation: 0,
  },

  changePasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});