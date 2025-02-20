import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta
import axios from 'axios'; // Asegúrate de que axios esté importado correctamente

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const body = req.body; // ✅ Utiliza req.body

    const { action, data } = body; // 🔹 Extrae la acción y los datos del webhook

    if (!data || !data.id) {
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;
    const paymentStatus = action; // Puede ser "payment.created", "payment.updated", etc.

    // 📌 Determinar el estado del pedido en base a la acción
    let estadoPedido;
    let coleccion;

    // Añadir soporte para payment.created
    if (paymentStatus === "payment.created") {
      estadoPedido = "pago creado";
      coleccion = "pedidosPendientes"; // O lo que corresponda
    } else if (paymentStatus.includes("payment.approved")) {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos";
    } else if (paymentStatus.includes("payment.rejected")) {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados";
    } else if (paymentStatus.includes("payment.pending")) {
      estadoPedido = "pago pendiente";
      coleccion = "pedidosPendientes";
    } else {
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    // 📌 Consultar los datos del cliente desde la API de Mercado Pago
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
      },
    });

    const paymentData = response.data;
    const comprador = paymentData.payer || {};
    const emailComprador = comprador.email || "email desconocido";

    // 📌 Guardar el estado del pedido en Firebase junto con los datos del comprador
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador: {
        nombre: comprador.name || "nombre desconocido",
        email: emailComprador,
      },
      precio: paymentData.transaction_amount || 0,
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}`);
    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
