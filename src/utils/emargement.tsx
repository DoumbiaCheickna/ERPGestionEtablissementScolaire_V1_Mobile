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
import { db, findClasseName } from '../firebaseConfig';

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
  indisponible?: number;
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
  pushToken?: string;
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
const generateNotificationKey = (matricule: string, matiereId: string, date: string): string => {
  return `${matricule}_${matiereId}_${date}`;
};

const wasNotificationSentToday = (matricule: string, matiereId: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const key = generateNotificationKey(matricule, matiereId, today);
  return sentNotifications.has(key);
};

const markNotificationAsSent = (matricule: string, matiereId: string): void => {
  const today = new Date().toISOString().split('T')[0];
  const key = generateNotificationKey(matricule, matiereId, today);
  sentNotifications.add(key);
};

const clearOldNotificationTracking = (): void => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  Array.from(sentNotifications).forEach(key => {
    const keyDate = key.split('_')[2];
    if (keyDate < yesterdayStr) {
      sentNotifications.delete(key);
    }
  });
};

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

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const isCourseTimeExpired = (endTime: string): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const courseEndTime = endHour * 60 + endMinute;
  return currentTime > courseEndTime;
};

const isTodayTheCourseDay = (courseDay?: number): boolean => {
  if (courseDay === undefined) return true;
  const today = new Date();
  const todayDay = today.getDay();
  const convertedTodayDay = todayDay === 0 ? 7 : todayDay;
  return convertedTodayDay === courseDay;
};

const generateUniqueId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// --- Main Functions ---
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

const addStudentToSession = async (
  sessionId: string,
  matricule: string,
  absenceData: any
): Promise<void> => {
  try {
    const sessionRef = doc(db, "emargements", sessionId);
    const sessionSnap = await getDoc(sessionRef);
    const existingData = sessionSnap.exists() ? sessionSnap.data() : {};

    const currentMatriculeData: any[] = Array.isArray(existingData[matricule]) ? existingData[matricule] : [];

    const filtered = currentMatriculeData.filter((e) => {
      return !(
        e.matiere_id == absenceData.matiere_id &&
        e.matiere_libelle == absenceData.matiere_libelle &&
        e.start == absenceData.start &&
        e.end == absenceData.end &&
        e.date == absenceData.date &&
        e.type == absenceData.type &&
        e.salle == absenceData.salle
      );
    });

    const updatedMatriculeData = [...filtered, absenceData];

    await setDoc(
      sessionRef,
      {
        ...existingData,
        [matricule]: updatedMatriculeData,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error adding student to session:", error);
    throw error;
  }
};

const updateUserStats = async (
  userDocId: string, 
  type: 'absence' | 'presence', 
  notificationData: NotificationDataAbsence
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userDocId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn(`User document not found: ${userDocId}`);
      return;
    }
    
    const userData = userSnap.data() || {};
    const existingNotifs: any[] = Array.isArray(userData.notifications) ? userData.notifications : [];

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

const getAllStudents = async (): Promise<StudentData[]> => {
  try {
    const studentsQuery = query(
      collection(db, 'users'), 
      where('role_libelle', '==', 'Etudiant'),
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
        expoPushToken: data.expoPushToken,
        pushToken: data.pushToken 
      });
    });

    return students;
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

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
        slots: Array.isArray(data.slots) ? data.slots : []
      });
    });

    return edts;
  } catch (error) {
    console.error('Error getting class EDT:', error);
    return [];
  }
};

const checkExistingEmargement = async (
  matricule: string,
  matiereId: string,
  matiereLibelle: string,
  date: string,
): Promise<boolean> => {
  try {
    const studentsRef = collection(db, 'users');
    const q = query(studentsRef, where('matricule', '==', matricule));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`User document not found for matricule: ${matricule}`);
      return false;
    }

    const studentDoc = querySnapshot.docs[0];
    const userData = studentDoc.data() || {};
    const existingEmargements: any[] = Array.isArray(userData.emargements) ? userData.emargements : [];

    const alreadyEmarged = existingEmargements.some(e =>
      e.matiere_id == matiereId &&
      e.matiere_libelle == matiereLibelle &&
      e.date == date &&
      e.type == 'presence'
    );

    return alreadyEmarged;

  } catch (error) {
    console.error(`Error checking existing emargement for ${matricule}:`, error);
    return false;
  }
};

const saveAbsenceForStudent = async (
  matricule: string,
  absenceData: any
): Promise<void> => {
  try {
    const studentsRef = collection(db, "users");
    const q = query(studentsRef, where("matricule", "==", matricule));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return;

    const studentDoc = querySnapshot.docs[0];
    const studentRef = studentDoc.ref;
    const studentData = studentDoc.data() || {};
    const currentEmargements: any[] = Array.isArray(studentData.emargements) ? studentData.emargements : [];

    const filtered = currentEmargements.filter((e: any) => {
      return !(
        e.matiere_id == absenceData.matiere_id &&
        e.matiere_libelle == absenceData.matiere_libelle &&
        e.enseignant == absenceData.enseignant &&
        e.start == absenceData.start &&
        e.end == absenceData.end &&
        e.date == absenceData.date &&
        e.type == absenceData.type &&
        e.salle == absenceData.salle &&
        e.matricule == absenceData.matricule
      );
    });

    const updatedEmargements = [...filtered, absenceData];

    await setDoc(
      studentRef,
      { emargements: updatedEmargements },
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving absence for ${matricule}:`, error);
    throw error;
  }
};

// --- Process absences per slot ---
const processClassSlotAbsences = async (
  edt: EdtData,
  slot: CourseSlot,
  classStudents: StudentData[],
  className: string
): Promise<void> => {
  try {
    if (slot.indisponible === 1) return;

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
        const hasExistingEmargement = await checkExistingEmargement(
          student.matricule,
          slot.matiere_id,
          slot.matiere_libelle,
          new Date().toDateString(),
        );

        if (hasExistingEmargement) continue;

        const userName = `${student.prenom} ${student.nom}`;
        const uniqueId = generateUniqueId('absence');

        const absenceData = {
          matiere_libelle: slot.matiere_libelle,
          matiere_id: slot.matiere_id,
          nom_complet: userName,
          matricule: student.matricule,
          timestamp: new Date(),
          type: 'absence',
          start: slot.start,
          date: new Date().toDateString(),
          end: slot.end,
          enseignant: slot.enseignant,
          salle: slot.salle,
          annee: edt.annee,
          semestre: edt.semestre,
          justification: {
            contenu: "",
            documents: "",
            dateJustification: "",
            statut: "En attente"
          }
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

        await saveAbsenceForStudent(student.matricule, absenceData as any);
        await addStudentToSession(sessionId, student.matricule, absenceData);
        await updateUserStats(student.id, 'absence', absenceNotificationData);

        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`Error processing absence for ${student.matricule}:`, error);
      }
    }

  } catch (error) {
    console.error('Error processing class slot absences:', error);
  }
};

// --- Main processing ---
export const processAllAutomaticAbsences = async (): Promise<void> => {
  console.log('Starting automatic absence processing...');
  
  try {
    clearOldNotificationTracking();
    
    const allStudents = await getAllStudents();
    if (allStudents.length === 0) return;

    const studentsByClass = allStudents.reduce((acc, student) => {
      if (!acc[student.classe_id]) acc[student.classe_id] = [];
      acc[student.classe_id].push(student);
      return acc;
    }, {} as Record<string, StudentData[]>);

    for (const [classId, classStudents] of Object.entries(studentsByClass)) {
      try {
        const classEDTs = await getClassEDT(classId);
        if (classEDTs.length === 0) continue;

        const className = await findClasseName(classId);

        for (const edt of classEDTs) {
          for (const slot of edt.slots) {
            if (!isTodayTheCourseDay(slot.day)) continue;
            if (!isCourseTimeExpired(slot.end)) continue;

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

// --- Service utilities ---
export const startAutomaticAbsenceService = (intervalInMinutes: number = 5): NodeJS.Timeout => {
  processAllAutomaticAbsences();
  return setInterval(() => {
    processAllAutomaticAbsences();
  }, intervalInMinutes * 60 * 1000);
};

export const stopAutomaticAbsenceService = (intervalId: NodeJS.Timeout): void => {
  clearInterval(intervalId);
};

export const runOnceAutomaticAbsences = async (): Promise<void> => {
  await processAllAutomaticAbsences();
};
