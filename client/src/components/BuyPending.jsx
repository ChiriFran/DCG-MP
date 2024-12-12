import React from "react";
import { Link } from "react-router-dom";
import '../styles/Pending.css'

function Pending() {
    return (
        <div className="pendingContainer">
            <h1>Pago Pendiente</h1>
            <p>Tu transacción está en proceso. Por favor, espera mientras confirmamos el estado de tu pago.</p>
            <div>
                <Link to="/">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}

export default Pending;
