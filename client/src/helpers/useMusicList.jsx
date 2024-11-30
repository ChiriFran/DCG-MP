import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const useMusicList = (searchTerm, category, urlCategory) => {
  const [discos, setDiscos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const musicDb = collection(db, "music");
    let qMusic = musicDb;

    if (searchTerm && category) {
      qMusic = query(
        musicDb,
        where("title", "==", searchTerm),
        where("category", "==", category)
      );
    } else if (searchTerm) {
      qMusic = query(musicDb, where("title", "==", searchTerm));
    } else if (category) {
      qMusic = query(musicDb, where("category", "==", category));
    } else if (urlCategory) {
      qMusic = query(musicDb, where("category", "==", urlCategory));
    }

    getDocs(qMusic)
      .then((musicResp) => {
        const sortedDiscos = musicResp.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Ordenar de mayor a menor según el id convertido a número
        setDiscos(sortedDiscos);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching music documents: ", error);
        setIsLoading(false);
      });
  }, [searchTerm, category, urlCategory]);

  return { discos, isLoading };
};

export default useMusicList;
