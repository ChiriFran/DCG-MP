import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import '../styles/Success.css'

const Success = () => {
    const [status, setStatus] = useState("");
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const orderId = queryParams.get("orderId");

        if (orderId) {
            updateOrderStatus(orderId);
        }
    }, [location]);

    const updateOrderStatus = async (orderId) => {
        try {
            const orderRef = doc(db, "pedidos", orderId);
            await updateDoc(orderRef, { status: "completed" });
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
