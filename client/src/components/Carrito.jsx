import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { CartContext } from "../context/CartContext";

const Carrito = () => {
  const { carrito, removeItem, clearCart, precioTotal } = useContext(CartContext);
  const [shippingData, setShippingData] = useState({});
  const [isProcessing, setIsProcessing] = useState("");
  const [preferenceId, setPreferenceId] = useState(null);
  const navigate = useNavigate();

  const createPreference = async () => {
    try {
      const response = await fetch("/api/mercadopago/create_preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: carrito.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.price,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create preference");
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Error creating preference:", error);
      return null;
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
      return doc.id;
    } catch (error) {
      console.error("Error saving the order in Firebase:", error);
      alert("There was a problem saving the order. Please try again.");
      return null;
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();

    if (isProcessing) return;

    setIsProcessing("Processing...");

    const id = await createPreference();
    if (id) {
      setPreferenceId(id);
      const orderId = await saveOrderToFirebase();
      if (orderId) {
        navigate(`/success/${orderId}`); // Redirigir a Success con el ID del pedido
      } else {
        alert("The order could not be saved. Please try again.");
      }
    } else {
      alert("It was not possible to create the preference in Mercado Pago. Please try again.");
    }

    setIsProcessing("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData({ ...shippingData, [name]: value });
  };

  return (
    <div>
      <h1>Your Cart</h1>
      {carrito.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {carrito.map((item) => (
            <div key={item.id}>
              <h2>{item.title}</h2>
              <p>Quantity: {item.quantity}</p>
              <p>Price: ${item.price}</p>
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          ))}
          <h3>Total: ${precioTotal()}</h3>
          <form onSubmit={handleBuy}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Shipping Address"
              onChange={handleInputChange}
              required
            />
            <button type="submit" disabled={isProcessing !== ""}>
              {isProcessing || "Complete Purchase"}
            </button>
          </form>
          <button onClick={clearCart}>Clear Cart</button>
        </div>
      )}
    </div>
  );
};

export default Carrito;