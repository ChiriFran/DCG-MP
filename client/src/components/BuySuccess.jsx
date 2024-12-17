import React, { useState, useEffect } from "react";
import '../styles/Success.css';

const BuySuccess = () => {
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const orderIdFromUrl = new URLSearchParams(window.location.search).get("orderId");

    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
      // Llama al webhook para obtener el estado del pago
      fetchWebhook(orderIdFromUrl);
    } else {
      console.error("No orderId found in URL");
    }
  }, []);

  const fetchWebhook = async (orderId) => {
    try {
      const response = await fetch(`/api/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'payment.updated', // Tipo de acción simulada
          data: { id: orderId }, // Simula el ID del pedido
          id: orderId,
          live_mode: false,
        }),
      });

      const data = await response.json();

      if (data && data.orderId && data.paymentStatus) {
        setOrderId(data.orderId);
        setPaymentStatus(data.paymentStatus);  // Actualiza el estado según lo enviado por el webhook
      } else {
        console.error("Invalid response from webhook:", data);
      }
    } catch (error) {
      console.error('Error fetching webhook:', error);
    }
  };

  return (
    <div className="successContainer">
      <h1>Compra exitosa</h1>
      <p>
        Gracias por tu compra. Tu pedido {orderId ? `con ID ${orderId}` : "no ha podido ser encontrado"}
        ha sido procesado.
        {paymentStatus && (
          <span>Estado del pago: {paymentStatus}</span>
        )}
      </p>
    </div>
  );
};

export default BuySuccess;
