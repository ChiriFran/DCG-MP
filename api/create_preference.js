import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  // Agrega las cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // Permite solicitudes desde cualquier dominio
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS"); // Métodos permitidos
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Cabeceras permitidas

  if (req.method === "POST") {
    try {
      const { items, shipping } = req.body;

      if (!shipping || !shipping.name || !shipping.address) {
        return res.status(400).json({ error: "Missing shipping data" });
      }

      const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;

      const client = new MercadoPagoConfig({
        accessToken: mpAccessToken,
      });

      const body = {
        items: items.map((item) => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "ARS",
        })),
        back_urls: {
          success: "https://dcgstore.vercel.app/#/Success",
          failure: "https://dcgstore.vercel.app/#/Failure",
          pending: "https://dcgstore.vercel.app/#/Pending",
        },
        auto_return: "approved",
        payer: {
          name: shipping.name || "N/A", // Nombre del comprador (valor por defecto)
          email: shipping.email || "N/A", // email del comprador (valor por defecto)
          address: {
            street_name: shipping.address || "Sin dirección", // Dirección obligatoria
            zip_code: shipping.zipCode || "0000",
            street_name: shipping.address || "Sin dirección",
            street_number: Number(shipping.streetNumber) || 0,
            floor: shipping.floor || "",
            apartment: shipping.apartment || "",
            city: shipping.city || "Ciudad",
            state_name: shipping.province || "Provincia",
            country: shipping.country || "Argentina", // Código de país obligatorio
          },
        },
        shipments: {
          mode: "cost",  // Puede ser "free" si el envío es gratis
          type: "standard",  // El tipo de envío, puede ser "standard" o "express"
          cost: 10000,  // Costo del envío
        },
        metadata: {
          comments: shipping.comments,
        }
      };


      const preference = new Preference(client);
      const result = await preference.create({ body });

      console.log(result); // Log de la respuesta de Mercado Pago
      res.status(200).json({ id: result.id });
    } catch (error) {
      console.error("Error al crear la preferencia:", error);
      res.status(500).json({ error: "Error al crear la preferencia." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}