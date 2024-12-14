import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";

export default async function handler(req, res) {
  // Agrega las cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

      // Paso 1: Consultar el costo del envío usando la API de Mercado Envíos
      const shipmentData = {
        origin_zip_code: "1706", // Código postal del vendedor
        destination_zip_code: shipping.zipCode, // Código postal del comprador
        dimensions: "30x30x30,1000", // Dimensiones y peso del paquete
      };

      const getShippingCost = async () => {
        try {
          const response = await axios.post("https://api.mercadopago.com/ships/mercadopago/v1/shipments", shipmentData, {
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
            },
          });

          return response.data.cost; // Retorna el costo del envío
        } catch (error) {
          console.error("Error al obtener el costo del envío:", error);
          throw error;
        }
      };

      const shippingCost = await getShippingCost();

      // Paso 2: Crear la preferencia con el costo del envío calculado
      const body = {
        items: items.map((item) => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "ARS"
        })),

        payer: {
          name: shipping.name || "Jonh",
          email: shipping.email || "Doe",
          phone: {
            area_code: "5411",
            number: shipping.phone || "12341234"
          },
          address: {
            street_name: shipping.address || "Direccion",
            zip_code: shipping.zipCode || "0000",
            street_number: Number(shipping.streetNumber) || 0,
            floor: shipping.floor || "",
            apartment: shipping.apartment || "",
            city: shipping.city || "Ciudad",
            state_name: shipping.province || "Provincia",
            country: "AR"
          }
        },

        shipments: {
          mode: "me2",
          local_pickup: false,
          dimensions: "30x30x30,1000",
          zip_code: "1706",
          cost: shippingCost, // Costo calculado dinámicamente
          options: {
            shipping_method: "standard"
          }
        },

        back_urls: {
          success: "https://dcgstore.vercel.app/#/BuySuccess",
          failure: "https://dcgstore.vercel.app/#/BuyFailure",
          pending: "https://dcgstore.vercel.app/#/BuyPending"
        },

        statement_descriptor: "DCGSTORE",

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
