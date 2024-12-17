import { verifySignature } from "mercadopago"; // Verificación de firma, si se necesita

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send({ message: "Servidor funcionando correctamente 🚀" });
  }

  if (req.method === "POST") {
    const signature = req.headers["x-merchant-order-id"]; // Firma enviada por Mercado Pago
    const body = req.body; // Payload de la notificación del webhook

    try {
      // Verifica la firma
      const isValid = verifySignature(signature, body);
      if (!isValid) {
        return res.status(400).json({ error: "Firma inválida" });
      }

      const event = body;

      // Según el estado del pago, actualiza el estado de la orden
      if (event.status === "approved") {
        await updateOrderStatus(event.id, "approved");
      } else if (event.status === "pending") {
        await updateOrderStatus(event.id, "pending");
      } else if (event.status === "rejected") {
        await updateOrderStatus(event.id, "rejected");
      }

      return res.status(200).json({ message: "Webhook procesado con éxito" });
    } catch (error) {
      console.error("Error procesando el webhook:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ error: `Método ${req.method} no permitido` });
}

// Función para actualizar el estado de la orden en Firebase
const updateOrderStatus = async (orderId, status) => {
  const pedidoRef = db.collection("pedidos").doc(orderId);
  await pedidoRef.update({ status });
};
