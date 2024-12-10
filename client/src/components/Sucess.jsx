import React from "react";
import { Link } from "react-router-dom";
import "../styles/Sucess.css";

const Success = ({ orderId, customerName }) => {
    return (
        <div className="successContainer">
            <div className="successCard">
                <h1 className="successTitle">Thank you for your purchase!</h1>
                <p className="successMessage">
                    Your order has been successfully processed.
                </p>
                <p className="orderDetails">
                    Order ID: <span className="orderId">{orderId}</span>
                </p>
                <p className="customerDetails">
                    Customer Name: <span className="customerName">{customerName}</span>
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
