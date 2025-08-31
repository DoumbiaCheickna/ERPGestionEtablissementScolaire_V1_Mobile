import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebaseConfig';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface AbsenceData {
  matiere_libelle: string;
  matiere_id: string;
  nom_complet: string;
  matricule: string;
  timestamp: Date;
  type: string;
  start: string;
  date: string;
  end: string;
  enseignant?: string;
  salle?: string;
  annee?: string;
  semestre?: string;
  justification: {
    contenu: string;
    documents: string;
    dateJustification: string;
    statut: string;
  }
}

interface JustificationModalProps {
  visible: boolean;
  absence: AbsenceData | null;
  onClose: () => void;
  userMatricule: string;
}

interface AttachedDocument {
  name: string;
  uri: string;
  type: string;
  size: number;
}

interface UploadedDocument {
  name: string;
  downloadURL: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export default function AbsenceJustificationModal({ 
  visible, 
  absence, 
  onClose, 
  userMatricule 
}: JustificationModalProps) {
  const [justificationText, setJustificationText] = useState('');
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  }, []);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', '.doc', '.docx'],
        copyToCacheDirectory: true,
        multiple: true
      });

      if (!result.canceled && result.assets[0]) {
        const document = result.assets[0];
        const newDocument: AttachedDocument = {
          name: document.name,
          uri: document.uri,
          type: document.mimeType || 'application/octet-stream',
          size: document.size || 0
        };

        setAttachedDocuments(prev => [...prev, newDocument]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  }, []);

  const removeDocument = useCallback((index: number) => {
    setAttachedDocuments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const uploadDocumentToStorage = useCallback(async (document: AttachedDocument): Promise<UploadedDocument> => {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = document.name.split('.').pop() || '';
      const fileName = `justifications/${userMatricule}/${timestamp}_${document.name}`;
      
      // Create storage reference
      const storageRef = ref(storage, fileName);
      
      // Convert URI to blob for upload
      const response = await fetch(document.uri);
      const blob = await response.blob();
      
      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return {
        name: document.name,
        downloadURL,
        type: document.type,
        size: document.size,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error(`Erreur lors du téléchargement de ${document.name}`);
    }
  }, [userMatricule]);

  const submitJustification = useCallback(async () => {
    if (!absence) return;

    if (!justificationText.trim() && attachedDocuments.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter une justification textuelle ou joindre un document');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedDocuments: UploadedDocument[] = [];

      // Upload documents to Firebase Storage if any
      if (attachedDocuments.length > 0) {
        try {
          setUploadProgress(0);
          const uploadPromises = attachedDocuments.map(async (doc, index) => {
            const result = await uploadDocumentToStorage(doc);
            setUploadProgress(((index + 1) / attachedDocuments.length) * 100);
            return result;
          });
          
          uploadedDocuments = await Promise.all(uploadPromises);
        } catch (uploadError) {
          Alert.alert('Erreur', 'Erreur lors du téléchargement des documents');
          setIsSubmitting(false);
          setUploadProgress(0);
          return;
        }
      }

      // Get all documents from emargements collection
      const emargementsRef = collection(db, 'emargements');
      const querySnapshot = await getDocs(emargementsRef);

      if (querySnapshot.empty) {
        Alert.alert('Erreur', 'Aucun document emargements trouvé');
        setIsSubmitting(false);
        setUploadProgress(0);
        return;
      }

      let targetDoc = null;
      let targetDocRef = null;

      // Loop through all documents to find the one containing our matricule
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data[userMatricule]) {
          targetDoc = data;
          targetDocRef = docSnapshot.ref;
        }
      });

      if (!targetDoc || !targetDocRef) {
        Alert.alert('Erreur', 'Aucune donnée trouvée pour cet utilisateur');
        setIsSubmitting(false);
        setUploadProgress(0);
        return;
      }

      // Get the user's absences array using their matricule as key
      const userAbsences: any = targetDoc[userMatricule];
      
      if (!Array.isArray(userAbsences)) {
        Alert.alert('Erreur', 'Aucune donnée trouvée pour cet utilisateur');
        setIsSubmitting(false);
        setUploadProgress(0);
        return;
      }
      
      let absenceFound = false;
      const updatedAbsences = userAbsences.map((item: any) => {
        if (
          item.type === 'absence' &&
          item.matiere_id == absence.matiere_id &&
          item.date == absence.date &&
          item.start == absence.start &&
          item.end == absence.end
        ) {
          absenceFound = true;
          return {
            ...item,
            justification: {
              contenu: justificationText.trim(),
              documents: uploadedDocuments,
              dateJustification: new Date().toISOString(),
              statut: 'En cours'
            }
          };
        }
        return item;
      });

      if (!absenceFound) {
        Alert.alert('Erreur', 'Absence introuvable dans les données');
        setIsSubmitting(false);
        setUploadProgress(0);
        return;
      }

      // Update the document in Firestore with the modified user absences
      await updateDoc(targetDocRef, {
        [userMatricule]: updatedAbsences
      });

      Alert.alert(
        'Succès', 
        'Justification envoyée avec succès',
        [{ text: 'OK', onPress: handleClose }]
      );

    } catch (error) {
      console.error('Error submitting justification:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la justification');
    } finally {
      setIsSubmitting(false);
    }
  }, [absence, justificationText, attachedDocuments, userMatricule]);

  const handleClose = useCallback(() => {
    setJustificationText('');
    setAttachedDocuments([]);
    setUploadProgress(0);
    onClose();
  }, [onClose]);

  if (!absence) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Justifier l'absence</Text>
          <View style={{ width: 24 }} />
        </View>

          {/* Absence Details */}
          <View style={styles.absenceDetails}>
            <Text style={styles.sectionTitle}>Détails de l'absence</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="book-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{absence.matiere_libelle}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{formatDate(absence.date)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{absence.start} - {absence.end}</Text>
            </View>

            {absence.enseignant && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <Text style={styles.detailText}>Prof: {absence.enseignant}</Text>
              </View>
            )}

            {absence.salle && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.detailText}>Salle: {absence.salle}</Text>
              </View>
            )}
            {absence.justification?.statut == "En cours" && (
                <View 
                    style={{
                        alignItems: 'center', 
                        borderRadius: 15, 
                    }}>
                    <Text 
                        style={{
                            alignItems: "center", 
                            textAlign: "center", 
                            color: "black", 
                            fontSize: 18, 
                            marginTop: 20, 
                            marginBottom: -50,
                            fontFamily: 'Times New Roman'   ,
                            fontWeight: 600 ,   
                            width: 300                 
                        }}
                    >
                        Votre justification est en cours de traitement
                    </Text>
                    <LottieView 
                        source={require('../../../assets/Waiting.json')}
                        autoPlay
                        loop={true}
                        style={{ width: 400, height: 400 }}
                    />
                </View>
            )}
          </View>

        {absence.justification?.statut != "En cours" && absence.justification?.statut != "Approuvée" && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

                <View style={styles.justificationSection}>
                    <Text style={styles.sectionTitle}>Justification écrite</Text>
                    <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Expliquez les raisons de votre absence..."
                    value={justificationText}
                    onChangeText={setJustificationText}
                    textAlignVertical="top"
                    />
                </View>
                <View style={styles.documentsSection}>
                    <Text style={styles.sectionTitle}>Pièces justificatives</Text>
        
                    <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
                        <Ionicons name="attach-outline" size={20} color="#007AFF" />
                        <Text style={styles.attachButtonText}>Joindre un document</Text>
                    </TouchableOpacity>
                    

                {/* Attached Documents List */}
                {attachedDocuments.map((document, index) => (
                    <View key={index} style={styles.documentItem}>
                    <View style={styles.documentInfo}>
                        <Ionicons 
                        name={
                            document.type.includes('image') ? 'image-outline' :
                            document.type.includes('pdf') ? 'document-text-outline' :
                            'document-outline'
                        } 
                        size={20} 
                        color="#666" 
                        />
                            <View style={styles.documentDetails}>
                                <Text style={styles.documentName} numberOfLines={1}>
                                {document.name}
                                </Text>
                                <Text style={styles.documentSize}>
                                {formatFileSize(document.size)}
                                </Text>
                            </View>
                            </View>
                            <TouchableOpacity onPress={() => removeDocument(index)}>
                            <Ionicons name="close-circle" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                        ))}
                    </View>
                    
                    <View style={styles.submitSection}>
                        <TouchableOpacity 
                            style={[
                            styles.submitButton,
                            (!justificationText.trim() && attachedDocuments.length === 0) && styles.submitButtonDisabled
                            ]}
                            onPress={submitJustification}
                            disabled={isSubmitting || (!justificationText.trim() && attachedDocuments.length === 0)}
                        >
                        {isSubmitting ? (
                            <View style={styles.submittingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                {attachedDocuments.length > 0 && (
                                <Text style={styles.progressText}>
                                    {Math.round(uploadProgress)}% téléchargé
                                </Text>
                                )}
                            </View>
                            ) : (
                            <>
                                <Ionicons name="send-outline" size={20} color="white" />
                                <Text style={styles.submitButtonText}>Envoyer la justification</Text>
                            </>
                            )}
                        </TouchableOpacity>
                        <Text style={{alignItems: "center", textAlign: "center", color: "red", fontSize: 11, marginVertical: 20}}>
                                Avant de justifier, vérifiez bien que les informations en place sont correctes.
                        </Text>
                    </View>
            </ScrollView>
            )}
          




        {/* Submit Button */}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  absenceDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  justificationSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    maxHeight: 150,
  },
  documentsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  attachButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 10,
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  submitSection: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
});