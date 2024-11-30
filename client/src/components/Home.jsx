import React, { useState, useEffect } from "react";
import "../styles/Home.css";
import ItemListContainerDestacados from "./ItemListContainerDestacados";
import HomeVideo from "./HomeVideo";
import PopUpNewsletter from "./PopUpNewsletter";

const Home = () => {
  const [showPopUp, setShowPopUp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopUp(true);
    }, 5000); // 5 segundos de retraso para mostrar el popup

    return () => clearTimeout(timer); // Limpiar el temporizador al desmontar el componente
  }, []);

  const closePopUp = () => {
    setShowPopUp(false);
  };

  return (
    <section className="homeContainer">
      <HomeVideo />
      <ItemListContainerDestacados />
      <PopUpNewsletter isOpen={showPopUp} onClose={closePopUp} />
    </section>
  );
};

export default Home;
