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

        payer: {
          name: shipping.name || "N/A",
          email: shipping.email || "N/A",
          address: {
            street_name: shipping.address || "Sin dirección",
            zip_code: shipping.zipCode || "0000",
            street_number: Number(shipping.streetNumber) || 0,
            floor: shipping.floor || "",
            apartment: shipping.apartment || "",
            city: shipping.city || "Ciudad",
            state_name: shipping.province || "Provincia",
            country: shipping.country || "AR",
          },
        },

        shipments: {
          mode: "me2", // Obligatorio para envíos estándar o personalizados
          cost: 10000, // Costo del envío
          receiver_address: {
            zip_code: shipping.zipCode || "0000", // Código postal
            street_name: shipping.address || "Sin dirección", // Dirección
            street_number: Number(shipping.streetNumber) || 0, // Número de calle
            floor: shipping.floor || "", // Piso (opcional)
            apartment: shipping.apartment || "", // Departamento (opcional)
            city_name: shipping.city || "Ciudad", // Ciudad
            state_name: shipping.province || "Provincia", // Provincia
            country_name: shipping.country || "AR", // País (ISO 3166-1 alpha-2)
          },
        },

        back_urls: {
          success: "https://dcgstore.vercel.app/#/BuySuccess",
          failure: "https://dcgstore.vercel.app/#/BuyFailure",
          pending: "https://dcgstore.vercel.app/#/BuyPending",
        },

        auto_return: "approved",
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