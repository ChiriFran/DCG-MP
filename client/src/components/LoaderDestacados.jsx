import { HashLoader } from "react-spinners";
import '../styles/LoaderDestacados.css'

function LoaderDestacados() {
  return (
    <div className="clipLoaderContianerDestacados">
      <HashLoader
        color="#fff"
        size={50}
        aria-label="Loading..."
        data-testid="loader"
      />
      <span>Cargando productos destacados...</span>
    </div>
  );
}

export default LoaderDestacados;
