import { useState } from "react";
import { useParams } from "react-router-dom";

import ItemList from "./ItemList";
import MusicList from "./MusicList";
import Loader from "./Loader";
import NoResultFound from "./NoResultsFound"; // Asegúrate de importar el componente
import SearchFilters from "./SearchFilters";
import useProductos from "../helpers/useProductos";

import "../styles/ItemListContainer.css";

const ItemListContainer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const { category: urlCategory } = useParams();

  const { productos, isLoading, titulo } = useProductos(
    searchTerm,
    category,
    urlCategory
  );

  const handleSearch = (searchFilters) => {
    setSearchTerm(searchFilters.title);
    setCategory(searchFilters.category);
  };

  if (isLoading) return <Loader />;

  // Verifica si no hay productos después de la carga
  const hasNoResults = productos.length === 0;

  return (
    <div className="shopContainer">
      <SearchFilters onSearch={handleSearch} />
      <div className="productosContainer">
        {hasNoResults ? (
          <NoResultFound searchTerm={searchTerm} /> // Pasa searchTerm al componente
        ) : (
          <>
            <div className="itemListContainer">
              <ItemList productos={productos} titulo={titulo} />
            </div>
            <MusicList
              searchTerm={searchTerm}
              category={category}
              urlCategory={urlCategory}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ItemListContainer;
