import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  // Agrega las cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "POST") {
    try {
      const { items, shipping, storeZipCode } = req.body;

      if (!shipping || !shipping.name || !shipping.address || !shipping.zipCode) {
        return res.status(400).json({ error: "Missing shipping data" });
      }

      const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;

      const client = new MercadoPagoConfig({
        accessToken: mpAccessToken,
      });

      // Aquí configuramos los datos de envío, incluyendo la dirección de origen de la tienda (código postal)
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
          address: {
            street_name: shipping.address,
            zip_code: shipping.zipCode, // Código postal del cliente
          },
        },
        shipping: {
          zip_code: storeZipCode,  // Código postal de la tienda (1426)
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
