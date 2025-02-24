import { useContext, useState } from "react";
import ItemCount from "./ItemCount";
import "../styles/ItemDetail.css";
import { CartContext } from "../context/CartContext";

const ItemDetail = ({ item }) => {
  const { carrito, agregarAlCarrito, eliminarDelCarrito } = useContext(CartContext);
  const [cantidad, setCantidad] = useState(1);
  const [talleSeleccionado, setTalleSeleccionado] = useState("");

  const handleRestar = () => {
    setCantidad((prevCantidad) => Math.max(prevCantidad - 1, 1));
  };

  const handleSumar = () => {
    setCantidad((prevCantidad) => Math.min(prevCantidad + 1, item.stock));
  };

  const handleAgregarAlCarrito = () => {
    if (item.category === "T-shirts" && !talleSeleccionado) {
      alert("Por favor, selecciona un talle antes de agregar al carrito.");
      return;
    }

    const productoConTalle = {
      ...item,
      cantidad,
      talleSeleccionado: item.category === "T-shirts" ? talleSeleccionado : null,
    };

    console.log("Producto agregado al carrito:", productoConTalle); // 👀 Verifica si el talle está aquí

    agregarAlCarrito(productoConTalle, cantidad);

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
              // Mostrar todos los talles disponibles
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
              // Mostrar un solo botón deshabilitado para talla única
              <button className="size-button single-size" disabled>
                Unique sizes available
              </button>
            )}
          </div>
        </div>

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
