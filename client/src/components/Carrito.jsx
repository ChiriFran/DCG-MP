import { useContext, useState } from "react";
import "../styles/Carrito.css";
import { CartContext } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { initMercadoPago } from "@mercadopago/sdk-react";
import ItemListContainerDestacados from "./ItemListContainerDestacados";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const Carrito = () => {
  const { carrito, precioTotal, vaciarCarrito } = useContext(CartContext);
  const [preferenceId, setPreferenceId] = useState(null);
  const [shippingData, setShippingData] = useState({
    name: "",
    email: "",
    phone_area: "",
    phone: "",
    street_name: "",
    street_number: "",
    zip_code: "",
    city: "",
    province: "",
    floor: "",
    apartment: "",
    comments: "",
  });
  const [isProcessing, setIsProcessing] = useState("");
  const navigate = useNavigate(); // Para redirigir después de la compra

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

  // Función para generar un ID único basado en la hora actual y un valor aleatorio
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Guarda la orden en Firebase con el ID único generado
  const saveOrderToFirebase = async () => {
    const pedidoId = generateUniqueId(); // Generar ID único
    const pedido = {
      id: pedidoId,
      cliente: shippingData,
      productos: carrito,
      total: precioTotal(),
      estado: "pending", // Estado inicial del pedido
    };

    try {
      const pedidoDb = collection(db, "pedidos");
      const docRef = await addDoc(pedidoDb, pedido);
      console.log(`Order saved with ID: ${pedidoId}`);
      return { pedidoId, docRef }; // Devolver ID para usarlo en la preferencia
    } catch (error) {
      console.error("Error saving the order in Firebase:", error);
      alert("There was a problem saving the order. Please try again.");
      return null;
    }
  };

  // Maneja la compra
  const handleBuy = async (e) => {
    e.preventDefault();

    if (isProcessing) return;

    setIsProcessing("Processing...");

    const id = await createPreference();
    if (id) {
      setPreferenceId(id);
      setIsProcessing("Redirecting to Mercado Pago...");

      const { pedidoId, docRef } = await saveOrderToFirebase();
      if (pedidoId) {
        setTimeout(async () => {
          const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;
          window.open(checkoutUrl, "_blank");

          // Actualiza el estado del pedido a 'paid' en Firebase después del pago
          await updateDoc(docRef, { estado: "paid" });

          vaciarCarrito();
          setIsProcessing("");
          navigate(`/success/${pedidoId}`); // Redirige al componente Success
        }, 1500);
      } else {
        alert("The order could not be saved. Please try again.");
        setIsProcessing("");
      }
    } else {
      alert("It was not possible to create the preference in Mercado Pago. Please try again.");
      setIsProcessing("");
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
                    name="zip_code"
                    value={shippingData.zip_code}
                    onChange={handleShippingChange}
                    placeholder="10001"
                    required
                  />
                </div>
                <div className="half-container">
                  <div className="formEnvioGroup half">
                    <label>Street name</label>
                    <input
                      type="text"
                      name="street_name"
                      value={shippingData.street_name}
                      onChange={handleShippingChange}
                      placeholder="Main St"
                      required
                    />
                  </div>
                  <div className="formEnvioGroup half">
                    <label>Adress</label>
                    <input
                      type="text"
                      name="street_number"
                      value={shippingData.stret_number}
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
                      name="phone_area"
                      value={shippingData.phone_area}
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
                    <label>Floor</label>
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