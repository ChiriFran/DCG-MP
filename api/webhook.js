import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import MercadoPago from 'mercadopago';

// Inicializar Firebase Admin SDK
initializeApp({
  credential: applicationDefault(), // Usa las credenciales predeterminadas para Vercel
});

const db = getFirestore();

// Inicializar MercadoPago SDK
MercadoPago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN_PROD);

// Función que maneja el webhook
export default async function handler(req, res) {
    if (req.method === "POST") {
        console.log("Webhook recibido:", req.body);
        try {
            // Recibe los datos del webhook de Mercado Pago
            const { data } = req.body;

            // Verifica la autenticidad del webhook (opcional si Mercado Pago incluye la firma)
            const webhookSecret = process.env.MP_WEBHOOK_SECRET;

            const signature = req.headers['x-mp-signature'];

            // Validación de firma
            if (!signature || signature !== webhookSecret) {
                console.error("Firma de webhook no válida.");
                return res.status(400).json({ error: "Firma inválida" });
            }

            // Verifica el estado del pago
            const paymentId = data.id;
            const paymentDetails = await MercadoPago.payment.findById(paymentId);

            if (!paymentDetails) {
                console.error(`No se pudo encontrar el pago con ID: ${paymentId}`);
                return res.status(404).json({ error: "Pago no encontrado" });
            }

            console.log("Detalles del pago:", paymentDetails);

            // Obtiene el estado del pago
            const paymentStatus = paymentDetails.status;
            let newStatus = "unknown";

            if (paymentStatus === "approved") {
                newStatus = "success";
            } else if (paymentStatus === "rejected") {
                newStatus = "failed";
            } else if (paymentStatus === "pending") {
                newStatus = "pending";
            }

            // Recuperar el ID del pedido y actualizar el estado en Firestore
            const orderId = data.external_reference;
            const orderRef = db.collection('pedidos').doc(orderId);

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
