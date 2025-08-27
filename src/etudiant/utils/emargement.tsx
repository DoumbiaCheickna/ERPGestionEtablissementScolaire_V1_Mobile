import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  setDoc,
  increment,
  arrayUnion,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, findClasseName } from '../../firebaseConfig';
import * as Notifications from 'expo-notifications';
import { sendPushNotification } from '../services/NotificationInitService';

// In-memory tracking to prevent duplicate notifications within the same session
const sentNotifications = new Set<string>();

// --- Interfaces ---
interface NotificationDataAbsence {
  id: string;
  courseTitle: string;
  matiereId: string;
  timestamp: Date;
  date: string;
  message: string;
  type: string;
  read: boolean;
}

interface CourseSlot {
  matiere_id: string;
  matiere_libelle: string;
  start: string;
  end: string;
  enseignant?: string;
  salle?: string;
  day?: number;
}

interface EdtData {
  class_id: string;
  title: string;
  annee: string;
  semestre: string;
  slots: CourseSlot[];
}

interface StudentData {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe_id: string;
  role_libelle: string;
  expoPushToken?: string;
}

interface SessionData {
  annee: string;
  class_id: string;
  class_libelle: string;
  semestre: string;
  date: Timestamp;
  day: number;
  start: string;
  end: string;
  salle: string;
  matiere_id: string;
  matiere_libelle: string;
  enseignant: string;
  created_at: any;
}

// --- Helper Functions ---

// Generate unique notification key to track sent notifications
const generateNotificationKey = (matricule: string, matiereId: string, date: string): string => {
  return `${matricule}_${matiereId}_${date}`;
};

// Check if notification was already sent today
const wasNotificationSentToday = (matricule: string, matiereId: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const key = generateNotificationKey(matricule, matiereId, today);
  return sentNotifications.has(key);
};

// Mark notification as sent
const markNotificationAsSent = (matricule: string, matiereId: string): void => {
  const today = new Date().toISOString().split('T')[0];
  const key = generateNotificationKey(matricule, matiereId, today);
  sentNotifications.add(key);
};

// Clear old notification tracking (call this daily)
const clearOldNotificationTracking = (): void => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Remove entries older than yesterday
  Array.from(sentNotifications).forEach(key => {
    const keyDate = key.split('_')[2]; // Extract date from key
    if (keyDate < yesterdayStr) {
      sentNotifications.delete(key);
    }

  });
};


// Generate deterministic session ID
const generateSessionId = (
  annee: string, 
  classId: string, 
  date: Date, 
  matiereId: string, 
  start: string, 
  end: string
): string => {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  return `${annee}__${classId}__${dateStr}__${matiereId}__${start}-${end}`;
};

// Normalize date to start of day
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};



// Check if course time is expired
const isCourseTimeExpired = (endTime: string): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const courseEndTime = endHour * 60 + endMinute;
  return currentTime > courseEndTime;
};

// Check if today is the course day
const isTodayTheCourseDay = (courseDay?: number): boolean => {
  if (courseDay == undefined) return true;
  const today = new Date();
  return today.getDay() == courseDay;
};

// Generate unique ID
const generateUniqueId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// --- Main Functions ---

// Create or get session document
const createOrGetSession = async (
  sessionId: string,
  sessionData: SessionData
): Promise<boolean> => {
  try {
    const sessionRef = doc(db, 'emargements', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      await setDoc(sessionRef, sessionData);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Check if student already has a record for this session
const checkExistingStudentRecord = async (
  sessionId: string, 
  matricule: string
): Promise<boolean> => {
  try {
    const sessionRef = doc(db, 'emargements', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) return false;
    
    const sessionData = sessionSnap.data();
    return sessionData[matricule] !== undefined;
  } catch (error) {
    return false;
  }
};

// Add student record to session
const addStudentToSession = async (
  sessionId: string, 
  matricule: string, 
  studentData: any
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'emargements', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    const existingData = sessionSnap.exists() ? sessionSnap.data() : {};
    
    const currentMatriculeData = existingData[matricule] || [];
    const updatedMatriculeData = [...currentMatriculeData, studentData];
    
    await setDoc(sessionRef, { 
      ...existingData, 
      [matricule]: updatedMatriculeData 
    }, { merge: true });
    
  } catch (error) {
    console.error('Error adding student to session:', error);
    throw error;
  }
};

// Update user stats and notifications
const updateUserStats = async (
  userDocId: string, 
  type: 'absence' | 'presence', 
  notificationData: NotificationDataAbsence
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userDocId);
    const userSnap = await getDoc(userRef);
    const existingNotifs = userSnap.data()?.notifications || [];

    const alreadyNotified = existingNotifs.some((n: any) => {
      const notifDate = n.timestamp?.toDate ? n.timestamp.toDate() : new Date(n.timestamp);
      return n.matiereId === notificationData.matiereId &&
            n.type === notificationData.type &&
            notifDate.toDateString() === new Date().toDateString();
    });

    if (!alreadyNotified) {
      const updateData: any = {
        notifications: arrayUnion(notificationData)
      };

      if (type === 'absence') {
        updateData.absences = increment(1);
      } else {
        updateData.presences = increment(1);
      }

      await updateDoc(userRef, updateData);
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// Get all students
const getAllStudents = async (): Promise<StudentData[]> => {
  try {
    const studentsQuery = query(
      collection(db, 'users'), 
      where('role_libelle', '==', 'Etudiant')
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    const students: StudentData[] = [];
    studentsSnapshot.forEach((doc) => {
      const data = doc.data();
      students.push({
        id: doc.id,
        matricule: data.matricule,
        nom: data.nom,
        prenom: data.prenom,
        classe_id: data.classe_id,
        role_libelle: data.role_libelle,
        expoPushToken: data.expoPushToken
      });
    });

    return students;
  } catch (error) {
    return [];
  }
};

// Get class EDT
const getClassEDT = async (classId: string): Promise<EdtData[]> => {
  try {
    const edtsQuery = query(collection(db, 'edts'), where('class_id', '==', classId));
    const edtsSnapshot = await getDocs(edtsQuery);
    
    const edts: EdtData[] = [];
    edtsSnapshot.forEach((doc) => {
      const data = doc.data();
      edts.push({
        class_id: data.class_id,
        title: data.title,
        annee: data.annee,
        semestre: data.semestre,
        slots: data.slots || []
      });
    });

    return edts;
  } catch (error) {
    console.error('Error getting class EDT:', error);
    return [];
  }
};

// Process absences for a specific class and course slot
const processClassSlotAbsences = async (
  edt: EdtData,
  slot: CourseSlot,
  classStudents: StudentData[],
  className: string
): Promise<void> => {
  try {
    const today = normalizeDate(new Date());
    
    const sessionId = generateSessionId(
      edt.annee,
      edt.class_id,
      today,
      slot.matiere_id,
      slot.start,
      slot.end
    );

    const sessionData: SessionData = {
      annee: edt.annee,
      class_id: edt.class_id,
      class_libelle: className,
      semestre: edt.semestre,
      date: Timestamp.fromDate(today),
      day: slot.day || new Date().getDay(),
      start: slot.start,
      end: slot.end,
      salle: slot.salle || '',
      matiere_id: slot.matiere_id,
      matiere_libelle: slot.matiere_libelle,
      enseignant: slot.enseignant || '',
      created_at: serverTimestamp()
    };

    await createOrGetSession(sessionId, sessionData);

    for (const student of classStudents) {
      try {
        // Check if already processed in Firestore
        const alreadyProcessed = await checkExistingStudentRecord(sessionId, student.matricule);
        if (alreadyProcessed) {
          continue;
        }

        // Check if notification was already sent today (prevents duplicates)
        const notificationAlreadySent = wasNotificationSentToday(student.matricule, slot.matiere_id);
        
        const userName = `${student.prenom} ${student.nom}`;
        const uniqueId = generateUniqueId('absence');

        const absenceData = {
          matiere_libelle: slot.matiere_libelle,
          matiereId: slot.matiere_id,
          nom_complet: userName,
          matricule: student.matricule,
          timestamp: new Date(),
          type: 'absence',
          start: slot.start,
          end: slot.end,
          enseignant: slot.enseignant,
          salle: slot.salle,
          annee: edt.annee,
          semestre: edt.semestre
        };

        const absenceNotificationData: NotificationDataAbsence = {
          id: uniqueId,
          courseTitle: slot.matiere_libelle,
          matiereId: slot.matiere_id,
          timestamp: new Date(),
          date: new Date().toDateString(),
          message: `Absence automatique enregistrée pour le cours de ${slot.matiere_libelle}`,
          type: 'Absence',
          read: false,
        };

        // Add student to session
        await addStudentToSession(sessionId, student.matricule, absenceData);
        
        // Update user statistics
        await updateUserStats(student.id, 'absence', absenceNotificationData);

        if (!notificationAlreadySent && student.expoPushToken) {
          try {
            // Use token to send remote push notification (works even if app killed)
            await sendPushNotification(
              "Absence Détectée",
              `Vous avez raté le cours de ${slot.matiere_libelle} (${slot.start}-${slot.end})`,
              {
                type: 'absence_detected',
                studentId: student.id,
                matricule: student.matricule,
                courseName: slot.matiere_libelle,
                courseTime: `${slot.start}-${slot.end}`,
                salle: slot.salle || 'Non spécifiée',
                timestamp: new Date().toISOString(),
                screen: 'Notifications',
              },
              student.expoPushToken 
            );

            // Mark as sent in memory to prevent duplicates
            markNotificationAsSent(student.matricule, slot.matiere_id);
          } catch (error) {
            console.error(`Push notification failed for ${student.matricule}:`, error);
          }
        }


        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Error processing absence for ${student.matricule}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error processing class slot absences:', error);
  }
};

// Main function to process all automatic absences
export const processAllAutomaticAbsences = async (): Promise<void> => {
  try {
    // Clear old tracking data
    clearOldNotificationTracking();
    
    const allStudents = await getAllStudents();
    if (allStudents.length === 0) {
      return;
    }

    const studentsByClass = allStudents.reduce((acc, student) => {
      if (!acc[student.classe_id]) {
        acc[student.classe_id] = [];
      }
      acc[student.classe_id].push(student);
      return acc;
    }, {} as Record<string, StudentData[]>);

    for (const [classId, classStudents] of Object.entries(studentsByClass)) {
      try {
        const classEDTs = await getClassEDT(classId);
        if (classEDTs.length === 0) {
          continue;
        }

        const className = await findClasseName(classId);
        
        for (const edt of classEDTs) {
          for (const slot of edt.slots) {
            if (!isTodayTheCourseDay(slot.day)) {
              continue;
            }

            if (!isCourseTimeExpired(slot.end)) {
              continue;
            }
            
            await processClassSlotAbsences(edt, slot, classStudents, className);
            
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
      } catch (error) {
        console.error(`Error processing class ${classId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error in automatic absence processing:', error);
  }
};

// Function to run service at regular intervals
export const startAutomaticAbsenceService = (intervalInMinutes: number = 30): NodeJS.Timeout => {
  processAllAutomaticAbsences();
  
  return setInterval(() => {
    processAllAutomaticAbsences();
  }, intervalInMinutes * 60 * 1000);
};

// Function to stop the service
export const stopAutomaticAbsenceService = (intervalId: NodeJS.Timeout): void => {
  clearInterval(intervalId);
};

// Function to run service once (for testing)
export const runOnceAutomaticAbsences = async (): Promise<void> => {
  console.log('Running automatic absences once for testing');
  await processAllAutomaticAbsences();
};