import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const { emails, subject, html } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                error: "Lista de emails inválida"
            });
        }

        let enviados = 0;
        let fallados = 0;

        await Promise.all(
            emails.map(async (originalTo) => {
                try {
                    // Cambiar en producción
                    const to = "info.dcgstore@gmail.com";

                    await resend.emails.send({
                        from: "Detroit Classic Gallery <onboarding@resend.dev>",
                        to,
                        subject,
                        html,
                    });

                    enviados++;
                } catch (err) {
                    console.error("❌ Error enviando:", originalTo, err);
                    fallados++;
                }
            })
        );

        return res.status(200).json({
            success: true,
            enviados,
            fallados,
        });

    } catch (err) {
        console.error("❌ Error general en bulk email:", err);

        return res.status(500).json({
            error: "Error enviando emails"
        });
    }
}
