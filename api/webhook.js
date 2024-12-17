// Desactiva el body parser en Vercel para manejar el webhook correctamente
export const config = {
    api: {
      bodyParser: false, // Desactiva el body parser de Vercel
    },
  };
  
  export default async function handler(req, res) {
    if (req.method === "POST") {
      try {
        // Log para verificar que el webhook llegó correctamente
        console.log("Webhook received:", req.body);
  
        // Si es necesario, puedes verificar el tipo de evento, por ejemplo:
        if (req.body.event === "payment_approved") {
          // Aquí procesas lo que debe ocurrir cuando un pago es aprobado
          console.log("Payment Approved:", req.body);
          
          // Puedes actualizar el estado en tu base de datos o realizar otras acciones necesarias.
        } else {
          console.log("Other event received:", req.body.event);
        }
  
        // Responde con 200 para confirmar que el webhook se procesó correctamente
        return res.status(200).send("Webhook processed");
  
      } catch (error) {
        console.error("Error processing webhook:", error);
        // En caso de error, responder con 500
        return res.status(500).send("Error processing webhook");
      }
    } else {
      // Responde con 405 si la solicitud no es POST
      res.status(405).send("Method Not Allowed");
    }
  }
  
  