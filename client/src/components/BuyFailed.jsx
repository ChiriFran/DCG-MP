import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/Failed.css";

const BuyFailed = () => {
  const [orderId, setOrderId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedOrderId = localStorage.getItem("orderId");

    if (savedOrderId) {
      setOrderId(savedOrderId);
      updateOrderStatus(savedOrderId);
    } else {
      console.error("No orderId found in localStorage");
    }
  }, []);

  const updateOrderStatus = async (orderId) => {
    try {
      const orderRef = doc(db, "pedidos", orderId);
      await updateDoc(orderRef, { status: "failed" });

      console.log(`Order ${orderId} status updated to 'failed'`);

      setTimeout(() => {
        localStorage.removeItem("orderId");
        console.log("orderId removed from localStorage");
      }, 3000);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const phoneNumber = "5491130504515"; // 👈 reemplazá con tu número de WhatsApp (formato internacional sin +)
    const message = `Hola, mi compra falló y este es mi ID de pedido: ${orderId}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="failedContainer">
      <h1>Compra fallida</h1>
      <p>Lo sentimos, hubo un problema con tu compra.</p>
      <button onClick={handleWhatsApp} className="whatsapp-btn">
        Contactar por WhatsApp
      </button>

      {orderId && (
        <div className="failed-info">
          <p><strong>ID del pedido:</strong> {orderId}</p>

          <div className="failed-buttons">
            <button onClick={handleCopy} className="copy-btn">
              {copied ? "¡Copiado!" : "Copiar ID"}
            </button>
            <button onClick={handleWhatsApp} className="whatsapp-btn">
              Contactar por WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyFailed;
