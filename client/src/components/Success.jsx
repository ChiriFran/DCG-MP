import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore"; // Cambiado a setDoc
import { db } from "../firebase/config";

import "../styles/Success.css";

const Success = ({ orderId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const createOrderStatus = async () => {
            if (!orderId) {
                setError("No order ID provided.");
                setLoading(false);
                return;
            }

            try {
                // Referencia al pedido usando el ID
                const orderRef = doc(db, "pedidos", orderId);

                // Crea un nuevo documento o establece un nuevo campo `status` como 'success'
                await setDoc(orderRef, {
                    status: "success", // Se crea el campo status con valor 'success'
                }, { merge: true }); // El merge asegura que no se sobrescriban otros campos del documento

                console.log("Order status created successfully!");
            } catch (err) {
                console.error("Error creating the order status:", err);
                setError("There was a problem creating the order status.");
            } finally {
                setLoading(false);
            }
        };

        createOrderStatus();
    }, [orderId]); // Ejecuta cuando `orderId` cambie

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Order Status Created</h1>
            <p>Order ID: {orderId} has been created with status 'success'.</p>
        </div>
    );
};

export default Success;
