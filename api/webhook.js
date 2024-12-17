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
    if (!event || !event.id) {
      console.error('Invalid event data:', event); // Log de error
      return res.status(400).json({ message: 'Invalid event data' });
    }

    console.log('Event ID:', event.id); // Log del ID del evento para depuración

    // Verificar que la solicitud sea de Mercado Pago (si es necesario)
    const authToken = req.headers['authorization'];
    if (!authToken || authToken !== `Bearer ${process.env.MP_ACCESS_TOKEN}`) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Inicializar Firebase Admin si no lo está
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    // Accede a Firestore
    const db = admin.firestore();

    // Dependiendo del estado del evento, actualiza el pedido
    if (event.action === 'payment.updated') {
      console.log('Payment updated for order:', event.id); // Log del tipo de evento recibido

      // Consultar el pedido por ID
      const orderRef = db.collection('pedidos').doc(event.id);
      const order = await orderRef.get();

      if (!order.exists) {
        console.error('Order not found:', event.id);
        return res.status(404).json({ message: 'Order not found' });
      }

      // Actualizar el estado del pedido
      const updatedStatus = event.data.status === 'approved' ? 'approved' : event.data.status;
      await orderRef.update({ status: updatedStatus });

      return res.status(200).json({ message: `Order status updated to ${updatedStatus}` });
    } else {
      console.error('Unsupported event action:', event.action); // Log si el evento no es reconocido
      return res.status(400).json({ message: 'Unsupported event action' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error); // Log de error detallado
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
