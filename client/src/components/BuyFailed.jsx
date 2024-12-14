import { useEffect } from 'react';
import { useOrdenCompraContext } from '../context/OrdenCompraContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const BuyFailed = () => {
  const { orderId } = useOrdenCompraContext();

  useEffect(() => {
    if (orderId) {
      // Actualiza el estado del pedido a "Failed"
      const orderRef = doc(db, 'pedidos', orderId);
      updateDoc(orderRef, { estado: 'Failed' })
        .then(() => {
          console.log('Pedido actualizado a Failed');
        })
        .catch((error) => {
          console.error('Error al actualizar el pedido:', error);
        });
    }
  }, [orderId]);

  return (
    <div>
      <h1>Compra fallida</h1>
      <p>Lo sentimos, hubo un problema con tu compra.</p>
    </div>
  );
};

export default BuyFailed;
