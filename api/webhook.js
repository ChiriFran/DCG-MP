import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta
import axios from "axios"; // Usaremos axios para hacer la consulta a la API de Mercado Pago

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN; // Tu token de acceso

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Cambiar esto de req.json() a req.body
    const body = req.body; // ✅ Utiliza req.body

    const { action, data } = body; // 🔹 Extrae la acción y los datos del webhook

    if (!data || !data.id) {
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;
    const paymentStatus = action; // Puede ser "payment.created", "payment.updated", etc.

    // Mostrar el estado del pago recibido para depuración
    console.log("Estado del pago:", paymentStatus);

    // 📌 Consultar el estado real del pago en la API de Mercado Pago
    const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    const paymentData = paymentResponse.data;
    const statusPago = paymentData.status; // status puede ser "approved", "pending", "rejected", etc.

    // 📌 Determinar el estado del pedido en base al estado real del pago
    let estadoPedido;
    let coleccion;

    // 📌 Solo crear pedidos pendientes si el estado es "pending"
    if (statusPago === "approved") {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos"; // Guardar en la colección de pagos exitosos
    } else if (statusPago === "rejected") {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados"; // Guardar en la colección de pagos rechazados
    } else if (statusPago === "pending") {
      estadoPedido = "pago pendiente";
      coleccion = "pedidosPendientes"; // Solo guardamos en pendientes si el pago está pendiente
    } else {
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    // Validar datos del comprador
    const comprador = data.user_id || "desconocido"; // Si no existe user_id, asigna "desconocido"
    const precio = data.transaction_amount || 0; // Si no existe, asigna 0
    const email = (data.payer && data.payer.email) || "desconocido"; // Verificar si payer existe antes de acceder al email

    // 📌 Registrar el pago con detalles adicionales
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(), // La hora de Buenos Aires ya está ajustada
      comprador: comprador,
      precio: precio,
      email: email, // Se agrega el email
      descripcion: data.description || "Sin descripción", // Descripción de la compra (si existe)
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}`);

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
