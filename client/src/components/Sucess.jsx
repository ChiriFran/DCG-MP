import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/Sucess.css";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";

const Success = () => {
    const [searchParams] = useSearchParams();
    const pedidoId = searchParams.get("pedido_id"); // Recuperar el ID del pedido desde la URL

    useEffect(() => {
        const updateOrderStatus = async () => {
            if (!pedidoId) return;
            try {
                const pedidoRef = doc(db, "pedidos", pedidoId);
                await updateDoc(pedidoRef, {
                    "productos[].status": "aprobado", // Cambiar el estado a "aprobado"
                });
                console.log(`Order ${pedidoId} status updated to approved.`);
            } catch (error) {
                console.error("Error updating order status:", error);
            }
        };
        updateOrderStatus();
    }, [pedidoId]);

    return (
        <div className="successContainer">
            <div className="successCard">
                <h1 className="successTitle">Thank you for your purchase!</h1>
                <p className="successMessage">
                    Your order has been successfully processed.
                </p>
                <p className="orderDetails">
                    Order ID: <span className="orderId">{pedidoId}</span>
                </p>
                <p className="additionalInfo">
                    You will receive a confirmation email shortly with the order details.
                </p>
                <Link to="/" className="returnHomeBtn">
                    Return to Home
                </Link>
            </div>
        </div>
    );
};

export default Success;
