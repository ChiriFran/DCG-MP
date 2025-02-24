import { createContext, useEffect, useState } from "react";

export const CartContext = createContext();

const carritoInicial = JSON.parse(localStorage.getItem("carrito")) || [];

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(carritoInicial);

  const agregarAlCarrito = (item, cantidad) => {
    const itemAgregado = { ...item, cantidad };

    const nuevoCarrito = [...carrito];
    const index = nuevoCarrito.findIndex(
      (producto) => producto.id === itemAgregado.id
    );

    if (index !== -1) {
      nuevoCarrito[index].cantidad += cantidad;
    } else {
      nuevoCarrito.push(itemAgregado);
    }

    setCarrito(nuevoCarrito);
  };

  const eliminarDelCarrito = (itemId, cantidadAEliminar) => {
    setCarrito((prevCarrito) => {
      const updatedCart = prevCarrito
        .map((item) => {
          if (item.id === itemId) {
            if (item.cantidad <= cantidadAEliminar) {
              // Si la cantidad a eliminar es mayor o igual a la cantidad en el carrito, eliminar el producto
              return null;
            } else {
              // Si la cantidad a eliminar es menor que la cantidad en el carrito, reducir la cantidad
              return { ...item, cantidad: item.cantidad - cantidadAEliminar };
            }
          } else {
            return item;
          }
        })
        .filter((item) => item !== null); // Filtrar los productos nulos (eliminados)

      return updatedCart;
    });
  };

  const precioTotal = () => {
    const total = carrito.reduce(
      (acc, prod) => acc + prod.price * prod.cantidad,
      0
    );
    return parseFloat(total.toFixed(2));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        precioTotal,
        vaciarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
