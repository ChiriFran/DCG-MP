import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config(); // Cargar las variables de entorno

// Inicializar Firebase Admin con las credenciales del servicio
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.firestore(); // Obtener la referencia de Firestore

export { db }; // Exportar el objeto db
