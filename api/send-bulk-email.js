import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req) {
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Método no permitido" }),
            { status: 405 }
        );
    }

    try {
        const { emails, subject, html } = await req.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return new Response(
                JSON.stringify({ error: "Lista de emails inválida" }),
                { status: 400 }
            );
        }

        let enviados = 0;
        let fallados = 0;

        // Envío en paralelo (más rápido)
        await Promise.all(
            emails.map(async to => {
                try {
                    await resend.emails.send({
                        from: "Detroit Classic Gallery <onboarding@resend.dev>",
                        to,
                        subject,
                        html
                    });
                    enviados++;
                } catch (err) {
                    console.error("❌ Error enviando a:", to, err);
                    fallados++;
                }
            })
        );

        return new Response(
            JSON.stringify({
                success: true,
                enviados,
                fallados
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );

    } catch (e) {
        console.error("❌ Error general:", e);
        return new Response(
            JSON.stringify({ error: "Error enviando emails" }),
            { status: 500 }
        );
    }
}
