import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  const allowedOrigins = ["https://www.detroitclassicgallery.com"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://www.detroitclassicgallery.com");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "POST") {
    try {
      const { items, shipping, shippingCost, orderId } = req.body;

      if (!items || items.length === 0 || !shipping || !shipping.name || !shipping.address) {
        return res.status(400).json({ error: "Missing required data" });
      }

      const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD;
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

      // 🔹 Clonar items originales y agregar costo de envío como ítem adicional
      const mpItems = items.map(({ title, quantity, unit_price, talleSeleccionado }) => ({
        title,
        quantity: Number(quantity),
        unit_price: Number(unit_price),
        currency_id: "ARS",
        description: `Talle: ${talleSeleccionado || "No especificado"}`,
      }));

      if (shippingCost && Number(shippingCost) > 0) {
        mpItems.push({
          title: `Costo de envío - ${shipping.address}`,
          quantity: 1,
          unit_price: Number(shippingCost),
          currency_id: "ARS",
          description: `Envío a ${shipping.address}`,
        });
      }

      const body = {
        items: mpItems,
        payer: {
          name: shipping.name,
          email: shipping.email,
          ...(shipping.dni && {
            identification: { type: "DNI", number: shipping.dni },
          }),
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
          cost: 0, // 🔹 Lo manejamos como ítem, no aquí
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
        statement_descriptor: "DCGSTORE",
        external_reference: orderId,
        auto_return: "approved",
        metadata: {
          orderId,
          productos: items.map(({ title, quantity, unit_price, talleSeleccionado }) => ({
            nombre: title,
            talle: talleSeleccionado || "No especificado",
            cantidad: quantity,
            precio: unit_price,
          })),
          shippingCost: Number(shippingCost) || 0,
        },
      };

      const preference = new Preference(client);
      const result = await preference.create({ body });

      console.log("✅ Preferencia creada:", result.id);
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
