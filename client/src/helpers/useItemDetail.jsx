import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const useItemDetail = (id) => {
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const fetchItem = async () => {
      try {
        const docDb = doc(db, "productos", id);
        const docSnapshot = await getDoc(docDb);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const itemWithStock = {
            ...data,
            id: docSnapshot.id,
            stock: data.stock || 10,
          };
          setItem(itemWithStock);
        } else {
          console.log("No existe el documento con el ID proporcionado");
          alert("No existe el documento con el ID proporcionado");
        }
      } catch (error) {
        alert("Error obteniendo el documento:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  return { item, isLoading };
};

export default useItemDetail;
