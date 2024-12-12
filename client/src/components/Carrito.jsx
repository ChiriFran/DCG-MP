import { useContext, useState } from "react";
import "../styles/Carrito.css";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { initMercadoPago } from "@mercadopago/sdk-react";
import ItemListContainerDestacados from "./ItemListContainerDestacados";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useOrdenCompraContext } from "../context/OrdenCompraContext";

const Carrito = () => {
  const { carrito, precioTotal, vaciarCarrito } = useContext(CartContext);
  const [preferenceId, setPreferenceId] = useState(null);
  const [shippingData, setShippingData] = useState({
    name: "",
    address: "",
    streetNumber: "",
    apartment: "",
    floor: "",
    zipCode: "",
    city: "",
    province: "",
    phoneArea: "",
    phone: "",
    email: "",
    comments: "",
  });
  const { updateOrderId } = useOrdenCompraContext();


  // Inicializa Mercado Pago con clave pública desde las variables de entorno
  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY_PROD;
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
      console.error("Error when creating the preference in Mercado Pago:", error);
      alert("There was a problem generating the preference. Please try again.");
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
      console.log(`Order saved with ID: ${doc.id}`);
      updateOrderId(doc.id); // Actualiza el contexto con el ID del pedido
      return true;
    } catch (error) {
      console.error("Error saving the order in Firebase:", error);
      alert("There was a problem saving the order. Please try again.");
      return false;
    }
  };

  // Maneja la compra
  const [isProcessing, setIsProcessing] = useState(""); // Estado para el mensaje de procesamiento
  const handleBuy = async (e) => {
    e.preventDefault();

    if (isProcessing) return; // Evita clics repetidos

    setIsProcessing("Processing..."); // Mostrar que se está procesando

    const id = await createPreference(); // Crear la preferencia en Mercado Pago
    if (id) {
      setPreferenceId(id);
      setIsProcessing("Redirecting to Mercado Pago..."); // Actualizar mensaje

      const saved = await saveOrderToFirebase(); // Guardar el pedido en Firebase solo si se genera la preferencia
      if (saved) {
        // Esperar 2 segundos antes de redirigir
        setTimeout(() => {
          const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;
          window.open(checkoutUrl, "_blank"); // Redirigir al checkout en nueva pestaña

          vaciarCarrito(); // Vaciar el carrito después de redirigir
          setIsProcessing(""); // Resetear el estado después del flujo
        }, 1500);
      } else {
        alert("The order could not be saved. Please try again.");
        setIsProcessing(""); // Resetear el estado si hay un error
      }
    } else {
      alert("It was not possible to create the preference in Mercado Pago. Please try again.");
      setIsProcessing(""); // Resetear el estado si hay un error
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
                    placeholder="John Doe"
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
                    placeholder="Buenos Aires"
                    required
                  />
                </div>
                <div className="formEnvioGroup">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={shippingData.email}
                    onChange={handleShippingChange}
                    placeholder="john.doe@example.com"
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
                    placeholder="Buenos Aires"
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
                    placeholder="10001"
                    required
                  />
                </div>
                <div className="half-container">
                  <div className="formEnvioGroup half">
                    <label>Address street</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingData.address}
                      onChange={handleShippingChange}
                      placeholder="Main St"
                      required
                    />
                  </div>
                  <div className="formEnvioGroup half">
                    <label>Adress Number</label>
                    <input
                      type="text"
                      name="streetNumber"
                      value={shippingData.streetNumber}
                      onChange={handleShippingChange}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                <div className="half-container">
                  <div className="formEnvioGroup half">
                    <label>Phone area</label>
                    <input
                      type="text"
                      name="phoneArea"
                      value={shippingData.phoneArea}
                      onChange={handleShippingChange}
                      placeholder="+54011"
                      required
                    />
                  </div>
                  <div className="formEnvioGroup half">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={shippingData.phone}
                      onChange={handleShippingChange}
                      placeholder="1234-5678"
                      required
                    />
                  </div>
                </div>
                <div className="half-container">
                  <div className="formEnvioGroup half">
                    <label>House Floor</label>
                    <input
                      type="text"
                      name="floor"
                      value={shippingData.floor}
                      onChange={handleShippingChange}
                      placeholder="4"
                    />
                  </div>
                  <div className="formEnvioGroup half">
                    <label>Apartment</label>
                    <input
                      type="text"
                      name="apartment"
                      value={shippingData.apartment}
                      onChange={handleShippingChange}
                      placeholder="B"
                    />
                  </div>
                </div>
                <div className="formEnvioGroup">
                  <label>Comments (Optional)</label>
                  <textarea
                    name="comments"
                    value={shippingData.comments}
                    onChange={handleShippingChange}
                    placeholder="Special instructions for vendors, shipping, and additional."
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
                  {isProcessing || "Buy"}
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