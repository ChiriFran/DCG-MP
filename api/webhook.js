import { MercadoPagoConfig } from "mercadopago";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfigBack = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfigBack);
const db = getFirestore(app); // Firestore

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;
            const webhookSecret = process.env.MP_WEBHOOK_SECRET;

            // Configuración de Mercado Pago
            const client = new MercadoPagoConfig({
                accessToken: mpAccessToken,
            });

            const { data } = req.body;

            // Verificar que el webhook sea legítimo
            const isValidWebhook = await client.webhook.verify(req.headers, req.body, webhookSecret);
            if (!isValidWebhook) {
                console.error("Webhook inválido");
                return res.status(400).json({ error: "Invalid webhook" });
            }

            // Recuperar el estado del pago desde la API de Mercado Pago
            const paymentId = data.id;
            const paymentDetails = await client.payment.findById(paymentId);

            if (!paymentDetails) {
                console.error(`No se pudo encontrar el pago con ID: ${paymentId}`);
                return res.status(404).json({ error: "Pago no encontrado" });
            }

            // Verificar el estado del pago
            const paymentStatus = paymentDetails.status;

            // Actualizar el estado del pedido en Firebase
            const orderId = data.external_reference;
            const orderRef = db.collection('pedidos').doc(orderId);

            let newStatus = "unknown";
            if (paymentStatus === "approved") {
                newStatus = "success";
            } else if (paymentStatus === "rejected") {
                newStatus = "failed";
            } else if (paymentStatus === "pending") {
                newStatus = "pending";
            }

            await orderRef.update({
                webhook_status: newStatus,
                payment_id: paymentId,
                updated_at: new Date(),
            });

            console.log(`Pedido ${orderId} actualizado a estado: ${newStatus}`);

            res.status(200).json({ message: "Webhook procesado correctamente" });
        } catch (error) {
            console.error("Error al procesar el webhook:", error);
            res.status(500).json({ error: "Error al procesar el webhook." });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
