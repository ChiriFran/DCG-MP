import { db } from "./firebaseAdmin";
import fetch from "node-fetch";
import { Timestamp } from "firebase-admin/firestore";

export const config = {
  api: {
    bodyParser: false, // Desactiva el body parser de Vercel
  },
};

export default async function handler(req, res) {
  try {
    // Solo acepta método POST
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Leer el cuerpo de la petición (raw body)
    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", (err) => reject(err));
    });

    console.log("Webhook received:", rawBody);
    const event = JSON.parse(rawBody);

    // Validar que el evento tenga la información mínima
    if (!event || !event.data || !event.data.id) {
      console.error("Invalid event data:", event);
      return res.status(400).json({ message: "Invalid event data" });
    }

    // Se obtiene el payment ID enviado por Mercado Pago
    const paymentId = event.data.id;
    console.log("Processing payment ID:", paymentId);

    // Consultar el estado real del pago en Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mpResponse.ok) {
      console.error("Error fetching payment details from Mercado Pago");
      return res.status(500).json({ message: "Error fetching payment details" });
    }

    const paymentData = await mpResponse.json();
    console.log("Payment data:", paymentData);

    // Determinar el ID de la orden: se utiliza external_reference o, en su defecto, otro identificador
    let orderId = paymentData.external_reference;
    if (!orderId && paymentData.order && paymentData.order.id) {
      orderId = paymentData.order.id;
    }
    if (!orderId) {
      console.error("No order ID found in payment data");
      return res.status(400).json({ message: "No order ID in payment data" });
    }

    // Extraer datos relevantes del pago
    const status = paymentData.status; // "approved", "pending", "rejected", etc.
    const amount = paymentData.transaction_amount;
    const items = paymentData.additional_info?.items || [];
    const createdAt = paymentData.date_created
      ? Timestamp.fromDate(new Date(paymentData.date_created))
      : Timestamp.now();

    // Determinar en qué colección se guardará el pedido
    let targetCollection;
    if (status === "approved") {
      targetCollection = "pedidosExitosos";
    } else if (status === "pending") {
      targetCollection = "pedidosPendientes";
    } else {
      targetCollection = "pedidosRechazados";
    }

    // Datos del pedido que se guardarán en Firebase
    const orderData = {
      orderId,
      paymentId,
      status,
      amount,
      items,
      createdAt,
    };

    // Verificar en Firebase: eliminar el pedido de las otras colecciones si ya existía
    const collections = ["pedidosExitosos", "pedidosPendientes", "pedidosRechazados"];
    for (const col of collections) {
      if (col !== targetCollection) {
        const docRef = db.collection(col).doc(String(orderId));
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          console.log(`Deleting order ${orderId} from ${col}`);
          await docRef.delete();
        }
      }
    }

    // Registrar o actualizar el pedido en la colección destino
    await db.collection(targetCollection).doc(String(orderId)).set(orderData, { merge: true });
    console.log(`Order ${orderId} saved/updated in ${targetCollection}`);

    // Responder al webhook de Mercado Pago
    return res.status(200).json({ message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
