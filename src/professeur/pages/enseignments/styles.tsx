import { Dimensions, StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MatieresStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f1f3ff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: -50,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  heroSection: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 2,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    zIndex: 3,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  matieresSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  badgeContainerDays: {
    marginVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeIconText: {
    fontSize: 16,
  },
  badgeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  badgeCount: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  matieresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  matiereCard: {
    width: (screenWidth - 55) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  matiereCardLeft: {
    marginRight: 7.5,
  },
  matiereCardRight: {
    marginLeft: 7.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  matiereIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matiereIcon: {
    fontSize: 24,
  },
  cardActions: {
    flexDirection: 'row',
  },
  favoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fce4ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
    color: '#e91e63',
  },
  cardContent: {
    padding: 15,
    paddingTop: 5,
  },
  matiereTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 22,
  },
  professorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  professorIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  professorName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  matiereStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  statChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  todayChip: {
    backgroundColor: '#dcfce7',
  },
  todayChipText: {
    color: '#16a34a',
  },
  nextCourseInfo: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 5,
  },
  nextCourseDay: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 8,
  },
  nextCourseLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  nextCourseTime: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 2,
  },
  nextCourseLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  cardFooter: {
    padding: 15,
    paddingTop: 0,
  },
  viewCoursesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  viewCoursesText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  refreshButton: {
    textAlign: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginVertical: 20
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
   classesContainer: {
    marginBottom: 30,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  classIconContainer: {
    backgroundColor: '#e3f2fd',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  classIcon: {
    fontSize: 20,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  filiereName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  matiereCountBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matiereCountText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },

  // Class matieres grid
  classMatieresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Empty classes state
  emptyClassesState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyClassesIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyClassesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyClassesSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },

  viewToggleContainer: {
  flexDirection: 'row',
  marginHorizontal: 20,
  marginBottom: 20,
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

toggleButton: {
  flex: 1,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},

toggleButtonActive: {
  backgroundColor: '#007AFF',
  shadowColor: '#007AFF',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},

toggleButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#666',
},

toggleButtonTextActive: {
  color: '#fff',
},

ViewStudentsButton: {
  backgroundColor: '#007AFF',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  marginVertical: 10,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#007AFF',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},

classStats: {
  fontSize: 14,
  color: '#666',
  fontWeight: '500',
},

classMatieres: {
  gap: 12,
},

classMatiere: {
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '#e9ecef',
},

classMatiereHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},

classMatiereIcon: {
  fontSize: 20,
  marginRight: 12,
},

classMatiereTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1a1a1a',
  flex: 1,
},

classMatiereStats: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
  gap: 12,
},

classMatiereStatText: {
  fontSize: 13,
  color: '#666',
  fontWeight: '500',
},

classMatiereTodayText: {
  fontSize: 13,
  color: '#007AFF',
  fontWeight: '600',
},

classMatiereNext: {
  fontSize: 13,
  color: '#28a745',
  fontWeight: '500',
  fontStyle: 'italic',
}

});