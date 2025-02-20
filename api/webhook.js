import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta
import axios from "axios"; // Usaremos axios para hacer la consulta a la API de Mercado Pago

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN_PROD; // Usamos la variable de entorno de producción

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

    console.log("Estado del pago:", paymentStatus);

    // 📌 Consultar el estado real del pago en la API de Mercado Pago
    const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`, // Utilizamos el token de acceso para producción
      },
    });

    const paymentData = paymentResponse.data;
    const statusPago = paymentData.status; // status puede ser "approved", "pending", "rejected", etc.

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

    // Validar datos del comprador (nombre y email)
    const comprador = data.user_id || "desconocido"; // Si no existe user_id, asigna "desconocido"
    const precio = data.transaction_amount || 0; // Si no existe, asigna 0

    // 📌 Verificar si el pago tiene datos de payer (comprador)
    const payer = paymentData.payer || {};
    const nombre = payer.name || "desconocido"; // Si no existe el nombre, asigna "desconocido"
    const email = payer.email || "desconocido"; // Si no existe el email, asigna "desconocido"

    // 📌 Registrar el pago con detalles adicionales
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(), // La hora de Buenos Aires ya está ajustada
      comprador: comprador,
      precio: precio,
      email: email, // Se agrega el email
      nombre: nombre, // Se agrega el nombre
      descripcion: data.description || "Sin descripción", // Descripción de la compra (si existe)
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}`);
    
    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
