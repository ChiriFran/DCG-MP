import ItemDestacados from "./ItemDestacados";
import "../styles/ItemListDestacados.css";

const ItemListDestacados = ({ productos }) => {
  return (
    <div className="productosDestacadosContainer">
      <div className="productosDestacados">
        {productos.map((prod) => (
          <ItemDestacados producto={prod} key={prod.id} />
        ))}
      </div>
    </div>
  );
};

export default ItemListDestacados;
