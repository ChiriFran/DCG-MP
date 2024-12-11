import { useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";

const Success = () => {
    const { orderId } = useParams();
    const [isUpdated, setIsUpdated] = useState(false);

    useEffect(() => {
        const updateOrderStatus = async () => {
            try {
                const orderRef = doc(db, "pedidos", orderId);
                await updateDoc(orderRef, { status: "success" });
                setIsUpdated(true);
                console.log(`Order ${orderId} updated to success`);
            } catch (error) {
                console.error("Error updating the order status:", error);
                setIsUpdated(false);
            }
        };

        if (orderId) {
            updateOrderStatus();
        }
    }, [orderId]);

    return (
        <div>
            {isUpdated ? (
                <h1>Your order was successfully processed!</h1>
            ) : (
                <h1>Processing your order...</h1>
            )}
        </div>
    );
};

export default Success;
