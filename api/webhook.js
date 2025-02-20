import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta

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

    if (paymentStatus.includes("payment.approved")) {
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

    // 📌 Agregar más datos al pedido
    const comprador = data.payer; // Información del comprador (según Mercado Pago)
    const detallesCompra = data.items; // Detalles de la compra (productos, cantidades, precios)
    const metodoPago = data.payment_method_id; // Método de pago (según Mercado Pago)

    // 📌 Guardar el estado del pedido en Firebase con más datos
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador: {
        nombre: comprador.name,
        email: comprador.email,
        telefono: comprador.phone,
      },
      detallesCompra: detallesCompra.map(item => ({
        producto: item.title,
        cantidad: item.quantity,
        precio: item.unit_price,
      })),
      metodoPago: metodoPago,
      fechaCompra: data.date_created, // Fecha de la compra (si está disponible)
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}`);

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
