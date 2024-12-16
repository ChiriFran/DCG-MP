import { MercadoPagoConfig } from "mercadopago";
import { db } from '../firebase/config';

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;
            const webhookSecret = process.env.MP_WEBHOOK_SECRET; // La clave de seguridad del webhook

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

            // Verificar detalles del pago
            const paymentStatus = paymentDetails.status; // Puede ser 'approved', 'pending', 'rejected'

            // Actualizar el estado del pedido en Firebase
            const orderId = data.external_reference; // El ID de tu pedido
            const orderRef = db.collection('pedidos').doc(orderId);

            let newWebhookStatus = "unknown"; // Valor por defecto

            if (paymentStatus === "approved") {
                newWebhookStatus = "success";
            } else if (paymentStatus === "rejected") {
                newWebhookStatus = "failed";
            } else if (paymentStatus === "pending") {
                newWebhookStatus = "pending";
            }

            // Actualizamos el estado del pedido con el nuevo campo 'webhook_status'
            await orderRef.update({
                webhook_status: newWebhookStatus, // Aquí creamos el campo 'webhook_status'
                payment_id: paymentId,
                updated_at: new Date(),
            });

            console.log(`Pedido ${orderId} actualizado a estado: ${newWebhookStatus}`);

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
