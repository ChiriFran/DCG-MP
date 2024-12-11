import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";  // Para acceder a los parámetros de la ruta
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../styles/Success.css";

const Success = () => {
    const { orderId } = useParams();  // Accede al parámetro 'orderId' desde la URL
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (orderId) {
            updateOrderStatus(orderId);  // Llama a la función para actualizar el estado del pedido
        }
    }, [orderId]);  // Asegúrate de que el efecto se ejecute cuando cambie el orderId

    const updateOrderStatus = async (orderId) => {
        try {
            const orderRef = doc(db, "pedidos", orderId);
            await updateDoc(orderRef, { status: "completed" });  // Actualiza el estado del pedido en Firebase
            setStatus("Your order was successfully completed!");
        } catch (error) {
            console.error("Error updating order status:", error);
            setStatus("There was an issue updating your order.");
        }
    };

    return (
        <div>
            <h1>{status}</h1>
        </div>
    );
};

export default Success;
