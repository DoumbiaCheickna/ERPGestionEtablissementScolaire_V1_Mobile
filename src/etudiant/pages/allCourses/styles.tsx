import { StyleSheet } from "react-native";
import { theme } from '../../../styles/globalStyles';



export const Cstyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingVertical: 10 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 15, color: '#333' },
  emargerButton: { backgroundColor: '#333', padding: 6, borderRadius: 6, alignItems: 'center', marginTop: 25 },
  emargerButtonText: { color: '#fff', fontSize: 12 },
  courseItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  courseText: { fontSize: 12, color: '#222', marginBottom: 4 },
  badgeContainer: {
    margin: 15,
    backgroundColor: 'rgb(1, 1, 34)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 15,
    color: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase', 
    textAlign: 'center',
  },
  columnWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',  
    marginBottom: 12,                 
  },
  squareCard: {
    backgroundColor: '#fff',
    borderRadius: 10,                 
    width: '48%',                   
    minHeight: 120,                 
    padding: 12,                    
    elevation: 2,                   
    shadowColor: '#000',            
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    justifyContent: 'flex-start',  
  },
  courseTitle: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 14,
  },
  courseSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  sectionListContainer: {
    paddingBottom: 20,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#f6f6f6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});

export const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 90,
  },

  // Header Section
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

  // Filter Toggle Section
  filterToggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  activeToggleButton: {
    backgroundColor: 'rgb(1, 1, 34)',
  },

  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  activeToggleButtonText: {
    color: '#fff',
  },

  // Filter Section
  filtersContainer: {
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  filterItem: {
    flex: 1,
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text || '#000',
    marginBottom: 8,
  },

  // Clear Filter Button
  clearFilterButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border || '#e0e0e0',
  },

  clearFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },

  // Custom Dropdown Styles
  dropdownButton: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border || '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },

  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text || '#000',
  },

  dropdownArrow: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    
  },

  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#e0e0e0',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text || '#000',
  },

  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },

  selectedDropdownItem: {
    backgroundColor: theme.colors.surface,
  },

  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
  },

  selectedDropdownItemText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  checkmark: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Modern Badge Enhancement
  modernBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(1, 1, 34)',
    borderRadius: 16,
    paddingVertical: 12,
    color: 'white',
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  badgeTextModern: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textTransform: 'none',
  },

  badgeCount: {
    backgroundColor: 'rgba(1, 1, 34)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },

  badgeCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modern Day Header
  modernDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(1, 1, 34)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  dayTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },

  dayCount: {
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },

  dayCountText: {
    color: '#000000ff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Modern Square Card
  modernSquareCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0,
  },

  modernCourseTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text || '#000',
    marginBottom: 12,
  },

  modernCourseText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },

  modernCourseSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },

  modernEmargerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },

  emargerButtonTextModern: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.background,
    borderStyle: 'dashed',
    marginTop: 20,
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error || '#ff0000',
    marginBottom: 8,
  },

  errorSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  nextCourseContainer: {
    marginTop: 30,
    marginBottom: 30,
  },
  todayCoursesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'black',
    color: theme.colors.text,
    marginBottom: 12,
  },
  nextCourseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classroomImage: {
    width: '100%',
    height: 150,
  },
  nextCourseInfo: {
    padding: 16,
  },
  nextCourseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  nextCourseText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nextCourseDay: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 8,
  },
  todayCourseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todayCourseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  todayCourseText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  todayCourseTime: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  }
});