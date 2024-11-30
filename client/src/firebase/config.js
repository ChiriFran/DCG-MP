import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// Tu configuración de Firebase para la aplicación web
const firebaseConfig = {
  apiKey: "AIzaSyBBkoZEjzftavISNPRRsAJRPbumS8AYbo4",
  authDomain: "ecommerce-ad14c.firebaseapp.com",
  projectId: "ecommerce-ad14c",
  storageBucket: "ecommerce-ad14c.appspot.com",
  messagingSenderId: "239222382582",
  appId: "1:239222382582:web:94cf50be10bae8594d71d7",
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
