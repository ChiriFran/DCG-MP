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
        setItemsPerView(2); // ← CAMBIADO DE 1 A 2
      } else if (width <= 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => {
      window.removeEventListener("resize", updateItemsPerView);
    };
  }, []);

  // Manejar el avance del slider
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + itemsPerView < productos.length ? prevIndex + itemsPerView : prevIndex
    );
  };

  // Manejar el retroceso del slider
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - itemsPerView >= 0 ? prevIndex - itemsPerView : 0
    );
  };

  // Calcular el desplazamiento del slider
  const sliderOffset = -(currentIndex * (100 / itemsPerView));

  return (
    <div className="productosDestacadosContainer">
      <button
        className="sliderButton prevButton"
        onClick={handlePrev}
        disabled={currentIndex === 0}
      >
        &#8592;
      </button>

      <div className="productosDestacadosWrapper">
        <div
          className="productosDestacados"
          style={{ transform: `translateX(${sliderOffset}%)` }}
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

      <button
        className="sliderButton nextButton"
        onClick={handleNext}
        disabled={currentIndex + itemsPerView >= productos.length}
      >
        &#8594;
      </button>
    </div>
  );
};

export default ItemListDestacados;
