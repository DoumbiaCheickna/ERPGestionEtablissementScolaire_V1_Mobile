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
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { localStyles } from './styles';
import { RootStackParamList } from '../../navigation';


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Login({ navigation }: Props) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
    const checkLoggedIn = async () => {
      const loggedIn = await AsyncStorage.getItem("userLogin");
      if (loggedIn) {
        const roleName = await AsyncStorage.getItem("userRole") || '';
        const email = await AsyncStorage.getItem("userEmail") || '';
        
        if (roleName === 'etudiant') {
          const classeId = await AsyncStorage.getItem("classe_id") || '';
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

    checkLoggedIn();
  }, []);

  useEffect(() => {
    // Animation Fade In and Slide up
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
    // Bubble 1 animation sequence
    const animateBubble1 = () => {
      Animated.sequence([
        // Move and scale
        Animated.parallel([
          Animated.timing(bubble1X, {
            toValue: Math.random() * 200 - 100, // Random movement between -100 and 100
            duration: 3000 + Math.random() * 2000, // Random duration between 3-5 seconds
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Y, {
            toValue: Math.random() * 100 - 50,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Scale, {
            toValue: 0.8 + Math.random() * 0.8, // Scale between 0.8 and 1.6
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
        // Return to original position
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
        // Restart the animation after a random delay
        setTimeout(animateBubble1, Math.random() * 2000 + 1000);
      });
    };

    // Bubble 2 animation sequence
    const animateBubble2 = () => {
      Animated.sequence([
        // Move and scale
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
            toValue: 0.7 + Math.random() * 0.8, // Scale between 0.7 and 1.5
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
        // Return to original position
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
        // Restart the animation after a random delay
        setTimeout(animateBubble2, Math.random() * 3000 + 1500);
      });
    };

    // Start both animations with different delays
    setTimeout(animateBubble1, 500);
    setTimeout(animateBubble2, 1200);
  };

  const showSuccessToast = (msg: string) => {
    Alert.alert('Succès', msg);
  };

  const showErrorToast = (msg: string) => {
    Alert.alert('Erreur', msg);
  };

  // Helper function to navigate to appropriate screen
  const navigateToHome = (userData: any) => {
    const { username, roleName, firstLogin, email } = userData;
    
    if (firstLogin == 1) {
      navigation.navigate('ChangePassword', {
        userLogin: username,
        userRole: roleName,
        firstLogin,
      });
    } else {
      if(roleName == 'etudiant') {
        navigation.navigate('HomeStudent', {
          userLogin: username,
          userRole: roleName,
          firstLogin,
          email: email,
          classeId: userData.classeId, // Only for students
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
        const userDoc = querySnapshot.docs[0].data();
        const email = userDoc.email;
        const firstLogin = userDoc.first_login;
        const roleId = userDoc.role_id;

        const roleDoc = await getDoc(doc(db, "roles", roleId as string));
        let roleData = roleDoc.data();

        // If document not found by ID, search in collection
        if (!roleData) {          
          const roleQuery = query(
            collection(db, "roles"),
            where("id", "==", roleId)
          );
          
          const roleQuerySnapshot = await getDocs(roleQuery);
          
          if (!roleQuerySnapshot.empty) {
            roleData = roleQuerySnapshot.docs[0].data();
          } else {
            // Try with numeric conversion if roleId is string
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

        // Handle case where no role is found
        if (!roleData) {
          showErrorToast("Erreur: Rôle utilisateur non trouvé.");
          setLoading(false);
          return;
        }

        const roleName = roleData.libelle?.toLowerCase() || '';

        // Store common user data
        await AsyncStorage.setItem('userLogin', username.trim());
        await AsyncStorage.setItem('userRole', roleName);
        await AsyncStorage.setItem('userEmail', email);

        // Store role-specific data
        if (roleName === 'etudiant') {
          // Student-specific data
          await AsyncStorage.setItem('classe_id', userDoc.classe_id || '');

          if (userDoc.classe2_id && userDoc.classe2_id.trim() !== '') {
            await AsyncStorage.setItem('classe2_id', userDoc.classe2_id);
          }

          await AsyncStorage.setItem('filiere', userDoc.filiere_id || '');
          await AsyncStorage.setItem('niveau', userDoc.niveau_id || '');
        } else if (roleName === 'professeur') {
          // Professor-specific data
          await AsyncStorage.setItem('specialite', userDoc.specialite || '');
          await AsyncStorage.setItem('statut', userDoc.statut || '');
          await AsyncStorage.setItem('auth_uid', userDoc.auth_uid || '');
          // Clear student-specific data in case of role switching
          await AsyncStorage.removeItem('classe_id');
          await AsyncStorage.removeItem('filiere');
          await AsyncStorage.removeItem('niveau');
        }

        if (roleName == 'etudiant' || roleName == 'professeur') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
              try {
                await signInWithEmailAndPassword(auth, email, password);
              } catch (signInError: any) {
                showErrorToast("Erreur de connexion, veuillez vérifier vos identifiants.");
                setLoading(false);
                return;
              }
            } else {
              showErrorToast("Erreur lors de la création du compte.");
              setLoading(false);
              return;
            }
          }

          setLoading(false);
          
          const userData = {
            username,
            roleName,
            firstLogin,
            email,
            // Include role-specific data
            ...(roleName === 'etudiant' && { classeId: userDoc.classe_id }),
            ...(roleName === 'professeur' && { 
              specialite: userDoc.specialite,
              statut: userDoc.statut 
            })
          };
          
          navigateToHome(userData);

        } else {
          showErrorToast("Identifiants invalides, veuillez réessayer.");
          setLoading(false);
        }

      } else {
        showErrorToast("Identifiants invalides, veuillez réessayer.");
        setLoading(false);
      }

    } catch (error) {
      showErrorToast("Erreur serveur, veuillez réessayer plus tard.");
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white"/>
      <View style={localStyles.container}>
        {/* Background Gradient */}
        <View />
        
        {/* Animated decorative bubbles */}
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
              {/* Header */}
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
              </View>

              {/* Form */}
              <View style={localStyles.loginForm}>
                {/* Username */}
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

                {/* Password */}
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

                {/* Login Button */}
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

                {/* Forgot Password */}
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