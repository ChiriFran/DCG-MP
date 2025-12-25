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
      {producto.preSalePrice ? (
        <div className="itemPriceContainer">
          <h3 className="itemPrice itemPriceOld">
            ${producto.price}.-
          </h3>
          <h3 className="itemPrice itemPriceSale">
            ${producto.preSalePrice}.-
          </h3>
        </div>
      ) : (
        <h3 className="itemPrice">
          ${producto.price}.-
        </h3>
      )}
    </div>
  );
};

export default Item;
