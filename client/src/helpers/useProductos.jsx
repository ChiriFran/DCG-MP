import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const useProductos = (searchTerm = "", category = "", urlCategory = "") => {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [titulo, setTitulo] = useState("Todos los productos");

  useEffect(() => {
    setIsLoading(true);
    const productosDb = collection(db, "productos");
    let qProductos = productosDb;

    if (category || urlCategory) {
      // Filtra por categoría en la consulta si se define category o urlCategory
      qProductos = query(productosDb, where("category", "==", category || urlCategory));
    }

    getDocs(qProductos)
      .then((productosResp) => {
        // Extrae productos y aplica filtro de búsqueda de título si es necesario
        let data = productosResp.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

        if (searchTerm) {
          // Filtrado parcial en cliente por coincidencias en el título
          data = data.filter((producto) =>
            producto.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setProductos(data);
        setIsLoading(false);

        if (category) {
          setTitulo(capitalizeFirstLetter(category));
        } else if (urlCategory) {
          setTitulo(capitalizeFirstLetter(urlCategory));
        } else {
          setTitulo("Todos los productos");
        }
      })
      .catch((error) => {
        console.error("Error fetching documents: ", error);
        setIsLoading(false);
      });
  }, [searchTerm, category, urlCategory]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return { productos, isLoading, titulo };
};

export default useProductos;
