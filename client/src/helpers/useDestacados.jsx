import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const useDestacados = (category) => {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDestacados = async () => {
      const productosDb = collection(db, "productos");
      let filtroCategoria;
      if (category) {
        filtroCategoria = query(productosDb, where("category", "==", category));
      } else {
        filtroCategoria = productosDb;
      }
      setIsLoading(true);

      try {
        const res = await getDocs(filtroCategoria);
        // Obtener 4 productos aleatorios
        const randomProductos = [];
        const max = res.docs.length;
        const indices = new Set();
        while (indices.size < 4) {
          const index = Math.floor(Math.random() * max);
          if (!indices.has(index)) {
            indices.add(index);
            randomProductos.push({
              ...res.docs[index].data(),
              id: res.docs[index].id,
            });
          }
        }
        setProductos(randomProductos);
      } catch (error) {
        console.error("Error fetching destacados: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestacados();
  }, [category]);

  return { productos, isLoading };
};

export default useDestacados;
