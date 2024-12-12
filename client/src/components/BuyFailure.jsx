import React from "react";
import '../styles/Failure.css'

function Failure() {
    return (
        <div className="failureContainer">
            <h1>Pago Fallido</h1>
            <p>Hubo un problema con tu pago. Por favor, inténtalo de nuevo o contacta con soporte.</p>
        </div>
    );
}

export default Failure;
