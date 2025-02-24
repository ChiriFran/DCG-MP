import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  // Agrega las cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "POST") {
    try {
      const { items, shipping, orderId } = req.body;

      if (!items || items.length === 0 || !shipping || !shipping.name || !shipping.address) {
        return res.status(400).json({ error: "Missing required data" });
      }

      const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

      // Crear el cuerpo de la preferencia con el talle de los productos
      const body = {
        items: items.map(({ title, quantity, unit_price, talle }) => ({
          title,
          quantity: Number(quantity),
          unit_price: Number(unit_price),
          currency_id: "ARS",
          description: talle ? `Talle: ${talle}` : "", // Incluir el talle en la descripción si existe
        })),
        payer: {
          name: shipping.name,
          email: shipping.email,
          phone: {
            area_code: shipping.phoneArea,
            number: shipping.phone,
          },
          address: {
            street_name: shipping.address,
            zip_code: shipping.zipCode,
            street_number: Number(shipping.streetNumber),
            floor: shipping.floor || "",
            apartment: shipping.apartment || "",
            city: shipping.city,
            state_name: shipping.province,
            country: "AR",
          },
        },
        shipments: {
          mode: "not_specified",
          cost: 1,
          receiver_address: {
            street_name: shipping.address,
            street_number: Number(shipping.streetNumber),
            zip_code: shipping.zipCode,
          },
        },
        back_urls: {
          success: "https://dcgstore.vercel.app/#/BuySuccess",
          failure: "https://dcgstore.vercel.app/#/BuyFailed",
          pending: "https://dcgstore.vercel.app/#/BuyPending",
        },
        statement_descriptor: "DCGSTORE",
        external_reference: orderId,
        auto_return: "approved",
      };

      const preference = new Preference(client);
      const result = await preference.create({ body });

      console.log(result);
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
