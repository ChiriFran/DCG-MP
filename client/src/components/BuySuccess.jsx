import React, { useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useOrdenCompraContext } from "../context/OrdenCompraContext";
import { db } from "../firebase/config";
import "../styles/Success.css";

function BuySuccess() {
  const { orderId } = useOrdenCompraContext();

  useEffect(() => {
    const updateStatus = async () => {
      if (orderId) {
        try {
          const orderRef = doc(db, "pedidos", orderId);
          await updateDoc(orderRef, { status: "success" });
          console.log(`Estado actualizado correctamente a "success" para el pedido con ID: ${orderId}`);
        } catch (error) {
          console.error("Error al actualizar el estado del pedido:", error);
        }
      } else {
        console.warn("El ID del pedido no está definido");
      }
    };

    updateStatus();
  }, [orderId]);

  return (
    <div className="successContainer">
      <h1>Compra Exitosa</h1>
      <p>Gracias por tu compra. Pronto recibirás un correo con los detalles.</p>
    </div>
  );
}

export default BuySuccess;
