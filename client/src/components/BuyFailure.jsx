import React, { useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useOrdenCompraContext } from "../context/OrdenCompraContext";
import { db } from "../firebase/config";
import '../styles/Failure.css'

function BuyFailure() {
  const { orderId } = useOrdenCompraContext();

  useEffect(() => {
    if (orderId) {
      const updateStatus = async () => {
        const orderRef = doc(db, "pedidos", orderId);
        await updateDoc(orderRef, { status: "failed" });
      };
      updateStatus();
    }
  }, [orderId]);

  return (
    <div className="failureContainer">
      <h1>Pago Fallido</h1>
      <p>Hubo un problema con tu pago. Por favor, inténtalo de nuevo o contacta con soporte.</p>
    </div>
  );
}

export default BuyFailure;
