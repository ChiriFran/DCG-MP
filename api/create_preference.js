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
          currency_id: "ARS"
        })),
      
        payer: {
          name: shipping.name || "Jonh", // Nombre del comprador (valor por defecto)
          email: shipping.email || "Doe", // Email del comprador (valor por defecto)
          phone: {
            area_code: "54", // Código de área de Argentina (sin necesidad de que el usuario lo ingrese)
            number: shipping.phone || "12341234" // Número de teléfono del comprador (solo el número)
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
          mode: "me2", // Usar Mercado Envíos en el modo estándar
          local_pickup: false, // No es recogido en local
          dimensions: "30x30x30,1000", // Ajusta las dimensiones y peso si es necesario
          zip_code: "1706", // Código postal del vendedor (origen del envío)
          cost: 0, // Costo del envío (se calcula dinámicamente)
          options: {
            shipping_method: "standard" // Asegura que se utilice el servicio estándar de envío
          }
        },
      
        back_urls: {
          success: "https://dcgstore.vercel.app/#/BuySuccess",
          failure: "https://dcgstore.vercel.app/#/BuyFailure",
          pending: "https://dcgstore.vercel.app/#/BuyPending"
        },
      
        statement_descriptor: "DCGSTORE", // Nombre que aparece en el estado de cuenta del comprador
      
        auto_return: "approved" // Redirige automáticamente a la URL de éxito si la compra es aprobada
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