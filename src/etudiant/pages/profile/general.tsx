import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db, getUserSnapchot } from '../../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavBar from '../../../components/layout/topBar';
import BottomNavBar from '../../../components/layout/bottomBar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/globalStyles';
import { RootStackParamList } from '../../../navigation/index';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generalStyles } from './styles';
import LottieView from 'lottie-react-native';
import { useStudentMatieres } from '../../../components/hooks/matieresStudent';
import { useStudentCourses } from '../../../components/hooks/coursStudent';

const profileActions = [
  { 
    id: '1', 
    icon: 'person-outline', 
    title: 'Mon Profil', 
    subtitle: 'Modifier vos informations personnelles',
    color: '#3b82f6'
  },
  { 
    id: '2', 
    icon: 'notifications-outline', 
    title: 'Notifications', 
    subtitle: 'Gérer vos préférences de notification',
    color: '#8b5cf6',
  },
  { 
    id: '3', 
    icon: 'settings-outline', 
    title: 'Paramètres', 
    subtitle: 'Configurer l\'application',
    color: '#6b7280'
  },
  { 
    id: '4', 
    icon: 'help-circle-outline', 
    title: 'Aide & Support', 
    subtitle: 'Obtenir de l\'aide et contacter le support',
    color: '#10b981'
  },
  { 
    id: '5', 
    icon: 'information-circle-outline', 
    title: 'À propos', 
    subtitle: 'Version de l\'app et informations légales',
    color: '#f59e0b'
  },
  { 
    id: '6', 
    icon: 'log-out-outline', 
    title: 'Déconnexion', 
    subtitle: 'Se déconnecter de votre compte',
    color: '#ef4444',
    isLogout: true
  },
];

const quickActions = [
  { icon: '📚', text: 'Matieres', action: 'Matieres' },
  { icon: '📊', text: 'Notes', action: 'grades' },
  { icon: '📅', text: 'Planning', action: 'Planning' },
  { icon: '💬', text: 'Messages', action: 'messages' },
];

interface UserInfo {
  nom: string;
  prenom: string;
  email: string;
  login: string;
  classeId: string;
  role: string;
  avatar?: string;
}

interface Matiere {
  id: string;
  title: string;
  professeurFullName: string;
  description?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileStudent'>;

export default function ProfileStudent({ navigation }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const { matieres } = useStudentMatieres();
  const { coursesByDay } = useStudentCourses();

  useEffect(() => {
    loadCachedUserOrFetch();
  }, []);

  // Load heavy data only after user is ready
  useEffect(() => {
    if (user && !dataLoaded) {
      setDataLoaded(true);
    }
  }, [user]);

  const loadCachedUserOrFetch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedUser = await AsyncStorage.getItem('userProfile');
      
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);
        setLoading(false);
        
        // Fetch fresh data in background
        fetchUserInfo(true);
      } else {
        // No cache, fetch immediately
        await fetchUserInfo(false);
      }

    } catch (error) {
      console.error('Error loading user:', error);
      await fetchUserInfo(false);
    }
  };

  const fetchUserInfo = async (isBackground: boolean = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      
      setError(null);

      const userSnapshot: any = await getUserSnapchot();

      if (!userSnapshot || userSnapshot.empty) {
        setError('Utilisateur non trouvé');
        return;
      }
      
      const userDoc = userSnapshot.docs[0].data();
      
      const userData: UserInfo = {
        nom: userDoc.nom || '',
        prenom: userDoc.prenom || '',
        email: userDoc.email || '',
        login: userDoc.login || '',
        classeId: userDoc.classe_id || '',
        role: userDoc.role || '',
        avatar: userDoc.sexe[0] === 'M' 
          ? require('../../../assets/man.png') 
          : require('../../../assets/woman.png')
      };

      setUser(userData);
      
      // Cache user data
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));

    } catch (error) {
      console.error('Fetch error:', error);
      setError('Erreur lors du chargement des informations');
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const handleActionPress = (actionId: string, actionTitle: string) => {
    switch (actionId) {
      case '1':
        navigation.navigate('ShowProfileInfosStudent');
        break;
      case '2':
        navigation.navigate('NotificationsInfos');
        break;
      case '3':
        Alert.alert('Info', 'Paramètres en cours de développement');
        break;
      case '4':
        Alert.alert('Info', 'Aide et support en cours de développement');
        break;
      case '5':
        Alert.alert('À propos', 'Version 1.0.0\nDéveloppé pour IIBS');
        break;
      case '6':
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
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              // Only clear auth-related data, keep cache
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('userLogin');
              // Keep userProfile, matieres, courses cached for faster re-login

              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' as never }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Matieres':
        navigation.navigate('MatieresStudent' as never);
        break;
      case 'grades':
        Alert.alert('Info', 'Notes à implémenter');
        break;
      case 'Planning':
        navigation.navigate('AllCoursesStudent' as never);
        break;
      case 'messages':
        Alert.alert('Info', 'Messages à implémenter');
        break;
    }
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const renderActionItem = ({ item }: { item: typeof profileActions[0] }) => (
    <TouchableOpacity 
      style={[
        generalStyles.actionItemEnhanced,
        item.isLogout && generalStyles.logoutItem
      ]} 
      activeOpacity={0.7}
      onPress={() => handleActionPress(item.id, item.title)}
    >
      <View style={[
        generalStyles.actionIconContainer,
        item.isLogout && generalStyles.logoutIconContainer
      ]}>
        <Ionicons 
          name={item.icon as any} 
          size={22} 
          color={item.color}
        />
      </View>
      
      <View style={generalStyles.actionText}>
        <Text style={[
          generalStyles.actionTitle,
          item.isLogout && generalStyles.logoutTitle
        ]}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={generalStyles.actionSubtitle}>{item.subtitle}</Text>
        ) : null}
      </View>
      
      <Ionicons 
        name="chevron-forward-outline" 
        size={18} 
        color="#cbd5e1" 
        style={generalStyles.actionChevron}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={generalStyles.container}>
        <TopNavBar />
        <View style={generalStyles.loadingContainer}>
          <LottieView
            source={require('../../../assets/loading.json')}
            autoPlay
            loop={true}
            style={{ width: 170, height: 170 }}
          />
          <Text style={generalStyles.loadingText}>Chargement de votre profil...</Text>
        </View>
        <BottomNavBar activeScreen="Profile" />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={generalStyles.container}>
        <TopNavBar />
        <View style={generalStyles.errorContainer}>
          <View style={generalStyles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          </View>
          <Text style={generalStyles.errorText}>Oups! Une erreur s'est produite</Text>
          <Text style={generalStyles.errorSubtext}>
            {error || 'Impossible de charger vos informations de profil'}
          </Text>
          <TouchableOpacity style={generalStyles.retryButton} onPress={() => fetchUserInfo(false)}>
            <Text style={generalStyles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar activeScreen="Profile" />
      </View>
    );
  }

  return (
    <View style={generalStyles.container}>
      <TopNavBar />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enhanced Profile Header */}
        <View style={generalStyles.profileHeader}>
          <View style={generalStyles.profileHeaderContent}>
            <View style={generalStyles.avatarContainer}>
              {user.avatar ? (
                <Image source={user.avatar as any} style={generalStyles.avatarImage} />
              ) : (
                <View style={generalStyles.avatarPlaceholder}>
                  <Text style={generalStyles.avatarPlaceholderText}>
                    {getInitials(user.prenom, user.nom)}
                  </Text>
                </View>
              )}
              <View style={generalStyles.onlineIndicator} />
            </View>
            
            <View style={generalStyles.userInfo}>
              <Text style={generalStyles.userName}>
                {user.prenom} {user.nom}
              </Text>
              <Text style={generalStyles.userEmail}>{user.email}</Text>
              <Text style={generalStyles.userLogin}>@{user.login}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={generalStyles.quickActionsContainer}>
          <View style={generalStyles.quickActionsRow}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={generalStyles.quickActionItem}
                onPress={() => handleQuickAction(action.action)}
                activeOpacity={0.7}
              >
                <Text style={generalStyles.quickActionIcon}>{action.icon}</Text>
                <Text style={generalStyles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile Stats */}
        <View style={generalStyles.statsContainer}>
          <View style={generalStyles.statItem}>
            <Text style={generalStyles.statNumber}>
              {dataLoaded ? matieres.length : '...'}
            </Text>
            <Text style={generalStyles.statLabel}>Matières</Text>
          </View>
          <View style={generalStyles.statDivider} />
          <View style={generalStyles.statItem}>
            <Text style={generalStyles.statNumber}>
              {dataLoaded ? coursesByDay.length : '...'}
            </Text>
            <Text style={generalStyles.statLabel}>Cours</Text>
          </View>
          <View style={generalStyles.statDivider} />
          <View style={generalStyles.statItem}>
            <Text style={generalStyles.statNumber}>17</Text>
            <Text style={generalStyles.statLabel}>Moyenne</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={generalStyles.sectionHeader}>
          <Text style={generalStyles.sectionTitle}>Paramètres du compte</Text>
          <Text style={generalStyles.sectionSubtitle}>Gérer votre compte et vos préférences</Text>
        </View>

        {/* Action Items */}
        <View style={generalStyles.listContainer}>
          {profileActions.map((item) => (
            <View key={item.id}>
              {renderActionItem({ item })}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar activeScreen="ProfileStudent" />
    </View>
  );
}