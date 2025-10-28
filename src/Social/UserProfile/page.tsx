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
import { styles } from './styles';

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

  // FIXED: Removed orderBy to avoid Firestore index requirement
  // Sorting is done client-side instead
  const setupUserPostsListener = () => {
    const postsRef = collection(db, 'posts');
    // Only filter by author_id, no orderBy
    const q = query(postsRef, where('author_id', '==', userId));

    return onSnapshot(q, (querySnapshot) => {
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      // Sort client-side by created_at
      const sortedPosts = posts.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setUserPosts(sortedPosts);
      setPostsCount(sortedPosts.length);
      
      // Calculate total likes received
      const totalLikes = sortedPosts.reduce((sum, post) => sum + post.likes.length, 0);
      setLikesCount(totalLikes);
      
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error fetching user posts:', error);
      Alert.alert('Erreur', 'Impossible de charger les posts');
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

  const navigateToComments = (postId: string, commentsCount: number) => {
    navigation.navigate('Comments', { postId, commentsCount });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "À l'instant";
    } else if (diffHours < 24) {
      return `il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays <= 7) {
      return `il y a ${diffDays - 1}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  // Modern Instagram-style PostCard
  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = post.likes.includes(currentUserId);
    const isOwnPost = userId === currentUserId;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {post.author_role === 'professeur' ? '👨‍🏫' : '🎓'}
              </Text>
            </View>
            <View>
              <Text style={styles.postAuthorName}>{post.author_name}</Text>
              <Text style={styles.postTimestamp}>
                {formatTimestamp(post.timestamp || post.created_at)}
              </Text>
            </View>
          </View>
          
          {isOwnPost && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePost(post.id)}
              activeOpacity={0.6}
            >
              <Text style={styles.deleteButtonText}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        {post.content && (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {/* Post Image */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* Action Buttons */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id, post.likes)}
            activeOpacity={0.6}
          >
            <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToComments(post.id, post.comments_count)}
            activeOpacity={0.6}
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.6}
          >
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.postStats}>
          {post.likes.length > 0 && (
            <Text style={styles.likesText}>
              {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>

        {/* Comments Preview */}
        {post.comments_count > 0 && (
          <TouchableOpacity 
            style={styles.commentsPreview}
            onPress={() => navigateToComments(post.id, post.comments_count)}
            activeOpacity={0.7}
          >
            <Text style={styles.commentsPreviewText}>
              Voir {post.comments_count > 1 
                ? `les ${post.comments_count} commentaires` 
                : 'le commentaire'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading || !user) {
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
          <TouchableOpacity 
            style={{position: 'absolute', left: 20, top: 20}}
            onPress={() => navigation.goBack()}
          >
            <Text style={{color: 'black', fontSize: 30}}>←</Text>
          </TouchableOpacity>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user.role.toLowerCase() === 'professeur' ? '👨‍🏫' : '🎓'}
            </Text>
          </View>
          
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userRole}>
            {user.role.toLowerCase() === 'professeur' ? 'Professeur' : 'Étudiant'}
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
              activeOpacity={0.8}
            >
              <Text style={styles.messageButtonText}>💬 Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Section Header */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.postsSectionTitle}>
              {isOwnProfile ? 'Mes Posts' : 'Ses Posts'}
            </Text>
            <View style={styles.postCountBadge}>
              <Text style={styles.postCountText}>{postsCount}</Text>
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
              {isOwnProfile ? 'Aucun post pour le moment' : 'Aucun post'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isOwnProfile 
                ? 'Commencez à partager vos idées !' 
                : 'Cet utilisateur n\'a pas encore publié'}
            </Text>
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={navigateToPostsFeed}
                activeOpacity={0.8}
              >
                <Text style={styles.createPostButtonText}>✏️ Créer un post</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeScreen="Posts" />
    </View>
  );
}

