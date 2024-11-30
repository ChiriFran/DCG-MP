import React from "react";
import { useParams } from "react-router-dom";
import ItemListDestacados from "./ItemListDestacados";
import LoaderDestacados from "./LoaderDestacados";
import useDestacados from "../helpers/useDestacados";

const ItemListContainerDestacados = () => {
  const { category } = useParams();
  const { productos, isLoading } = useDestacados(category);

  if (isLoading) return <LoaderDestacados />;

  return (
    <>
      <h3 className="homeText">Shop</h3>
      <ItemListDestacados productos={productos} />
    </>
  );
};

export default ItemListContainerDestacados;
