import { createContext, useEffect, useState } from "react";

export const CartContext = createContext();

const carritoInicial = JSON.parse(localStorage.getItem("carrito")) || [];

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(carritoInicial);

  const agregarAlCarrito = (item, cantidad, talleSeleccionado) => {
    const precioFinal =
      item.preSalePrice != null
        ? item.preSalePrice
        : item.price;

    const itemAgregado = {
      ...item,
      price: precioFinal, // 👈 precio definitivo
      cantidad,
      talleSeleccionado,
    };

    setCarrito((prevCarrito) => {
      const index = prevCarrito.findIndex(
        (producto) =>
          producto.id === itemAgregado.id &&
          producto.talleSeleccionado === itemAgregado.talleSeleccionado
      );

      if (index !== -1) {
        return prevCarrito.map((prod, i) =>
          i === index
            ? { ...prod, cantidad: prod.cantidad + cantidad }
            : prod
        );
      } else {
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

  // 🧩 Nueva función para eliminar UNA unidad
  const eliminarUnidad = (id, talleSeleccionado) => {
    setCarrito((prevCarrito) =>
      prevCarrito
        .map((prod) => {
          if (prod.id === id && prod.talleSeleccionado === talleSeleccionado) {
            if (prod.cantidad > 1) {
              return { ...prod, cantidad: prod.cantidad - 1 };
            } else {
              return null; // eliminar completamente si tenía solo 1
            }
          }
          return prod;
        })
        .filter(Boolean)
    );
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
        eliminarUnidad,
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
