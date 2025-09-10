import { StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';




export const HomeStyles = StyleSheet.create({
container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 90,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  headerSection: {
    marginBottom: 24,
    paddingTop: 10,
  },

  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text || '#000',
    marginBottom: 4,
  },

  dateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  // Location Status
  locationStatus: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  locationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section Container
  sectionContainer: {
    marginBottom: 50,
  },

  // Modern Badge Styling
  modernBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(1, 1, 34)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  badgeIconText: {
    fontSize: 16,
  },

  badgeTextModern: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color:  '#ffffffff',
  },

  badgeCount: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },

  badgeCountText: {
    color: '#000000ff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Matière Card Styling
  matiereCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  matiereHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  matiereIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  matiereIcon: {
    fontSize: 18,
  },

  matiereContent: {
    flex: 1,
  },

  matiereTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text || '#000',
    marginBottom: 4,
  },

  professeurText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  matiereArrow: {
    paddingLeft: 8,
  },

  arrowText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },

  // Course Card Styling
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 100,
    marginTop: 30
  },

  courseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: '48%',
  },

  courseCardLeft: {
    marginRight: '2%',
  },

  courseCardRight: {
    marginLeft: '2%',
  },

  courseHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },

  courseIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  modernCourseTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text || '#000',
  },

  courseInfo: {
    marginBottom: 16,
  },

  modernCourseText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },

  modernCourseSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },

  modernEmargerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  emargerButtonTextModern: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    alignItems: 'center',
  },

  // New button styles for different states
  emargedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    textAlign: 'center',

  },

  emargedButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },

  expiredButton: {
    backgroundColor: '#9E9E9E',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    textAlign: 'center',
  },

  expiredButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading State
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },

  loadingText: {
    marginTop: -50,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  // Empty State
  emptyState: {
    marginTop: 20,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e7e7e7ff',
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text || '#000',
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
   qrButton: {
    backgroundColor: 'rgba(37, 37, 82, 1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 10
  },
  absentButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  
  absentButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Statistics container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingTop: 10,
  },

  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  statusWarning: {
    color: 'orange',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center'
  },
  statusPrimary: {
    color: 'dodgerblue',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center'

  },
  statusSuccess: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center'

  },
    professorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 5,
  },
  
  indisponibleButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  indisponibleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  unavailableButton: {
    backgroundColor: '#757575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 8,
    opacity: 0.7,
  },
  
  unavailableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  studentListButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  studentListButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  courseClassInfo: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  
  courseClassText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },

});