import { db } from "./firebaseAdmin.js"; // Asegúrate de que la ruta es correcta
import axios from "axios"; // Para realizar consultas a la API de Mercado Pago

// Función que maneja el webhook de Mercado Pago
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

    // 📌 Extraer los productos comprados con talles
    const productosComprados =
      paymentData.additional_info?.items?.map((item) => {
        const talle = item.attributes?.find((attr) => attr.id === "SIZE")?.value_name || "No especificado";
        return {
          title: item.title.split(" - Talle: ")[0], // Nombre del producto sin el talle
          talle: talle !== "No especificado" ? talle : null, // Si no se especifica, ponemos null
          cantidad: Number(item.quantity) || 1, // Convertimos a número
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
      productos: productosComprados, // ✅ Guardamos los productos con talles
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion} con productos:`, productosComprados);

    // 📌 ACTUALIZAR STOCK
    if (estadoPedido === "pago completado") {
      for (const producto of productosComprados) {
        const stockRef = db.collection("stock").doc(producto.title);
        const stockDoc = await stockRef.get();

        if (stockDoc.exists) {
          const stockData = stockDoc.data();

          // Aseguramos que la cantidad total sea un número
          const nuevaCantidad = (Number(stockData.cantidad) || 0) + producto.cantidad;

          // Actualizamos la cantidad total del producto
          await stockRef.update({ cantidad: nuevaCantidad });

          console.log(`Stock total actualizado: ${producto.title} ahora tiene ${nuevaCantidad} unidades en total.`);

          // Si el producto tiene talle, actualizamos el stock por talle
          if (producto.talle) {
            const talleCampo = `talle${producto.talle.toUpperCase()}`;
            const nuevoStockTalle = (Number(stockData[talleCampo]) || 0) + producto.cantidad;

            // Actualizamos el stock del talle específico
            await stockRef.update({ [talleCampo]: nuevoStockTalle });

            console.log(`Stock del talle ${producto.talle} actualizado: ${nuevoStockTalle}`);
          }
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
