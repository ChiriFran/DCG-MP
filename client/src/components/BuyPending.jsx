import { useEffect } from 'react';
import { useOrdenCompraContext } from '../context/OrdenCompraContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import '../styles/Pending.css'

const BuyPending = () => {
  const { orderId } = useOrdenCompraContext();

  useEffect(() => {
    if (orderId) {
      // Actualiza el estado del pedido a "Pending"
      const orderRef = doc(db, 'pedidos', orderId);
      updateDoc(orderRef, { estado: 'Pending' })
        .then(() => {
          console.log('Pedido actualizado a Pending');
        })
        .catch((error) => {
          console.error('Error al actualizar el pedido:', error);
        });
    }
  }, [orderId]);

  return (
    <div className='pendingContainer'>
      <h1>Compra pendiente</h1>
      <p>Estamos procesando tu compra. Te avisaremos pronto.</p>
    </div>
  );
};

export default BuyPending;
