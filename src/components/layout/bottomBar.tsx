import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/globalStyles';
import { Cstyles } from '../../etudiant/pages/allCourses/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  activeScreen: string;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const BottomNavBar = ({ activeScreen }: Props) => {
  const navigation = useNavigation();
  const [role, setRole] = useState<string | null>(null);

  // Load userRole from storage
  useEffect(() => {
    (async () => {
      const savedRole = await AsyncStorage.getItem("userRole");
      setRole(savedRole);
    })();
  }, []);

  if (!role) return null; // avoid flashing until role is loaded

  const studentItems = [
    { name: 'HomeStudent', icon: 'home-outline', screen: 'HomeStudent', libelle: 'Accueil' },
    { name: 'AllCoursesStudent', icon: 'calendar-outline', screen: 'AllCoursesStudent', libelle: 'Emploi du temps' },
    { name: 'Posts', icon: 'create-outline', screen: 'Posts', libelle: 'Posts' },
    { name: 'VoirNote', icon: 'document-text-outline', screen: 'VoirNote', libelle: 'Notes' },
    { name: 'ProfileStudent', icon: 'person-outline', screen: 'ProfileStudent', libelle: 'Profil' }, 
  ];""

  const profItems = [
    { name: 'HomeProfesseur', icon: 'home-outline', screen: 'HomeProfesseur', libelle: 'Accueil' },
    { name: 'AllCoursesProfesseur', icon: 'calendar-outline', screen: 'AllCoursesProfesseur', libelle: 'Cours' },
    { name: 'Posts', icon: 'create-outline', screen: 'Posts', libelle: 'Posts' },
    { name: 'Evaluations', icon: 'document-text-outline', screen: 'Evaluations', libelle: 'Évaluations' },
    { name: 'ProfileProfesseur', icon: 'person-outline', screen: 'ProfileProfesseur', libelle: 'Profil' },
  ];


  const navItems = role === "etudiant" ? studentItems : profItems;

  return (
    <SafeAreaView style={styles.wrapper} edges={['bottom']}>
      <View style={styles.container}>
        {navItems.map((item) => {
          const isActive = activeScreen == item.screen;
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.button}
              onPress={() => navigation.navigate(item.screen as never)}
            >
              <Ionicons
                size={28}
                color={isActive ? theme.colors.primary : '#888'}
                name={item.icon as IoniconName}
              />
              {isActive && <View style={styles.activeIndicator} />}
              <Text style={Cstyles.courseText}>{item.libelle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default BottomNavBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    alignItems: 'center',
  },
  activeIndicator: {
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});
