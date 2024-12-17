import crypto from 'crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Desactiva el bodyParser en Vercel para manejar el webhook correctamente
export const config = {
  api: {
    bodyParser: false, // Desactiva el bodyParser de Vercel
  },
};

// Inicializa Firebase con tus credenciales
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

// Obtén la referencia de Firestore
const db = getFirestore();

// Clave secreta de Mercado Pago
const secret = process.env.MP_WEBHOOK_SECRET;

// Función para validar la firma del webhook
const validateWebhookSignature = (req) => {
  const signature = req.headers['x-mercadopago-signature'];  // El encabezado de la firma (dependiendo de la plataforma)
  const rawBody = req.rawBody;  // El cuerpo sin procesar del webhook

  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return signature === hash;  // Compara la firma generada con la recibida
};

export default async function handler(req, res) {
  try {
    // Verifica que la solicitud sea un POST
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Lee el cuerpo sin procesar
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

    // Verifica la firma del webhook
    if (!validateWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody);

    // Asegúrate de que los datos del evento sean válidos
    if (!event || !event.id) {
      console.error('Invalid event data:', event);
      return res.status(400).json({ message: 'Invalid event data' });
    }

    // Procesa el evento dependiendo de la acción
    if (event.action === 'payment.updated') {
      console.log('Payment updated for order:', event.id);

      // Actualiza el estado del pedido en Firebase
      const orderRef = db.collection('pedidos').doc(event.id);
      await orderRef.update({ status: event.data.status });

      return res.status(200).json({ message: 'Payment status updated', orderId: event.id });
    }

    return res.status(400).json({ message: 'Unsupported event action' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
