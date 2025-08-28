// src/components/TopNavBar.tsx
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, StatusBar, Platform, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/globalStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, getUserData, getUserSnapchot } from '../../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './navStyles'
export interface TopNavBarRef {
  refreshData: () => Promise<void>;
}

interface TopNavBarProps {
  onRefreshHome?: () => Promise<void>;
}

const TopNavBar = forwardRef<TopNavBarRef, TopNavBarProps>(({ onRefreshHome }, ref) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [notificationCount, setNotificationCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [userLogin, setUserLogin] = useState<string | any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  const getUserName = async () => {
    try {
      const login = await AsyncStorage.getItem("userLogin");
      if (login) {
        setUserLogin(login);
      }
    
      const userData = await getUserData(login as string);
      setUserName(`${userData.prenom}`)
    
    } catch (error) {
      console.error("Error loading user login:", error);
    }
  };
  
  const getGreeting = (userName: string): string => {
    const now = new Date();
    const hours = now.getHours();

    let greeting = "";

    if (hours >= 0 && hours < 12) {
      greeting = `☀️ Bonjour, ${userName} !`;
    } else if (hours >= 12 && hours < 18) {
      greeting = `🌞 Bon Après-midi, ${userName} !`;
    } else {
      greeting = `🌙 Bonsoir, ${userName} !`;
    }

    return greeting;
  };

  // Function to get user notifications using userLogin
  const getUserNotifications = async () => {
    try {
      const querySnapshot: any = await getUserSnapchot();
      
      if (querySnapshot.empty) {
        Alert.alert('Erreur lors de la récupération des informations');
        return;
      }

      // Get the first (should be only) user document
      const userDoc = querySnapshot.docs[0];
      const userData: any = userDoc.data();
      const userNotifications = userData.notifications || {};

      // Convert notifications object to array
      const notificationsArray = Object.values(userNotifications);
      
      // Count unread notifications (where read is false or undefined)
      const unreadCount = notificationsArray.filter((notif: any) => 
        notif.read == false || notif.read == undefined
      ).length;
      
      setNotificationCount(unreadCount);

    } catch (error) {
      console.error("Error fetching notifications: ", error);
    }
  };

  // Function to get absent courses count
  const getAbsentCount = async () => {
    try {
      const userLogin = await AsyncStorage.getItem('userLogin')
      const studentsRef = collection(db, 'users');
      const q = query(studentsRef, where('login', '==', userLogin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`User document not found for matricule: ${userLogin}`);
        return false;
      }

      const studentDoc = querySnapshot.docs[0];
      const userData = studentDoc.data();
      const existingEmargements: any[] = userData.emargements || [];

      const absences = existingEmargements.filter(ex => ex.type == 'absence');
      setAbsentCount(absences.length);


    } catch (error) {
      console.error('Error loading absent courses count:', error);
      setAbsentCount(0);
    }
  };

  // Combined function to refresh all data
  const refreshData = async () => {
    await Promise.all([
      getUserNotifications(),
      getUserName(),
      getAbsentCount()
    ]);
    // Force component re-render with updated greeting time
    setRefreshKey(prev => prev + 1);
  };

  // Expose refreshData function to parent components
  useImperativeHandle(ref, () => ({
    refreshData
  }));

  // Load notifications on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Handle logo press - navigate to Home or refresh if already on Home
  const handleLogoPress = async () => {
    // Check if current route is Home
    if (route.name === 'HomeStudent') {
      // Already on Home, refresh the data
      await refreshData();
      if (onRefreshHome) {
        await onRefreshHome();
      }
    } else {
      // Navigate to Home
      navigation.navigate('HomeStudent' as never);
    }
  };

  // Function to format notification count for display
  const getNotificationDisplay = () => {
    if (notificationCount === 0) return null;
    if (notificationCount > 9) return '9+';
    return notificationCount.toString();
  };

  // Function to format absent count for display
  const getAbsentDisplay = () => {
    if (absentCount == 0) return null;
    if (absentCount > 9) return '9+';
    return absentCount.toString();
  };

  const handleMenuItemPress = (screen: string) => {
    setMenuVisible(false);
    navigation.navigate(screen as never);
  };

  const MenuOption = ({ icon, title, count, onPress, countColor = '#FF3B30' }: {
    icon: string;
    title: string;
    count?: string | null;
    onPress: () => void;
    countColor?: string;
  }) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={styles.menuOptionLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        <Text style={styles.menuOptionText}>{title}</Text>
      </View>
      {count && (
        <View style={[styles.menuBadge, { backgroundColor: countColor }]}>
          <Text style={styles.menuBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* StatusBar Configuration */}
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="white"
        translucent={false}
      />
      
      <View style={styles.topNav} key={refreshKey}>
        {/* IIBS Logo - Navigates to Home or Refreshes if on Home */}
        <TouchableOpacity onPress={handleLogoPress}>
          <Image
            source={require('../../../assets/iibs-logo.png')}
            style={styles.profilePic}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
           {getGreeting(userName as string)}
        </Text>

        {/* Hamburger Menu Icon */}
        <TouchableOpacity 
          onPress={() => setMenuVisible(true)}
          style={styles.hamburgerContainer}
        >
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
          
          {/* Combined Badge for notifications and absences */}
          {(notificationCount > 0 || absentCount > 0) && (
            <View style={styles.combinedBadge}>
              <Text style={styles.combinedBadgeText}>
                {Math.min(99, notificationCount + absentCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity 
                onPress={() => setMenuVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuOptions}>
              <MenuOption
                icon="notifications-outline"
                title="Notifications"
                count={getNotificationDisplay()}
                onPress={() => handleMenuItemPress('Notifications')}
              />
              
              <MenuOption
                icon="close-circle-outline"
                title="Absences"
                count={getAbsentDisplay()}
                onPress={() => handleMenuItemPress('Absences')}
                countColor="#FF9500"
              />
              
              <MenuOption
                icon="book-outline"
                title="Matières"
                onPress={() => handleMenuItemPress('MatieresStudent')}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

export default TopNavBar;