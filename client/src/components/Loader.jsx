import { GridLoader } from "react-spinners";
import '../styles/Loader.css'

function Loader() {
  return (
    <div className="clipLoaderContianer">
      <GridLoader
        color="#fff"
        size={15}
        aria-label="Loading..."
        data-testid="loader"
      />
    </div>
  );
}

export default Loader;
