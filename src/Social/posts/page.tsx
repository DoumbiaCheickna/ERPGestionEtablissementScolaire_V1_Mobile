import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  Animated
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
import { styles } from '../posts/styles';

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
  background_color?: string;
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
  const [selectedBgColor, setSelectedBgColor] = useState('none');


  const BACKGROUND_COLORS = [
    { id: 'none', name: 'None', color: 'transparent' },
    { id: 'white', name: 'White', color: '#FFFFFF' },
    { id: 'lightblue', name: 'Light Blue', color: '#4FC3F7' },
    { id: 'pink', name: 'Pink', color: '#F48FB1' },
    { id: 'darkblue', name: 'Dark Blue', color: '#1565C0' },
    { id: 'black', name: 'Black', color: '#000000' },
    { id: 'green', name: 'Green', color: '#66BB6A' },
    { id: 'red', name: 'Red', color: '#EF5350' },
    { id: 'yellow', name: 'Yellow', color: '#FFEE58' },
    { id: 'beige', name: 'Beige', color: '#D7CCC8' },
    { id: 'purple', name: 'Purple', color: '#AB47BC' },
  ];
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 100, // bouge 100px vers la droite
          duration: 6000, // 6 seconds
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0, // return vers la gauche
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -100, // bouge 100px vers la gauche
          duration: 6000, // 6 seconds
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0, // return vers le miliey
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateX]);

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
        updated_at: serverTimestamp(),
        background_color: selectedBgColor, 
      };

      const postsRef = collection(db, "posts");
      await addDoc(postsRef, newPost);

      setNewPostContent('');
      setSelectedBgColor('none'); // RESET BACKGROUND COLOR
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
    
    // Get background color
    const bgColorObj = BACKGROUND_COLORS.find(bg => bg.id === post.background_color);
    const hasBackground = post.background_color && post.background_color !== 'none';
    const backgroundColor = bgColorObj?.color || 'transparent';
    
    // Determine text color based on background
    const isDarkBg = ['black', 'darkblue', 'purple', 'red', 'lightblue', 'red', 'purple', 'green', 'pink'].includes(post.background_color || '');
    const textColor = hasBackground ? (isDarkBg ? '#ffffff' : '#000000') : '#ffffff';

    return (
      <View style={styles.postCard}>
        {/* Header with user info */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => navigateToUserProfile(post.author_id)}
            activeOpacity={0.7}
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
              activeOpacity={0.6}
            >
              <Text style={styles.deleteButtonText}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post content - WITH BACKGROUND COLOR */}
        {post.content && !post.image_url && hasBackground ? (
          <View style={[styles.postTextBackground, { backgroundColor }]}>
            <Text style={[styles.postContentCentered, { color: textColor }]}>
              {post.content}
            </Text>
          </View>
        ) : post.content && !post.image_url ? (
          <View style={styles.postTextBackground}>
            <Text style={[styles.postContentCentered, { color: '#ffffff' }]}>
              {post.content}
            </Text>
          </View>
        ) : post.content ? (
          <Text style={styles.postContent}>{post.content}</Text>
        ) : null}

        {/* Post image */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* Action buttons */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id, post.likes)}
            activeOpacity={0.6}
          >
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToComments(post.id, post.comments_count)}
            activeOpacity={0.6}
          >
            <Text style={styles.actionText}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.6}
          >
            <Text style={styles.actionText}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Like and comment counts */}
        <View style={styles.postStats}>
          {post.likes.length > 0 && (
            <Text style={styles.statsText}>
              {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>

        {/* Comments preview */}
        {post.comments_count > 0 && (
          <TouchableOpacity 
            style={{ paddingHorizontal: 12, paddingBottom: 4 }}
            onPress={() => navigateToComments(post.id, post.comments_count)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, color: '#999' }}>
              Voir {post.comments_count > 1 ? `les ${post.comments_count} commentaires` : 'le commentaire'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <Text style={styles.postTimestamp}>
          {formatTimestamp(post.timestamp || post.created_at)}
        </Text>
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
            <Text style={styles.headerTitle}>Hello, Welcome to IIBS Social World!</Text>
            <Animated.View style={{ transform: [{ translateX }] }}>
          <LottieView
            source={require('../../assets/post.json')}
            autoPlay
            loop
            style={{ width: 300, height: 200 }}
          />
        </Animated.View>
        </View>

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
              setSelectedBgColor('none');
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
              placeholderTextColor="#999"
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

            {/* Background Color Picker */}
            <View style={styles.colorPickerSection}>
              <Text style={styles.colorPickerTitle}>Couleur de fond:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.colorPickerScroll}
              >
                {BACKGROUND_COLORS.map((bg) => (
                  <TouchableOpacity
                    key={bg.id}
                    style={[
                      styles.colorOption,
                      { backgroundColor: bg.color === 'transparent' ? '#1a1a1a' : bg.color },
                      bg.color === 'transparent' && styles.colorOptionNone,
                      selectedBgColor === bg.id && styles.colorOptionSelected
                    ]}
                    onPress={() => setSelectedBgColor(bg.id)}
                    activeOpacity={0.7}
                  >
                    {selectedBgColor === bg.id && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                    {bg.id === 'none' && (
                      <Text style={styles.colorNoneText}>∅</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Preview */}
            {newPostContent.trim() && selectedBgColor !== 'none' && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Aperçu:</Text>
                <View style={[
                  styles.previewBox,
                  { backgroundColor: BACKGROUND_COLORS.find(bg => bg.id === selectedBgColor)?.color }
                ]}>
                  <Text style={[
                    styles.previewText,
                    { color: ['black', 'darkblue', 'purple', 'red', 'lightblue', 'green', 'red', 'purple', 'pink'].includes(selectedBgColor) ? '#ffffff' : '#000000' }
                  ]}>
                    {newPostContent}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <BottomNavBar activeScreen="Posts" />
    </View>
  );
}

