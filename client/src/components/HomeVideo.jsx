import React, { useRef, useEffect, useState } from "react";
import homeVideoDesktop from "../../media/video/DCG-hero-desktop.mp4";
import homeVideoMobile from "../../media/video/DCG-hero-mobile.mp4";
import homePoster from "../../media/video/heroFallback.png"; // Imagen fija de respaldo
import "../styles/HomeVideo.css";

function HomeVideo() {
  const videoRef = useRef(null);
  const [showFallback, setShowFallback] = useState(false);

  // Detectar si el navegador es el WebView de Instagram (o similar)
  const isInstagramBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return ua.toLowerCase().includes("instagram");
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const useMobile = window.innerWidth <= 700;
    video.src = useMobile ? homeVideoMobile : homeVideoDesktop;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        console.warn("Autoplay bloqueado o no permitido, usando fallback:", err);
        setShowFallback(true);
      }
    };

    // En navegadores embebidos como Instagram, forzamos fallback directamente
    if (isInstagramBrowser()) {
      setShowFallback(true);
      return;
    }

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("error", () => setShowFallback(true));

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("error", () => setShowFallback(true));
    };
  }, []);

  if (showFallback) {
    return (
      <div className="homeVideoContainer">
        <div className="homeVideoContainerTexture">
          <img
            src={homePoster}
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
          poster={homePoster}
        />
      </div>
    </div>
  );
}

export default HomeVideo;
