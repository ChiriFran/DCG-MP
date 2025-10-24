import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmail: helper universal para enviar emails
 * @param {string} to - destinatario
 * @param {string} subject - asunto del correo
 * @param {string} html - contenido HTML del correo
 */
export async function sendEmail({ to, subject, html }) {
    try {
        const response = await resend.emails.send({
            from: "no-reply@detroitclassicgallery.com",
            to,
            subject,
            html,
        });
        console.log("📧 Email enviado a", to);
        return response;
    } catch (err) {
        console.error("❌ Error enviando email:", err);
        throw err;
    }
}
