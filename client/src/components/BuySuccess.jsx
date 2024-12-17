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
