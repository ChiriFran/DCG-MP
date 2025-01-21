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
          console.log("The document with the provided ID does not exist");
          alert("The document with the provided ID does not exist");
        }
      } catch (error) {
        alert("Error obtaining the document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  return { item, isLoading };
};

export default useItemDetail;
