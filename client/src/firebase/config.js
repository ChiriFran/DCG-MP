import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// Tu configuración de Firebase para la aplicación web
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "dcg-store-db-7dbe5.firebaseapp.com",
  projectId: "dcg-store-db-7dbe5",
  storageBucket: "dcg-store-db-7dbe5.firebasestorage.app",
  messagingSenderId: "348286296150",
  appId: "1:348286296150:web:a162b029f704245a9fdbf7",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Firestore
const auth = getAuth(app); // Autenticación

export {
  db,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
};
