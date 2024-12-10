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
          success: "https://dcgstore.vercel.app/",
          failure: "https://dcgstore.vercel.app/",
          pending: "https://dcgstore.vercel.app/",
        },
        auto_return: "approved",
        payer: {
          name: shipping.name,
          email: shipping.email,
          phone: {
            area_code: shipping.phone_area,
            number: shipping.phone_number,
          },
          address: {
            zip_code: shipping.zip_code,
            street_name: shipping.address,
            street_number: shipping.street_number,
          },
        },
        shipments: {
          mode: "me2", // Configurar Mercado Envíos
          dimensions: "30x30x30,1000", // Dimensiones y peso del paquete (largo x ancho x alto, peso en gramos)
          local_pickup: false, // Indicar si está disponible el retiro en persona
          cost: null, // Deja que Mercado Pago calcule el costo
          free_methods: [], // Si deseas envíos gratuitos, configura los métodos aquí
          receiver_address: {
            zip_code: shipping.zip_code,
            street_name: shipping.address,
            street_number: shipping.street_number,
            floor: shipping.floor,
            apartment: shipping.apartment,
            city: shipping.city,
            state_name: shipping.province,
            country: "AR", // Código de país
          },
          origin: {
            zip_code: "1426", // Código postal de origen (tu depósito)
            state_name: "Buenos Aires", // Provincia del origen
            city_name: "CABA", // Ciudad del origen
          },
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