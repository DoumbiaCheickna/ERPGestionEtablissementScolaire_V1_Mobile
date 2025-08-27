import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, getUserSnapchot } from '../../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavBar from '../../components/layout/topBar';
import BottomNavBar from '../../components/layout/bottomBar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/globalStyles';
import { RootStackParamList } from '../../../navigation/index';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const profileActions = [
  { id: '1', icon: 'person-outline', title: 'Profil', subtitle: 'Modifier votre profil' },
  { id: '2', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Gérer vos notifications' },
  { id: '3', icon: 'help-circle-outline', title: 'Aide et support', subtitle: 'Accéder à l aide et au support' },
  { id: '4', icon: 'log-out-outline', title: 'Déconnexion', subtitle: '' },
];

interface UserInfo {
  nom: string;
  prenom: string;
  email: string;
  login: string;
  classeId: string;
  avatar?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function Profile({ navigation }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      

      const userSnapshot: any = await getUserSnapchot();

      if (!userSnapshot || userSnapshot.empty) {
          setError('Utilisateur non trouvé');
          return;
        }
        const userDoc = userSnapshot.docs[0].data();
        
        setUser({
          nom: userDoc.nom || '',
          prenom: userDoc.prenom || '',
          email: userDoc.email || '',
          login: userDoc.login || '',
          classeId: userDoc.classe_id || '',
          avatar: userDoc.avatar
        });
    

    } catch (error) {
      setError('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleActionPress = (actionId: string, actionTitle: string) => {
    // Handle different action presses
    switch (actionId) {
      case '1': // Profil
        navigation.navigate('ShowProfileInfos');
        break;
      case '2': // Notifications
        navigation.navigate('NotificationsInfos')
        break;
      case '3': // Aide
        Alert.alert('Info', 'Fonctionnalité d\'aide et support à implémenter');
        break;
      case '4': // Déconnexion
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userLogin');
              await AsyncStorage.removeItem('userRole');
              await AsyncStorage.removeItem('classe_id');
              await AsyncStorage.removeItem('filiere');
              await AsyncStorage.removeItem('niveau');
              
              Alert.alert('Succès', 'Vous avez été déconnecté avec succès');
              navigation.navigate('Login' as never);
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: typeof profileActions[0] }) => (
    <TouchableOpacity 
      style={styles.actionItem} 
      activeOpacity={0.6}
      onPress={() => handleActionPress(item.id, item.title)}
    >
      <Ionicons name={item.icon as any} size={24} color={theme.colors.primary} />
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.actionSubtitle}>{item.subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNavBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
        <BottomNavBar activeScreen="Profile" />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <TopNavBar />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || 'Erreur de chargement'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserInfo}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar activeScreen="Profile" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNavBar />

      <View style={styles.profileHeader}>
        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.prenom} {user.nom}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userLogin}>@{user.login}</Text>
        </View>
      </View>

      <FlatList
        data={profileActions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <BottomNavBar activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f6f6f6' 
  },
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  userInfo: {
    marginLeft: 15,
    flexDirection: 'column',
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  userLogin: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  actionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
  actionSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});