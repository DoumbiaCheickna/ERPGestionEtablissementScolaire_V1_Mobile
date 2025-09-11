import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar, 
  SafeAreaView,
  Animated,
  Image
} from 'react-native';
import LottieView from 'lottie-react-native';
import { RootStackParamList } from '../navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;



const LandingPage = ({ navigation }: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animations
    isAlreadyLoggedIn();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsVisible(true);
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleGetStarted = () => {
    navigation.navigate('Login' as never);
  };

  const isAlreadyLoggedIn = async () => {
    const userLogin = await AsyncStorage.getItem('userLogin');
    const userRole = await AsyncStorage.getItem('userRole');

    if(userLogin){
      if(userRole === 'etudiant') navigation.navigate('HomeStudent' as never);
      else if(userRole === 'professeur') navigation.navigate('HomeProfesseur' as never);

    }
    
  } 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" translucent={false} />
      
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        <View style={styles.gradientOverlay} />
      </View>

      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoSection,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.logoContainer}>
            {/* Replace with your actual logo */}
            <Image 
              source={require('../assets/logo7.png')} // Update path
              style={styles.logoImage}
              resizeMode="contain"
            />

          </View>
          <Text style={styles.logoTitle}>Campus Digital</Text>
          <Text style={styles.logoSubtitle}>Institut Informatique Business School</Text>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <Text style={styles.heroTitle}>
            L'avenir de{'\n'}
            <Text style={styles.heroAccent}>l'éducation connectée</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Gérez vos cours, émargez en temps réel et restez connecté avec votre campus où que vous soyez
          </Text>
        </Animated.View>

        {/* Lottie Animation */}
        <Animated.View 
          style={[
            styles.animationContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
    
        </Animated.View>

        {/* Features Preview */}
        <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(64, 224, 208, 0.2)' }]}>
                <Text style={styles.featureEmoji}>📚</Text>
              </View>
              <Text style={styles.featureTitle}>Cours Live</Text>
              <Text style={styles.featureDesc}>Suivi temps réel</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(138, 43, 226, 0.2)' }]}>
                <Text style={styles.featureEmoji}>📍</Text>
              </View>
              <Text style={styles.featureTitle}>Géolocalisation</Text>
              <Text style={styles.featureDesc}>Émargement sécurisé</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 65, 108, 0.2)' }]}>
                <Text style={styles.featureEmoji}>⚡</Text>
              </View>
              <Text style={styles.featureTitle}>QR Rapide</Text>
              <Text style={styles.featureDesc}>Accès instantané</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Bottom CTA */}
      <Animated.View 
        style={[
          styles.ctaSection,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <View style={styles.ctaButtonInner}>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaText}>Commencez</Text>
              <View style={styles.ctaIcon}>
                <Text style={styles.ctaArrow}>→</Text>
              </View>
            </View>
          </View>
          <View style={styles.ctaGlow} />
        </TouchableOpacity>
        
        <View style={styles.trustIndicator}>
          <View style={styles.trustDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Text style={styles.trustText}>150+ étudiants connectés</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },

  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 1,
  },

  circle1: {
    top: -170,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: '#2196F3',
  },

  circle2: {
    top: screenHeight * 0.4,
    left: -150,
    width: 240,
    height: 240,
    backgroundColor: '#2196F3',
  },

  circle3: {
    bottom: -100,
    right: -80,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 65, 108, 0.1)',
  },

  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.3)',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },

  logoImage: {
    width: 300,
    height: 100,
    marginBottom: 12,
  },

  logoBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#40E0D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0f0f23',
  },

  logoBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f0f23',
    letterSpacing: 0.5,
  },

  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 1,
  },

  logoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: -50,
  },

  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },

  heroAccent: {
    color: '#2196F3',
    fontSize: 38,
  },

  heroDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Animation Section
  animationContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },

  animationWrapper: {
    position: 'relative',
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: (screenWidth * 0.7) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(64, 224, 208, 0.2)',
  },

  lottieAnimation: {
    width: '80%',
    height: '80%',
  },

  animationPlaceholder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  placeholderEmoji: {
    fontSize: 32,
  },

  placeholderText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // Features Section
  featuresSection: {
    marginTop: 20,
  },

  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  featureItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },

  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  featureEmoji: {
    fontSize: 24,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    paddingHorizontal: 0,
    textAlign: 'center',
  },

  featureDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 0,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  ctaButton: {
    position: 'relative',
    width: screenWidth - 48,
    height: 64,
    borderRadius: 32,
    marginBottom: 24,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  ctaButtonInner: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f0f23',
    marginRight: 12,
  },

  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,15,35,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  ctaArrow: {
    fontSize: 16,
    color: '#0f0f23',
    fontWeight: 'bold',
  },

  ctaGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(64, 224, 208, 0.3)',
  },

  // Trust Indicator
  trustIndicator: {
    alignItems: 'center',
  },

  trustDots: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 3,
  },

  activeDot: {
    backgroundColor: '#2196F3',
  },

  trustText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});

export default LandingPage;