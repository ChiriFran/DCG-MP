import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import '../styles/Success.css'

const BuySuccess = () => {
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Recupera el ID del pedido del localStorage
    const savedOrderId = localStorage.getItem("orderId");

    if (savedOrderId) {
      setOrderId(savedOrderId);

      // Llama a una función para actualizar el estado del pedido en Firebase
      updateOrderStatus(savedOrderId);

      // Llama al webhook de prueba después de actualizar el estado del pedido
      testWebhook(savedOrderId);
    } else {
      console.error("No orderId found in localStorage");
    }
  }, []);

  const updateOrderStatus = async (orderId) => {
    try {
      // Referencia al documento de Firebase con el ID de la orden
      const orderRef = doc(db, "pedidos", orderId);

      // Actualiza el estado de la orden a "completed" (o el estado que desees)
      await updateDoc(orderRef, {
        status: "completed", // Actualiza el estado según lo necesario
      });

      console.log(`Order ${orderId} status updated to 'completed'`);

      // Borra el orderId del localStorage para seguridad
      localStorage.removeItem("orderId");
      console.log("orderId removed from localStorage");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const testWebhook = (orderId) => {
    fetch('/api/webhook', {
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
    })
      .then(response => response.json())
      .then(data => console.log('Response from webhook:', data))
      .catch(error => console.error('Error in webhook test:', error));
  };

  return (
    <div className="successContainer">
      <h1>Compra exitosa</h1>
      <p>
        Gracias por tu compra. Tu pedido {orderId ? `con ID ${orderId}` : "no ha podido ser encontrado"} ha sido procesado.
      </p>
    </div>
  );
};

export default BuySuccess;
