import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const { to, subject, html } = req.body;

        const response = await resend.emails.send({
            from: "Detroit Classic Gallery <onboarding@resend.dev>", // remitente de prueba
            to,
            subject,
            html,
        });

        console.log("📧 Email enviado a", to);
        return res.status(200).json({ success: true, response });
    } catch (err) {
        console.error("❌ Error enviando email:", err.response?.data || err);
        return res.status(500).json({ error: "Error enviando email", details: err });
    }
}
