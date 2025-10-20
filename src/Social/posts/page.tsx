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
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavBar from '../../components/layout/topBar';
import BottomNavBar from '../../components/layout/bottomBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/index';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { MatieresStyles } from '../../etudiant/pages/matieres/styles';

const { width: screenWidth } = Dimensions.get('window');

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

type Props = NativeStackScreenProps<RootStackParamList, 'Posts'>;

export default function Posts({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'etudiant' | 'professeur'>('etudiant');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      const unsubscribe = setupPostsListener();
      return unsubscribe;
    }
  }, [currentUserId]);

  const initializeUser = async () => {
    try {
      const userLogin = await AsyncStorage.getItem('userLogin');
      const userRole = await AsyncStorage.getItem('userRole');
      
      if (userLogin && userRole) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('login', '==', userLogin));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const userId = userDoc.id;
          const userName = userData.nom && userData.prenom 
            ? `${userData.prenom} ${userData.nom}` 
            : userData.nom || userData.prenom || 'Utilisateur';
            
          setCurrentUserId(userId);
          setCurrentUserName(userName);
          setCurrentUserRole(userRole as 'etudiant' | 'professeur');
          
          // Store for Comments screen
          await AsyncStorage.setItem('userId', userId);
          await AsyncStorage.setItem('userName', userName);
        }
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const setupPostsListener = () => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('created_at', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      setPosts(postsData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
      setRefreshing(false);
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const isLiked = currentLikes.includes(currentUserId);

      await updateDoc(postRef, {
        likes: isLiked 
          ? arrayRemove(currentUserId)
          : arrayUnion(currentUserId),
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating like:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le like');
    }
  };

  const handleDeletePost = async (postId: string) => {
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
              Alert.alert('Succès', 'Post supprimé avec succès');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le post');
            }
          }
        }
      ]
    );
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir du contenu pour votre post');
      return;
    }

    setSubmittingPost(true);

    try {
      if (!currentUserId) {
        throw new Error("Utilisateur non authentifié");
      }

      const newPost = {
        content: newPostContent.trim(),
        author_id: currentUserId,
        author_name: currentUserName,
        author_role: currentUserRole,
        timestamp: serverTimestamp(),
        likes: [],
        comments_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const postsRef = collection(db, "posts");
      await addDoc(postsRef, newPost);

      setNewPostContent('');
      setShowCreateModal(false);
      Alert.alert('Succès', 'Post créé avec succès !');

    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Erreur", "Impossible de créer le post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const navigateToComments = (postId: string, commentsCount: number) => {
    navigation.navigate('Comments', { postId, commentsCount });
  };

  const navigateToUserProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
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
      return `${diffHours}h`;
    } else if (diffDays === 1) {
      return "Aujourd'hui";
    } else if (diffDays === 2) {
      return "Hier";
    } else if (diffDays <= 7) {
      return `${diffDays - 1}d`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = post.likes.includes(currentUserId);
    const isOwnPost = post.author_id === currentUserId;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => navigateToUserProfile(post.author_id)}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {post.author_role === 'professeur' ? '👨‍🏫' : '🎓'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{post.author_name}</Text>
              <Text style={styles.userRole}>
                {post.author_role === 'professeur' ? 'Professeur' : 'Étudiant'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {isOwnPost && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePost(post.id)}
            >
              <Text style={styles.deleteButtonText}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
          />
        )}

        <View style={styles.postStats}>
          <Text style={styles.statsText}>{post.likes.length} likes · {post.comments_count} comments</Text>
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={() => handleLike(post.id, post.likes)}
          >
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {isLiked ? '❤️' : '🤍'} Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToComments(post.id, post.comments_count)}
          >
            <Text style={styles.actionText}>
              💬 Comment
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
        <Text style={styles.loadingText}>Chargement des posts...</Text>
      </View>
    );
  }

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
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Recent Posts</Text>
        </View>

        <TouchableOpacity 
          style={MatieresStyles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Text style={MatieresStyles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>

        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>Aucun post pour le moment</Text>
            <Text style={styles.emptySubtext}>Soyez le premier à partager quelque chose !</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              Keyboard.dismiss();
              setShowCreateModal(false);
            }}>
              <Text style={styles.modalCancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Post</Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={submittingPost || !newPostContent.trim()}
            >
              <Text style={[
                styles.modalSubmitButton,
                (!newPostContent.trim() || submittingPost) && styles.modalSubmitButtonDisabled
              ]}>
                {submittingPost ? '...' : 'Publier'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.postInput}
              placeholder="Que voulez-vous partager ?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              textAlignVertical="top"
              maxLength={500}
              blurOnSubmit={false}
              returnKeyType="default"
            />
            <Text style={styles.characterCount}>
              {newPostContent.length}/500
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNavBar activeScreen="Posts" />
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
  scrollView: {
    flex: 1,
  },
  headerSection: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#999',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  postStats: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 13,
    color: '#999',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  likedButton: {
    backgroundColor: '#f5f5f5',
  },
  actionText: {
    fontSize: 14,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
  },
  commentsModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  commentItemNew: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  commentAvatar: {
    fontSize: 18,
  },
  commentDetailsContainer: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  commentTimeNew: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  commentContentNew: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  newCommentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  newCommentAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newCommentAvatar: {
    fontSize: 16,
  },
  newCommentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  newCommentInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  newCommentSendButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  newCommentSendIcon: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalSubmitButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  modalSubmitButtonDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  postInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 10,
  },
})