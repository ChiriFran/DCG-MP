import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

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
    const status = event.data.status;
    const timestamp = admin.firestore.Timestamp.now();

    // Registro dependiendo del estado
    const orderRef = db.collection(
      status === "approved" ? "pedidosExitosos" : status === "rejected" ? "pedidosRechazados" : "pedidosPendientes"
    ).doc(paymentId);

    await orderRef.set(
      {
        estado: status === "approved" ? "pago completado" : status === "rejected" ? "pago rechazado" : "pendiente",
        fechaHora: timestamp,
        status: status,
      },
      { merge: true }
    );

    console.log(`Pago con ID: ${paymentId}, Estado: ${status}`);

    return res.status(200).json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

