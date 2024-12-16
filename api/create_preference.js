import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  // Agrega las cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // Permite solicitudes desde cualquier dominio
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS"); // Métodos permitidos
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Cabeceras permitidas

  if (req.method === "POST") {
    try {
      const { items, shipping, orderId } = req.body; // Asegúrate de pasar `orderId` desde tu frontend

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
          currency_id: "ARS"
        })),

        payer: {
          name: shipping.name || "Jonh ", // Nombre del comprador (valor por defecto)
          email: shipping.email || "Doe", // Email del comprador (valor por defecto)
          phone: {
            area_code: shipping.phoneArea || "11",
            number: shipping.phone || "1234-1234"
          },
          address: {
            street_name: shipping.address || "Direccion", // Dirección obligatoria
            zip_code: shipping.zipCode || "0000", // Código postal
            street_number: Number(shipping.streetNumber) || 0, // Número de calle
            floor: shipping.floor || "", // Piso (opcional)
            apartment: shipping.apartment || "", // Departamento (opcional)
            city: shipping.city || "Ciudad", // Ciudad
            state_name: shipping.province || "Provincia", // Provincia/estado
            country: "AR" // País (obligatorio)
          }
        },

        shipments: {
          mode: "not_specified",
          cost: 5, // Costo fijo del envío en tu moneda (ARS en este caso)
          reciver_address: {
            street_name: shipping.address || "Direccion", // Dirección obligatoria
            street_number: Number(shipping.streetNumber) || 0,// Número de calle
            zip_code: shipping.zipCode || "0000" // Código postal
          }
        },

        back_urls: {
          success: "https://dcgstore.vercel.app/#/BuySuccess",
          failure: "https://dcgstore.vercel.app/#/BuyFailed",
          pending: "https://dcgstore.vercel.app/#/BuyPending",
        },

        statement_descriptor: "DCGSTORE",

        external_reference: orderId, // Aquí agregas el external_reference

        auto_return: "approved"
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