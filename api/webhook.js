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

    // Manejar diferentes tipos de eventos
    switch (event.action) {
      case 'payment.created':
        console.log('Payment created for order:', event.id);
        // Registrar el pago en la colección "pedidos"
        // Aquí puedes agregar la lógica para registrar el pago en Firebase o actualizar tu base de datos.
        return res.status(200).json({ message: 'Payment created' });
        
      case 'payment.updated':
        console.log('Payment updated for order:', event.id);
        // Aquí puedes manejar la actualización del pago, por ejemplo, confirmando un pago exitoso o rechazado
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
