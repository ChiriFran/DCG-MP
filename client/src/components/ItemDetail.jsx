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
    if (!talleSeleccionado) {
      alert("Por favor, selecciona un talle antes de agregar al carrito.");
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
  };

  return (
    <div className="itemDetailContainer">
      <div className="itemDetail">
        <h3 className="itemDetailTitle">{item.title}</h3>
        <p className="itemDetailPrice">${item.price}.-</p>

        <div className="sizeSelectorContainer">
          <h3>Size</h3>
          <div id="size-selector">
            {["S", "M", "L", "XL", "XXL"].map((talle) => (
              <button
                key={talle}
                className={`size-button ${talle === talleSeleccionado ? "selected" : ""}`}
                onClick={() => handleTalleSeleccionado(talle)}
              >
                {talle}
              </button>
            ))}
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
          Cart: {cantidadEnCarrito} unit/s added.
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
          <div className="sizeGridContainer">
            <div className="sizeGrid">
              {/* talles */}
              <div className="divVacio"></div>
              <div className="talleS">S</div>
              <div className="talleM">M</div>
              <div className="talleL">L</div>
              <div className="talleXL">XL</div>
              <div className="talleXXL">XXL</div>
              {/* largo */}
              <div className="longitud">Length</div>
              <div className="longitudS">60</div>
              <div className="longitudM">62</div>
              <div className="longitudL">66</div>
              <div className="longitudXL">68</div>
              <div className="longitudXXL">70</div>
              {/* pecho */}
              <div className="pecho">Chest</div>
              <div className="pechoS">62</div>
              <div className="pechoM">64</div>
              <div className="pechoL">66</div>
              <div className="pechoXL">68</div>
              <div className="pechoXXL">72</div>
            </div>
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

          <div className="careInstructions">
            <p>Care Instructions</p>
            <ul>
              <li>Wash before use for the perfect look</li>
              <li>Desired vintage effect can be enhanced by washing</li>
              <li>Gentle cycle 30°</li>
              <li>Wash with similar colors</li>
              <li>Wash and iron inside-out</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="itemDetailImgContainer">
        <img className="itemDetailImg" src={item.imageDetail} alt={item.title} />

        <div className="sizeGridContainerDesktop">
          <div className="sizeGrid">
            {/* talles */}
            <div className="divVacio"></div>
            <div className="talleS">S</div>
            <div className="talleM">M</div>
            <div className="talleL">L</div>
            <div className="talleXL">XL</div>
            <div className="talleXXL">XXL</div>
            {/* largo */}
            <div className="longitud">Length</div>
            <div className="longitudS">60</div>
            <div className="longitudM">62</div>
            <div className="longitudL">66</div>
            <div className="longitudXL">68</div>
            <div className="longitudXXL">70</div>
            {/* pecho */}
            <div className="pecho">Chest</div>
            <div className="pechoS">62</div>
            <div className="pechoM">64</div>
            <div className="pechoL">66</div>
            <div className="pechoXL">68</div>
            <div className="pechoXXL">72</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
