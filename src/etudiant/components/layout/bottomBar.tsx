import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ important
import { theme } from '../../../styles/globalStyles';
import { Cstyles } from '../../pages/allCourses/styles';

interface Props {
  activeScreen: string;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const navItems: { name: string; icon: IoniconName; screen: string; libelle: string }[] = [
  { name: 'Home', icon: 'home-outline', screen: 'Home', libelle: 'Accueil' },
  { name: 'AllCourses', icon: 'calendar-outline', screen: 'AllCourses', libelle: 'Emploi du temps' },
  { name: 'Profile', icon: 'person-outline', screen: 'Profile', libelle: 'Profil' }, 
];

export default function BottomNavBar({ activeScreen }: Props) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.wrapper} edges={['bottom']}>
      <View style={styles.container}>
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.button}
              onPress={() => navigation.navigate(item.screen as never)}
            >
              <Ionicons
                size={28}
                color={isActive ? theme.colors.primary : '#888'}
                name={item.icon}
              />
              {isActive && <View style={styles.activeIndicator} />}
              <Text style={Cstyles.courseText}>
                {item.libelle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0, // ✅ always pinned above Android/iOS nav bar
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
