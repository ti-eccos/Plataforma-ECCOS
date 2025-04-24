
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyByPn9InuXX2Dp-_nef-Om0ii4zfBwfMFk",
  authDomain: "plataforma-de-tecnologia.firebaseapp.com",
  projectId: "plataforma-de-tecnologia",
  storageBucket: "plataforma-de-tecnologia.firebasestorage.app",
  messagingSenderId: "1083542320286",
  appId: "1:1083542320286:web:5c1a5b7203f050186e778f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

googleProvider.setCustomParameters({
  hd: 'colegioeccos.com.br'
});

export default app;