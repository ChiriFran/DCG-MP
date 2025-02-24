import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta
import axios from "axios"; // Para realizar consultas a la API de Mercado Pago

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const body = req.body;
    const { action, data } = body;

    if (!data || !data.id) {
      return res.status(400).json({ error: "ID de pago no proporcionado" });
    }

    const paymentId = data.id;
    const paymentStatus = action;

    console.log("Estado del pago recibido:", paymentStatus);

    // 📌 Obtener los detalles completos del pago desde la API de Mercado Pago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
        },
      }
    );

    if (response.status !== 200) {
      return res
        .status(400)
        .json({ error: "No se pudo obtener el estado del pago de Mercado Pago" });
    }

    const paymentData = response.data; // Datos completos del pago

    let estadoPedido;
    let coleccion;

    // 📌 Determinar el estado del pedido y en qué colección guardarlo
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

    // 📌 Recoger la información del comprador
    const comprador = paymentData.payer?.name || "desconocido";
    const email = paymentData.payer?.email || "desconocido";
    const precio = paymentData.transaction_amount || 0;

    // 📌 Extraer los productos comprados y el talle correspondiente
    const productosComprados =
      paymentData.additional_info?.items?.map((item) => {
        // Extraemos el talle directamente desde la descripción si está incluido
        const talle = item.description ? item.description.match(/talle(S|M|L|XL|XXL)/) : null;
        return {
          title: item.title,
          quantity: item.quantity,
          talle: talle ? talle[0] : null, // Se asigna el talle encontrado o null si no se encuentra
        };
      }) || [];

    console.log("Productos comprados:", productosComprados);

    // 📌 Guardar la orden en Firebase con los productos
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      precio,
      productos: productosComprados, // ✅ Guardamos los nombres de los productos
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion} con productos:`, productosComprados);

    // 📌 ACTUALIZAR STOCK
    if (estadoPedido === "pago completado") {
      for (const producto of productosComprados) {
        const stockRef = db.collection("stock").doc(producto.title); // Referencia al producto en la colección 'stock'
        const stockDoc = await stockRef.get();

        if (stockDoc.exists) {
          const stockData = stockDoc.data();

          // 📌 Actualizar la cantidad total
          const nuevaCantidadTotal = (stockData.cantidad || 0) + producto.quantity;
          await stockRef.update({ cantidad: nuevaCantidadTotal });

          // 📌 Actualizar la cantidad del talle correspondiente
          const talle = producto.talle;  // El talle ya debería estar en el formato adecuado (talleS, talleM, etc.)
          if (talle && stockData[talle] !== undefined) {
            const nuevaCantidadTalle = (stockData[talle] || 0) + producto.quantity;
            await stockRef.update({ [talle]: nuevaCantidadTalle });
            console.log(`Stock del talle ${talle} actualizado: ${producto.title} ahora tiene ${nuevaCantidadTalle} unidades.`);
          } else {
            console.warn(`Talle ${talle} no encontrado para ${producto.title}`);
          }

          console.log(`Stock total actualizado: ${producto.title} ahora tiene ${nuevaCantidadTotal} unidades.`);
        } else {
          console.warn(`Producto ${producto.title} no encontrado en la colección 'stock'.`);
        }
      }
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
