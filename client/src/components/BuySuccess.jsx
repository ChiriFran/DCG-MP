import { useLocation } from 'react-router-dom';

const BuySuccess = () => {
  const [orderId, setOrderId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar si el orderId está en los parámetros de la URL
    const searchParams = new URLSearchParams(location.search);
    const orderIdFromUrl = searchParams.get('orderId'); // Asegúrate de pasar 'orderId' en la URL al redirigir
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
    } else {
      // Intentar obtenerlo desde localStorage si no está en la URL
      const savedOrderId = localStorage.getItem("orderId");
      if (savedOrderId) {
        setOrderId(savedOrderId);
      } else {
        console.error("No orderId found in URL or localStorage");
      }
    }
  }, [location]);

  useEffect(() => {
    if (orderId) {
      const updateOrderStatus = async () => {
        const orderRef = doc(db, "pedidos", orderId);
        await updateDoc(orderRef, { status: "completed" }); // Cambiar estado a "completed"
        console.log(`Order ${orderId} status updated to completed`);
      };

      updateOrderStatus();
    }
  }, [orderId]);

  return (
    <div className="successContainer">
      <h1>Compra exitosa</h1>
      <p>Gracias por tu compra. Tu pedido ha sido procesado.</p>
    </div>
  );
};

export default BuySuccess;
