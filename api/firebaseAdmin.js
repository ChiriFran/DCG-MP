// firebaseAdmin.js

import admin from 'firebase-admin';

// Verificamos si Firebase Admin ya está inicializado
if (!admin.apps.length) {
  // Inicialización de Firebase con las credenciales de variables de entorno
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplaza saltos de línea
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  admin.app(); // Si ya está inicializado, utilizamos la instancia existente
}

const db = admin.firestore();

export { db };
