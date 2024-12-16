import { MercadoPagoConfig } from "mercadopago";
import { db } from '../firebase/config';

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;
            const webhookSecret = process.env.MP_WEBHOOK_SECRET; // La clave de seguridad del webhook que te dio Mercado Pago

            // Configuración de Mercado Pago
            const client = new MercadoPagoConfig({
                accessToken: mpAccessToken,
            });

            const { data } = req.body;

            // Verificar que el webhook sea legítimo
            const isValidWebhook = await client.webhook.verify(req.headers, req.body, webhookSecret);
            if (!isValidWebhook) {
                return res.status(400).json({ error: "Invalid webhook" });
            }

            // Recuperar el estado del pago desde la API de Mercado Pago
            const paymentId = data.id;
            const paymentDetails = await client.payment.findById(paymentId);

            // Aquí puedes verificar detalles del pago si lo necesitas
            const paymentStatus = paymentDetails.status; // Puede ser 'approved', 'pending', 'rejected'

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
                status: newStatus,
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
