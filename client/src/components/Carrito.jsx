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
  const [isProcessing, setIsProcessing] = useState(""); // Estado para el mensaje de procesamiento
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
    adressType: "",
    comments: "",
  });
  const [shippingOption, setShippingOption] = useState(""); // Nueva opción de envío

  const shippingCosts = {
    CABA: 4000,
    GBA: 7000,
    "Resto del país": 10000,
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingOptionChange = (e) => {
    setShippingOption(e.target.value);
  };

  // Inicializa Mercado Pago con clave pública desde las variables de entorno
  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY_PROD;
  initMercadoPago(mpPublicKey);


  // Crea la preferencia en el backend
  const createPreference = async () => {
    try {
      const items = carrito.map((prod) => ({
        title: `${prod.title} - Talle: ${prod.talleSeleccionado}`, // Agrega el talle al título
        unit_price: prod.price,
        quantity: prod.cantidad,
        category_id: prod.talleSeleccionado, // Mantén el talle en category_id si lo necesitas
        description: `Talle: ${prod.talleSeleccionado}`, // Descripción también con el talle
      }));

      console.log("Items enviados a Mercado Pago:", JSON.stringify(items, null, 2));

      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await axios.post(`${apiUrl}/create_preference`, {
        items,
        shipping: shippingData,
        shippingCost: shippingCosts[shippingOption] || 0, // Se agrega el costo de envío
      });

      console.log("Respuesta de Mercado Pago:", response.data);

      const { id } = response.data;
      return id;
    } catch (error) {
      console.error("Error al crear la preferencia en Mercado Pago:", error);
      alert("Hubo un problema al generar la preferencia. Por favor, inténtalo de nuevo.");
    }
  };

  // Guarda la orden en Firebase
  const saveOrderToFirebase = async () => {
    const pedido = {
      cliente: shippingData,
      productos: carrito,
      total: precioTotal() + (shippingCosts[shippingOption] || 0),
      status: "pending",
      createdAt: new Date(),
      shippingOption,
    };

    try {
      const pedidoDb = collection(db, "pedidos");
      const doc = await addDoc(pedidoDb, pedido);

      console.log("Guardando el orderId:", doc.id);
      localStorage.setItem("orderId", doc.id);

      return doc.id; // Regresar el ID del pedido guardado
    } catch (error) {
      console.error("Error saving the order in Firebase:", error);
      alert("There was a problem saving the order. Please try again.");
      return false;
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();

    if (!shippingData.adressType) {
      alert("Por favor, selecciona un tipo de dirección.\nPlease select an address type.");
      return;
    }

    if (shippingData.adressType === "departamento") {
      if (!shippingData.floor || !shippingData.apartment) {
        alert("Por favor, completa el número de piso y la letra/número de departamento.\nPlease complete the floor number and the apartment letter/number.");
        return;
      }

      if (!/^[A-Za-z]+$/.test(shippingData.floor)) {
        alert("El número de piso solo debe contener letras.\nThe floor number should only contain letters.");
        return;
      }

      if (!/^\d+$/.test(shippingData.apartment)) {
        alert("El apartamento solo debe contener números.\nThe apartment should only contain numbers.");
        return;
      }

      if (!shippingOption) {
        alert("Por favor, selecciona una opción de envío."); //valida el precio de envio
        return;
      }
    }

    if (isProcessing) return; // Evita clics repetidos

    setIsProcessing("Processing..."); // Mostrar que se está procesando

    const id = await createPreference(); // Crear la preferencia en Mercado Pago
    if (id) {
      setPreferenceId(id);
      setIsProcessing("Redirecting to Mercado Pago..."); // Actualizar mensaje

      const orderId = await saveOrderToFirebase(); // Guardar el pedido en Firebase y obtener el ID

      if (orderId) {
        // Esperar 1 segundos antes de redirigir
        setTimeout(() => {
          const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}&orderId=${orderId}`;
          window.open(checkoutUrl, "_blank"); // Redirigir al checkout en nueva pestaña

          vaciarCarrito(); // Vaciar el carrito después de redirigir
          setIsProcessing(""); // Resetear el estado después del flujo
        }, 200);
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

            <h2 className="precioFinal">
              Total: ${precioTotal() + (shippingCosts[shippingOption] || 0)}
            </h2>

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
                <div className="formEnvioGroup">
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
                <div className="formEnvioGroup">
                <label>Housing options</label>
                  <div className="radio-group">
                    <label className={`custom-radio ${shippingData.adressType === "casa" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="adressType"
                        value="casa"
                        checked={shippingData.adressType === "casa"}
                        onChange={(e) =>
                          setShippingData((prev) => ({ ...prev, adressType: e.target.value }))
                        }
                      />
                      House / Casa
                    </label>

                    <label className={`custom-radio ${shippingData.adressType === "departamento" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="adressType"
                        value="departamento"
                        checked={shippingData.adressType === "departamento"}
                        onChange={(e) =>
                          setShippingData((prev) => ({ ...prev, adressType: e.target.value }))
                        }
                      />
                      Apartment / Departamento
                    </label>
                  </div>
                </div>

                <div className="half-container">
                  <div className="formEnvioGroup half">
                    <label>House Floor</label>
                    <input
                      type="text"
                      name="floor"
                      value={shippingData.floor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) { // Acepta solo números
                          setShippingData((prev) => ({ ...prev, floor: value }));
                        }
                      }}
                      placeholder="4"
                      className={shippingData.floor && /^\d+$/.test(shippingData.floor) ? "valid" : "invalid"}
                    />
                  </div>

                  <div className="formEnvioGroup half">
                    <label>Apartment</label>
                    <input
                      type="text"
                      name="apartment"
                      value={shippingData.apartment}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z]*$/.test(value)) { // Acepta solo letras
                          setShippingData((prev) => ({ ...prev, apartment: value }));
                        }
                      }}
                      placeholder="B"
                      className={shippingData.apartment && /^[A-Za-z]+$/.test(shippingData.apartment) ? "valid" : "invalid"}
                    />
                  </div>

                </div>

                <div className="formEnvioGroup mediosDeEnvio">
                  <label>Shipping Option</label>
                  <div className="radio-group">
                    {["CABA", "GBA", "Resto del país"].map((option) => (
                      <label key={option} className={`custom-radio ${shippingOption === option ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="shippingOption"
                          value={option}
                          checked={shippingOption === option}
                          onChange={handleShippingOptionChange}
                          required
                        />
                        {option} - ${shippingCosts[option]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="formEnvio">
                  <label>Comments (Optional)</label>
                  <textarea
                    name="comments"
                    value={shippingData.comments}
                    onChange={handleShippingChange}
                    placeholder="Special instructions for vendors, shipping, and additional."
                  />
                </div>
                <div className="redireccionMarkContainer">
                  <p>Al finalizar el pago seras redirigido nuevamente para confirmar la compra, pro favor espera.</p>
                  <p>At checkout you will be redirected to confirm your purchase, please wait. </p>
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