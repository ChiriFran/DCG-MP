import admin from "../../firebaseAdmin"; // Asegúrate de que esta ruta sea correcta
const db = admin.firestore(); // Usamos `admin.firestore()` para obtener la referencia a Firestore

export const config = {
  api: {
    bodyParser: false, // Desactiva el body parser de Vercel
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Leer el cuerpo del evento
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

    console.log('Webhook received:', rawBody); // Log para ver el cuerpo recibido

    // El cuerpo del evento está en formato JSON
    const event = JSON.parse(rawBody);

    if (!event || !event.id) {
      console.error('Invalid event data:', event); // Log de error
      return res.status(400).json({ message: 'Invalid event data' });
    }

    console.log('Event ID:', event.id); // Log del ID del evento

    // Definir la fecha y hora del evento
    const timestamp = new Date().toISOString();

    // Datos básicos del pedido
    const orderData = {
      id: event.id,
      timestamp: timestamp,
      total_amount: event.data?.amount,  // Asumiendo que el total del pago está en `event.data.amount`
      status: event.data?.status,  // Estado del pago
      items: event.data?.items || [],  // Detalles de los artículos si están disponibles
    };

    // Registrar el evento según el tipo de pago
    switch (event.action) {
      case 'payment.created':
        console.log('Payment created for order:', event.id);

        // Crear un documento en "pedidosPendientes"
        await db.collection('pedidosPendientes').doc(event.id).set(orderData);

        return res.status(200).json({ message: 'Payment created' });

      case 'payment.updated':
        console.log('Payment updated for order:', event.id);

        // Verifica si el pago fue exitoso o rechazado
        if (event.data.status === 'approved') {
          // Si el pago fue exitoso, agregarlo a "pedidosExitosos"
          await db.collection('pedidosExitosos').doc(event.id).set(orderData);
        } else if (event.data.status === 'rejected') {
          // Si el pago fue rechazado, agregarlo a "pedidosRechazados"
          await db.collection('pedidosRechazados').doc(event.id).set(orderData);
        }

        return res.status(200).json({ message: 'Payment updated' });

      default:
        console.error('Unsupported event action:', event.action);
        return res.status(400).json({ message: 'Unsupported event action' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
