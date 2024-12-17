import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import '../styles/Success.css';

const BuySuccess = ({ orderId }) => { // Recibe orderId como prop
  const [orderProcessed, setOrderProcessed] = useState(false);

  useEffect(() => {
    if (orderId) {
      updateOrderStatus(orderId);
    } else {
      console.error("No orderId provided.");
    }
  }, [orderId]);

  const updateOrderStatus = async (orderId) => {
    try {
      // Referencia al documento de Firebase con el ID de la orden
      const orderRef = doc(db, "pedidos", orderId);

      // Actualiza el estado de la orden a "completed"
      await updateDoc(orderRef, {
        status: "completed", // Estado que deseas asignar
      });

      console.log(`Order ${orderId} status updated to 'completed'`);
      setOrderProcessed(true);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="successContainer">
      <h1>Compra exitosa</h1>
      <p>
        {orderProcessed ? (
          `Gracias por tu compra. Tu pedido con ID ${orderId} ha sido procesado.`
        ) : (
          "Estamos procesando tu pedido..."
        )}
      </p>
    </div>
  );
};

export default BuySuccess;
