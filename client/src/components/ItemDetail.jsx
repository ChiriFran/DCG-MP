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
  const [stockTotal, setStockTotal] = useState(item.category === "T-shirts" ? {} : 0);
  const [cantidadVendida, setCantidadVendida] = useState(item.category === "T-shirts" ? {} : 0);
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState("");
  const [imagenActual, setImagenActual] = useState(item.imageDetail);
  const [imagenCargando, setImagenCargando] = useState(false);

  useEffect(() => {
    const consultarStock = async () => {
      try {
        const productoRef = doc(db, "productos", item.id);
        const productoSnapshot = await getDoc(productoRef);
        const productoData = productoSnapshot.data();

        if (item.category === "T-shirts") {
          setStockTotal({
            S: productoData?.stockS || 0,
            M: productoData?.stockM || 0,
            L: productoData?.stockL || 0,
            XL: productoData?.stockXL || 0,
            XXL: productoData?.stockXXL || 0,
          });
        } else {
          setStockTotal(productoData?.stock || 0);
        }

        const stockRef = doc(db, "stock", item.title);
        const stockSnapshot = await getDoc(stockRef);
        const stockData = stockSnapshot.data();

        if (item.category === "T-shirts") {
          setCantidadVendida({
            S: stockData?.S || 0,
            M: stockData?.M || 0,
            L: stockData?.L || 0,
            XL: stockData?.XL || 0,
            XXL: stockData?.XXL || 0,
          });
        } else {
          setCantidadVendida(stockData?.cantidad || 0);
        }
      } catch (error) {
        console.error("Error al consultar el stock:", error);
      }
    };

    consultarStock();
  }, [item.id, item.title, item.category]);

  useEffect(() => {
    if (item.category === "T-shirts") {
      if (talleSeleccionado && cantidadVendida[talleSeleccionado] >= stockTotal[talleSeleccionado]) {
        setMensajeAdvertencia("No hay stock disponible para este talle.");
      } else {
        setMensajeAdvertencia("");
      }
    } else {
      if (cantidadVendida >= stockTotal) {
        setMensajeAdvertencia("No hay stock disponible para este producto.");
      } else {
        setMensajeAdvertencia("");
      }
    }
  }, [cantidadVendida, stockTotal, talleSeleccionado, item.category]);

  const handleRestar = () => {
    setCantidad((prevCantidad) => Math.max(prevCantidad - 1, 1));
  };

  const handleSumar = () => {
    if (item.category === "T-shirts" && talleSeleccionado) {
      const stockDisponible = stockTotal[talleSeleccionado] - cantidadVendida[talleSeleccionado];
      setCantidad((prevCantidad) => Math.min(prevCantidad + 1, stockDisponible));
    } else if (item.category !== "T-shirts") {
      const stockDisponible = stockTotal - cantidadVendida;
      setCantidad((prevCantidad) => Math.min(prevCantidad + 1, stockDisponible));
    }
  };

  const handleAgregarAlCarrito = () => {
    if (item.category === "T-shirts" && !talleSeleccionado) {
      alert("Por favor, selecciona un talle antes de agregar al carrito.");
      return;
    }

    let cantidadEnCarritoProducto = 0;
    if (item.category === "T-shirts") {
      const productoEnCarrito = carrito.find(
        (producto) => producto.id === item.id && producto.talle === talleSeleccionado
      );
      cantidadEnCarritoProducto = productoEnCarrito ? productoEnCarrito.cantidad : 0;
    } else {
      cantidadEnCarritoProducto = carrito.reduce((total, producto) => {
        return producto.id === item.id ? total + producto.cantidad : total;
      }, 0);
    }

    const stockDisponible =
      item.category === "T-shirts"
        ? stockTotal[talleSeleccionado] - cantidadVendida[talleSeleccionado] - cantidadEnCarritoProducto
        : stockTotal - cantidadVendida - cantidadEnCarritoProducto;

    if (cantidad > stockDisponible) {
      alert("No hay suficiente stock disponible.");
      return;
    }

    agregarAlCarrito(item, cantidad, item.category === "T-shirts" ? talleSeleccionado : null);
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
    setCantidad(1);
  };

  const cambiarImagen = (nuevaImagen) => {
    if (!imagenCargando && imagenActual !== nuevaImagen) {
      setImagenCargando(true);
      setImagenActual(nuevaImagen);
    }
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

        {mensajeAdvertencia && <p className="mensajeAdvertencia">{mensajeAdvertencia}</p>}

        <div className="botonesComprarEliminar">
          <ItemCount
            cantidad={cantidad}
            handleSumar={handleSumar}
            handleRestar={handleRestar}
            handleAgregar={handleAgregarAlCarrito}
            disabled={!talleSeleccionado || (item.category === "T-shirts" && cantidadVendida[talleSeleccionado] >= stockTotal[talleSeleccionado])}
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
                <span>SIZE A:</span>
                <p>Marco is 1.80m and wears a Size L...</p>
              </li>
              <li>
                <span>SIZE B:</span>
                <p>Nina is 1.71m and wears a Size M...</p>
              </li>
            </ul>
          </div>

          <div className="sizeChartContainerDesktop">
            <p className="sizeTitle">Size Chart</p>
            <ul>
              <li>
                <span>SIZE A:</span>
                <p>Marco is 1.80m and wears a Size L...</p>
              </li>
              <li>
                <span>SIZE B:</span>
                <p>Nina is 1.71m and wears a Size M...</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="itemDetailImgContainer">
        <img
          className="itemDetailImg"
          src={imagenActual}
          alt={item.title}
          onLoad={() => setImagenCargando(false)}
        />
        <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
          <span
            onClick={() => cambiarImagen(item.imageDetail)}
            style={{
              backgroundColor: imagenActual === item.imageDetail ? "#363636" : "#acadac",
              cursor: imagenCargando ? "not-allowed" : "pointer",
              opacity: imagenCargando ? 0.5 : 1,
            }}
          />
          {item.imageBack && (
            <span
              onClick={() => cambiarImagen(item.imageBack)}
              style={{
                backgroundColor: imagenActual === item.imageBack ? "#363636" : "#acadac",
                cursor: imagenCargando ? "not-allowed" : "pointer",
                opacity: imagenCargando ? 0.5 : 1,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;