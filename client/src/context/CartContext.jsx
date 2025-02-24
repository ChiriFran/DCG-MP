export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(carritoInicial);

  const agregarAlCarrito = (item, cantidad, talle) => {
    if (!talle) {
      console.error("El talle es requerido y no fue proporcionado.");
      return;
    }

    const itemAgregado = { ...item, cantidad, talle };

    console.log("Producto agregado al carrito:", itemAgregado);

    const nuevoCarrito = [...carrito];
    const index = nuevoCarrito.findIndex(
      (producto) => producto.id === itemAgregado.id && producto.talle === itemAgregado.talle
    );

    if (index !== -1) {
      nuevoCarrito[index].cantidad += cantidad;  // Si ya existe, se aumenta la cantidad
    } else {
      nuevoCarrito.push(itemAgregado);  // Si no existe, se agrega el producto
    }

    setCarrito(nuevoCarrito);
  };

  const eliminarDelCarrito = (itemId, talle, cantidadAEliminar) => {
    setCarrito((prevCarrito) => {
      const updatedCart = prevCarrito
        .map((item) => {
          if (item.id === itemId && item.talle === talle) {
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
