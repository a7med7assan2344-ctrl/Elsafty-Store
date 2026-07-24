import React, { useState } from 'react';
import './Checkout.css';

function Checkout({ cart, setCart, setCurrentView }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleWhatsAppOrder = (e) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert('الرجاء إكمال بيانات الشحن (الاسم، الهاتف، العنوان)');
      return;
    }

    // رقم الواتساب الخاص بك (عدل الرقم ده برقمك الحقيقي مع الكود الدولي)
    const adminWhatsApp = "201000000000"; 

    let message = `🛒 *طلب جديد من متجر أمازون مصر* 🛒\n\n`;
    message += `👤 *الاسم:* ${name}\n`;
    message += `📞 *الهاتف:* ${phone}\n`;
    message += `📍 *العنوان:* ${address}\n\n`;
    message += `📦 *المنتجات المطلوبة:*\n`;

    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.title} (العدد: ${item.quantity}) - السعر: ${item.price * item.quantity} ج.م\n`;
    });

    message += `\n💰 *الإجمالي الكلي:* ${totalPrice} ج.م`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodedMessage}`;

    // فتح واتساب وإفراغ السلة
    window.open(whatsappUrl, '_blank');
    setCart([]);
    setCurrentView('store');
    alert('تم إرسال طلبك بنجاح عبر الواتساب!');
  };

  return (
    <div className="checkout-container">
      <h2>إتمام الطلب وإرساله للواتساب</h2>
      <form onSubmit={handleWhatsAppOrder} className="checkout-form">
        <div className="form-group">
          <label>الاسم الكامل:</label>
          <input type="text" placeholder="أدخل اسمك هنا" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>رقم الهاتف:</label>
          <input type="tel" placeholder="010xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>عنوان الشحن بالتفصيل:</label>
          <textarea placeholder="المحافظة، المدينة، الشارع، رقم الحائط..." value={address} onChange={(e) => setAddress(e.target.value)} required rows="3" style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
        </div>

        <div className="order-summary-box">
          <h4>ملخص الطلب: {totalPrice} ج.م</h4>
        </div>

        <button type="submit" className="whatsapp-submit-btn">
          إرسال الطلب الآن عبر الواتساب 🟢
        </button>
      </form>
    </div>
  );
}

export default Checkout;