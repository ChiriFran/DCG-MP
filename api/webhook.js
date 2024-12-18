import { verifySignature } from './utils/verifySignature.js'; // Función para verificar la firma del webhook
import { actualizarPedidoFirebase } from './utils/actualizarPedidoFirebase.js'; // Función para actualizar el estado en Firebase

// Desactiva el body parser en Vercel para manejar el webhook correctamente
export const config = {
  api: {
    bodyParser: false, // Desactiva el body parser de Vercel
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Verifica la firma del webhook
      const rawBody = await getRawBody(req); // Obtiene el cuerpo crudo de la solicitud
      const signature = req.headers['x-mp-signature']; // Firma enviada por Mercado Pago

      const isValid = await verifySignature(signature, rawBody);
      if (!isValid) {
        return res.status(400).send("Invalid signature");
      }

      // Parsear el cuerpo JSON después de verificar la firma
      const body = JSON.parse(rawBody);

      // Log para verificar que el webhook llegó correctamente
      console.log("Webhook received:", body);

      // Procesar el evento según su tipo
      if (body.event === "payment_approved") {
        console.log("Payment Approved:", body);

        // Extraer el ID del pedido y el estado del pago
        const orderId = body.data.id; // Ajusta según la estructura de tu webhook
        const paymentStatus = body.data.status;

        // Actualizar el estado del pedido en Firebase Firestore
        await actualizarPedidoFirebase(orderId, paymentStatus);
      } else {
        console.log("Other event received:", body.event);
      }

      // Responde con 200 para confirmar que el webhook se procesó correctamente
      return res.status(200).send("Webhook processed");
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).send("Error processing webhook");
    }
  } else {
    // Responde con 405 si la solicitud no es POST
    return res.status(405).send("Method Not Allowed");
  }
}
