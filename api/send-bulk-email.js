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

        await Promise.all(
            emails.map(async originalTo => {
                try {
                    // 🔹 HARD-CODE: todos los emails van a tu casilla de prueba -  const to = originalTo; DE PROD

                    const to = "info.dcgstore@gmail.com";

                    await resend.emails.send({
                        from: "Detroit Classic Gallery <onboarding@resend.dev>",
                        to,
                        subject,
                        html,
                    });

                    console.log(
                        `📧 Enviado a: ${to} (original: ${originalTo})`
                    );

                    enviados++;
                } catch (err) {
                    console.error(`❌ Error enviando a ${originalTo}:`, err);
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
