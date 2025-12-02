// components/hooks/useUploadPostImage.ts
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage2 } from '../../firebaseConfig2';

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