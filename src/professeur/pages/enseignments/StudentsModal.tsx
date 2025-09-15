import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../../../firebaseConfig';

interface Student {
  id: string;
  nom: string;
  prenom: string;
  login: string;
  email?: string;
  classe: string;
  telephone?: string;
}

interface StudentsModalProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

const StudentsModal: React.FC<StudentsModalProps> = ({
  visible,
  onClose,
  classId,
  className
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch students for the specific class
  const fetchStudents = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const usersRef = collection(db, "users");

      const q1 = query(
        usersRef,
        where("role_libelle", "==", "Etudiant"),
        where("classe_id", "==", classId)
      );

      const q2 = query(
        usersRef,
        where("role_libelle", "==", "Etudiant"),
        where("classe2_id", "==", classId)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const studentsMap = new Map<string, Student>();

      // Helper to add student without duplicates
      const addStudent = (doc: any) => {
        const data = doc.data();
        studentsMap.set(doc.id, {
          id: doc.id,
          nom: data.nom || "",
          prenom: data.prenom || "",
          login: data.login || "",
          email: data.email || "",
          classe: data.classe || "",
          telephone: data.telephone || ""
        });
      };

      snap1.forEach(addStudent);
      snap2.forEach(addStudent);

      // Convert map → array
      const studentsData = Array.from(studentsMap.values());

      // Sort students by last name, then first name
      studentsData.sort((a, b) => {
        const lastNameCompare = a.nom.localeCompare(b.nom);
        if (lastNameCompare === 0) {
          return a.prenom.localeCompare(b.prenom);
        }
        return lastNameCompare;
      });

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      Alert.alert("Erreur", "Impossible de charger les étudiants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && classId) {
      fetchStudents();
    }
  }, [visible, classId]);

  const handleClose = () => {
    setStudents([]);
    onClose();
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0).toUpperCase()}${nom.charAt(0).toUpperCase()}`;
  };

  const getAvatarColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    return colors[index % colors.length];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Étudiants</Text>
            <Text style={styles.headerSubtitle}>{className}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.studentCount}>{students.length}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement des étudiants...</Text>
            </View>
          ) : students.length > 0 ? (
            <View style={styles.studentsList}>
              {students.map((student, index) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert(
                      'Détails Étudiant',
                      `Nom: ${student.nom}\nPrénom: ${student.prenom}\nClasse: ${student.classe}${student.email ? `\nEmail: ${student.email}` : ''}${student.telephone ? `\nTéléphone: ${student.telephone}` : ''}`,
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  {/* Avatar */}
                  <View 
                    style={[
                      styles.avatar,
                      { backgroundColor: getAvatarColor(index) }
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(student.nom, student.prenom)}
                    </Text>
                  </View>
                  
                  {/* Student Info */}
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {student.prenom} {student.nom}
                    </Text>
                    <Text style={styles.studentLogin}>@{student.login}</Text>
                    {student.email && (
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    )}
                  </View>
                  
                  {/* Arrow */}
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Aucun étudiant trouvé</Text>
              <Text style={styles.emptySubtitle}>
                Cette classe ne contient aucun étudiant pour le moment
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchStudents}
              >
                <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  
  headerLeft: {
    width: 40,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  
  studentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    textAlign: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  
  studentsList: {
    padding: 20,
  },
  
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  
  studentInfo: {
    flex: 1,
  },
  
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  studentLogin: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  
  studentEmail: {
    fontSize: 12,
    color: '#999',
  },
  
  arrow: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 8,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StudentsModal;