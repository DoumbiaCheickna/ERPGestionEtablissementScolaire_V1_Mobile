import { Dimensions, StyleSheet } from 'react-native';
import { theme } from '../../styles/globalStyles';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8e8e',
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
    color: '#8e8e8e',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  
  // Profile Header Styles
  profileHeader: {
    backgroundColor: '#ffffff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#dbdbdb',
  },
  avatarLargeText: {
    fontSize: 36,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 12,
  },
  studentInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  studentInfoText: {
    fontSize: 13,
    color: '#8e8e8e',
    marginVertical: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  messageButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Posts Section
  postsSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  postCountBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#262626',
  },
  
  // Modern Post Card Styles
  postCard: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#dbdbdb',
  },
  avatarSmallText: {
    fontSize: 16,
  },
  postAuthorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  postTimestamp: {
    fontSize: 11,
    color: '#8e8e8e',
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#262626',
    fontWeight: '600',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#262626',
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  likedIcon: {
    color: '#ed4956',
  },
  postStats: {
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  likesText: {
    fontSize: 13,
    color: '#262626',
    fontWeight: '600',
  },
  commentsPreview: {
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  commentsPreviewText: {
    fontSize: 13,
    color: '#8e8e8e',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: '#ffffff',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 20,
  },
  createPostButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});