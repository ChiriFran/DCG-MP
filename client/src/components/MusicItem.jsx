import React from "react";
import "../styles/MusicItem.css";

const MusicItem = ({ disco }) => {
  return (
    <div className="musicItemContainer">
      <div className="musicItem">
        <iframe
          className="musicIframe"
          title="Reproductor de música"
          src={disco.urlSong}
          seamless
        ></iframe>
        <a
          className="BuyBtn"
          href={disco.urlToBuy}
          target="_blank"
          rel="noopener noreferrer"
        >
          ${disco.price}.-
        </a>
      </div>
    </div>
  );
};

export default MusicItem;