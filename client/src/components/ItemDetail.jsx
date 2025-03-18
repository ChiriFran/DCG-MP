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
  const [stockDisponible, setStockDisponible] = useState({});
  const [cantidadVendida, setCantidadVendida] = useState({});
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState("");

  useEffect(() => {
    // Verificar el stock disponible en Firebase cuando se carga el producto
    const consultarStock = async () => {
      try {
        const productoRef = doc(db, "productos", item.id); // Cambié la forma de acceder al documento
        const productoSnapshot = await getDoc(productoRef);
        const productoData = productoSnapshot.data();

        // Verificar el stock por talle (solo para productos "T-shirt")
        if (item.category === "T-shirts") {
          const stockPorTalle = productoData?.stock || {};
          setStockDisponible(stockPorTalle);
        } else {
          const stockTotal = productoData?.stock || 0;
          setStockDisponible({ total: stockTotal });
        }

        // Consultar la cantidad vendida en la colección "stock"
        const stockRef = doc(db, "stock", item.title); // Buscar por nombre del producto
        const stockSnapshot = await getDoc(stockRef);
        const stockData = stockSnapshot.data();

        let cantidadVendidaProducto = {};
        if (stockData) {
          cantidadVendidaProducto = stockData.talles || {}; // Guardar la cantidad vendida por talle
        }
        setCantidadVendida(cantidadVendidaProducto);

      } catch (error) {
        console.error("Error al consultar el stock:", error);
      }
    };

    consultarStock();
  }, [item.id, item.title, item.category]);

  useEffect(() => {
    // Verificar si la cantidad excede el stock disponible por talle
    if (talleSeleccionado && cantidadVendida[talleSeleccionado] >= stockDisponible[talleSeleccionado]) {
      setMensajeAdvertencia(`No hay stock disponible para el talle ${talleSeleccionado}.`);
    } else {
      setMensajeAdvertencia("");
    }
  }, [cantidadVendida, stockDisponible, talleSeleccionado]);

  const handleRestar = () => {
    setCantidad((prevCantidad) => Math.max(prevCantidad - 1, 1));
  };

  const handleSumar = () => {
    if (talleSeleccionado) {
      const stockTalle = stockDisponible[talleSeleccionado] || 0;
      const cantidadTalleVendida = cantidadVendida[talleSeleccionado] || 0;

      // Verificamos que la cantidad no exceda el stock disponible
      if (cantidad + cantidadTalleVendida > stockTalle) {
        alert("No hay suficiente stock disponible para este talle.");
        return;
      }
    }

    setCantidad((prevCantidad) => Math.min(prevCantidad + 1, stockDisponible[talleSeleccionado] - cantidadVendida[talleSeleccionado]));
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

    // Verificamos el stock disponible antes de agregar al carrito
    if (cantidad + (cantidadVendida[talleSeleccionado] || 0) > (stockDisponible[talleSeleccionado] || 0)) {
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

        </div>
      </div>

      <div className="itemDetailImgContainer">
        <img className="itemDetailImg" src={item.imageDetail} alt={item.title} />
      </div>
    </div>
  );
};

export default ItemDetail;
