import { createContext, useEffect, useState } from "react";

export const CartContext = createContext();

const carritoInicial = JSON.parse(localStorage.getItem("carrito")) || [];

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(carritoInicial);

  const agregarAlCarrito = (item, cantidad, talleSeleccionado) => {
    const itemAgregado = { ...item, cantidad, talleSeleccionado };

    setCarrito((prevCarrito) => {
      const index = prevCarrito.findIndex(
        (producto) =>
          producto.id === itemAgregado.id &&
          producto.talleSeleccionado === itemAgregado.talleSeleccionado
      );

      if (index !== -1) {
        // Si el producto ya está en el carrito, aumentamos la cantidad
        return prevCarrito.map((prod, i) =>
          i === index
            ? { ...prod, cantidad: prod.cantidad + cantidad } // Se añade la nueva cantidad
            : prod
        );
      } else {
        // Si el producto no está en el carrito, lo añadimos
        return [...prevCarrito, itemAgregado];
      }
    });
  };


  const eliminarDelCarrito = (itemId, cantidadAEliminar) => {
    setCarrito((prevCarrito) => {
      const updatedCart = prevCarrito
        .map((item) => {
          if (item.id === itemId) {
            if (item.cantidad <= cantidadAEliminar) {
              return null;
            } else {
              return { ...item, cantidad: item.cantidad - cantidadAEliminar };
            }
          } else {
            return item;
          }
        })
        .filter((item) => item !== null);

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

  const cantidadTotal = () =>
    carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const obtenerCantidadPorProducto = (id, talleSeleccionado) => {
    const item = carrito.find(
      (prod) => prod.id === id && prod.talleSeleccionado === talleSeleccionado
    );
    return item?.cantidad || 0;
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
        cantidadTotal,
        obtenerCantidadPorProducto,
        vaciarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
