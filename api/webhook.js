import { db } from "./firebaseAdmin.js";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { action, data } = req.body;
    if (!data?.id) return res.status(400).json({ error: "ID de pago no proporcionado" });

    const paymentId = data.id;

    // 🔹 Obtener datos del pago desde Mercado Pago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}` } }
    );

    const paymentData = response.data;
    const status = paymentData.status;
    const orderId = paymentData.external_reference || paymentData.metadata?.orderId || null;

    // 🔹 Determinar estado y colección
    let estadoPedido;
    if (status === "approved") estadoPedido = "pago completado";
    else if (status === "rejected") estadoPedido = "pago rechazado";
    else if (status === "pending" || action === "payment.created") estadoPedido = "pago pendiente";
    else return res.status(200).json({ message: "Webhook recibido, sin cambios" });

    // 🔹 Datos originales de cliente y envío
    let clienteOriginal = {}, envioOriginal = {};
    if (orderId) {
      const pedidoDoc = await db.collection("pedidos").doc(orderId).get();
      if (pedidoDoc.exists) {
        const pedidoData = pedidoDoc.data();
        clienteOriginal = pedidoData.cliente || {};
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

    // 🔹 Datos del comprador desde MP (fallback)
    const payer = paymentData.payer || {};
    const comprador = `${payer.first_name || clienteOriginal.name || ""} ${payer.last_name || ""}`.trim() || "Dato no disponible";
    const email = payer.email || clienteOriginal.email || "Dato no disponible";
    const dni = payer.identification?.number || clienteOriginal.dni || "Dato no disponible";
    const telefono = {
      area_code: clienteOriginal.phoneArea || payer.phone?.area_code || "Dato no disponible",
      number: clienteOriginal.phone || payer.phone?.number || "Dato no disponible",
      completo: clienteOriginal.phoneArea && clienteOriginal.phone
        ? `+${clienteOriginal.phoneArea} ${clienteOriginal.phone}`
        : "Dato no disponible",
    };

    // 🔹 Extraer costo de envío desde items
    let costoEnvio = 0;
    if (paymentData.items?.length) {
      const shippingItem = paymentData.items.find(item => item.title.toLowerCase().includes("costo de envío"));
      costoEnvio = shippingItem ? Number(shippingItem.unit_price) : 0;
    }

    // 🔹 Precios
    const precioProductos =
      paymentData.transaction_amount ||
      (paymentData.items?.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0) - costoEnvio);
    const precioTotal =
      paymentData.transaction_details?.total_paid_amount || precioProductos + costoEnvio || 0;

    // 🔹 Productos comprados
    let productosComprados = [];
    if (paymentData.metadata?.productos?.length) {
      productosComprados = paymentData.metadata.productos.map(p => ({
        title: p.nombre || "Producto sin nombre",
        cantidad: p.cantidad || 1,
        talle: p.talle || "Dato no disponible",
        precio: p.precio || 0,
      }));
    }

    // 🔹 Guardar en pedidosExitosos si pago completado
    if (estadoPedido === "pago completado") {
      await db.collection("pedidosExitosos").doc(paymentId).set({
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
    }

    // 🔹 Actualizar pedido original si existe
    if (orderId) {
      try {
        await db.collection("pedidos").doc(orderId).update({
          estado: estadoPedido,
          paymentId,
          actualizadoEn: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`⚠️ No se pudo actualizar el pedido original (${orderId}):`, err.message);
      }
    }

    // 🔹 Actualizar stock si pago completado
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
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
