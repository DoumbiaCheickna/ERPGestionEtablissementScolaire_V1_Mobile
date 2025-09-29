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
import { Cstyles } from './styles';

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
      <View style={Cstyles.container}>
        {/* Header */}
        <View style={Cstyles.header}>
          <View style={Cstyles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={Cstyles.closeButton}>
              <Text style={Cstyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={Cstyles.headerCenter}>
            <Text style={Cstyles.headerTitle}>Étudiants</Text>
            <Text style={Cstyles.headerSubtitle}>{className}</Text>
          </View>
          
          <View style={Cstyles.headerRight}>
            <Text style={Cstyles.studentCount}>{students.length}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={Cstyles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={Cstyles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={Cstyles.loadingText}>Chargement des étudiants...</Text>
            </View>
          ) : students.length > 0 ? (
            <View style={Cstyles.studentsList}>
              {students.map((student, index) => (
                <TouchableOpacity
                  key={student.id}
                  style={Cstyles.studentCard}
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
                      Cstyles.avatar,
                      { backgroundColor: getAvatarColor(index) }
                    ]}
                  >
                    <Text style={Cstyles.avatarText}>
                      {getInitials(student.nom, student.prenom)}
                    </Text>
                  </View>
                  
                  {/* Student Info */}
                  <View style={Cstyles.studentInfo}>
                    <Text style={Cstyles.studentName}>
                      {student.prenom} {student.nom}
                    </Text>
                    <Text style={Cstyles.studentLogin}>@{student.login}</Text>
                    {student.email && (
                      <Text style={Cstyles.studentEmail}>{student.email}</Text>
                    )}
                  </View>
                  
                  {/* Arrow */}
                  <Text style={Cstyles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={Cstyles.emptyState}>
              <Text style={Cstyles.emptyIcon}>👥</Text>
              <Text style={Cstyles.emptyTitle}>Aucun étudiant trouvé</Text>
              <Text style={Cstyles.emptySubtitle}>
                Cette classe ne contient aucun étudiant pour le moment
              </Text>
              <TouchableOpacity 
                style={Cstyles.refreshButton}
                onPress={fetchStudents}
              >
                <Text style={Cstyles.refreshButtonText}>🔄 Actualiser</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};



export default StudentsModal;
