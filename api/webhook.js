import { db } from './firebaseAdmin';

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

    // Log para ver el cuerpo completo recibido
    console.log('Evento recibido completo:', rawBody);

    // El cuerpo del evento está en formato JSON
    const event = JSON.parse(rawBody);

    if (!event || !event.id) {
      console.error('Invalid event data:', event); // Log de error
      return res.status(400).json({ message: 'Invalid event data' });
    }

    console.log('Evento completo:', JSON.stringify(event, null, 2)); // Log detallado del evento

    const paymentStatus = event.data?.status; // Asegurarse de que `status` esté dentro de `data`
    const collectionName = getCollectionName(paymentStatus);

    if (!collectionName) {
      console.error('Unknown payment status:', paymentStatus);
      return res.status(400).json({ message: 'Unknown payment status' });
    }

    // Guardar en la colección correspondiente
    await db.collection(collectionName).doc(event.id).set({
      id: event.id,
      status: paymentStatus,
      amount: event.data?.transaction_amount || 0,
      currency: event.data?.currency_id || 'ARS',
      email: event.data?.payer?.email || '',
      date: new Date(),
    });

    console.log(`Pago registrado en ${collectionName}:`, event.id);
    return res.status(200).json({ message: `Pago guardado en ${collectionName}` });

  } catch (error) {
    console.error('Error procesando el webhook:', error);
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
