// src/components/TopNavBar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, getUserData, getUserSnapchot } from '../../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TopNavBar() {
  const navigation = useNavigation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [userLogin, setUserLogin] = useState<string | any>(null);
  const [userName, setUserName] = useState<string | null>(null);


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

  // Load notifications on component mount
  useEffect(() => {
    getUserNotifications();
    getUserName();
  }, []);

  // Function to format notification count for display
  const getNotificationDisplay = () => {
    if (notificationCount === 0) return null;
    if (notificationCount > 9) return '9+';
    return notificationCount.toString();
  };

  return (
    <>
      {/* StatusBar Configuration */}
      <StatusBar 
        barStyle="dark-content" // This makes the text/icons dark
        backgroundColor="white" // Background color (Android)
        translucent={false}
      />
      
      <View style={styles.topNav}>
        {/* IIBS Logo - Navigates to Home */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Image
            source={require('../../../assets/iibs-logo.png')}
            style={styles.profilePic}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
           {getGreeting(userName as string)}
        </Text>

        {/* Notification Icon with Badge */}
        <TouchableOpacity         
          onPress={() => {
            navigation.navigate('Notifications' as never);
            // Optionally mark notifications as read here
            // markNotificationsAsRead();
          }}
          style={styles.notificationContainer}>
          <Ionicons 
            name="notifications-outline" 
            size={28} 
            color={theme.colors.primary} 
          />
          
          {/* Notification Badge */}
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {getNotificationDisplay()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topNav: {
    paddingHorizontal: 15,
    height: 170,
    marginTop: -50,
    backgroundColor: "white",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d3d3d3ff',
    // Add padding top for status bar on Android if needed
    paddingTop: 70
  },
  profilePic: {
    marginTop: 25,
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#ccc',
    zIndex: 100,
  },
  title: {
    marginTop: 25,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    flex: 1, 
  },
  notificationContainer: {
    marginTop: 25,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30', // Red color
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});