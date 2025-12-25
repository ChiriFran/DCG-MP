import { useState } from "react";
import { useParams } from "react-router-dom";

import ItemList from "./ItemList";
import MusicList from "./MusicList";
import SearchFilters from "./SearchFilters";
import useProductos from "../helpers/useProductos";

import heroShop from "../../media/video/hero-chombas.png";

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

  // 👉 Ordena productos con preSalePrice arriba
  const productosOrdenados = [...productos].sort((a, b) => {
    const aTienePreventa = a.preSalePrice ? 1 : 0;
    const bTienePreventa = b.preSalePrice ? 1 : 0;

    return bTienePreventa - aTienePreventa;
  });

  const handleSearch = (searchFilters) => {
    setSearchTerm(searchFilters.title);
    setCategory(searchFilters.category);
  };

  return (
    <div className="shopContainer">
      {/* HERO */}
      <div className="heroShop">
        <img src={heroShop} alt="Hero shop" />
      </div>

      <SearchFilters onSearch={handleSearch} />

      <div className="productosContainer">
        <ItemList
          productos={productosOrdenados}
          titulo={titulo}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />

        <MusicList
          searchTerm={searchTerm}
          category={category}
          urlCategory={urlCategory}
        />
      </div>
    </div>
  );
};

export default ItemListContainer;
