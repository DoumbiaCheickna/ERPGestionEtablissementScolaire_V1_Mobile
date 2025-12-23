// components/hooks/useUploadProfilePhoto.ts
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage2 } from '../../firebaseConfig2';



export interface UploadedDocument {
  name: string;
  downloadURL: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface AttachedDocument {
  name: string;
  uri: string;
  type: string;
  size: number;
}

export const useUploadAbsenceDocuments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload a single document to Firebase Storage
   * @param document - The document to upload
   * @param userId - User's matricule or ID
   * @param courseName - Name of the course (sanitized)
   * @param date - Date string (YYYY-MM-DD format)
   * @returns Promise with uploaded document info
   */
  const uploadSingleDocument = async (
    document: AttachedDocument,
    userId: string,
    courseName: string,
    date: string
  ): Promise<UploadedDocument> => {
    try {
      // clean le nom du cours pour le nom de fichier
      const sanitizedCourseName = courseName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50); // Limit 
      // Extraire l'extension du fichier
      const fileExtension = document.name.split('.').pop() || 'file';
      
      const timestamp = Date.now();
      const fileName = `justifications/${userId}_${sanitizedCourseName}_${date}_${timestamp}.${fileExtension}`;
      
      // Créer une référence de stockage
      const storageRef = ref(storage2, fileName);
      
      // Convertir l'URI en blob
      const response = await fetch(document.uri);
      const blob = await response.blob();
      
      // Valider la taille du fichier (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('Le fichier ne doit pas dépasser 10 Mo');
      }
      
      // valider le type de fichier
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(blob.type)) {
        throw new Error('Type de fichier non autorisé. Utilisez: images, PDF ou documents Word');
      }
      
      // Upload vers Firebase Storage
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        name: document.name,
        downloadURL,
        type: document.type,
        size: document.size,
        uploadedAt: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('Error uploading document:', err);
      throw new Error(err.message || `Erreur lors du téléchargement de ${document.name}`);
    }
  };

  /**
   * Upload multiple documents
   * @param documents - Array of documents to upload
   * @param userId - User's matricule or ID
   * @param courseName - Name of the course
   * @param date - Date string (YYYY-MM-DD format)
   * @returns Promise with array of uploaded documents
   */
  const uploadAbsenceDocuments = async (
    documents: AttachedDocument[],
    userId: string,
    courseName: string,
    date: string
  ): Promise<UploadedDocument[]> => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      if (documents.length === 0) {
        return [];
      }

      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      if (totalSize > 20 * 1024 * 1024) {
        throw new Error('La taille totale des fichiers ne doit pas dépasser 20 Mo');
      }

      const uploadPromises = documents.map(async (doc, index) => {
        try {
          const result = await uploadSingleDocument(doc, userId, courseName, date);
          
          const progress = ((index + 1) / documents.length) * 100;
          setUploadProgress(progress);
          
          return result;
        } catch (err: any) {
          console.error(`Failed to upload ${doc.name}:`, err);
          throw err;
        }
      });

      const uploadedDocuments = await Promise.all(uploadPromises);
      
      setUploadProgress(100);
      return uploadedDocuments;

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Erreur lors du téléchargement des documents');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const reset = () => {
    setLoading(false);
    setError(null);
    setUploadProgress(0);
  };

  return { 
    uploadAbsenceDocuments, 
    uploadSingleDocument,
    loading, 
    error, 
    uploadProgress,
    reset
  };
};
export const usersWallpapers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadProfilePhoto = async (uri: string, userId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const filename = `${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage2, `usersProfilePhotos/${filename}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadProfilePhoto, loading, error };
};

export const useUploadPostImage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPostImage = async (uri: string, userId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

          const filename = `${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage2, `postsImages/${filename}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadPostImage, loading, error };
};