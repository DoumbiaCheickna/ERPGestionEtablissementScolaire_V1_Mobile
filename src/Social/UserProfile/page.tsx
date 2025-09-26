import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  RefreshControl,
  Dimensions,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import TopNavBar from '../../components/layout/topBar';
import BottomNavBar from '../../components/layout/bottomBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/index';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  where,
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { MatieresStyles } from '../../etudiant/pages/matieres/styles';

const { width: screenWidth } = Dimensions.get('window');

// Post interface
interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_role: 'student' | 'professeur';
  content: string;
  image_url?: string;
  timestamp: any;
  likes: string[];
  comments_count: number;
  created_at: any;
  updated_at?: any;
}

// User interface
interface User {
  id: string;
  nom: string;
  prenom: string;
  login: string;
  role: 'student' | 'professeur';
  email?: string;
  matricule?: string;
  classe_libelle?: string;
  filiere_libelle?: string;
  niveau_libelle?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export default function UserProfile({ navigation, route }: Props) {
  const { userId } = route.params;
  
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [postsCount, setPostsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    initializeCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      const unsubscribe = setupUserPostsListener();
      return unsubscribe;
    }
  }, [userId]);

  const initializeCurrentUser = async () => {
    try {
      const userLogin = await AsyncStorage.getItem('userLogin');
      if (userLogin) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('login', '==', userLogin));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setCurrentUserId(querySnapshot.docs[0].id);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          id: userDoc.id,
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          login: userData.login || '',
          role: userData.role || 'student',
          email: userData.email || '',
          matricule: userData.matricule || '',
          classe_libelle: userData.classe_libelle || '',
          filiere_libelle: userData.filiere_libelle || '',
          niveau_libelle: userData.niveau_libelle || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil utilisateur');
    }
  };

  const setupUserPostsListener = () => {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('author_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      setUserPosts(posts);
      setPostsCount(posts.length);
      
      // Calculate total likes received
      const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
      setLikesCount(totalLikes);
      
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error fetching user posts:', error);
      setLoading(false);
      setRefreshing(false);
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserProfile();
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const isLiked = currentLikes.includes(currentUserId);

      await updateDoc(postRef, {
        likes: isLiked 
          ? arrayRemove(currentUserId)
          : arrayUnion(currentUserId)
      });
    } catch (error) {
      console.error('Error updating like:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le like');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (userId !== currentUserId) {
      Alert.alert('Erreur', 'Vous ne pouvez supprimer que vos propres posts');
      return;
    }

    Alert.alert(
      'Supprimer le post',
      'Êtes-vous sûr de vouloir supprimer ce post ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', 
          style: 'destructive',  
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', postId));
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le post');
            }
          }
        }
      ]
    );
  };

  const navigateToPostsFeed = () => {
    navigation.navigate('Posts');
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Aujourd'hui";
    } else if (diffDays === 2) {
      return "Hier";
    } else if (diffDays <= 7) {
      return `Il y a ${diffDays - 1} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = post.likes.includes(currentUserId);
    const isOwnPost = userId === currentUserId;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
          {isOwnPost && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePost(post.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={() => handleLike(post.id, post.likes)}
          >
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {isLiked ? '❤️' : '🤍'} {post.likes.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToPostsFeed}
          >
            <Text style={styles.actionText}>
              💬 {post.comments_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/Book loading.json')}
          autoPlay
          loop={true}
          style={{ width: 170, height: 170 }}
        />
        <Image 
          source={require('../../assets/logo8.png')} 
          style={{ width: 250, height: 250, marginTop: -50 }}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <TopNavBar />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Utilisateur introuvable</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar activeScreen="PostsFeed" />
      </View>
    );
  }

  const isOwnProfile = userId === currentUserId;
  const fullName = user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.nom || user.prenom || 'Utilisateur';

  return (
    <View style={styles.container}>
      <TopNavBar />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user.role.toLocaleLowerCase() == 'professeur' ? '👨‍🏫' : '🎓'}
            </Text>
          </View>
          
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userRole}>
            {user.role.toLocaleLowerCase() === 'professeur' ? 'Professeur' : 'Etudiant'}
          </Text>

          {user.role === 'student' && (
            <View style={styles.studentInfo}>
              {user.classe_libelle && (
                <Text style={styles.studentInfoText}>📚 {user.classe_libelle}</Text>
              )}
              {user.filiere_libelle && (
                <Text style={styles.studentInfoText}>🎯 {user.filiere_libelle}</Text>
              )}
              {user.niveau_libelle && (
                <Text style={styles.studentInfoText}>📊 {user.niveau_libelle}</Text>
              )}
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postsCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likesCount}</Text>
              <Text style={styles.statLabel}>Likes reçus</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => Alert.alert('Info', 'Fonctionnalité de message à venir')}
            >
              <Text style={styles.messageButtonText}>💬 Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity 
          style={MatieresStyles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser</Text>
        </TouchableOpacity>

        {/* Posts Section */}
        <View style={styles.sectionHeader}>
          <View style={MatieresStyles.badgeContainer}>
            <View style={MatieresStyles.badgeIcon}>
              <Text style={MatieresStyles.badgeIconText}>📝</Text>
            </View>
            <Text style={MatieresStyles.badgeText}>
              {isOwnProfile ? 'Mes Posts' : 'Ses Posts'}
            </Text>
            <View style={MatieresStyles.badgeCount}>
              <Text style={MatieresStyles.badgeCountText}>{postsCount}</Text>
            </View>
          </View>
        </View>

        {/* Posts List */}
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>
              {isOwnProfile ? 'Vous n\'avez pas encore de posts' : 'Aucun post pour le moment'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isOwnProfile ? 'Commencez à partager vos idées !' : 'Revenez plus tard pour voir du contenu'}
            </Text>
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={navigateToPostsFeed}
              >
                <Text style={styles.createPostButtonText}>Créer un post</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeScreen="PostsFeed" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarLargeText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  studentInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  studentInfoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messageButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  likedButton: {
    backgroundColor: '#ffe6e6',
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#e74c3c',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createPostButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});