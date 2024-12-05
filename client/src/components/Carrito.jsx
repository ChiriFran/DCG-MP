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
    zipCode: "",
    city: "",
    province: "",
    phone: "",
  });
  const [isProcessing, setIsProcessing] = useState(false); // Estado para manejar el clic repetido en el botón

  // Inicializa Mercado Pago con clave pública desde las variables de entorno
  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY_PROD; // Cambiado a VITE_ para acceso correcto
  initMercadoPago(mpPublicKey);

  // Maneja los cambios en los campos de envío
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Crea la preferencia en el backend
  const createPreference = async () => {
    try {
      const items = carrito.map((prod) => ({
        title: prod.title,
        unit_price: prod.price,
        quantity: prod.cantidad,
      }));

      // URL base del backend desde las variables de entorno
      const apiUrl = import.meta.env.VITE_API_URL; // Cambiado a VITE_ para acceso correcto

      const response = await axios.post(`${apiUrl}/create_preference`, {
        items,
        shipping: shippingData,
      });

      const { id } = response.data;
      return id;
    } catch (error) {
      console.error("Error al crear la preferencia en Mercado Pago:", error);
      alert("Hubo un problema al generar la preferencia. Intenta nuevamente.");
    }
  };

  // Guarda la orden en Firebase
  const saveOrderToFirebase = async () => {
    const pedido = {
      cliente: shippingData,
      productos: carrito,
      total: precioTotal(),
    };

    try {
      const pedidoDb = collection(db, "pedidos");
      const doc = await addDoc(pedidoDb, pedido);
      console.log(`Pedido guardado con ID: ${doc.id}`);
      return true;
    } catch (error) {
      console.error("Error al guardar el pedido en Firebase:", error);
      alert("Hubo un problema al guardar el pedido. Intenta nuevamente.");
      return false;
    }
  };

  // Maneja la compra
  const handleBuy = async (e) => {
    e.preventDefault();

    if (isProcessing) return; // Evita clics repetidos

    setIsProcessing(true); // Activar el estado de procesamiento

    const saved = await saveOrderToFirebase();
    if (!saved) {
      setIsProcessing(false); // Desactivar el estado de procesamiento si falla
      return;
    }

    const id = await createPreference();
    if (id) {
      setPreferenceId(id);

      // Redirigir al checkout de Mercado Pago en una nueva pestaña
      const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;
      window.open(checkoutUrl, "_blank");

      // Vaciar el carrito después de guardar el pedido y abrir el checkout
      vaciarCarrito();
    }

    setIsProcessing(false); // Desactivar el estado de procesamiento después de completar el flujo
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
                <h3 className="carritoCantidad">
                  <p className="mobileCantidad">Quantity: </p>
                  {prod.cantidad}
                </h3>
                <h3 className="precioTotal">${prod.price * prod.cantidad}</h3>
              </div>
            ))}
            <h2 className="precioFinal">Total: ${precioTotal()}</h2>

            <div className="finalizarCompraContainer">
              <form onSubmit={handleBuy} className="formEnvio">
                <div className="formEnvioGroup">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={shippingData.name}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <div className="formEnvioGroup">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={shippingData.address}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <div className="formEnvioGroup">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingData.city}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <div className="formEnvioGroup">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={shippingData.zipCode}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <div className="formEnvioGroup">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={shippingData.phone}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <div className="formEnvioGroup">
                  <label>Province</label>
                  <input
                    type="text"
                    name="province"
                    value={shippingData.province}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="mercadoPagoBtn"
                  style={{
                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                  disabled={isProcessing} // Desactiva el botón mientras se procesa la compra
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
        ) : null}
      </div>

      {carrito.length === 0 && <ItemListContainerDestacados />}
    </div>
  );
};

export default Carrito;
