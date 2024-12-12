import React, { useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useOrdenCompraContext } from "../context/OrdenCompraContext";
import { db } from "../firebase/config";

function BuyPending() {
  const { orderId } = useOrdenCompraContext();

  useEffect(() => {
    if (orderId) {
      const updateStatus = async () => {
        const orderRef = doc(db, "pedidos", orderId);
        await updateDoc(orderRef, { status: "pending" });
      };
      updateStatus();
    }
  }, [orderId]);

  return (
    <div className="pendingContainer">
      <h1>Pago Pendiente</h1>
      <p>Tu transacción está en proceso. Por favor, espera mientras confirmamos el estado de tu pago.</p>
    </div>
  );
}

export default BuyPending;
