import { useContext, useState } from "react";
import "../styles/Carrito.css";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { initMercadoPago } from "@mercadopago/sdk-react";
import ItemListContainerDestacados from "./ItemListContainerDestacados";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const Carrito = () => {
  const { carrito, precioTotal, vaciarCarrito } = useContext(CartContext);
  const [preferenceId, setPreferenceId] = useState(null);
  const [shippingData, setShippingData] = useState({
    name: "",
    address: "",
    apartment: "",
    zipCode: "",
    city: "",
    province: "",
    phone: "",
    email: "",
    comments: "",
  });

  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY_PROD;
  initMercadoPago(mpPublicKey);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const createPreference = async () => {
    try {
      const items = carrito.map((prod) => ({
        title: prod.title,
        unit_price: prod.price,
        quantity: prod.cantidad,
      }));

      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await axios.post(`${apiUrl}/create_preference`, {
        items,
        shipping: shippingData,
      });

      const { id } = response.data;
      return id;
    } catch (error) {
      console.error("Error when creating the preference in Mercado Pago:", error);
      alert("There was a problem generating the preference. Please try again.");
    }
  };

  const saveOrderToFirebase = async () => {
    const pedido = {
      cliente: shippingData,
      productos: carrito,
      total: precioTotal(),
    };

    try {
      const pedidoDb = collection(db, "pedidos");
      const doc = await addDoc(pedidoDb, pedido);
      console.log(`Order saved with ID: ${doc.id}`);
      return true;
    } catch (error) {
      console.error("Error saving the order in Firebase:", error);
      alert("There was a problem saving the order. Please try again.");
      return false;
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const handleBuy = async (e) => {
    e.preventDefault();

    if (isProcessing) return;
    setIsProcessing(true);

    const id = await createPreference();
    if (id) {
      setPreferenceId(id);

      const saved = await saveOrderToFirebase();
      if (saved) {
        setTimeout(() => {
          const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;
          window.open(checkoutUrl, "_blank");
          vaciarCarrito();
          setIsProcessing(false);
        }, 1500);
      } else {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <div className="carritoContainer">
      <div className="carritoCard">
        <h1 className="carritoTitle">
          {carrito.length > 0
            ? "Shopping Cart"
            : "Oops, you don't have any items in your cart! Here below are some of our products"}
        </h1>
        {carrito.length > 0 ? (
          <>
            {/* Product List */}
            <div className="carritoHeader">
              <span className="headerItem">Products</span>
              <span className="headerItem">Unit Price</span>
              <span className="headerItem">Quantity</span>
              <span className="headerItem">Total Price</span>
            </div>
            {carrito.map((prod) => (
              <div className="carritoItem" key={prod.id}>
                <div className="productDetails">
                  <img src={prod.image} alt={prod.title} className="productImage" />
                  <h2 className="titulo">{prod.title}</h2>
                </div>
                <h3 className="precio">${prod.price}</h3>
                <h3 className="carritoCantidad">{prod.cantidad}</h3>
                <h3 className="precioTotal">${prod.price * prod.cantidad}</h3>
              </div>
            ))}
            <h2 className="precioFinal">Total: ${precioTotal()}</h2>

            {/* Shipping Form */}
            <div className="finalizarCompraContainer">
              <form onSubmit={handleBuy} className="formEnvio">
                {Object.entries(shippingData).map(([key, value]) => (
                  <div className="formEnvioGroup" key={key}>
                    <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    <input
                      type={key === "email" ? "email" : "text"}
                      name={key}
                      value={value}
                      onChange={handleShippingChange}
                      required={key !== "apartment" && key !== "comments"}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="mercadoPagoBtn"
                >
                  {isProcessing ? "Processing..." : "Checkout MP"}
                </button>
              </form>
              <button onClick={vaciarCarrito} className="vaciarCarrito">
                Empty Cart
              </button>
            </div>
            <Link to="/Faq" className="carritoFaq">
              FAQ / Shipping
            </Link>
          </>
        ) : (
          <ItemListContainerDestacados />
        )}
      </div>
    </div>
  );
};

export default Carrito;
