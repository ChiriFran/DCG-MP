import * as admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY); // Accede a la variable de entorno

if (!admin.apps.length) {
    admin.initializeApp({
        credential: cert(serviceAccount), // Usa la clave de servicio para inicializar Firebase
    });
}

const db = admin.firestore();  // Obtener Firestore desde firebase-admin

export default async function handler(req, res) {
    console.log("Cuerpo de la solicitud:", req.body);  // Aquí agregamos el log para ver el cuerpo

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
    } else if (req.method === "GET") {
        res.status(200).json({ message: "Este es el endpoint del webhook. Usa POST para recibir eventos de Mercado Pago." });
    } else {
        res.setHeader("Allow", ["POST", "GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
