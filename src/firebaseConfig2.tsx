import { initializeApp as initializeApp2 } from 'firebase/app'
import { getFirestore as getFirestore2 } from 'firebase/firestore'
import { getAuth as getAuth2 } from 'firebase/auth'
import { getStorage as getStorage2 } from 'firebase/storage'

const firebaseConfig2 = {
  apiKey: "AIzaSyDZHA0ne_E4x9CzK_E29j5_tOYAjTtrnrM",
  authDomain: "drop-iibs.firebaseapp.com",
  projectId: "drop-iibs",
  storageBucket: "drop-iibs.firebasestorage.app",
  messagingSenderId: "113120592091",
  appId: "1:113120592091:web:2586508f5323aeeefe0cfe",
}

export const app2 = initializeApp2(firebaseConfig2, "secondApp")

export const db2 = getFirestore2(app2)
export const auth2 = getAuth2(app2)  
export const storage2 = getStorage2(app2)
