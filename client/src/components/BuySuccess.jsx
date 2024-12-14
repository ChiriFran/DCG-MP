import { useEffect } from 'react';
import { useOrdenCompraContext } from '../context/OrdenCompraContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const BuySuccess = () => {
  const { orderId } = useOrdenCompraContext();

  useEffect(() => {
    if (orderId) {
      // Actualiza el estado del pedido a "Success"
      const orderRef = doc(db, 'pedidos', orderId);
      updateDoc(orderRef, { estado: 'Success' })
        .then(() => {
          console.log('Pedido actualizado a Success');
        })
        .catch((error) => {
          console.error('Error al actualizar el pedido:', error);
        });
    }
  }, [orderId]);

  return (
    <div>
      <h1>Compra exitosa</h1>
      <p>Gracias por tu compra.</p>
    </div>
  );
};

export default BuySuccess;
