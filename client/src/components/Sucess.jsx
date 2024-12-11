import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/Sucess.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const Success = () => {
    const { orderId } = useParams(); // Obtén el ID del pedido desde la URL
    const [orderDetails, setOrderDetails] = useState(null);

    // Obtener los detalles del pedido desde Firebase
    useEffect(() => {
        const getOrderDetails = async () => {
            const orderRef = doc(db, "pedidos", orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                setOrderDetails(orderSnap.data());
            } else {
                console.log("No such order!");
            }
        };

        getOrderDetails();
    }, [orderId]);

    if (!orderDetails) return <p>Loading...</p>;

    return (
        <div className="successContainer">
            <div className="successCard">
                <h1 className="successTitle">Thank you for your purchase!</h1>
                <p className="successMessage">Your order has been successfully processed.</p>
                <p className="orderDetails">
                    Order ID: <span className="orderId">{orderDetails.id}</span>
                </p>
                <p className="customerDetails">
                    Customer Name: <span className="customerName">{orderDetails.cliente.name}</span>
                </p>
                <p className="additionalInfo">
                    You will receive a confirmation email shortly with the order details.
                </p>
                <Link to="/" className="returnHomeBtn">Return to Home</Link>
            </div>
        </div>
    );
};

export default Success;
