import { Link } from "react-router-dom";
import "../styles/ItemDestacados.css";

const ItemDestacados = ({ producto }) => {
  // Asegúrate de que 'producto' no es undefined
  if (!producto) {
    return null;
  }

  // Asegúrate de que 'producto.title' no es undefined
  const title = producto.title ? producto.title : "";

  return (
    <>
      <div className="card itemDestacados">
        <div className="card-img itemDestacadosImgContainer">
          <img
            src={producto.image}
            alt={title}
            className="itemDestacadosImg"
          ></img>
          <Link
            to={`/ProductoDetalles/${producto.id}`}
            className="ver-mas itemDestacadosButton"
          ></Link>
        </div>
        <div className="card-info">
          <h4 className="text-body">
            {title.length > 6 ? title.substring(0, 10) + "..." : title}
          </h4>
        </div>
        <div className="card-footer">
          <span className="ntext-title itemDestacadosPrice">
            ${producto.price}.-
          </span>
        </div>
      </div>
    </>
  );
};

export default ItemDestacados;
