import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import '../styles/Success.css'

const Success = () => {
    const { orderId } = useParams(); // Suponiendo que pasas el ID como parámetro en la URL
    const [status, setStatus] = useState("validating");

    useEffect(() => {
        const validateOrder = async () => {
            try {
                const orderRef = doc(db, "pedidos", orderId);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();

                    // Aquí deberías incluir la lógica para validar la compra.
                    const isValid = true; // Sustituir con la lógica real de validación

                    if (isValid) {
                        await updateDoc(orderRef, { status: "completed" });
                        setStatus("completed");
                    } else {
                        setStatus("failed");
                    }
                } else {
                    console.error("Order not found");
                    setStatus("not-found");
                }
            } catch (error) {
                console.error("Error validating order:", error);
                setStatus("error");
            }
        };

        validateOrder();
    }, [orderId]);

    return (
        <div className="successContainer">
            {status === "validating" && <p>Validating your order...</p>}
            {status === "completed" && <p>Your order has been successfully completed!</p>}
            {status === "failed" && <p>There was an issue with your order validation.</p>}
            {status === "not-found" && <p>Order not found.</p>}
            {status === "error" && <p>An error occurred during validation. Please try again later.</p>}
        </div>
    );
};

export default Success;
