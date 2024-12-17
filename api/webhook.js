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
  
      const orderId = event.data.id; // Obtenemos el ID del pedido
  
      console.log('Event ID:', orderId); // Log del ID del evento para depuración
  
      // Dependiendo del estado del evento, devuelve una respuesta
      if (event.action === 'payment.updated') {
        console.log('Payment updated for order:', orderId); // Log del tipo de evento recibido
  
        // Aquí puedes hacer una redirección o enviar una respuesta al cliente
        return res.status(200).json({ message: 'Payment status updated', orderId });
      } else {
        console.error('Unsupported event action:', event.action); // Log si el evento no es reconocido
        return res.status(400).json({ message: 'Unsupported event action' });
      }
    } catch (error) {
      console.error('Error processing webhook:', error); // Log de error detallado
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  