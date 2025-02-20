const axios = require('axios');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.handler = async (req, res) => {
  try {
    const { payment_id } = req.body; // El ID de pago que llega con el webhook
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN_PROD}`,
      },
    });

    if (response.status === 200) {
      const paymentData = response.data;

      // Obtener estado y método de pago
      const paymentStatus = paymentData.status; // 'approved', 'rejected', 'pending'
      const paymentMethod = paymentData.payment_method_id; // 'account_money', 'credit_card', etc.

      let coleccion = '';
      let estadoPedido = '';

      // Verificar el estado del pago y método
      if (paymentStatus === 'approved') {
        // Pago aprobado
        if (paymentMethod === 'account_money') {
          estadoPedido = 'pago completado con dinero en cuenta';
          coleccion = 'pedidosExitosos'; // Se guarda en pedidosExitosos si el pago es con dinero en cuenta
        } else {
          estadoPedido = 'pago completado';
          coleccion = 'pedidosExitosos'; // Si no es dinero en cuenta, también va a pedidosExitosos
        }
      } else if (paymentStatus === 'rejected') {
        // Pago rechazado
        estadoPedido = 'pago rechazado';
        coleccion = 'pedidosRechazados';
      } else if (paymentStatus === 'pending') {
        // Pago pendiente
        estadoPedido = 'pago pendiente';
        coleccion = 'pedidosPendientes';
      } else {
        return res.status(400).json({ error: 'Estado de pago desconocido' });
      }

      // Datos del comprador (nombre y email)
      const comprador = paymentData.payer || {};
      const emailComprador = comprador.email || 'email desconocido';

      // Guardar el estado del pedido en Firebase
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

      return res.status(200).json({ message: `Pedido ${estadoPedido} guardado correctamente` });
    } else {
      console.error('Error obteniendo detalles del pago:', response.statusText);
      return res.status(500).json({ error: 'Error obteniendo detalles del pago' });
    }
  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return res.status(500).json({ error: 'Error procesando el webhook' });
  }
};
