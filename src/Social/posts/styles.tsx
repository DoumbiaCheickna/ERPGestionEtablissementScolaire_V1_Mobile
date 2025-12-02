import { Dimensions, StyleSheet } from 'react-native';
import { theme } from '../../styles/globalStyles';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
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
    marginBottom: 90,
  },
  headerSection: {
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    margin: 10,
    fontWeight: '700',
    color: 'black',
    fontFamily: 'Sansation-Regular',
    textAlign: 'center',
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
    backgroundColor: 'black',
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

   postCard: {
    backgroundColor: '#ffffff',
    marginVertical: 6,
    marginHorizontal: 0,
    paddingVertical: 15,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20
  },
  
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  
  avatarText: {
    fontSize: 18,
  },
  
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  
  userRole: {
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
    fontSize: 12,
    color: '#262626',
    paddingHorizontal: 15,
    marginBottom: 8,
    marginTop: -15
  },
  
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  
  postStats: {
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  
  statsText: {
    fontSize: 13,
    color: '#262626',
    fontWeight: '600',
  },
  
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    marginTop: 10,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: 'transparent',
    borderColor: '#ccc',
    borderWidth: 0.25,
    marginHorizontal: 2,
    
    marginVertical: 10,
  },
  
  likedButton: {
    backgroundColor: 'transparent',
  },
  
  actionText: {
    fontSize: 13,
    color: '#262626',
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  
  likedText: {
    color: '#ed4956', // Instagram red
  },
  
  // Modern timestamp style
  postTimestamp: {
    fontSize: 10,
    color: '#8e8e8e',
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  postTextBackground: {
    width: '100%',
    minHeight: 300, // Square like image posts
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#000000',
  },

  postContentCentered: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  colorPickerSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
  },

  colorPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },

  colorPickerScroll: {
    flexGrow: 0,
  },

  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  colorOptionNone: {
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
  },

  colorOptionSelected: {
    borderColor: '#0095f6',
    borderWidth: 3,
  },

  colorCheckmark: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  colorNoneText: {
    fontSize: 28,
    color: '#999',
  },

  previewSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
  },

  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },

  previewBox: {
    width: '100%',
    minHeight: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  previewText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarSmallText: {
    fontSize: 20,
  },

    imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  
  imagePickerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  
  imagePickerText: {
    fontSize: 15,
    color: '#262626',
    fontWeight: '600',
  },
  
  selectedImageContainer: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  
  selectedImagePreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  removeImageText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  uploadingContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  
  uploadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },


  textWithImage: {
  fontSize: 14,
  textAlign: "left",
  color: '#000000',
  },

  textWithoutImage: {
    fontSize: 16,
    textAlign: "center",
  },

  baseText: {
    lineHeight: 20,
  },

})