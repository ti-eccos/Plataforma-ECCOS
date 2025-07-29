
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBa-bbn3UllojrA9z23jsBEDrytq0X978c",
  authDomain: "plataforma-eccos-232ee.firebaseapp.com",
  projectId: "plataforma-eccos-232ee",
  storageBucket: "plataforma-eccos-232ee.firebasestorage.app",
  messagingSenderId: "347524267259",
  appId: "1:347524267259:web:9042fa48eb19caec01445e"
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