import { StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';

export const styles = StyleSheet.create({
  topNav: {
    paddingHorizontal: 15,
    height: 170,
    marginTop: -50,
    backgroundColor: "white",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d3d3d3ff',
    paddingTop: 70
  },
  profilePic: {
    marginTop: 25,
    maxHeight: 50,
    maxWidth: 50,
    borderRadius: 18,
    backgroundColor: '#f1f1f1ff',
    zIndex: 100,
  },
  title: {
    marginTop: 25,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    flex: 1, 
  },
  hamburgerContainer: {
    marginTop: 25,
    position: 'relative',
    padding: 8,
  },
  hamburgerIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  combinedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  combinedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
   backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '80%',
    // IMPROVED: Better touch handling
    elevation: 10, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },

  closeButton: {
    padding: 5, // Increased touch area
  },

  menuOptions: {
    gap: 15,
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    // IMPROVED: Better touch feedback
    minHeight: 50, // Ensure minimum touch target size
  },

  menuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  menuOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },

  menuBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  menuBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

});

