import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const Success = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("processing");

    useEffect(() => {
        const validatePayment = async () => {
            const paymentId = searchParams.get("payment_id");
            const externalReference = searchParams.get("external_reference");
            const paymentStatus = searchParams.get("status");

            if (!paymentId || !externalReference || !paymentStatus) {
                setStatus("error");
                return;
            }

            try {
                // Validar el estado del pago con la API de Mercado Pago
                const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: {
                        Authorization: `Bearer ${import.meta.env.VITE_MP_ACCESS_TOKEN}`, // Reemplaza con tu token
                    },
                });

                const payment = await response.json();

                if (payment.status === "approved") {
                    // Actualizar el estado del pedido en Firebase
                    const orderRef = doc(db, "pedidos", externalReference); // external_reference es el ID del pedido en tu base de datos
                    await updateDoc(orderRef, { status: "completed" });

                    setStatus("completed");
                } else {
                    setStatus("failed");
                }
            } catch (error) {
                console.error("Error validating payment:", error);
                setStatus("error");
            }
        };

        validatePayment();
    }, [searchParams]);

    return (
        <div>
            {status === "processing" && <h1>Processing your payment...</h1>}
            {status === "completed" && <h1>Payment successful! Thank you for your purchase.</h1>}
            {status === "failed" && <h1>Payment failed. Please try again.</h1>}
            {status === "error" && <h1>An error occurred. Please contact support.</h1>}
        </div>
    );
};

export default Success;
