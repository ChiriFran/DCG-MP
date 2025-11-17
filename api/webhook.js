import { db } from "./firebaseAdmin.js";
import { sendEmail } from "./send-email.js";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { action, data } = req.body;

    if (!data || !data.id) {
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;

    // 🔹 Obtener info real del pago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}` } }
    );

    const paymentData = response.data;
    const status = paymentData.status;
    const orderId =
      paymentData.external_reference ||
      paymentData.metadata?.orderId ||
      null;

    console.log("🔔 Webhook recibido:", { paymentId, status, orderId });

    // ░░░ ESTADOS :::::::::::::::::::::::::::::::::::::::::::::::::::
    let estadoPedido = "";
    let coleccion = "";

    if (status === "approved") {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos";
    } else if (status === "rejected") {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados";
    } else if (status === "pending" || action === "payment.created") {
      estadoPedido = "pago pendiente";
      coleccion = "pedidosPendientes";
    } else {
      console.log("➡️ Estado no relevante, ignorado:", status);
      return res.status(200).json({ message: "Estado sin cambios" });
    }

    // ░░░ DATOS ORIGINALES :::::::::::::::::::::::::::::::::::::::::::::::::::
    let clienteOriginal = {};
    let envioOriginal = {};

    if (orderId) {
      const pedidoDoc = await db.collection("pedidos").doc(orderId).get();

      if (pedidoDoc.exists) {
        const pedido = pedidoDoc.data();
        clienteOriginal = pedido.cliente || {};

        envioOriginal = {
          street_name: clienteOriginal.address || "Dato no disponible",
          street_number: clienteOriginal.streetNumber || "Dato no disponible",
          floor: clienteOriginal.floor || "",
          apartment: clienteOriginal.apartment || "",
          zip_code: clienteOriginal.zipCode || "Dato no disponible",
          city: clienteOriginal.city || "Dato no disponible",
          province: clienteOriginal.province || "Dato no disponible",
          country: "AR",
        };
      }
    }

    // ░░░ PAYER :::::::::::::::::::::::::::::::::::::::::::::::::::
    const payer = paymentData.payer || {};

    const comprador =
      `${payer.first_name || clienteOriginal.name || ""} ${payer.last_name || ""
        }`.trim() || "Dato no disponible";

    const email =
      payer.email || clienteOriginal.email || "Dato no disponible";

    const dni =
      payer.identification?.number || clienteOriginal.dni || "Dato no disponible";

    const telefono = {
      area_code:
        clienteOriginal.phoneArea ||
        payer.phone?.area_code ||
        "Dato no disponible",

      number:
        clienteOriginal.phone ||
        payer.phone?.number ||
        "Dato no disponible",

      completo:
        clienteOriginal.phoneArea && clienteOriginal.phone
          ? `+${clienteOriginal.phoneArea} ${clienteOriginal.phone}`
          : "Dato no disponible",
    };

    // ░░░ ITEMS DE M.PAGO (100% confiable) :::::::::::::::::::::::::::::::::::
    let productosComprados = [];

    if (paymentData.items?.length) {
      productosComprados = paymentData.items
        .filter(
          (item) => !item.title.toLowerCase().includes("costo de envío")
        )
        .map((item) => ({
          title: item.title || "Producto sin nombre",
          cantidad: item.quantity || 1,
          talle: item.category_id || "No especificado",
          precio: item.unit_price || 0,
        }));
    }

    // ░░░ PRECIOS :::::::::::::::::::::::::::::::::::::::::::::::::::
    let costoEnvio = 0;
    const shippingItem = paymentData.items?.find((item) =>
      item.title.toLowerCase().includes("costo de envío")
    );
    if (shippingItem) costoEnvio = Number(shippingItem.unit_price || 0);

    const precioProductos = paymentData.transaction_amount || 0;

    const precioTotal =
      paymentData.transaction_details?.total_paid_amount ||
      precioProductos + costoEnvio ||
      0;

    // ░░░ GUARDAR EL PEDIDO :::::::::::::::::::::::::::::::::::::::::::::::::::
    await db.collection(coleccion).doc(`${paymentId}`).set({
      orderId,
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      dni,
      telefono,
      envio: envioOriginal,
      precioProductos,
      costoEnvio,
      precioTotal,
      productos: productosComprados,
    });

    console.log(`📦 Guardado en ${coleccion}:`, paymentId);

    // ░░░ ACTUALIZAR PEDIDO ORIGINAL :::::::::::::::::::::::::::::::::::::::::::::::::::
    if (orderId) {
      await db.collection("pedidos").doc(orderId).update({
        estado: estadoPedido,
        paymentId,
        actualizadoEn: new Date().toISOString(),
      });
      console.log("📄 Pedido original actualizado:", orderId);
    }

    // ░░░ SI ESTÁ APROBADO :::::::::::::::::::::::::::::::::::::::::::::::::::
    if (estadoPedido === "pago completado") {
      // ----- actualizar stock -----
      const batch = db.batch();

      for (const item of productosComprados) {
        const stockRef = db.collection("stock").doc(item.title);
        const stockDoc = await stockRef.get();

        if (stockDoc.exists) {
          const stock = stockDoc.data();
          const updateData = {
            cantidad: (stock.cantidad || 0) + item.cantidad,
          };

          if (item.talle && stock[item.talle] !== undefined) {
            updateData[item.talle] =
              (stock[item.talle] || 0) + item.cantidad;
          }

          batch.update(stockRef, updateData);
        }
      }

      await batch.commit();
      console.log("🧩 Stock actualizado correctamente.");

      // ----- enviar email -----
      if (email && email !== "Dato no disponible") {
        const productosHTML = productosComprados
          .map(
            (p) =>
              `<li>${p.title} - Talle: ${p.talle} - Cant: ${p.cantidad} - $${p.precio}</li>`
          )
          .join("");

        const html = `
          <h2>¡Gracias por tu compra, ${comprador}!</h2>
          <p>Tu pedido se procesó correctamente.</p>
          <ul>${productosHTML}</ul>
          <p>Total productos: $${precioProductos}</p>
          <p><strong>Total pagado: $${precioTotal}</strong></p>
        `;

        await sendEmail({
          to: email,
          subject: `Compra confirmada - Pedido ${orderId || paymentId}`,
          html,
        });

        console.log("📧 Email enviado a:", email);
      }
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
