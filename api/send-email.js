import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Esta función se puede llamar desde el webhook
export async function sendEmail({ to, subject, html }) {
    try {
        // 🔹 Modo prueba: todos los emails van a tu casilla
        to = "info.dcgstore@gmail.com";

        const response = await resend.emails.send({
            from: "Detroit Classic Gallery <onboarding@resend.dev>",
            to,
            subject,
            html,
        });

        console.log("📧 Email enviado correctamente a", to);
        return response;
    } catch (err) {
        console.error("❌ Error enviando email:", err.response?.data || err);
        throw err;
    }
}

// ❗ Mantengo tu handler original por si usás /api/send-email
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const { to, subject, html } = req.body;

        const response = await sendEmail({ to, subject, html });

        return res.status(200).json({ success: true, response });
    } catch (error) {
        return res.status(500).json({ error: "Error enviando email" });
    }
}
