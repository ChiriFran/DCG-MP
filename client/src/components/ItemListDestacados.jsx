import React, { useState, useEffect } from "react";
import ItemDestacados from "./ItemDestacados";
import "../styles/ItemListDestacados.css";
import arrowLeft from '../../media/icons/arrow-left.svg';
import arrowRight from '../../media/icons/arrow-right.svg';

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

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? productos.length - itemsPerView : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      (prevIndex + 1) % productos.length
    );
  };

  return (
    <div className="productosDestacadosContainer">
      <button className="sliderButton prevButton" onClick={handlePrev}>
        <img src={arrowLeft} alt="prev" title="prev" />
      </button>
      <div className="productosDestacadosWrapper">
        <div
          className="productosDestacados"
          style={{
            transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
            width: `${(productos.length / itemsPerView) * 100}%`,
          }}
        >
          {productos.map((prod, index) => (
            <div
              className="sliderItem"
              key={`${prod.id}-${index}`}
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <ItemDestacados producto={prod} />
            </div>
          ))}
        </div>
      </div>
      <button className="sliderButton nextButton" onClick={handleNext}>
        <img src={arrowRight} alt="next" title="next" />
      </button>
    </div>
  );
};

export default ItemListDestacados
