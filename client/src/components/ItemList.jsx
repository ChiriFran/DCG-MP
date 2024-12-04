import Loader from "./Loader"; // Asegúrate de importar el componente Loader
import NoResultFound from "./NoResultsFound"; // Asegúrate de importar NoResultFound
import Item from "./Item";
import "../styles/ItemList.css";

const ItemList = ({ productos, titulo, isLoading, searchTerm }) => {
  if (isLoading) return <Loader />; // Mueve la lógica de loading aquí

  if (productos.length === 0) {
    return <NoResultFound searchTerm={searchTerm} />; // Mueve la lógica de NoResultFound aquí
  }

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
