import { db } from './firebaseAdmin'; // Importar el objeto db de firebaseAdmin

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
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', err => reject(err));
    });

    console.log('Webhook received:', rawBody);
    const event = JSON.parse(rawBody);

    if (!event || !event.id) {
      console.error('Invalid event data:', event);
      return res.status(400).json({ message: 'Invalid event data' });
    }

    console.log('Event ID:', event.id);
    const paymentStatus = event.data.status; // Estado del pago (approved, rejected, pending)
    const collectionName = getCollectionName(paymentStatus);

    if (!collectionName) {
      console.error('Unknown payment status:', paymentStatus);
      return res.status(400).json({ message: 'Unknown payment status' });
    }

    // Guardar en la colección correspondiente
    await db.collection(collectionName).doc(event.id).set({
      id: event.id,
      status: paymentStatus,
      amount: event.data.transaction_amount || 0,
      currency: event.data.currency_id || 'ARS',
      email: event.data.payer?.email || '',
      date: new Date(),
    });

    console.log(`Payment registered in ${collectionName}:`, event.id);
    return res.status(200).json({ message: `Payment saved in ${collectionName}` });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

// Función auxiliar para determinar la colección según el estado del pago
function getCollectionName(status) {
  switch (status) {
    case 'approved': return 'pedidosExitosos';
    case 'rejected': return 'pedidosRechazados';
    case 'pending': return 'pedidosPendientes';
    default: return null;
  }
}
