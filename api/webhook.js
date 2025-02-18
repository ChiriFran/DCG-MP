import { db } from "../../firebaseAdmin";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Leer el cuerpo del evento
    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => resolve(data));
      req.on("error", (err) => reject(err));
    });

    console.log("Webhook received:", rawBody);
    const event = JSON.parse(rawBody);

    if (!event || !event.data || !event.data.id) {
      console.error("Invalid event data:", event);
      return res.status(400).json({ message: "Invalid event data" });
    }

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

    const orderId = paymentData.order.id;
    const status = paymentData.status; // "approved", "pending", "rejected"
    const amount = paymentData.transaction_amount;
    const items = paymentData.additional_info.items;
    const createdAt = paymentData.date_created;

    let collectionName;
    if (status === "approved") {
      collectionName = "pedidosExitosos";
    } else if (status === "pending") {
      collectionName = "pedidosPendientes";
    } else {
      collectionName = "pedidosRechazados";
    }

    // Guardar en Firebase
    await db.collection(collectionName).doc(String(orderId)).set({
      orderId,
      paymentId,
      status,
      amount,
      items,
      createdAt,
    });

    console.log(`Order ${orderId} saved in ${collectionName}`);
    return res.status(200).json({ message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
