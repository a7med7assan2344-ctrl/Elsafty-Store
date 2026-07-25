import React, { useState } from "react";
import "./Admin.css";

import {
  addProduct,
  editProduct,
  removeProduct,
} from "../../services/productService";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

function Admin({ products, loadProducts }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("إلكترونيات");
  const [rating, setRating] = useState(5);
  const [stock, setStock] = useState(1);
  const [image, setImage] = useState("");

  const [editingId, setEditingId] = useState(null);

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setCategory("إلكترونيات");
    setRating(5);
    setStock(1);
    setImage("");
    setEditingId(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !price || !image) {
      alert("اكمل البيانات");
      return;
    }

    try {
      let imageUrl = image;

      // رفع الصورة إلى Cloudinary
      if (image.startsWith("data:")) {
        const formData = new FormData();
        const blob = await (await fetch(image)).blob();

        formData.append("file", blob);
        formData.append("upload_preset", "elsafty_store");

        const upload = await fetch(
          "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await upload.json();

        if (!upload.ok) {
          console.log(uploadData);
          alert("فشل رفع الصورة");
          return;
        }

        imageUrl = uploadData.secure_url;
      }

      const product = {
        title,
        description,
        price: Number(price),
        image: imageUrl,
        category,
        rating: Number(rating),
        stock: Number(stock),
      };

      if (editingId) {
        await editProduct(editingId, product);
      } else {
        await addProduct(product);
      }

      await loadProducts();
      clearForm();

      alert(editingId ? "تم تعديل المنتج" : "تمت إضافة المنتج");
    } catch (error) {
      console.log(error);
      alert("حدث خطأ أثناء حفظ المنتج");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price);
    setCategory(product.category);
    setRating(product.rating);
    setStock(product.stock);
    setImage(product.image);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف المنتج؟")) return;

    try {
      await removeProduct(id);
      await loadProducts();
      alert("تم حذف المنتج");
    } catch (error) {
      console.log(error);
      alert("فشل الحذف");
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="admin-container">
      {/* هيدر لوحة التحكم مع زر الخروج */}
      <div className="admin-top-bar">
        <h2>لوحة التحكم</h2>
        <button className="logout-btn" onClick={handleLogout}>
          تسجيل خروج 🚪
        </button>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="اسم المنتج"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="وصف المنتج"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>إلكترونيات</option>
          <option>أزياء</option>
          <option>منزل ومطبخ</option>
          <option>موبايلات</option>
          <option>لابتوبات</option>
          <option>أخرى</option>
        </select>

        <input
          type="number"
          placeholder="التقييم"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />

        <input
          type="number"
          placeholder="المخزون"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <input type="file" accept="image/*" onChange={handleImageUpload} />

        <input
          type="text"
          placeholder="رابط الصورة"
          value={image.startsWith("data:") ? "" : image}
          onChange={(e) => setImage(e.target.value)}
        />

        {image && <img src={image} alt="preview" className="img-preview" />}

        <button type="submit">
          {editingId ? "حفظ التعديل" : "إضافة المنتج"}
        </button>
      </form>

      <hr />

      <h2>المنتجات</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>الصورة</th>
            <th>الاسم</th>
            <th>السعر</th>
            <th>القسم</th>
            <th>المخزون</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <img src={p.image} alt={p.title} className="table-img" />
              </td>
              <td>{p.title}</td>
              <td>{p.price} ج.م</td>
              <td>{p.category}</td>
              <td>{p.stock}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(p)}>
                  تعديل
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(p.id)}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;