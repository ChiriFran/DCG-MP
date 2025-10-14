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
  const { carrito, precioTotal, vaciarCarrito, eliminarUnidad } = useContext(CartContext);
  const [isProcessing, setIsProcessing] = useState("");
  const [preferenceId, setPreferenceId] = useState(null);

  // 🔹 Agregamos dni
  const [shippingData, setShippingData] = useState({
    name: "",
    dni: "",
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

  const [shippingOption, setShippingOption] = useState("");
  const [message, setMessage] = useState("");

  const shippingCosts = {
    CABA: 5000,
    GBA: 7500,
    "Resto del país": 15000,
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingOptionChange = (e) => {
    setShippingOption(e.target.value);
  };

  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY_PROD;
  initMercadoPago(mpPublicKey);

  const createPreference = async () => {
    try {
      // 🔹 Items del carrito
      const items = carrito.map((prod) => ({
        title: `${prod.title} - Talle: ${prod.talleSeleccionado} - Unidades: ${prod.cantidad}`,
        unit_price: prod.price,
        quantity: prod.cantidad,
        category_id: prod.talleSeleccionado,
        description: `Talle: ${prod.talleSeleccionado}`,
      }));

      // 🔹 Costo de envío como ítem adicional
      const shippingCost = shippingCosts[shippingOption] || 0;
      if (shippingCost > 0) {
        items.push({
          title: `Costo de envío - ${shippingOption}`,
          unit_price: shippingCost,
          quantity: 1,
          description: `Envío a ${shippingOption}`,
        });
      }

      const apiUrl = import.meta.env.VITE_API_URL;

      // 🔹 Crear preferencia en tu backend
      const response = await axios.post(`${apiUrl}/create_preference`, {
        items,
        shipping: shippingData, // Info del cliente
      });

      const { id } = response.data;
      return id;
    } catch (error) {
      console.error("Error al crear la preferencia en Mercado Pago:", error);
      alert("Hubo un problema al generar la preferencia. Inténtalo nuevamente.");
      return null;
    }
  };


  const saveOrderToFirebase = async () => {
    // 🔹 Incluye dni completo dentro del cliente
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
      localStorage.setItem("orderId", doc.id);
      return doc.id;
    } catch (error) {
      console.error("Error guardando el pedido:", error);
      alert("Hubo un problema al guardar el pedido. Inténtalo nuevamente.");
      return false;
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();

    if (!shippingData.adressType) return setMessage("Por favor, indica el tipo de domicilio.");
    if (!shippingOption) return setMessage("Por favor, confirma el costo de envío.");
    if (shippingData.adressType === "departamento" && (!shippingData.floor || !shippingData.apartment)) {
      return setMessage("Completa el número de piso y departamento.");
    }

    if (isProcessing) return;
    setIsProcessing("Processing...");

    try {
      // 1️⃣ Guardar primero el pedido en Firebase
      const pedido = {
        cliente: shippingData,
        productos: carrito,
        total: precioTotal() + (shippingCosts[shippingOption] || 0),
        status: "pending",
        createdAt: new Date(),
        shippingOption,
      };

      const pedidoDb = collection(db, "pedidos");
      const doc = await addDoc(pedidoDb, pedido);
      const orderId = doc.id;
      localStorage.setItem("orderId", orderId);

      // 2️⃣ Crear preferencia con orderId ya existente
      const items = carrito.map((prod) => ({
        title: `${prod.title} - Talle: ${prod.talleSeleccionado} - Unidades: ${prod.cantidad}`,
        unit_price: prod.price,
        quantity: prod.cantidad,
        category_id: prod.talleSeleccionado,
        description: `Talle: ${prod.talleSeleccionado}`,
      }));

      const shippingCost = shippingCosts[shippingOption] || 0;
      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await axios.post(`${apiUrl}/create_preference`, {
        items,
        shipping: shippingData,
        shippingCost,
        orderId,
      });

      const { id } = response.data;
      if (!id) throw new Error("No se generó la preferencia correctamente.");

      setPreferenceId(id);

      // 3️⃣ Intentar abrir la app de Mercado Pago
      const appUrl = `mercadopago://checkout?pref_id=${id}`;
      const webUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}&orderId=${orderId}`;

      window.location.href = appUrl;

      setTimeout(() => {
        window.location.href = webUrl;
      }, 2000);

      vaciarCarrito();
    } catch (error) {
      console.error("Error en el flujo de compra:", error);
      setMessage("Ocurrió un error al procesar la compra.");
    } finally {
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
              <span className="headerItem"></span>
            </div>

            {carrito.map((prod) => (
              <div className="carritoItem" key={`${prod.id}-${prod.talleSeleccionado || "no-talle"}`}>
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
                <button
                  className="btnEliminar"
                  onClick={() => eliminarUnidad(prod.id, prod.talleSeleccionado)}
                  title="Eliminar una unidad"
                >
                  ❌
                </button>
              </div>
            ))}

            <h2 className="precioFinal">
              Total: ${precioTotal() + (shippingCosts[shippingOption] || 0)}
            </h2>

            <div className="finalizarCompraContainer">
              <form onSubmit={handleBuy} className="formEnvio">
                <div className="formEnvioGroup">
                  <label>Nombre y apellidos</label>
                  <input
                    type="text"
                    name="name"
                    value={shippingData.name}
                    onChange={handleShippingChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* 🔹 Campo nuevo: DNI */}
                <div className="formEnvioGroup">
                  <label>DNI</label>
                  <input
                    type="text"
                    name="dni"
                    value={shippingData.dni}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Acepta solo números (sin guiones ni puntos)
                      if (/^\d*$/.test(value)) {
                        setShippingData((prev) => ({ ...prev, dni: value }));
                      }
                    }}
                    placeholder="Ej: 40123456"
                    required
                  />
                </div>

                <div className="formEnvioGroup">
                  <label>Provincia</label>
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
                  <label>Ciudad</label>
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
                  <label>Dirección calle</label>
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
                  <label>Dirección numero</label>
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
                  <label>Código postal</label>
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
                    <label>Zona telefónica</label>
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
                    <label>Teléfono numero</label>
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
                  <label>Opciones de despacho</label>
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
                    <label>Departamento piso</label>
                    <input
                      type="text"
                      name="floor"
                      value={shippingData.floor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z0-9\s]*$/.test(value)) {
                          setShippingData((prev) => ({ ...prev, floor: value }));
                        }
                      }}
                      placeholder="4B"
                    />
                  </div>

                  <div className="formEnvioGroup half">
                    <label>Departamento número</label>
                    <input
                      type="text"
                      name="apartment"
                      value={shippingData.apartment}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z0-9\s]*$/.test(value)) {
                          setShippingData((prev) => ({ ...prev, apartment: value }));
                        }
                      }}
                      placeholder="B2"
                    />
                  </div>
                </div>

                <div className="formEnvioGroup mediosDeEnvioContainer">
                  <label className="mediosDeEnvioTitle">Gastos de envío</label>
                  <div className="mediosDeEnvio">
                    <label>
                      CABA<br />$5000
                      <input
                        type="radio"
                        name="shippingOption"
                        value="CABA"
                        onChange={handleShippingOptionChange}
                      />
                    </label>
                    <label>
                      GBA<br />$7500
                      <input
                        type="radio"
                        name="shippingOption"
                        value="GBA"
                        onChange={handleShippingOptionChange}
                      />
                    </label>
                    <label>
                      Resto del país<br />$15000
                      <input
                        type="radio"
                        name="shippingOption"
                        value="Resto del país"
                        onChange={handleShippingOptionChange}
                      />
                    </label>
                  </div>
                  <div className="redireccionMarkContainer">
                    <p>Al seleccionar envío, se aplicará el costo. / When selecting shipping, the cost will be applied.</p>
                  </div>
                </div>

                <div className="formEnvio">
                  <label>Comentarios (Opcional)</label>
                  <textarea
                    name="comments"
                    value={shippingData.comments}
                    onChange={handleShippingChange}
                    placeholder="Special instructions for vendors, shipping, and additional."
                  />
                </div>

                <div className="redireccionMarkContainer">
                  <p>Al finalizar el pago seras redirigido rapidamente. / At the end of the payment you will be redirected quickly.</p>
                </div>

                {message && <div className="message">{message}</div>}

                <button
                  type="submit"
                  className="mercadoPagoBtn"
                  style={{
                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                  disabled={!!isProcessing}
                >
                  {isProcessing || "Comprar"}
                </button>
              </form>
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
