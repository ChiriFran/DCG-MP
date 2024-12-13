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
          name: shipping.name,
          email: shipping.email,
          address: {
            street_name: shipping.address,
            street_number: Number(shipping.streetNumber),
            zip_code: shipping.zip_code,
          },

          shipments: {
            mode: "custom",
            cost: 5000,
            receiver_address: {
              zip_code: shipping.zipCode,
              street_name: shipping.address,
              street_number: Number(shipping.streetNumber),
              floor: shipping.floor || "",
              apartment: shipping.apartment || "",
              city_name: shipping.city,
              state_name: shipping.province,
            },
          },

          bak_urls: {
            success: "https://dcgstore.vercel.app/#/BuySuccess",
            failure: "https://dcgstore.vercel.app/#/BuyFailure",
            pending: "https://dcgstore.vercel.app/#/BuyPending",
          },
          auto_return: "approved",
        },
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