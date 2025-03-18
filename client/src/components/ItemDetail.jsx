import { useContext, useState, useEffect } from "react";
import ItemCount from "./ItemCount";
import "../styles/ItemDetail.css";
import { CartContext } from "../context/CartContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const ItemDetail = ({ item }) => {
  const { carrito, agregarAlCarrito, eliminarDelCarrito } = useContext(CartContext);
  const [cantidad, setCantidad] = useState(1);
  const [talleSeleccionado, setTalleSeleccionado] = useState("");
  const [stockDisponible, setStockDisponible] = useState(0);
  const [cantidadVendida, setCantidadVendida] = useState(0);
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState("");

  useEffect(() => {
    const consultarStock = async () => {
      try {
        const productoRef = doc(db, "productos", item.id);
        const productoSnapshot = await getDoc(productoRef);
        const productoData = productoSnapshot.data();

        if (item.category === "T-shirts") {
          // Si es una remera, manejar stock por talle
          setStockDisponible(productoData?.stockPorTalle || {});
        } else {
          // Si no es una remera, manejar stock general
          setStockDisponible(productoData?.stock || 0);
        }

        const stockRef = doc(db, "stock", item.title);
        const stockSnapshot = await getDoc(stockRef);
        const stockData = stockSnapshot.data();

        let cantidadVendidaProducto = 0;
        if (stockData && stockData.cantidad) {
          cantidadVendidaProducto = stockData.cantidad;
        }
        setCantidadVendida(cantidadVendidaProducto);

      } catch (error) {
        console.error("Error al consultar el stock:", error);
      }
    };

    consultarStock();
  }, [item.id, item.title]);

  useEffect(() => {
    let stockActual = 0;

    if (item.category === "T-shirts") {
      stockActual = talleSeleccionado ? (stockDisponible[talleSeleccionado] || 0) : 0;
    } else {
      stockActual = stockDisponible;
    }

    if (cantidadVendida >= stockActual) {
      setMensajeAdvertencia("No hay stock disponible para este producto.");
    } else {
      setMensajeAdvertencia("");
    }
  }, [cantidadVendida, stockDisponible, talleSeleccionado]);

  const handleRestar = () => {
    setCantidad((prevCantidad) => Math.max(prevCantidad - 1, 1));
  };

  const handleSumar = () => {
    let stockActual = item.category === "T-shirts"
      ? (talleSeleccionado ? (stockDisponible[talleSeleccionado] || 0) : 0)
      : stockDisponible;

    setCantidad((prevCantidad) => Math.min(prevCantidad + 1, stockActual - cantidadVendida));
  };

  const handleAgregarAlCarrito = () => {
    if (item.category === "T-shirts" && !talleSeleccionado) {
      alert("Por favor, selecciona un talle antes de agregar al carrito.");
      return;
    }

    if (cantidad <= 0) {
      alert("Por favor, selecciona una cantidad válida.");
      return;
    }

    let stockActual = item.category === "T-shirts"
      ? (stockDisponible[talleSeleccionado] || 0)
      : stockDisponible;

    if (cantidad + cantidadVendida > stockActual) {
      alert("No hay suficiente stock disponible.");
      return;
    }

    agregarAlCarrito(item, cantidad, talleSeleccionado);
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
    setCantidad(1); // Reiniciar cantidad al cambiar de talle
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
        </div>
      </div>

      <div className="itemDetailImgContainer">
        <img className="itemDetailImg" src={item.imageDetail} alt={item.title} />
      </div>
    </div>
  );
};

export default ItemDetail;
