import { useContext, useState, useEffect } from "react";
import ItemCount from "./ItemCount";
import "../styles/ItemDetail.css";
import { CartContext } from "../context/CartContext";
import { doc, getDoc } from "firebase/firestore"; // Usar el SDK modular
import { db } from "../firebase/config"; // Asegúrate de que tu archivo de configuración esté bien configurado

const ItemDetail = ({ item }) => {
  const { carrito, agregarAlCarrito, eliminarDelCarrito } = useContext(CartContext);
  const [cantidad, setCantidad] = useState(1);
  const [talleSeleccionado, setTalleSeleccionado] = useState("");
  const [stockDisponible, setStockDisponible] = useState({
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0
  });
  const [cantidadVendida, setCantidadVendida] = useState({
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0
  });
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState("");

  useEffect(() => {
    // Verificar el stock disponible por talle y la cantidad vendida en Firebase cuando se carga el producto
    const consultarStock = async () => {
      try {
        // Consulta el producto en la colección de productos usando SDK modular
        const productoRef = doc(db, "productos", item.id);
        const productoSnapshot = await getDoc(productoRef);
        const productoData = productoSnapshot.data();

        // Obtiene el stock por talle desde la colección productos
        const stockProducto = {
          S: productoData?.stockS || 0,
          M: productoData?.stockM || 0,
          L: productoData?.stockL || 0,
          XL: productoData?.stockXL || 0,
          XXL: productoData?.stockXXL || 0,
        };
        setStockDisponible(stockProducto);

        // Consulta la cantidad vendida por talle en la colección "stock"
        const stockRef = doc(db, "stock", item.title);
        const stockSnapshot = await getDoc(stockRef);
        const stockData = stockSnapshot.data();

        // Si existe la entrada, suma la cantidad vendida por talle
        const cantidadVendidaProducto = {
          S: stockData?.S || 0,
          M: stockData?.M || 0,
          L: stockData?.L || 0,
          XL: stockData?.XL || 0,
          XXL: stockData?.XXL || 0,
        };
        setCantidadVendida(cantidadVendidaProducto);

      } catch (error) {
        console.error("Error al consultar el stock:", error);
      }
    };

    consultarStock();
  }, [item.id, item.title]);

  useEffect(() => {
    // Verificar si la cantidad seleccionada excede el stock disponible para el talle seleccionado
    if (talleSeleccionado && cantidadVendida[talleSeleccionado] >= stockDisponible[talleSeleccionado]) {
      setMensajeAdvertencia("No hay stock disponible para este talle.");
    } else {
      setMensajeAdvertencia("");
    }
  }, [cantidadVendida, stockDisponible, talleSeleccionado]);

  const handleRestar = () => {
    setCantidad((prevCantidad) => Math.max(prevCantidad - 1, 1));
  };

  const handleSumar = () => {
    if (cantidad + cantidadVendida[talleSeleccionado] <= stockDisponible[talleSeleccionado]) {
      setCantidad((prevCantidad) => prevCantidad + 1);
    }
  };

  const handleAgregarAlCarrito = () => {
    if (item.category === "T-shirts" && !talleSeleccionado) {
      alert("Por favor, selecciona un talle antes de agregar al carrito.");
      return;
    }

    // Validar que la cantidad sea mayor que 0
    if (cantidad <= 0) {
      alert("Por favor, selecciona una cantidad válida.");
      return;
    }

    if (cantidad + cantidadVendida[talleSeleccionado] > stockDisponible[talleSeleccionado]) {
      alert("No hay suficiente stock disponible.");
      return;
    }

    console.log("Producto agregado al carrito:", {
      ...item,
      cantidad,
      talleSeleccionado: item.category === "T-shirts" ? talleSeleccionado : null,
    });

    agregarAlCarrito(item, cantidad, talleSeleccionado); // ✅ Pasar el talle como argumento

    setCantidad(1);
    setTalleSeleccionado("");
  };

  const handleEliminarDelCarrito = () => {
    const cantidadEnCarrito = carrito.find((producto) => producto.id === item.id)?.cantidad || 0;
    const cantidadAEliminar = Math.min(cantidadEnCarrito, cantidad);
    eliminarDelCarrito(item.id, cantidadAEliminar);
    setCantidad(1);
  };

  const cantidadEnCarrito = carrito.reduce((total, producto) => {
    return producto.id === item.id ? total + producto.cantidad : total;
  }, 0);

  const handleTalleSeleccionado = (talle) => {
    setTalleSeleccionado(talle);
  };

  return (
    <div className="itemDetailContainer">
      <div className="itemDetail">
        <h3 className="itemDetailTitle">{item.title}</h3>
        <p className="itemDetailPrice">${item.price}.-</p>

        <div className="sizeSelectorContainer">
          <h3>Size</h3>
          <div id="size-selector">
            {item.category === "T-shirts" ? (
              ["S", "M", "L", "XL", "XXL"].map((talle) => (
                <button
                  key={talle}
                  className={`size-button ${talle === talleSeleccionado ? "selected" : ""}`}
                  onClick={() => handleTalleSeleccionado(talle)}
                >
                  {talle}
                </button>
              ))
            ) : (
              <button className="size-button single-size" disabled>
                Unique sizes available
              </button>
            )}
          </div>
        </div>

        {mensajeAdvertencia && (
          <p className="mensajeAdvertencia">{mensajeAdvertencia}</p>
        )}

        <div className="botonesComprarEliminar">
          <ItemCount
            cantidad={cantidad}
            handleSumar={handleSumar}
            handleRestar={handleRestar}
            handleAgregar={handleAgregarAlCarrito}
          />
        </div>

        <p className="cantidadEnCarrito">
          You have {cantidadEnCarrito} units in cart
          <button className="eliminarDelCarrito" onClick={handleEliminarDelCarrito}>
            Remove
          </button>
        </p>

        <p className="itemDetailDescription">{item.description}</p>

        <div className="itemDetailDescriptionList">
          <ul>
            <li>Unisex Hoodie</li>
            <li>Relaxed Fit</li>
            <li>70% premium cotton / 30% polyester</li>
            <li>Logo puff print on the back</li>
            <li>Faux leather logo patch on the sleeve</li>
            <li>Includes our unique Mutual Rytm rubber tag, a Bandcamp download code and stickers</li>
          </ul>

          <div className="sizeChartContainer">
            <p className="sizeTitle">Size Chart</p>
            <ul>
              <li>
                <span>SIZE A:</span><p>Marco is 1.80m and wears a Size L. For a comfortable, relaxed fit, choose your regular size. For an oversized look, go one size up!</p>
              </li>
              <li>
                <span>SIZE B:</span><p>Nina is 1.71m and wears a Size M. For a comfortable, relaxed fit, choose your regular size. For an oversized look, go one size up!</p>
              </li>
            </ul>
          </div>

          <div className="sizeChartContainerDesktop">
            <p className="sizeTitle">Size Chart</p>
            <ul>
              <li>
                <span>SIZE A:</span><p>Marco is 1.80m and wears a Size L. For a comfortable, relaxed fit, choose your regular size. For an oversized look, go one size up!</p>
              </li>
              <li>
                <span>SIZE B:</span><p>Nina is 1.71m and wears a Size M. For a comfortable, relaxed fit, choose your regular size. For an oversized look, go one size up!</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="itemDetailImgContainer">
        <img className="itemDetailImg" src={item.imageDetail} alt={item.title} />
      </div>
    </div>
  );
};

export default ItemDetail;