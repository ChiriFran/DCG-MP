import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import '../styles/Failed.css';

const BuyFailed = () => {
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

      // Actualiza el estado de la orden a "failed"
      await updateDoc(orderRef, {
        status: "failed", // Actualiza el estado a 'failed' para este caso
      });

      console.log(`Order ${orderId} status updated to 'failed'`);

      // Borra el orderId del localStorage por seguridad
      localStorage.removeItem("orderId");
      console.log("orderId removed from localStorage");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="failedContainer">
      <h1>Compra fallida</h1>
      <p>Lo sentimos, hubo un problema con tu compra.</p>
    </div>
  );
};

export default BuyFailed;
