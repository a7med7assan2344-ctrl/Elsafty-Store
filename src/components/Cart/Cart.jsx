import React from 'react';
import './Cart.css';

function Cart({ cart, updateQuantity, removeFromCart, setCurrentView }) {
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>سلة مشتريات أمازون فارغة</h2>
        <p>ليس لديك أي منتجات في السلة حالياً.</p>
        <button className="back-store-btn" onClick={() => setCurrentView('store')}>تسوق الآن</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>سلة المشتريات</h2>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.title} />
            <div className="cart-item-details">
              <h4>{item.title}</h4>
              <p className="cart-item-price">{item.price} ج.م</p>
              <div className="cart-controls">
                <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h3>المجموع الكلي: <span>{totalPrice} ج.م</span></h3>
        <button className="checkout-btn" onClick={() => setCurrentView('checkout')}>إتمام الطلب عبر واتساب</button>
      </div>
    </div>
  );
}

export default Cart;