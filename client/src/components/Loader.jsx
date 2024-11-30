import { HashLoader } from "react-spinners";
import '../styles/Loader.css'

function Loader() {
  return (
    <div className="clipLoaderContianer">
      <HashLoader
        color="#fff"
        size={50}
        aria-label="Loading..."
        data-testid="loader"
      />
      <span>Loading...</span>
    </div>
  );
}

export default Loader;
