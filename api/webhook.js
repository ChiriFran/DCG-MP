import { IncomingWebhook } from '@slack/webhook'; // Ejemplo con Slack

export default async function handler(req, res) {
  try {
    // Verifica que la solicitud sea un POST
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Asegúrate de que los datos de autenticación sean válidos
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader || authorizationHeader !== `Bearer ${process.env.MP_WEBHOOK_SECRET}`) {
      console.error('Unauthorized request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Procesar el webhook aquí
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

    const event = JSON.parse(rawBody);

    if (!event || !event.id) {
      console.error('Invalid event data:', event);
      return res.status(400).json({ message: 'Invalid event data' });
    }

    // Realizar el procesamiento necesario
    if (event.action === 'payment.updated') {
      return res.status(200).json({ message: 'Payment status updated' });
    } else {
      console.error('Unsupported event action:', event.action);
      return res.status(400).json({ message: 'Unsupported event action' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
