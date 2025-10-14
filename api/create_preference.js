import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  const allowedOrigins = ["https://www.detroitclassicgallery.com"];
  const origin = req.headers.origin;

  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(origin)
      ? origin
      : "https://www.detroitclassicgallery.com"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "POST") {
    try {
      const { items, shipping, shippingCost = 0, orderId } = req.body;

      if (!orderId) return res.status(400).json({ error: "Falta orderId" });
      if (!shipping?.name || !shipping?.address)
        return res.status(400).json({ error: "Faltan datos de envío" });

      const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN_PROD,
      });

      const mpItems = items.map((p) => ({
        title: p.title,
        quantity: Number(p.quantity),
        unit_price: Number(p.unit_price),
        currency_id: "ARS",
        description: p.description || "",
      }));

      if (shippingCost > 0) {
        mpItems.push({
          title: `Costo de envío - ${shipping.city || "Zona"}`,
          quantity: 1,
          unit_price: Number(shippingCost),
          currency_id: "ARS",
        });
      }

      const body = {
        items: mpItems,
        payer: {
          name: shipping.name,
          email: shipping.email,
          identification: { type: "DNI", number: shipping.dni },
          phone: {
            area_code: shipping.phoneArea,
            number: shipping.phone,
          },
          address: {
            street_name: shipping.address,
            street_number: Number(shipping.streetNumber),
            zip_code: shipping.zipCode,
            city: shipping.city,
            state_name: shipping.province,
          },
        },
        shipments: {
          mode: "not_specified",
          cost: 0,
          receiver_address: {
            street_name: shipping.address,
            street_number: Number(shipping.streetNumber),
            zip_code: shipping.zipCode,
          },
        },
        back_urls: {
          success: "https://www.detroitclassicgallery.com/#/BuySuccess",
          failure: "https://www.detroitclassicgallery.com/#/BuyFailed",
          pending: "https://www.detroitclassicgallery.com/#/BuyPending",
        },
        external_reference: orderId,
        auto_return: "approved",
        statement_descriptor: "DCGSTORE",
        metadata: {
          orderId,
          shipping,
          productos: items,
          shippingCost,
        },
      };

      const preference = new Preference(client);
      const result = await preference.create({ body });

      console.log(`✅ Preferencia creada: ${result.id} para pedido ${orderId}`);
      res.status(200).json({ id: result.id });
    } catch (error) {
      console.error("❌ Error al crear preferencia:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
