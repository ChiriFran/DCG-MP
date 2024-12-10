import mercadopago from "mercadopago";

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN_PROD);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "POST") {
    try {
      const { items, shipping } = req.body;

      // Validación de datos de entrada
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items data is invalid or missing." });
      }
      if (!shipping || !shipping.name || !shipping.address) {
        return res.status(400).json({ error: "Missing shipping data." });
      }

      // Cuerpo de la preferencia
      const body = {
        items: items.map((item) => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "ARS",
        })),
        back_urls: {
          success: "https://dcgstore.vercel.app/",
          failure: "https://dcgstore.vercel.app/",
          pending: "https://dcgstore.vercel.app/",
        },
        auto_return: "approved",
        payer: {
          name: shipping.name,
          email: shipping.email,
          phone: {
            area_code: shipping.phone_area || "",
            number: shipping.phone_number || "",
          },
          address: {
            zip_code: shipping.zip_code || "N/A",
            street_name: shipping.address || "N/A",
            street_number: shipping.street_number || 0,
          },
        },
        shipments: {
          mode: "me2",
          dimensions: "30x30x30,1000",
          local_pickup: false,
          cost: null,
          receiver_address: {
            zip_code: shipping.zip_code || "N/A",
            street_name: shipping.address || "N/A",
            street_number: shipping.street_number || 0,
            floor: shipping.floor || "",
            apartment: shipping.apartment || "",
            city: shipping.city || "N/A",
            state_name: shipping.province || "N/A",
            country: "AR",
          },
        },
      };

      // Creación de la preferencia
      const preference = await mercadopago.preferences.create(body);
      res.status(200).json({ id: preference.response.id });
    } catch (error) {
      console.error("Error al crear la preferencia:", error);
      res.status(500).json({ error: "Error al crear la preferencia." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
