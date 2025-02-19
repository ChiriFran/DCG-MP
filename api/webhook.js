import { db } from './firebaseAdmin.js';

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

    const event = JSON.parse(rawBody);
    console.log('Evento recibido:', JSON.stringify(event, null, 2));

    if (!event || !event.id) {
      console.error('Invalid event data:', event);
      return res.status(400).json({ message: 'Invalid event data' });
    }

    // Asegurar que sea un evento de pago
    if (event.type !== 'payment') {
      console.log('Evento ignorado:', event.type);
      return res.status(200).json({ message: `Evento ${event.type} ignorado` });
    }

    // Obtener el estado de pago de forma segura
    const paymentStatus = event?.data?.status || 'unknown';
    const collectionName = getCollectionName(paymentStatus);

    if (!collectionName || paymentStatus === 'unknown') {
      console.error('Unknown payment status:', paymentStatus, 'Evento recibido:', event);
      return res.status(400).json({ message: 'Unknown payment status' });
    }

    // Guardar en la colección correspondiente
    await db.collection(collectionName).doc(event.id).set({
      id: event.id,
      status: paymentStatus,
      amount: event?.data?.transaction_amount || 0,
      currency: event?.data?.currency_id || 'ARS',
      email: event?.data?.payer?.email || '',
      date: new Date(),
    });

    console.log(`Payment registrado en ${collectionName}:`, event.id);
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
