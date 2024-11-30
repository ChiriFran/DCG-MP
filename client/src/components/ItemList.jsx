import Item from "./Item";
import "../styles/ItemList.css";

const ItemList = ({ productos, titulo }) => {
  return (
    <>
      <h2 className="categoryTitle">{titulo}</h2>
      <div className="productosContenedor">
        {productos.map((prod) => (
          <Item producto={prod} key={prod.id} />
        ))}
      </div>
    </>
  );
};

export default ItemList;
