import { createContext, useContext, useState } from "react";

const OrdenCompraContext = createContext();

export const OrdenCompraProvider = ({ children }) => {
  const [orderId, setOrderId] = useState(null);

  const updateOrderId = (id) => setOrderId(id);

  return (
    <OrdenCompraContext.Provider value={{ orderId, updateOrderId }}>
      {children}
    </OrdenCompraContext.Provider>
  );
};

export const useOrdenCompraContext = () => useContext(OrdenCompraContext);
