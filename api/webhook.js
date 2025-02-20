import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("Método no permitido");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Cambiar esto de req.json() a req.body
    const body = req.body; // ✅ Utiliza req.body

    const { action, data } = body; // 🔹 Extrae la acción y los datos del webhook
    console.log("Webhook recibido:", body); // Registra el cuerpo del webhook

    if (!data || !data.id) {
      console.error("ID de pago no proporcionado");
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;
    const paymentStatus = action; // Puede ser "payment.created", "payment.updated", etc.
    console.log("ID de pago:", paymentId); // Log del paymentId

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
      console.error("Acción no válida:", paymentStatus);
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    // 📌 Guardar el estado del pedido en Firebase
    const docRef = await db.collection(coleccion).add({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      paymentId: paymentId, // Para hacer seguimiento con el ID de pago
    });

    console.log(`Pedido ${paymentId} guardado en la colección ${coleccion}`);
    console.log(`Documento ID: ${docRef.id}`); // Ver el ID del documento generado por Firebase

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
