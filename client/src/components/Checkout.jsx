import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { useForm } from "react-hook-form";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../styles/Checkout.css";

function Checkout() {
  const [pedidoId, setPedidoId] = useState("");
  const { carrito, precioTotal, vaciarCarrito } = useContext(CartContext);
  const { register, handleSubmit } = useForm();

  const comprar = (data) => {
    const pedido = {
      cliente: data,
      productos: carrito,
      total: precioTotal(),
    };
    console.log(pedido);

    const pedidoDb = collection(db, "pedidos");

    addDoc(pedidoDb, pedido).then((doc) => {
      setPedidoId(doc.id);
      vaciarCarrito();
    });
  };

  if (pedidoId) {
    return (
      <div className="CheckoutContainerCompraFinalizada">
        <h1 className="CheckoutContainerCompraFinalizadaTitle">
          ¡Muchas gracias por tu compra!
        </h1>
        <p>Pedido: #{pedidoId}</p>
      </div>
    );
  }

  return (
    <div className="mainCheckoutContainer">
      <div className="checkoutContainer">
        <h1 className="checkoutTitle">Finalizar compra</h1>
        <form className="checkoutFormulario" onSubmit={handleSubmit(comprar)}>
          <input
            type="text"
            placeholder="Nombre completo: "
            {...register("nombre")}
            pattern="[a-zA-Z]+\s[a-zA-Z]+"
            title="Ingresa un nombre completo válido... Ej: Pepito Perez"
            required
          />
          <input
            type="email"
            placeholder="E-mail: "
            {...register("email")}
            required
          />
          <input
            type="phone"
            placeholder="Teléfono: "
            {...register("telefono")}
            required
          />
          <input
            type="text"
            placeholder="Dirección: "
            {...register("direccion")}
            required
          />
          <input
            type="text"
            placeholder="Ciudad: "
            {...register("ciudad")}
            required
          />
          <input
            type="text"
            placeholder="Código Postal: "
            {...register("codigoPostal")}
            required
          />
          <button className="checkoutEnviar" type="submit">
            Comprar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
