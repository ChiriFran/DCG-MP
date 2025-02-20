import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data || !data.id) {
      return res.status(400).json({ error: "Datos de webhook inválidos" });
    }

    const paymentId = data.id;

    console.log("Webhook recibido:", type, paymentId);

    // Llamada a la API de Mercado Pago para obtener más detalles del pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      throw new Error("Error al obtener el pago de Mercado Pago");
    }

    const paymentData = await mpResponse.json();
    const status = paymentData.status;

    console.log("Estado del pago:", status);

    // Actualizar Firebase según el estado del pago
    const pedidoRef = db.collection("pedidos").doc(paymentId);
    
    if (status === "approved") {
      await pedidoRef.update({
        estado: "pago completado",
        fechaPago: new Date(),
      });

      await db.collection("pedidosExitosos").doc(paymentId).set({
        estado: "pago completado",
        fechaHora: new Date(),
      });
    } else if (status === "rejected") {
      await pedidoRef.update({ estado: "pago rechazado" });

      await db.collection("pedidosRechazados").doc(paymentId).set({
        estado: "pago rechazado",
        fechaHora: new Date(),
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error en el webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
