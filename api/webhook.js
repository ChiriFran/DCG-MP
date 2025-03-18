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

    // 📌 Obtener los detalles del pago desde Mercado Pago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
        },
      }
    );

    if (response.status !== 200) {
      return res.status(400).json({ error: "No se pudo obtener el estado del pago" });
    }

    const paymentData = response.data;

    let estadoPedido;
    let coleccion;

    // 📌 Determinar estado del pedido y colección correspondiente
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

    // 📌 Extraer los productos comprados
    const productosComprados =
      paymentData.additional_info?.items?.map((item) => item.title) || [];

    console.log("Productos comprados:", productosComprados);

    // 📌 Extraer datos de envío
    const shippingData = paymentData.additional_info?.shipments || {};
    const direccion = shippingData.receiver_address?.street_name || "No especificada";
    const numero = shippingData.receiver_address?.street_number || "No especificado";
    const codigoPostal = shippingData.receiver_address?.zip_code || "No especificado";
    const ciudad = shippingData.receiver_address?.city?.name || "No especificada";
    const provincia = shippingData.receiver_address?.state?.name || "No especificada";
    const pais = shippingData.receiver_address?.country?.name || "No especificado";

    // 📌 Guardar la orden en Firebase con los productos y datos de envío
    await db.collection(coleccion).doc(`${paymentId}`).set({
      estado: estadoPedido,
      fecha: new Date().toISOString(),
      comprador,
      email,
      precio,
      productos: productosComprados,
      envio: {
        direccion,
        numero,
        codigoPostal,
        ciudad,
        provincia,
        pais,
      },
    });

    console.log(`Pedido ${paymentId} guardado en ${coleccion} con productos:`, productosComprados);
    console.log(`Datos de envío registrados:`, {
      direccion,
      numero,
      codigoPostal,
      ciudad,
      provincia,
      pais,
    });

    // 📌 ACTUALIZAR STOCK
    if (estadoPedido === "pago completado") {
      for (const producto of productosComprados) {
        // Separar el nombre del producto y el talle (si tiene)
        const partes = producto.split(" - Talle: ");
        const nombreProducto = partes[0]; // Nombre sin talle
        const talle = partes[1] ? partes[1].trim() : null; // Talle (si existe)

        const stockRef = db.collection("stock").doc(nombreProducto);
        const stockDoc = await stockRef.get();

        if (stockDoc.exists) {
          const stockData = stockDoc.data();
          const nuevaCantidad = (stockData.cantidad || 0) + 1;

          // Actualizar solo la cantidad general si no tiene talle
          const updateData = { cantidad: nuevaCantidad };

          // Si el producto tiene talle, también actualizamos el stock del talle específico
          if (talle && stockData[talle] !== undefined) {
            updateData[talle] = (stockData[talle] || 0) + 1;
          }

          await stockRef.update(updateData);

          console.log(`Stock actualizado: ${nombreProducto} ahora tiene ${nuevaCantidad} unidades.`);
          if (talle) {
            console.log(`Talle ${talle} actualizado: ${updateData[talle]} unidades.`);
          }
        } else {
          console.warn(`Producto ${nombreProducto} no encontrado en la colección 'stock'.`);
        }
      }
    }

    return res.status(200).json({ message: `Pedido actualizado: ${estadoPedido}` });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}