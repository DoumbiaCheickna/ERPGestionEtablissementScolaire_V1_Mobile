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
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Modal
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
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
  setDoc
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

// Comment interface
interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_role: 'etudiant' | 'professeur';
  content: string;
  timestamp: any;
  created_at: any;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Posts'>;

export default function Posts({ navigation }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'etudiant' | 'professeur'>('etudiant');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

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
          setCurrentUserId(userDoc.id);
          setCurrentUserName(userData.nom && userData.prenom 
            ? `${userData.prenom} ${userData.nom}` 
            : userData.nom || userData.prenom || 'Utilisateur');
          setCurrentUserRole(userRole as 'etudiant' | 'professeur');
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
    // The listener will automatically update the posts
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
      // 1. Get userLogin from AsyncStorage
      const userLogin = await AsyncStorage.getItem("userLogin");
      if (!userLogin) {
        throw new Error("Impossible de trouver le login dans AsyncStorage");
      }

      // 2. Query the users collection by login
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("login", "==", userLogin));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        throw new Error("Utilisateur introuvable");
      }

      // 3. Get user doc ID and data
      const userDoc = querySnap.docs[0];
      const userDocId = userDoc.id;
      const userData = userDoc.data();

      // 4. Build new post data
      const newPost = {
        content: newPostContent.trim(),
        author_id: userDocId,
        author_name: userData.nom + " " + userData.prenom, // adapt if needed
        author_role: userData.role,
        matricule: userData.matricule,
        date: new Date().toDateString(),
        likes: [],
        comments_count: 0,
        created_at: serverTimestamp()
      };

      // 5. Reference to that user’s doc
      const userDocRef = doc(db, "users", userDocId);

      // 6. If posts field doesn’t exist yet → create, else → update with arrayUnion
      await setDoc(
        userDocRef,
        { posts: arrayUnion(newPost) },
        { merge: true }
      );

      // Success
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


  const loadComments = async (postId: string) => {
    if (expandedComments[postId]) {
      // Hide comments
      setExpandedComments(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
      return;
    }

    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const q = query(commentsRef, orderBy('created_at', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];

      setExpandedComments(prev => ({
        ...prev,
        [postId]: comments
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Erreur', 'Impossible de charger les commentaires');
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsRef, {
        post_id: postId,
        author_id: currentUserId,
        author_name: currentUserName,
        author_role: currentUserRole,
        content: content,
        created_at: serverTimestamp(),
        timestamp: serverTimestamp()
      });

      // Update post comment count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments_count: (posts.find(p => p.id === postId)?.comments_count || 0) + 1,
        updated_at: serverTimestamp()
      });

      // Clear comment input
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));

      // Refresh comments
      if (expandedComments[postId]) {
        loadComments(postId);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    }
  };

  const navigateToUserProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
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
    const isOwnPost = post.author_id === currentUserId;
    const comments = expandedComments[post.id] || [];

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
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
          
          <View style={styles.postMeta}>
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
            onPress={() => loadComments(post.id)}
          >
            <Text style={styles.actionText}>
              💬 {post.comments_count} commentaires
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {expandedComments[post.id] && (
          <View style={styles.commentsSection}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <TouchableOpacity
                  onPress={() => navigateToUserProfile(comment.author_id)}
                >
                  <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                </TouchableOpacity>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentTime}>{formatTimestamp(comment.timestamp)}</Text>
              </View>
            ))}

            {/* Add Comment Input */}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Ajouter un commentaire..."
                value={newComment[post.id] || ''}
                onChangeText={(text) => setNewComment(prev => ({
                  ...prev,
                  [post.id]: text
                }))}
                multiline
              />
              <TouchableOpacity
                style={styles.sendCommentButton}
                onPress={() => handleAddComment(post.id)}
                disabled={!newComment[post.id]?.trim()}
              >
                <Text style={[
                  styles.sendCommentText,
                  !newComment[post.id]?.trim() && styles.sendCommentTextDisabled
                ]}>
                  ➤
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Posts de la Communauté</Text>
          <Text style={styles.headerSubtitle}>Partagez et découvrez</Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity 
          style={MatieresStyles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Text style={MatieresStyles.refreshButtonText}>🔄 Actualiser</Text>
        </TouchableOpacity>

        {/* Posts List */}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
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
            />
            <Text style={styles.characterCount}>
              {newPostContent.length}/500
            </Text>
          </View>
        </View>
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
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userRole: {
    fontSize: 13,
    color: '#666',
  },
  postMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    marginTop: 5,
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  likedButton: {
    backgroundColor: '#ffe6e6',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#e74c3c',
  },
  commentsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentItem: {
    marginBottom: 10,
    paddingLeft: 10,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  sendCommentButton: {
    marginLeft: 10,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendCommentTextDisabled: {
    color: '#ccc',
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
});