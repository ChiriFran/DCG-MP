import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/Success.css";

const BuySuccess = () => {
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Recuperar el orderId del localStorage
    const savedOrderId = localStorage.getItem("orderId");

    if (savedOrderId) {
      setOrderId(savedOrderId);
    } else {
      console.error("No orderId found in localStorage");
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      const updateOrderStatus = async () => {
        const orderRef = doc(db, "pedidos", orderId);
        await updateDoc(orderRef, { status: "completed" }); // Cambiar estado a "completed"
        console.log(`Order ${orderId} status updated to completed`);
      };

      updateOrderStatus();
    }
  }, [orderId]);

  return (
    <div className="successContainer">
      <h1>Compra exitosa</h1>
      <p>Gracias por tu compra. Tu pedido ha sido procesado.</p>
    </div>
  );
};

export default BuySuccess;
