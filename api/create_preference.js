import { Router } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const router = Router();

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX", // Reemplaza con tu token real
});

router.post("/", async (req, res) => {
  try {
    const { items, shipping } = req.body;

    if (!shipping || !shipping.name || !shipping.address) {
      return res.status(400).json({ error: "Missing shipping data" });
    }

    const body = {
      items: items.map((item) => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "ARS",
      })),
      back_urls: {
        success: "https://tu-app.vercel.app/checkout-success",
        failure: "https://tu-app.vercel.app/checkout-failure",
        pending: "https://tu-app.vercel.app/checkout-pending",
      },
      auto_return: "approved",
      payer: {
        name: shipping.name,
        address: {
          street_name: shipping.address,
        },
      },
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({ id: result.id });
  } catch (error) {
    res.status(500).json({ error: "Error al crear la preferencia." });
  }
});

export default router;
