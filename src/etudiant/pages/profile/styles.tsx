import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';


const { width, height } = Dimensions.get('window');


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    paddingBottom: 20,
    elevation: 3,
    paddingTop: 70
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    marginBottom: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#f1f5f9',
  },
  avatarImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#f1f5f9',
  },
  changeAvatarButton: {
    backgroundColor:  '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  changeAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fullName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  settingsContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: -0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#334155',
    marginLeft: 16,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  infoItem: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValueContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Enhanced Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    fontWeight: '500',
    color: '#1e293b',
  },
  textInputFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // Additional enhancement styles
  settingItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Improved info sections
  infoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  
  // Enhanced typography
  sectionTitleEnhanced: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
    marginLeft: 20,
    letterSpacing: -0.8,
  },
  
  // Gradient-like effects using multiple shadows
  primaryCard: {
    backgroundColor: '#ffffff',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Loading state improvements
  loadingSpinner: {
    transform: [{ scale: 1.2 }],
  },
  
  // Interactive states
  settingItemPressed: {
    backgroundColor: '#f8fafc',
    transform: [{ scale: 0.98 }],
  },
  
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});






export const generalStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  
  // Profile Header Styles
  profileHeader: {
    backgroundColor: 'white',
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  
  avatarImage: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  
  avatarPlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#cbd5e1',
  },
  
  avatarPlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#64748b',
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  
  userEmail: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 3,
  },
  
  userLogin: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Action Items Styles
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 90
  },
  
  actionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  actionText: {
    flex: 1,
  },
  
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  
  actionChevron: {
    opacity: 0.6,
  },
  
  // Special styling for logout item
  logoutItem: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  
  logoutTitle: {
    color: '#dc2626',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8fafc',
  },
  
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  errorText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Section Headers
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  
  // Profile Stats Section (if you want to add it)
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  
  // Quick Actions Section
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  quickActionItem: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  
  // Enhanced Action Items with better spacing
  actionItemEnhanced: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  
  // Hover/Press states
  actionItemPressed: {
    backgroundColor: '#f8fafc',
    transform: [{ scale: 0.98 }],
  },
  
  // Premium Card Effect
  premiumCard: {
    borderWidth: 0,
  },
  
  // Modern Badge
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
});