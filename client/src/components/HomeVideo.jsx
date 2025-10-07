import React, { useRef, useEffect, useState } from "react";
import homeVideoDesktop from "../../media/video/DCG-hero-desktop.mp4";
import homeVideoMobile from "../../media/video/DCG-hero-mobile.mp4";
import homePosterDesktop from "../../media/video/heroFallback-desktop.png";
import homePosterMobile from "../../media/video/heroFallback-mobile.png"; 
import "../styles/HomeVideo.css";

function HomeVideo() {
  const videoRef = useRef(null);
  const [showFallback, setShowFallback] = useState(false);
  const [poster, setPoster] = useState(homePosterDesktop);

  // Detectar si el navegador es el WebView de Instagram (o similar)
  const isInstagramBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return ua.toLowerCase().includes("instagram");
  };

  // Función para determinar si usamos versión mobile
  const isMobile = () => window.innerWidth <= 700;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Selecciona el video y poster según tamaño
    video.src = isMobile() ? homeVideoMobile : homeVideoDesktop;
    setPoster(isMobile() ? homePosterMobile : homePosterDesktop);

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        console.warn("Autoplay bloqueado o no permitido, usando fallback:", err);
        setShowFallback(true);
      }
    };

    // Forzamos fallback en Instagram Browser
    if (isInstagramBrowser()) {
      setShowFallback(true);
      return;
    }

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("error", () => setShowFallback(true));

    // Actualizar poster al redimensionar
    const handleResize = () => {
      setPoster(isMobile() ? homePosterMobile : homePosterDesktop);
      if (!isMobile()) video.src = homeVideoDesktop;
      else video.src = homeVideoMobile;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("error", () => setShowFallback(true));
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (showFallback) {
    return (
      <div className="homeVideoContainer">
        <div className="homeVideoContainerTexture">
          <img
            src={poster}
            alt="Inicio"
            className="homeVideoFallback"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="homeVideoContainer">
      <div className="homeVideoContainerTexture">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
        />
      </div>
    </div>
  );
}

export default HomeVideo;
