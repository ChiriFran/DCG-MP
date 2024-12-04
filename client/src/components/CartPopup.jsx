import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../styles/CartPopup.css";

const CartPopup = () => {
    const { carrito } = useContext(CartContext);
    const [isVisible, setIsVisible] = useState(false);
    const [lastProduct, setLastProduct] = useState(null);
    const [popupMessage, setPopupMessage] = useState("");
    const [prevCart, setPrevCart] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Detectar cambios en el carrito
        if (carrito.length === 0 && prevCart.length > 0) {
            // El carrito está vacío y antes tenía productos
            setLastProduct(null);
            setPopupMessage("Empty cart");
            setIsVisible(true);
        } else {
            carrito.forEach((producto, index) => {
                const prevProducto = prevCart[index];

                // Si no existía antes o si su cantidad ha cambiado
                if (!prevProducto || producto.cantidad !== prevProducto.cantidad) {
                    setLastProduct(producto);
                    setPopupMessage("Added to cart:");
                    setIsVisible(true);
                }
            });
        }

        // Actualizar el carrito anterior para la próxima comparación
        setPrevCart([...carrito]);
    }, [carrito]);

    // Ocultar el popup después de 4 segundos
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 4000); // El popup desaparecerá después de 4 segundos
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    // Función para navegar al carrito
    const goToCart = () => {
        navigate("/Carrito");
        setIsVisible(false); // Cerrar el popup
    };

    return (
        <div className={`cart-popup ${isVisible ? "show" : "hide"}`}>
            <div className="popup-content">
                {lastProduct ? (
                    <>
                        <img src={lastProduct.image} alt={lastProduct.title} className="popup-product-image" />
                        <div className="popup-product-info">
                            <h3>{popupMessage}</h3>
                            <p>{lastProduct.title}</p>
                            <p>Quantity: {lastProduct.cantidad}</p>
                            <button onClick={goToCart}>Buy</button>
                        </div>
                    </>
                ) : (
                    <div className="popup-product-info">
                        <h3>{popupMessage}</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPopup;
