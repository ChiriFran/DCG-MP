import { useParams } from "react-router-dom";
import ItemDetail from "./ItemDetail";
import ItemListContainerDestacados from "./ItemListContainerDestacados";
import Loader from "./Loader";
import useItemDetail from "../helpers/useItemDetail";

import "../styles/ItemDetailContainer.css";
import "../styles/Item.css";

const ItemDetailContainer = () => {
  const { id } = useParams();
  const { item, isLoading } = useItemDetail(id);

  if (isLoading) return <Loader />;

  return (
    <>
      <div className="detailContainer">{item && <ItemDetail item={item} />}</div>
      <ItemListContainerDestacados />
    </>
  );
};

export default ItemDetailContainer;
