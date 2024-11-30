import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const useMusicDestacados = () => {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMusicDestacados = async () => {
      const productosDb = collection(db, "music");
      setIsLoading(true);

      try {
        const res = await getDocs(productosDb);
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

    fetchMusicDestacados();
  }, []);

  return { productos, isLoading };
};

export default useMusicDestacados;
