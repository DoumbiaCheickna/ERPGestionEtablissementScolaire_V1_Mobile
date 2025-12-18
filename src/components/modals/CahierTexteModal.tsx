import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CahierTexteModalProps {
  visible: boolean;
  onClose: () => void;
  course: {
    matiere_id: string;
    matiere_libelle: string;
    start: string;
    end: string;
    salle: string;
    combined_classes?: string;
    classe_libelle?: string;
    class_ids?: string[];
  };
}

export default function CahierTexteModal({ visible, onClose, course }: CahierTexteModalProps) {
  const [objectif, setObjectif] = useState('');
  const [travauxAFaire, setTravauxAFaire] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const objectifInputRef = useRef<View>(null);
  const travauxInputRef = useRef<View>(null);

  const calculateHeures = (start: string, end: string): number => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return (endMinutes - startMinutes) / 60; // Convert to hours
  };

  const formatDate = (): string => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleInputFocus = (inputRef: React.RefObject<View>) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: y - 20,
            animated: true,
          });
        },
        () => {}
      );
    }, 100);
  };

  const handleSave = async () => {
    // Validation
    if (!objectif.trim()) {
      Alert.alert('Erreur', 'L\'objectif du cours est obligatoire');
      return;
    }

    setLoading(true);

    try {
        const userLogin = await AsyncStorage.getItem('userLogin');
        let professorName = '';
        if (!userLogin) return;
      
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('login', '==', userLogin));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            professorName = userData.nom && userData.prenom 
            ? `${userData.prenom} ${userData.nom}` 
            : userData.nom || userData.prenom || 'Professeur';
        }

      // Calculate hours
      const heures = calculateHeures(course.start, course.end);

      // Prepare data
      const cahierData = {
        matiere_id: course.matiere_id,
        matiere_libelle: course.matiere_libelle,
        objectif_cours: objectif.trim(),
        travaux_a_faire: travauxAFaire.trim() || '',
        date: formatDate(),
        heure_debut: course.start,
        heure_fin: course.end,
        nombre_heures: heures,
        salle: course.salle,
        classes: course.combined_classes || course.classe_libelle,
        class_ids: course.class_ids || [],
        professeur_login: userLogin,
        professeur_nom: professorName,
        created_at: serverTimestamp(),
      };

      // Save to Firestore
      await addDoc(collection(db, 'cahier_textes'), cahierData);

      Alert.alert(
        'Succès',
        'Le cahier de texte a été enregistré avec succès!',
        [
          {
            text: 'OK',
            onPress: () => {
              setObjectif('');
              setTravauxAFaire('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving cahier de texte:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le cahier de texte');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setObjectif('');
    setTravauxAFaire('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cahier de Texte</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Course Info */}
          <View style={styles.courseInfoCard}>
            <Text style={styles.courseTitle}>{course.matiere_libelle}</Text>
            <Text style={styles.courseDetail}>
              📅 {formatDate()} • 🕐 {course.start} - {course.end}
            </Text>
            <Text style={styles.courseDetail}>
               {course.salle} • ⏱️ {calculateHeures(course.start, course.end)}h
            </Text>
            <Text style={styles.courseDetail}>
               {course.combined_classes || course.classe_libelle}
            </Text>
          </View>

          {/* Objectif du cours (Required) */}
          <View style={styles.inputGroup} ref={objectifInputRef}>
            <Text style={styles.label}>
              Objectif du cours <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Décrivez l'objectif du cours..."
              value={objectif}
              onChangeText={setObjectif}
              onFocus={() => handleInputFocus(objectifInputRef as any)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.charCount}>{objectif.length} caractères</Text>
          </View>

          {/* Travaux à faire (Optional) */}
          <View style={styles.inputGroup} ref={travauxInputRef}>
            <Text style={styles.label}>Travaux à faire</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Décrivez les travaux à faire (optionnel)..."
              value={travauxAFaire}
              onChangeText={setTravauxAFaire}
              onFocus={() => handleInputFocus(travauxInputRef as any)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.charCount}>{travauxAFaire.length} caractères</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Les informations seront enregistrées dans le cahier de texte de la classe.
            </Text>
          </View>
          
          {/* Extra padding at bottom for keyboard */}
          <View style={{ height: 50 }} />
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading || !objectif.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  courseInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  courseDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  required: {
    color: '#F44336',
    fontSize: 18,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 10,
    paddingVertical: 20,
    paddingBottom: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
    marginBottom: 5
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#1a1a1a',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});