import { Link } from "react-router-dom";
import "../styles/Item.css";

const Item = ({ producto }) => {
  return (
    <div className="item">
      <div className="itemImgContainer">
        <img
          src={producto.image}
          alt={producto.title}
          className="itemImg"
        ></img>
        <Link
          to={`/ProductoDetalles/${producto.id}`}
          className="ver-mas itemButton"
        ></Link>
      </div>
      <h2 className="itemTitle">
        {producto.title}
      </h2>
      <h3 className="itemPrice">${producto.price}.-</h3>{" "}
    </div>
  );
};

export default Item;
