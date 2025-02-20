import axios from 'axios';
import admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const handler = async (req, res) => {
  try {
    const { payment_id } = req.body; // ID de pago recibido en el webhook
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
      },
    });

    if (response.status === 200) {
      const paymentData = response.data;

      // Estado del pago
      const paymentStatus = paymentData.status; // Puede ser 'approved', 'rejected', 'pending'
      const paymentMethod = paymentData.payment_method_id; // Método de pago ('account_money', 'credit_card', etc.)

      let coleccion = '';
      let estadoPedido = '';

      // Comprobar estado del pago y asignar la colección correspondiente
      if (paymentStatus === 'approved') {
        // Pago aprobado
        if (paymentMethod === 'account_money') {
          estadoPedido = 'pago completado con dinero en cuenta';
          coleccion = 'pedidosExitosos'; // Guardar en pedidosExitosos si fue con dinero en cuenta
        } else {
          estadoPedido = 'pago completado';
          coleccion = 'pedidosExitosos'; // Guardar en pedidosExitosos para otros métodos de pago
        }
      } else if (paymentStatus === 'rejected') {
        // Pago rechazado
        estadoPedido = 'pago rechazado';
        coleccion = 'pedidosRechazados'; // Guardar en pedidosRechazados si fue rechazado
      } else if (paymentStatus === 'pending') {
        // Pago pendiente
        estadoPedido = 'pago pendiente';
        coleccion = 'pedidosPendientes'; // Guardar en pedidosPendientes si está pendiente
      } else {
        // Si no se reconoce el estado del pago
        return res.status(400).json({ error: 'Estado de pago desconocido' });
      }

      // Datos del comprador (nombre y email)
      const comprador = paymentData.payer || {};
      const emailComprador = comprador.email || 'email desconocido';

      // Guardar en la colección correcta en Firestore
      await db.collection(coleccion).doc(`${payment_id}`).set({
        estado: estadoPedido,
        fecha: new Date().toISOString(),
        comprador: {
          nombre: comprador.name || 'nombre desconocido',
          email: emailComprador,
        },
        precio: paymentData.transaction_amount || 0,
      });

      console.log(`Pedido ${payment_id} guardado en ${coleccion}`);

      // Enviar respuesta exitosa
      return res.status(200).json({ message: 'Pedido procesado correctamente' });
    } else {
      // Si la respuesta de Mercado Pago no es exitosa
      return res.status(400).json({ error: 'Error al obtener la información del pago' });
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
};
