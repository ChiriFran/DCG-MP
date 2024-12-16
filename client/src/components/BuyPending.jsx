import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import '../styles/Pending.css';

const BuyPending = () => {
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Recupera el ID del pedido del localStorage
    const savedOrderId = localStorage.getItem("orderId");

    if (savedOrderId) {
      setOrderId(savedOrderId);

      // Llama a una función para actualizar el estado del pedido en Firebase
      updateOrderStatus(savedOrderId);
    } else {
      console.error("No orderId found in localStorage");
    }
  }, []);

  const updateOrderStatus = async (orderId) => {
    try {
      // Referencia al documento de Firebase con el ID de la orden
      const orderRef = doc(db, "pedidos", orderId);

      // Actualiza el estado de la orden a "pending"
      await updateDoc(orderRef, {
        status: "pending", // Actualiza el estado a 'pending' para este caso
      });

      console.log(`Order ${orderId} status updated to 'pending'`);

      // Borra el orderId del localStorage por seguridad
      localStorage.removeItem("orderId");
      console.log("orderId removed from localStorage");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="pendingContainer">
      <h1>Compra pendiente</h1>
      <p>Estamos procesando tu compra. Te avisaremos pronto.</p>
    </div>
  );
};

export default BuyPending;
