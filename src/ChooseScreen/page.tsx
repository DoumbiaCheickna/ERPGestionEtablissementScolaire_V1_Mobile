import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { saveData, getData, deleteData, clearAllData } from '../components/utils/secureStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseScreen'>;

export default function ChooseScreen({ navigation, route }: Props) {
  const { userLogin, email, classeId } = route.params || {};

  const handleSelectRole = async (selectedRole: 'etudiant' | 'professeur') => {
    try {
      // Update secureStorage with selected role
      await saveData('userRole', selectedRole);

      if (selectedRole === 'etudiant') {
        navigation.replace('HomeStudent', {
          userLogin: userLogin || '',
          userRole: selectedRole,
          firstLogin: 0,
          email: email || '',
          classeId: classeId || '',
        });
      } else {
        navigation.replace('HomeProfesseur', {
          userLogin: userLogin || '',
          userRole: selectedRole,
          firstLogin: 0,
          email: email || '',
        });
      }
    } catch (error) {
      console.error('Error selecting role:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Background */}
      <View style={styles.background} />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎓</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Veuillez choisir</Text>
        <Text style={styles.title}>Votre Écran</Text>
        
        <Text style={styles.subtitle}>
          Sélectionnez votre profil pour continuer
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Étudiant Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleSelectRole('etudiant')}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>

              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Étudiant</Text>
                <Text style={styles.buttonSubtitle}>
                  Accéder à l'espace étudiant
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Professeur Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleSelectRole('professeur')}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>

              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Professeur</Text>
                <Text style={styles.buttonSubtitle}>
                  Accéder à l'espace professeur
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Institut Informatique Business School
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 50,
    fontWeight: '400',
  },
  buttonsContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonIconText: {
    fontSize: 28,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  arrow: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: '600',
  },
  footer: {
    marginTop: 60,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});