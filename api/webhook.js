import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta
import axios from 'axios'; // Para realizar consultas a la API de Mercado Pago

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const body = req.body; // ✅ Utiliza req.body para acceder a los datos del webhook
    const { action, data } = body; // Extraemos la acción y los datos del webhook

    if (!data || !data.id) {
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;
    const paymentStatus = action; // Estado del pago, por ejemplo, "payment.created", "payment.approved"

    console.log("Estado del pago recibido:", paymentStatus);

    // 📌 Realizamos una consulta a la API de Mercado Pago para obtener detalles adicionales del pago
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
      },
    });

    if (response.status !== 200) {
      return res.status(400).json({ error: "No se pudo obtener el estado del pago de Mercado Pago" });
    }

    const paymentData = response.data; // Datos completos del pago

    let estadoPedido;
    let coleccion;

    // 📌 Lógica para determinar el estado del pedido y la colección donde guardar
    if (paymentData.status === "approved") {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos"; // Guardamos en exito si el pago fue aprobado
    } else if (paymentData.status === "rejected") {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados"; // Guardamos en rechazados si el pago fue rechazado
    } else if (paymentData.status === "pending" || paymentStatus === "payment.created") {
      estadoPedido = "pago pendiente";
      coleccion = "pedidosPendientes"; // Guardamos en pendientes si el pago está pendiente o creado
    } else {
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    // 📌 Recoger la información del comprador y otros detalles del pago
    const comprador = paymentData.payer ? paymentData.payer.name || "desconocido" : "desconocido"; // Nombre del comprador
    const email = paymentData.payer ? paymentData.payer.email || "desconocido" : "desconocido"; // Email del comprador
    const precio = paymentData.transaction_amount || 0; // Monto total del pago
    const descripcion = paymentData.description || "Sin descripción"; // Descripción del producto

    // 📌 Guardar en la colección correspondiente en Firebase
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador: comprador,
      email: email,
      precio: precio,
      descripcion: descripcion,
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}`);

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
