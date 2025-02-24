import { db } from "./firebaseAdmin.js";
import axios from "axios";

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

    // 📌 Obtener detalles del pago desde Mercado Pago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
        },
      }
    );

    if (response.status !== 200) {
      return res.status(400).json({ error: "No se pudo obtener el estado del pago de Mercado Pago" });
    }

    const paymentData = response.data;

    let estadoPedido;
    let coleccion;

    // 📌 Determinar estado del pedido y la colección en Firebase
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

    // 📌 Recoger información del comprador
    const comprador = paymentData.payer?.name || "desconocido";
    const email = paymentData.payer?.email || "desconocido";
    const precio = paymentData.transaction_amount || 0;

    // 📌 Extraer productos comprados
    const productosComprados = paymentData.additional_info?.items?.map((item) => ({
      title: item.title,
      talleSeleccionado: item.description || null,
      quantity: item.quantity,
    })) || [];

    console.log("Productos comprados:", productosComprados);

    // 📌 Guardar la orden en Firebase con los productos
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      precio,
      productos: productosComprados,
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion} con productos:`, productosComprados);

    // 📌 ACTUALIZAR STOCK
    if (estadoPedido === "pago completado") {
      for (const producto of productosComprados) {
        const stockRef = db.collection("stock").doc(producto.title);
        const stockDoc = await stockRef.get();

        if (!stockDoc.exists) {
          console.warn(`Producto ${producto.title} no encontrado en la colección 'stock'.`);
          continue;
        }

        const stockData = stockDoc.data();
        const nuevaCantidad = (Number(stockData.cantidad) || 0) - producto.quantity;

        // 📌 Consultar la categoría del producto para ver si tiene talles
        const productoRef = db.collection("productos").doc(producto.title);
        const productoDoc = await productoRef.get();

        if (!productoDoc.exists) {
          console.warn(`No se encontró el producto ${producto.title} en la colección 'productos'.`);
          continue;
        }

        const productoData = productoDoc.data();
        const categoria = productoData.categoria?.toLowerCase() || "";

        console.log(`Categoría del producto ${producto.title}: ${categoria}`);

        // 📌 Actualizar stock dependiendo de si tiene talle o no
        const updateData = { cantidad: nuevaCantidad };

        if (categoria === "T-shirts" && producto.talleSeleccionado) {
          // Si es una remera y tiene talle, actualizar también el stock del talle
          const talleField = `talle${producto.talleSeleccionado.toUpperCase()}`; // Ej: talleS, talleM
          updateData[talleField] = (Number(stockData[talleField]) || 0) - producto.quantity;
        }

        await stockRef.update(updateData);

        console.log(`Stock actualizado: ${producto.title}, cantidad total: ${nuevaCantidad}, talle: ${producto.talleSeleccionado || "N/A"}`);
      }
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
