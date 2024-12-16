import { useEffect } from "react";
import { db } from "../firebase/config";  // Asegúrate de que la ruta sea correcta
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Funciones de Firebase

import '../styles/Success.css';

const BuySuccess = () => {
  useEffect(() => {
    const updateOrderStatus = async () => {
      try {
        // Obtener el ID del pedido desde la URL (o donde lo tengas almacenado)
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const orderId = urlParams.get("order_id");  // Asegúrate de que este sea el nombre correcto del parámetro

        if (orderId) {
          const orderRef = doc(db, "pedidos", orderId);
          const orderSnapshot = await getDoc(orderRef);

          if (orderSnapshot.exists()) {
            // Si el pedido existe, actualiza el estado
            await updateDoc(orderRef, {
              status: "success",  // O el estado que desees
              updated_at: new Date(),
            });
            console.log(`Pedido ${orderId} actualizado a 'completo'`);
          }
        }
      } catch (error) {
        console.error("Error al actualizar el estado del pedido:", error);
      }
    };

    updateOrderStatus();
  }, []);  // El efecto solo se ejecutará una vez al montar el componente

  return (
    <div className="successContainer">
      <h1>Compra exitosa</h1>
      <p>Gracias por tu compra.</p>
    </div>
  );
};

export default BuySuccess;
