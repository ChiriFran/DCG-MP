import { MercadoPagoConfig } from "mercadopago";
import { db } from '../client/src/firebase/config'; // Asegúrate de que la ruta de tu configuración de Firebase sea correcta

export default async function handler(req, res) {
  // Agrega las cabeceras CORS (si es necesario, aunque en Vercel no debería ser necesario)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "POST") {
    try {
      const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;
      const webhookSecret = process.env.MP_WEBHOOK_SECRET; // La clave de seguridad que te dio Mercado Pago

      // Configuración de Mercado Pago
      const client = new MercadoPagoConfig({
        accessToken: mpAccessToken,
      });

      // Verificar el webhook
      const isValidWebhook = await client.webhook.verify(req.headers, req.body, webhookSecret);
      if (!isValidWebhook) {
        return res.status(400).json({ error: "Invalid webhook" });
      }

      // Recuperar la información del pago (puedes encontrar más detalles en la documentación de Mercado Pago)
      const { data } = req.body; // La información del pago enviada por Mercado Pago
      const paymentStatus = data.status; // 'approved', 'pending', 'rejected'

      // Identificar el ID de la orden para actualizar el estado en Firebase
      const orderId = data.external_reference; // Asegúrate de que esto esté correctamente configurado
      const orderRef = db.collection('pedidos').doc(orderId);

      // Establecer el nuevo estado según el estado del pago
      let newStatus = "unknown";
      if (paymentStatus === "approved") {
        newStatus = "success";
      } else if (paymentStatus === "rejected") {
        newStatus = "failed";
      } else if (paymentStatus === "pending") {
        newStatus = "pending";
      }

      // Actualizar el estado en Firebase
      await orderRef.update({
        status: newStatus,
        payment_id: data.id, // ID del pago de Mercado Pago
        updated_at: new Date(),
      });

      console.log(`Pedido ${orderId} actualizado a estado: ${newStatus}`);

      // Responder con éxito
      res.status(200).json({ message: "Webhook procesado correctamente" });
    } catch (error) {
      console.error("Error al procesar el webhook:", error);
      res.status(500).json({ error: "Error al procesar el webhook." });
    }
  } else {
    // Si la solicitud no es un POST, responder con 405
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
