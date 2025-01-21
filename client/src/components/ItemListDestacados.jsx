import React, { useState, useEffect } from "react";
import ItemDestacados from "./ItemDestacados";
import "../styles/ItemListDestacados.css";

const ItemListDestacados = ({ productos }) => {
  const [itemsPerView, setItemsPerView] = useState(4); // Número inicial de productos visibles
  const [currentIndex, setCurrentIndex] = useState(0);

  // Actualizar itemsPerView según el ancho de la ventana
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width <= 700) {
        setItemsPerView(1); // Solo 1 elemento visible hasta 700px
      } else if (width <= 1024) {
        setItemsPerView(2); // 2 elementos visibles hasta 1024px
      } else {
        setItemsPerView(4); // Valor por defecto para pantallas grandes
      }
    };

    updateItemsPerView(); // Inicializa el valor
    window.addEventListener("resize", updateItemsPerView); // Escucha cambios en el tamaño de la ventana

    return () => {
      window.removeEventListener("resize", updateItemsPerView); // Limpia el evento al desmontar el componente
    };
  }, []);

  return (
    <div className="productosDestacadosContainer">
      <div className="productosDestacadosWrapper">
        <div
          className="productosDestacados"
          data-items-per-view={itemsPerView}
          data-current-index={currentIndex}
        >
          {productos.map((prod, index) => (
            <div
              className="sliderItem"
              key={`${prod.id}-${index}`}
              data-items-per-view={itemsPerView}
            >
              <ItemDestacados producto={prod} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemListDestacados;
