import React, { useState } from "react";
import ItemDestacados from "./ItemDestacados";
import "../styles/ItemListDestacados.css";
import arrowLeft from '../../media/icons/arrow-left.svg';
import arrowRight from '../../media/icons/arrow-right.svg';


const ItemListDestacados = ({ productos }) => {
  const itemsPerView = 4; // Número de productos visibles al mismo tiempo
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? productos.length - 1 : prevIndex - 1
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
        <img src={arrowRight} alt="next" title="next" />      </button>
    </div>
  );
};

export default ItemListDestacados;
