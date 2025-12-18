import { Platform, StatusBar, StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';


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
  addButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  evaluationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  evaluationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  evaluationIcon: {
    fontSize: 20,
  },
  cardHeaderText: {
    flex: 1,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  evaluationSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  cardContent: {
    marginTop: 5,
  },
  evaluationDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 10,
  },
  evaluationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    fontSize: 18,
    color: '#666',
    padding: 5,
  },
  modalContent: {
    maxHeight: 400,
  },
  classItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  classSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  matiereItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  matiereTitle: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullModalHeader: {
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
  fullModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalSubmitButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalSubmitButtonDisabled: {
    color: '#ccc',
  },
  fullModalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  selectedText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSection: {
    flex: 1,
    marginRight: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dateIcon: {
    fontSize: 16,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
   },
   pickerButtonText: {
    fontSize: 16,
    color: '#333',
   },
   pickerArrow: {
    fontSize: 12,
    color: '#666',
   },
  typeItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTitle: {
    fontSize: 16,
    color: '#1a1a1a',
   },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  dropdownButton: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  backgroundColor: '#fff',
  marginTop: 5,
},

dropdownText: {
  fontSize: 16,
  color: '#333',
},

dropdownArrow: {
  fontSize: 16,
  color: '#333',
},

dropdownList: {
  backgroundColor: '#fff',
  borderRadius: 8,
  marginTop: 5,
  borderWidth: 1,
  borderColor: '#eee',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

dropdownItem: {
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},

dropdownItemText: {
  fontSize: 16,
  color: '#333',
},

cancelButton: {
  backgroundColor: '#FF4D4D', // red
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 10,
},
cancelButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
},

addNoteButton: {
  backgroundColor: '#2196F3', // red
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 10,
},


  
});