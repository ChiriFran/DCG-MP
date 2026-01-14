import { db } from "./firebaseAdmin.js";
import { sendEmail } from "./send-email.js";
import axios from "axios";

export default async function handler(req, res) {
  console.log("🔔 Webhook iniciado...");
  console.log("🔗 Query:", req.query);
  console.log("📩 Content-Type:", req.headers["content-type"]);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Parseo seguro del body
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    console.log("📨 Body recibido:", JSON.stringify(body, null, 2));

    // Obtener paymentId de todas las formas posibles
    const paymentId = body?.data?.id || body?.id || req.query?.id;

    if (!paymentId) {
      console.log("❌ Webhook sin paymentId:", body, req.query);
      return res.status(200).send("Sin paymentId");
    }

    if (!process.env.MP_ACCESS_TOKEN_PROD) {
      console.error("❌ MP_ACCESS_TOKEN_PROD no definido");
      return res.status(500).json({ error: "Falta token MP" });
    }

    // Consultar Mercado Pago
    let paymentData;
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
          },
        }
      );
      paymentData = response.data;
    } catch (err) {
      console.error("❌ Error consultando MP:", err.response?.data || err);
      return res.status(500).json({ error: "Error consultando MP" });
    }

    const status = paymentData.status;
    const orderId =
      paymentData.external_reference || paymentData.metadata?.orderId || null;

    console.log("📌 Datos del pago:", { paymentId, status, orderId });

    // Ignorar estados intermedios
    if (status !== "approved" && status !== "rejected") {
      console.log("ℹ️ Estado intermedio ignorado:", status);
      return res.status(200).send("Estado intermedio");
    }

    // Clasificación
    let estadoPedido = "";
    let coleccion = "";

    if (status === "approved") {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos";
    } else {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados";
    }

    // Duplicados inteligentes
    const existingDoc = await db
      .collection(coleccion)
      .doc(`${paymentId}`)
      .get();

    if (existingDoc.exists) {
      console.log("⚠️ Webhook duplicado detectado:", paymentId);

      if (orderId) {
        const pedidoRef = db.collection("pedidos").doc(orderId);
        const pedidoSnap = await pedidoRef.get();

        if (pedidoSnap.exists) {
          const estadoActual = pedidoSnap.data().estado;

          if (estadoActual !== estadoPedido) {
            console.log(
              "🔧 Pedido con estado incorrecto, reparando:",
              estadoActual,
              "→",
              estadoPedido
            );

            await pedidoRef.update({
              estado: estadoPedido,
              paymentId,
              actualizadoEn: new Date().toISOString(),
            });

            return res.status(200).json({
              message: "Duplicado pero pedido reparado",
            });
          }
        }
      }

      console.log("✅ Duplicado válido, ya estaba correcto");
      return res
        .status(200)
        .json({ message: "Duplicado ignorado (ya correcto)" });
    }

    // Pedido original
    let clienteOriginal = {};
    let envioOriginal = {};

    if (orderId) {
      try {
        const pedidoDoc = await db.collection("pedidos").doc(orderId).get();
        if (pedidoDoc.exists) {
          clienteOriginal = pedidoDoc.data().cliente || {};
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
      } catch (err) {
        console.error("❌ Error leyendo pedido original:", err);
      }
    }

    // Payer
    const payer = paymentData.payer || {};
    const comprador =
      `${payer.first_name || clienteOriginal.name || ""} ${
        payer.last_name || ""
      }`.trim() || "Dato no disponible";
    const email = payer.email || clienteOriginal.email || "Dato no disponible";
    const dni =
      payer.identification?.number ||
      clienteOriginal.dni ||
      "Dato no disponible";

    const telefono = {
      area_code:
        clienteOriginal.phoneArea ||
        payer.phone?.area_code ||
        "Dato no disponible",
      number:
        clienteOriginal.phone || payer.phone?.number || "Dato no disponible",
      completo:
        clienteOriginal.phoneArea && clienteOriginal.phone
          ? `+${clienteOriginal.phoneArea} ${clienteOriginal.phone}`
          : "Dato no disponible",
    };

    // Productos
    let productosComprados = [];

    if (
      Array.isArray(paymentData.metadata?.productos) &&
      paymentData.metadata.productos.length
    ) {
      productosComprados = paymentData.metadata.productos
        .filter((item) => !item.title?.toLowerCase().includes("envío"))
        .map((item) => ({
          title: item.title || "Producto sin nombre",
          cantidad: Number(item.quantity) || 1,
          talle: item.talle || item.category_id || "No especificado",
          precio: Number(item.unit_price) || 0,
        }));
    } else if (Array.isArray(paymentData.additional_info?.items)) {
      productosComprados = paymentData.additional_info.items
        .filter((item) => !item.title?.toLowerCase().includes("envío"))
        .map((item) => {
          const title = item.title || "";
          const talleMatch = title.match(/Talle:\s*([A-Za-z0-9]+)/i);
          const cantidadMatch = title.match(/Unidades:\s*(\d+)/i);
          return {
            title: title.split(" - Talle:")[0] || "Producto sin nombre",
            talle: talleMatch ? talleMatch[1] : "No especificado",
            cantidad: cantidadMatch
              ? Number(cantidadMatch[1])
              : Number(item.quantity) || 1,
            precio: Number(item.unit_price) || 0,
          };
        });
    }

    // Precios
    const costoEnvio = Number(paymentData.metadata?.shippingCost || 0);
    const precioProductos = paymentData.transaction_amount || 0;
    const precioTotal =
      paymentData.transaction_details?.total_paid_amount ||
      precioProductos + costoEnvio ||
      0;

    // Guardar
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

    console.log(`📁 Guardado en ${coleccion}:`, paymentId);

    // Actualizar pedido original
    if (orderId) {
      await db.collection("pedidos").doc(orderId).update({
        estado: estadoPedido,
        paymentId,
        actualizadoEn: new Date().toISOString(),
      });
      console.log("📄 Pedido original actualizado:", orderId);
    }

    // Si aprobado: stock + mail
    if (estadoPedido === "pago completado") {
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
            updateData[item.talle] = (stock[item.talle] || 0) + item.cantidad;
          }
          batch.update(stockRef, updateData);
        }
      }

      await batch.commit();
      console.log("🧩 Stock actualizado.");

      if (email && email !== "Dato no disponible") {
        const productosHTML = productosComprados
          .map(
            (p) =>
              `<li>${p.title} - Talle: ${p.talle} - Cant: ${p.cantidad} - $${p.precio}</li>`
          )
          .join("");

        const html = `
          <h2>¡Gracias por tu compra, ${comprador}!</h2>
          <ul>${productosHTML}</ul>
          <p>Total: $${precioTotal}</p>
        `;

        await sendEmail({
          to: email,
          subject: `Compra confirmada - Pedido ${orderId || paymentId}`,
          html,
        });

        console.log("📧 Email enviado a:", email);
      }
    }

    return res.status(200).json({
      message: `Pedido actualizado: ${estadoPedido}`,
    });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
