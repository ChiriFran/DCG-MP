// api/webhook.js
import pkg from 'firebase-admin';
const { initializeApp, credential } = pkg;
import * as admin from 'firebase-admin';

export default async function handler(req, res) {
  try {
    // Verifica que la solicitud sea un POST
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Configura Firebase Admin con las credenciales del servicio desde las variables de entorno
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    // Inicializa Firebase Admin
    if (!admin.apps.length) {
      initializeApp({
        credential: credential.cert(serviceAccount),
      });
    }

    // Accede a Firestore
    const db = admin.firestore();

    // Obtener el evento del webhook
    const event = req.body;

    // Asegúrate de que los datos del evento sean válidos
    if (!event || !event.id) {
      return res.status(400).json({ message: 'Invalid event data' });
    }

    // Actualiza el estado del pedido en Firebase
    const orderRef = db.collection('pedidos').doc(event.id);
    const order = await orderRef.get();

    if (!order.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Dependiendo del estado del evento, actualiza el pedido
    if (event.status === 'approved') {
      await orderRef.update({ status: 'approved' });
      return res.status(200).json({ message: 'Order status updated to approved' });
    } else if (event.status === 'pending') {
      await orderRef.update({ status: 'pending' });
      return res.status(200).json({ message: 'Order status updated to pending' });
    } else if (event.status === 'failed') {
      await orderRef.update({ status: 'failed' });
      return res.status(200).json({ message: 'Order status updated to failed' });
    } else {
      return res.status(400).json({ message: 'Invalid event status' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
