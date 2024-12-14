import { createContext, useContext, useState } from 'react';

// Contexto para manejar el ID del pedido
const OrdenCompraContext = createContext();

export const useOrdenCompraContext = () => {
  return useContext(OrdenCompraContext);
};

export const OrdenCompraProvider = ({ children }) => {
  const [orderId, setOrderId] = useState(null);

  const updateOrderId = (id) => {
    setOrderId(id);
  };

  const resetOrderId = () => {
    setOrderId(null);
  };

  return (
    <OrdenCompraContext.Provider value={{ orderId, updateOrderId, resetOrderId }}>
      {children}
    </OrdenCompraContext.Provider>
  );
};
