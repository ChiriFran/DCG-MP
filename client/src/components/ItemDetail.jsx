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
        // Stock total del producto
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

        // Cantidad vendida desde colección 'stock'
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
    if (item.category === "T-shirts" && talleSeleccionado) {
      const disponible = stockTotal[talleSeleccionado] - cantidadVendida[talleSeleccionado];
      if (disponible <= 0) {
        setMensajeAdvertencia("No hay stock disponible para este talle.");
      } else {
        setMensajeAdvertencia("");
      }
    } else if (item.category !== "T-shirts") {
      const disponible = stockTotal - cantidadVendida;
      if (disponible <= 0) {
        setMensajeAdvertencia("No hay stock disponible para este producto.");
      } else {
        setMensajeAdvertencia("");
      }
    }
  }, [cantidadVendida, stockTotal, talleSeleccionado, item.category]);

  const handleRestar = () => {
    setCantidad((prev) => Math.max(prev - 1, 1));
  };

  const handleSumar = () => {
    let stockDisponible = 0;

    if (item.category === "T-shirts" && talleSeleccionado) {
      const enCarrito = carrito.reduce((total, p) => {
        return p.id === item.id && p.talle === talleSeleccionado ? total + p.cantidad : total;
      }, 0);
      stockDisponible = stockTotal[talleSeleccionado] - cantidadVendida[talleSeleccionado] - enCarrito;
    } else if (item.category !== "T-shirts") {
      const enCarrito = carrito.reduce((total, p) => {
        return p.id === item.id ? total + p.cantidad : total;
      }, 0);
      stockDisponible = stockTotal - cantidadVendida - enCarrito;
    }

    setCantidad((prev) => Math.min(prev + 1, stockDisponible));
  };

  const handleAgregarAlCarrito = () => {
    if (item.category === "T-shirts" && !talleSeleccionado) {
      alert("Por favor, selecciona un talle.");
      return;
    }

    const enCarrito = item.category === "T-shirts"
      ? carrito.reduce((total, p) =>
        p.id === item.id && p.talle === talleSeleccionado ? total + p.cantidad : total,
        0)
      : carrito.reduce((total, p) => (p.id === item.id ? total + p.cantidad : total), 0);

    const stockDisponible = item.category === "T-shirts"
      ? stockTotal[talleSeleccionado] - cantidadVendida[talleSeleccionado] - enCarrito
      : stockTotal - cantidadVendida - enCarrito;

    if (cantidad > stockDisponible) {
      alert("No hay suficiente stock disponible.");
      return;
    }

    agregarAlCarrito(item, cantidad, item.category === "T-shirts" ? talleSeleccionado : null);
    setCantidad(1);
    setTalleSeleccionado("");
  };

  const handleEliminarDelCarrito = () => {
    const cantidadEnCarrito = carrito.find((p) => p.id === item.id)?.cantidad || 0;
    eliminarDelCarrito(item.id, Math.min(cantidadEnCarrito, cantidad));
    setCantidad(1);
  };

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

  const cantidadEnCarrito = carrito.reduce((total, p) => {
    return p.id === item.id ? total + p.cantidad : total;
  }, 0);

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
                Unique size
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
            disabled={
              item.category === "T-shirts"
                ? !talleSeleccionado || cantidadVendida[talleSeleccionado] >= stockTotal[talleSeleccionado]
                : cantidadVendida >= stockTotal
            }
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
            <li>Includes Bandcamp download code and stickers</li>
          </ul>

          <div className="sizeChartContainer">
            <p className="sizeTitle">Size Chart</p>
            <ul>
              <li><span>SIZE A:</span> Marco is 1.80m and wears Size L</li>
              <li><span>SIZE B:</span> Nina is 1.71m and wears Size M</li>
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
