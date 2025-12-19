import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/globalStyles';
import { Cstyles } from '../../etudiant/pages/allCourses/styles';
import { saveData, getData, deleteData, clearAllData } from '../../components/utils/secureStorage';
interface Props {
  activeScreen: string;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const BottomNavBar = ({ activeScreen }: Props) => {
  const navigation = useNavigation();
  const [role, setRole] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);


  // Load userRole from storage
  useEffect(() => {
    (async () => {
      const savedRole = await getData("userRole");
      setRole(savedRole);
    })();

  }, []);

  useEffect(() => {
    (async () => {
      const photo = await getUserPhoto();
      setUserPhoto(photo);
    })();
  }, []);

  const getUserPhoto = async () => {
    const storedProfile = await getData('userProfile');

    if (storedProfile) {
      const user = JSON.parse(storedProfile);
      return user.profilePhotoUrl || 'person-outline';
    }
  }

  if (!role) return null; 

  const studentItems = [
    { name: 'HomeStudent', icon: 'home-outline', screen: 'HomeStudent', libelle: 'Accueil' },
    { name: 'AllCoursesStudent', icon: 'calendar-outline', screen: 'AllCoursesStudent', libelle: 'Emploi du temps'},
    { name: 'VoirNote', icon: 'document-text-outline', screen: 'VoirNote', libelle: 'Notes' },
    { name: 'ProfileStudent', icon: 'person-outline', screen: 'ProfileStudent', libelle: 'Profil' }, 
  ];

  const profItems = [
    { name: 'HomeProfesseur', icon: 'home-outline', screen: 'HomeProfesseur', libelle: 'Accueil' },
    { name: 'AllCoursesProfesseur', icon: 'calendar-outline', screen: 'AllCoursesProfesseur', libelle: 'Cours' },
    { name: 'Evaluations', icon: 'document-text-outline', screen: 'Evaluations', libelle: 'Évaluations' },
    { name: 'ProfileProfesseur', icon: 'person-outline', screen: 'ProfileProfesseur', libelle: 'Profil' },
  ];


  const navItems = role === "etudiant" ? studentItems : profItems;

  return (
   <SafeAreaView style={styles.wrapper} edges={['bottom']}>
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeScreen == item.screen;

        // Check if this is the profile item and has a URL
        const isProfile = item.name === 'ProfileStudent' && userPhoto;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.button}
            onPress={() => navigation.navigate(item.screen as never)}
          >
            {isProfile ? (
              <Image
                source={{ uri: userPhoto }}
                style={{ width: 28, height: 28, borderRadius: 14 }}
              />
            ) : (
              <Ionicons
                size={28}
                color={isActive ? theme.colors.primary : '#888'}
                name={item.icon as IoniconName}
              />
            )}
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
    marginTop: 5,
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
