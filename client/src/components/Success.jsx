import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

import "../styles/Success.css";

const Success = ({ orderId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const updateOrderStatus = async () => {
            if (!orderId) {
                setError("No order ID provided.");
                setLoading(false);
                return;
            }

            try {
                // Referencia al pedido usando el ID
                const orderRef = doc(db, "pedidos", orderId);

                // Actualiza el estado del pedido a 'success'
                await updateDoc(orderRef, {
                    status: "success",
                });

                console.log("Order updated successfully!");
            } catch (err) {
                console.error("Error updating the order:", err);
                setError("There was a problem updating the order.");
            } finally {
                setLoading(false);
            }
        };

        updateOrderStatus();
    }, [orderId]); // Ejecuta cuando `orderId` cambie

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Order Status Updated</h1>
            <p>Order ID: {orderId} has been updated with status 'success'.</p>
        </div>
    );
};

export default Success;
