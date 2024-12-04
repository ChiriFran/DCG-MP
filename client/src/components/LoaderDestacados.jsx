import { GridLoader } from "react-spinners";
import '../styles/LoaderDestacados.css'

function LoaderDestacados() {
  return (
    <div className="clipLoaderContianerDestacados">
      <GridLoader
        color="#fff"
        size={15}
        aria-label="Loading..."
        data-testid="loader"
      />
    </div>
  );
}

export default LoaderDestacados;
