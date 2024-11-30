import React, { useRef, useEffect } from "react";
import homeVideoDesktop from "../../media/video/DCG-hero-desktop.mp4";
import homeVideoMobile from "../../media/video/DCG-hero-mobile.mp4";
import "../styles/HomeVideo.css";

function HomeVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      video.play().catch((error) => {
        console.log("Failed to autoplay:", error);
      });
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  return (
    <div className="homeVideoContainer">
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        muted
      >
        <source src={homeVideoMobile} type="video/mp4" media="(max-width: 700px)" />
        <source src={homeVideoDesktop} type="video/mp4" media="(min-width: 701px)" />
        Su navegador no soporta la etiqueta de vídeo.
      </video>
    </div>
  );
}

export default HomeVideo;
