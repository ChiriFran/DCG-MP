import { db } from "./firebaseAdmin.js";
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
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}` } }
    );

    const paymentData = response.data;
    const status = paymentData.status;

    let estadoPedido, coleccion;
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
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    // 🧾 Datos del comprador
    const payer = paymentData.payer || {};
    const comprador = `${payer.first_name || ""} ${payer.last_name || ""}`.trim() || "Dato no disponible";
    const email = payer.email || "Dato no disponible";
    const dni = payer.identification?.number || "Dato no disponible";

    // 📞 Teléfono (busca en varias fuentes)
    const phone =
      payer.phone?.number ||
      paymentData.additional_info?.payer?.phone?.number ||
      null;
    const areaCode =
      payer.phone?.area_code ||
      paymentData.additional_info?.payer?.phone?.area_code ||
      null;
    const telefono = phone
      ? {
        area_code: areaCode || "Dato no disponible",
        number: phone || "Dato no disponible",
        completo: `${areaCode ? "+" + areaCode + " " : ""}${phone}`,
      }
      : {
        area_code: "Dato no disponible",
        number: "Dato no disponible",
        completo: "Dato no disponible",
      };

    // 💰 Precios reales desde la API
    const precioProductos = paymentData.transaction_amount || 0;
    const costoEnvio = paymentData.shipments?.cost || 0;
    const precioTotal =
      paymentData.transaction_details?.total_paid_amount ||
      precioProductos + costoEnvio ||
      0;

    // 🚚 Dirección de envío real
    const envioData = paymentData.shipments?.receiver_address || {};
    const envio = {
      street_name: envioData.street_name || "Dato no disponible",
      street_number: envioData.street_number || "Dato no disponible",
      zip_code: envioData.zip_code || "Dato no disponible",
      city: envioData.city?.name || "Dato no disponible",
      province: envioData.state?.name || "Dato no disponible",
      country: envioData.country?.name || "Dato no disponible",
    };

    // 🧳 Productos comprados
    let productosComprados = [];

    // ✅ 1. Prioridad: leer desde metadata (preferencia)
    if (paymentData.metadata?.productos?.length) {
      productosComprados = paymentData.metadata.productos.map((p) => ({
        title: p.nombre || "Producto sin nombre",
        cantidad: p.cantidad || 1,
        talle: p.talle || "Dato no disponible",
        precio: p.precio || 0,
      }));
    } else {
      // 🔄 2. Fallback: extraer desde additional_info si no hay metadata
      productosComprados =
        paymentData.additional_info?.items?.map((item) => {
          const match = item.title.match(/^(.*?) - Talle: (.*?) - Unidades: (\d+)$/);
          if (!match)
            return {
              title: item.title || "Producto sin nombre",
              cantidad: item.quantity || 1,
              talle: "Dato no disponible",
            };
          const nombre = match[1].trim();
          const talle = match[2] === "null" ? "Dato no disponible" : match[2].trim();
          const cantidad = parseInt(match[3], 10);
          return { title: nombre, talle, cantidad };
        }) || [
          {
            title: "Sin productos",
            cantidad: 0,
            talle: "Dato no disponible",
          },
        ];
    }

    // 📦 Guardar pedido en Firebase
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      dni,
      telefono,
      envio,
      precioProductos,
      costoEnvio,
      precioTotal,
      productos: productosComprados,
    });

    console.log(`✅ Pedido ${paymentId} guardado en ${coleccion}.`);

    // 🔄 Actualizar stock solo si el pago fue aprobado
    if (estadoPedido === "pago completado") {
      const batch = db.batch();
      for (const item of productosComprados) {
        const stockRef = db.collection("stock").doc(item.title);
        const stockDoc = await stockRef.get();
        if (stockDoc.exists) {
          const stockData = stockDoc.data();
          const updateData = { cantidad: (stockData.cantidad || 0) + item.cantidad };
          if (item.talle && stockData[item.talle] !== undefined) {
            updateData[item.talle] = (stockData[item.talle] || 0) + item.cantidad;
          }
          batch.update(stockRef, updateData);
        }
      }
      await batch.commit();
      console.log("🧩 Stock actualizado.");
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
