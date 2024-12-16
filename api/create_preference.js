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
          name: shipping.name || "Jonh",
          email: shipping.email || "Doe",
          phone: {
            area_code: shipping.phoneArea || "11",
            number: shipping.phone || "1234-1234",
          },
          address: {
            street_name: shipping.address || "Direccion",
            zip_code: shipping.zipCode || "0000",
            street_number: Number(shipping.streetNumber) || 0,
            floor: shipping.floor || "",
            apartment: shipping.apartment || "",
            city: shipping.city || "Ciudad",
            state_name: shipping.province || "Provincia",
            country: "AR",
          },
        },
        shipments: {
          mode: "not_specified",
          cost: 100,
          reciver_address: {
            street_name: shipping.address || "Direccion",
            street_number: Number(shipping.streetNumber) || 0,
            zip_code: shipping.zipCode || "0000",
          },
        },
        back_urls: {
          success: "https://dcgstore.vercel.app/#/BuySuccess",
          failure: "https://dcgstore.vercel.app/#/BuyFailed",
          pending: "https://dcgstore.vercel.app/#/BuyPending",
        },
        statement_descriptor: "DCGSTORE",
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [
            { id: "pagofacil" },
            { id: "rapipago" },
          ],
        },
        auto_return: "approved",
        external_reference: orderId,  // Aquí pasas el ID de Firebase
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