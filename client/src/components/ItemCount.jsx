import '../styles/ItemCount.css'

const ItemCount = ( {cantidad, handleSumar, handleRestar, handleAgregar} ) => {

  return (
    <div className='itemCountContainer'>
      <div className="itemCount">
        <span className='cantidadSpan'>Quantity</span>
        <button className='btnContador' onClick={handleRestar}>-</button>
        <p className='cantidad'>{cantidad}</p>
        <button className='btnContador' onClick={handleSumar}>+</button>
      </div>
      <button className="agregar-al-carrito" onClick={handleAgregar}>Add to cart</button>
    </div>
  );
};

export default ItemCount;
