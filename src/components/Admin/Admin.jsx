import React, { useState } from 'react';
import './Admin.css';

function Admin({ products, setProducts }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('إلكترونيات');
  const [image, setImage] = useState('');
  const [rating, setRating] = useState('4.5');
  const [editingId, setEditingId] = useState(null);

  // دالة رفع الصور عبر Cloudinary (Upload Preset الافتراضي أو رابط مباشر)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // بيحولها لـ Base64 لو مفيش كلووديناري، شغال 100% بدون تعقيد
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !price || !image) {
      alert('الرجاء إدخال اسم المنتج والسعر والصورة!');
      return;
    }

    if (editingId) {
      // تعديل منتج موجود
      setProducts(products.map(p => p.id === editingId ? {
        ...p,
        title,
        price: Number(price),
        category,
        image,
        rating: Number(rating)
      } : p));
      setEditingId(null);
    } else {
      // إضافة منتج جديد
      const newProduct = {
        id: Date.now(),
        title,
        price: Number(price),
        category,
        image,
        rating: Number(rating)
      };
      setProducts([newProduct, ...products]);
    }

    // تفريغ الحقول
    setTitle('');
    setPrice('');
    setImage('');
    setRating('4.5');
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setPrice(product.price);
    setCategory(product.category);
    setImage(product.image);
    setRating(product.rating);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <h2>لوحة التحكم الإدارية - إدارة المنتجات</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد للمتجر'}</h3>
        
        <div className="form-group">
          <label>اسم المنتج:</label>
          <input 
            type="text" 
            placeholder="مثال: سماعة بلوتوث أصلية" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>السعر (ج.م):</label>
            <input 
              type="number" 
              placeholder="1500" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>القسم:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="إلكترونيات">إلكترونيات</option>
              <option value="أزياء">أزياء</option>
              <option value="منزل ومطبخ">منزل ومطبخ</option>
            </select>
          </div>

          <div className="form-group">
            <label>التقييم (من 5):</label>
            <input 
              type="number" 
              step="0.1" 
              max="5" 
              min="1" 
              value={rating} 
              onChange={(e) => setRating(e.target.value)} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>صورة المنتج (رفع من الجهاز أو رابط):</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <input 
            type="text" 
            placeholder="أو ضع رابط صورة مباشر هنا..." 
            value={image.startsWith('data:') ? '' : image} 
            onChange={(e) => setImage(e.target.value)} 
            style={{ marginTop: '5px' }}
          />
          {image && <img src={image} alt="Preview" className="img-preview" />}
        </div>

        <button type="submit" className="save-btn">
          {editingId ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر فوراً'}
        </button>
        {editingId && (
          <button type="button" className="cancel-btn" onClick={() => { setEditingId(null); setTitle(''); setPrice(''); setImage(''); }}>
            إلغاء التعديل
          </button>
        )}
      </form>

      <div className="admin-products-list">
        <h3>المنتجات الحالية في المتجر ({products.length})</h3>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الصورة</th>
                <th>اسم المنتج</th>
                <th>السعر</th>
                <th>القسم</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><img src={p.image} alt={p.title} className="table-img" /></td>
                  <td>{p.title}</td>
                  <td>{p.price} ج.م</td>
                  <td>{p.category}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(p)}>تعديل</button>
                    <button className="delete-btn" onClick={() => handleDelete(p.id)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Admin;