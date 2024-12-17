import pkg from 'firebase-admin';
const { initializeApp, credential } = pkg;
import * as admin from 'firebase-admin';

// Desactiva el body parser en Vercel para manejar el webhook correctamente
export const config = {
  api: {
    bodyParser: false, // Desactiva el body parser de Vercel
  },
};

export default async function handler(req, res) {
  try {
    // Verifica que la solicitud sea un POST
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Leer el cuerpo del evento (esto es necesario porque Vercel no lo parsea automáticamente)
    const rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => {
        resolve(data);
      });
      req.on('error', (err) => reject(err));
    });

    console.log('Webhook received:', rawBody); // Agregado para ver el cuerpo recibido

    // El cuerpo del evento se encuentra en formato JSON
    const event = JSON.parse(rawBody);

    // Asegúrate de que los datos del evento sean válidos
    if (!event || !event.data || !event.data.id) {
      console.error('Invalid event data:', event); // Log de error
      return res.status(400).json({ message: 'Invalid event data' });
    }

    console.log('Event ID:', event.data.id); // Log del ID del evento para depuración

    // Inicializa Firebase Admin si no está inicializado
    if (!admin.apps.length) {
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

      initializeApp({
        credential: credential.cert(serviceAccount),
      });
    }

    // Accede a Firestore
    const db = admin.firestore();

    // Dependiendo del estado del evento, actualiza el pedido
    if (event.action === 'payment.updated') {
      const orderId = event.data.id; // El ID del pedido
      const orderRef = db.collection('pedidos').doc(orderId);
      const order = await orderRef.get();

      if (!order.exists) {
        console.error('Order not found:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }

      // Actualiza el estado del pedido según la información del evento
      await orderRef.update({
        status: 'updated by webhook', // O el estado que necesites
        payment_status: event.data.status, // Si el evento trae el estado del pago
      });

      console.log('Payment updated for order:', orderId);
      return res.status(200).json({ message: 'Payment status updated' });
    } else {
      console.error('Unsupported event action:', event.action); // Log si el evento no es reconocido
      return res.status(400).json({ message: 'Unsupported event action' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error); // Log de error detallado
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
