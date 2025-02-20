import { db } from "./firebaseAdmin.js"; // Asegúrate de que la importación incluya la extensión `.js`

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    if (!data || !data.id) {
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;
    let estadoPedido, coleccion;

    if (action.includes("payment.approved")) {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos";
    } else if (action.includes("payment.rejected")) {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados";
    } else if (action.includes("payment.pending")) {
      estadoPedido = "pago pendiente";
      coleccion = "pedidosPendientes";
    } else {
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
    });

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
