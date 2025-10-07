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

    const comprador = paymentData.payer?.name || "desconocido";
    const email = paymentData.payer?.email || "desconocido";
    const precio = paymentData.transaction_amount || 0;

    // 🔹 Calcular el precio total incluyendo envío
    const precioProductos = paymentData.transaction_amount || 0;
    const costoEnvio = paymentData.shipments?.cost || 0;
    const precioTotal = precioProductos + costoEnvio;

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

    // Datos de envío
    const shippingData = paymentData.additional_info?.shipments || {};
    const direccion = shippingData.receiver_address?.street_name || "No especificada";
    const numero = shippingData.receiver_address?.street_number || "No especificado";
    const codigoPostal = shippingData.receiver_address?.zip_code || "No especificado";
    const ciudad = shippingData.receiver_address?.city?.name || "No especificada";
    const provincia = shippingData.receiver_address?.state?.name || "No especificada";
    const pais = shippingData.receiver_address?.country?.name || "No especificado";

    // Guardar pedido
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      precio,
      precioProductos, // 🔹 nuevo campo informativo
      costoEnvio,      // 🔹 nuevo campo informativo
      precioTotal,     // 🔹 nuevo campo informativo (productos + envío)
      productos: productosComprados,
      envio: { direccion, numero, codigoPostal, ciudad, provincia, pais },
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion}.`);

    // Actualizar stock con batch
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

      // Ejecutar batch
      await batch.commit();
      console.log("Stock actualizado con batch.");
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
