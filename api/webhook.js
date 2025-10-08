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
    const paymentStatus = action;

    console.log("Estado del pago recibido:", paymentStatus);

    // Obtener detalles del pago desde Mercado Pago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}` } }
    );

    if (response.status !== 200) {
      return res.status(400).json({ error: "No se pudo obtener el estado del pago" });
    }

    const paymentData = response.data;

    let estadoPedido;
    let coleccion;

    if (paymentData.status === "approved") {
      estadoPedido = "pago completado";
      coleccion = "pedidosExitosos";
    } else if (paymentData.status === "rejected") {
      estadoPedido = "pago rechazado";
      coleccion = "pedidosRechazados";
    } else if (paymentData.status === "pending" || paymentStatus === "payment.created") {
      estadoPedido = "pago pendiente";
      coleccion = "pedidosPendientes";
    } else {
      return res.status(200).json({ message: "Webhook recibido, sin cambios" });
    }

    const comprador = paymentData.payer?.name || "Desconocido";
    const email = paymentData.payer?.email || "No especificado";
    const precio = paymentData.transaction_amount || 0;

    // 🔹 Calcular el precio total incluyendo envío
    const precioProductos = paymentData.transaction_amount || 0;
    const costoEnvio = paymentData.shipments?.cost || 0;
    const precioTotal = precioProductos + costoEnvio;

    // 🔹 Datos del teléfono (con fallback seguro)
    const phoneData = paymentData.payer?.phone || {};
    const phone = {
      area_code: phoneData.area_code || "No especificado",
      number: phoneData.number || "No especificado",
      completo:
        phoneData.area_code && phoneData.number
          ? `+${phoneData.area_code} ${phoneData.number}`
          : "No especificado",
    };

    // 🔹 Datos completos del address (con fallback)
    const addressData = paymentData.payer?.address || {};
    const address = {
      street_name: addressData.street_name || "No especificado",
      street_number: addressData.street_number || "No especificado",
      zip_code: addressData.zip_code || "No especificado",
      floor: addressData.floor || "No especificado",
      apartment: addressData.apartment || "No especificado",
      city: addressData.city || "No especificado",
      state_name: addressData.state_name || "No especificado",
      country: addressData.country || "No especificado",
    };

    // Extraer productos: nombre, talle y cantidad
    const productosComprados =
      paymentData.additional_info?.items?.map((item) => {
        const match = item.title.match(/^(.*?) - Talle: (.*?) - Unidades: (\d+)$/);
        if (!match) return { title: item.title, cantidad: 1, talle: null };

        const nombre = match[1].trim();
        const talle = match[2] === "null" ? null : match[2].trim();
        const cantidad = parseInt(match[3], 10);

        return { title: nombre, talle, cantidad };
      }) || [];

    console.log("Productos comprados:", productosComprados);

    // 🔹 Datos de envío adicionales desde shipments
    const shippingData = paymentData.additional_info?.shipments || {};
    const direccionEnvio = {
      street_name: shippingData.receiver_address?.street_name || "No especificado",
      street_number: shippingData.receiver_address?.street_number || "No especificado",
      zip_code: shippingData.receiver_address?.zip_code || "No especificado",
      city: shippingData.receiver_address?.city?.name || "No especificado",
      province: shippingData.receiver_address?.state?.name || "No especificado",
      country: shippingData.receiver_address?.country?.name || "No especificado",
    };

    // 🔹 Guardar pedido con toda la información
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      telefono: phone, // 🔹 teléfono completo y dividido
      address,         // 🔹 datos de dirección del payer
      envio: direccionEnvio, // 🔹 datos de envío del pedido
      precio,
      precioProductos,
      costoEnvio,
      precioTotal,
      productos: productosComprados,
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}.`);

    // 🔹 Actualizar stock solo si fue exitoso
    if (estadoPedido === "pago completado") {
      const batch = db.batch();

      for (const item of productosComprados) {
        const nombreProducto = item.title;
        const talle = item.talle;
        const cantidadComprada = item.cantidad;

        const stockRef = db.collection("stock").doc(nombreProducto);
        const stockDoc = await stockRef.get();

        if (stockDoc.exists) {
          const stockData = stockDoc.data();
          const updateData = { cantidad: (stockData.cantidad || 0) + cantidadComprada };

          if (talle && stockData[talle] !== undefined) {
            updateData[talle] = (stockData[talle] || 0) + cantidadComprada;
          }

          batch.update(stockRef, updateData);
          console.log(
            `Preparado para actualizar: ${nombreProducto}, cantidad total ${updateData.cantidad}` +
            (talle ? `, talle ${talle} ${updateData[talle]}` : "")
          );
        } else {
          console.warn(`Producto ${nombreProducto} no encontrado en stock.`);
        }
      }

      await batch.commit();
      console.log("Stock actualizado con batch.");
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}