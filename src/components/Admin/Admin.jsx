JavaScript
import React, {
  useEffect,
  useState,
  useRef
} from "react";

import {
  useNavigate
} from "react-router-dom";


import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc
} from "firebase/firestore";

import {
  db,
  auth
} from "../../firebase";

import {
  signOut
} from "firebase/auth";

import "./Admin.css";

import {
  addProduct,
  editProduct,
  removeProduct
} from "../../services/productService";

import {
  getAllCategories,
  addCategory,
  editCategory,
  removeCategory
} from "../../services/categoryService";

function Admin({
  products,
  loadProducts
}) {

  const navigate = useNavigate();

  // =====================
  // STATES
  // =====================

  const [tab, setTab] = useState("products");

  const [orders, setOrders] = useState([]);
  const [trackingNumbers, setTrackingNumbers] = useState({});
  const [categories, setCategories] = useState([]);

  const firstLoad = useRef(true);

  // =====================
  // PRODUCT STATES
  // =====================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(5);
  const [stock, setStock] = useState(1);

  const [offer, setOffer] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [recommended, setRecommended] = useState(false);

  const [image, setImage] = useState("");
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // =====================
  // CATEGORY STATES
  // =====================

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // =====================
  // AUDIO
  // =====================

  const audio = useRef(
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    )
  );

  // =====================
  // NOTIFICATION
  // =====================

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // =====================
  // TOTAL SALES
  // =====================

  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  // =====================
  // CLEAR PRODUCT FORM
  // =====================

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setOldPrice("");
    setCategory("");
    setRating(5);
    setStock(1);

    setOffer(false);
    setBestSeller(false);
    setNewArrival(false);
    setRecommended(false);

    setImage("");
    setImages([]);
    setEditingId(null);
  };

  // =====================
  // IMAGE UPLOAD
  // =====================

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((result) => {
      setImages(result);
      setImage(result[0]);
    });
  };

  // =====================
  // CATEGORY IMAGE UPLOAD
  // =====================

  const handleCategoryImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCategoryImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // =====================
  // SAVE PRODUCT
  // =====================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !price || !image) {
      alert("اكمل بيانات المنتج");
      return;
    }

    try {
      let uploadedImages = [];

      for (const img of (images.length ? images : [image])) {
        let imageUrl = img;

        if (imageUrl.startsWith("data:")) {
          const formData = new FormData();
          const blob = await (await fetch(imageUrl)).blob();

          formData.append("file", blob);
          formData.append("upload_preset", "elsafty_store");

          const upload = await fetch(
            "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
            {
              method: "POST",
              body: formData
            }
          );

          const data = await upload.json();

          if (!upload.ok) {
            throw new Error("Cloudinary Error");
          }

          imageUrl = data.secure_url;
        }

        uploadedImages.push(imageUrl);
      }

      const product = {
        title,
        description,
        price: Number(price),
        oldPrice: Number(oldPrice || 0),
        image: uploadedImages[0],
        images: uploadedImages,
        category,
        rating: Number(rating),
        stock: Number(stock),
        offer,
        bestSeller,
        newArrival,
        recommended
      };

      if (editingId) {
        await editProduct(editingId, product);
      } else {
        await addProduct(product);
      }

      await loadProducts();
      clearForm();
      alert("تم حفظ المنتج");
    } catch (error) {
      console.log(error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  // =====================
  // EDIT PRODUCT
  // =====================

  const handleEdit = (product) => {
    setEditingId(product.id);
    setTitle(product.title || "");
    setDescription(product.description || "");
    setPrice(product.price || "");
    setOldPrice(product.oldPrice || "");
    setCategory(product.category || "");
    setRating(product.rating || 5);
    setStock(product.stock || 1);
    setOffer(product.offer || false);
    setBestSeller(product.bestSeller || false);
    setNewArrival(product.newArrival || false);
    setRecommended(product.recommended || false);
    setImage(product.image || "");
    setImages(product.images || []);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // =====================
  // DELETE PRODUCT
  // =====================

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

  // =====================
  // LOAD ORDERS
  // =====================

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      if(
"Notification" in window &&
Notification.permission==="granted"
){
 new Notification("🛒 طلب جديد",{
 body:`${list[0]?.customerName || ""} - ${list[0]?.total || 0} جنيه`
 });
}

      firstLoad.current = false;
      setOrders(list);
    });

    return () => unsubscribe();
  }, []);

  // =====================
  // CHANGE ORDER STATUS
  // =====================

  const changeOrderStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status
      });
    } catch (error) {
      console.log(error);
    }
  };

  // =====================
  // SAVE TRACKING NUMBER
  // =====================

  const saveTrackingNumber = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        trackingNumber: trackingNumbers[orderId] || "",
      });

      alert("تم حفظ رقم التتبع");
    } catch (error) {
      console.log(error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  // =====================
  // LOAD CATEGORIES
  // =====================

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // =====================
  // SAVE CATEGORY
  // =====================

  const saveCategory = async () => {
    if (!categoryName) return;

    try {
      const data = {
        name: categoryName,
        icon: categoryIcon,
        image: categoryImage,
        active: editingCategoryId
          ? categories.find((c) => c.id === editingCategoryId)?.active
          : true
      };

      if (editingCategoryId) {
        await editCategory(editingCategoryId, data);
      } else {
        await addCategory(data);
      }

      await loadCategories();

      setCategoryName("");
      setCategoryIcon("");
      setCategoryImage("");
      setEditingCategoryId(null);
    } catch (error) {
      console.log(error);
      alert("حدث خطأ أثناء حفظ القسم");
    }
  };

  // =====================
  // EDIT CATEGORY
  // =====================

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name || "");
    setCategoryIcon(cat.icon || "");
    setCategoryImage(cat.image || "");
  };

  // =====================
  // DELETE CATEGORY
  // =====================

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("حذف والفئة؟")) return;

    try {
      await removeCategory(id);
      await loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  // =====================
  // TOGGLE CATEGORY STATUS
  // =====================

  const toggleCategoryStatus = async (cat) => {
    try {
      await editCategory(cat.id, {
        active: !cat.active
      });

      await loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  // =====================
  // LOGOUT
  // =====================

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  // =====================
  // RETURN
  // =====================

  return (
    <div className="admin-container">
      {orders.length > 0 && (
        <div className="new-order-alert">
          <span>🔔 يوجد {orders.length} طلب</span>
          <button onClick={() => setTab("orders")}>عرض الطلبات</button>
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <h3>📦 المنتجات</h3>
    products?.length || 0
        </div>

        <div className="stat-card">
          <h3>🧾 الطلبات</h3>
          <p>{orders.length}</p>
        </div>

        <div className="stat-card">
          <h3>🗂️ الفئات</h3>
          <p>{categories.length}</p>
        </div>

        <div className="stat-card">
          <h3>💰 المبيعات</h3>
          <p>{totalSales} ج.م</p>
        </div>
      </div>

      {/* =====================
      HEADER
      ===================== */}

      <div className="admin-top-bar">
        <h2>لوحة التحكم</h2>

        <div className="admin-actions">
          <button className="store-btn" onClick={() => navigate("/")}>
            🛒 العودة للمتجر
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            🚪 تسجيل خروج
          </button>
        </div>
      </div>

      {/* =====================
      TABS
      ===================== */}

      <div className="admin-tabs">
        <button
          className={tab === "products" ? "active" : ""}
          onClick={() => setTab("products")}
        >
          📦 المنتجات
        </button>

        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          🧾 الطلبات ({orders.length})
        </button>

        <button
          className={tab === "categories" ? "active" : ""}
          onClick={() => setTab("categories")}
        >
          🗂️ الأقسام
        </button>
      </div>

      {/* =====================
      PRODUCT FORM
      ===================== */}

      {tab === "products" && (
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

          <div className="price-row">
            <input
              type="number"
              placeholder="السعر"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              type="number"
              placeholder="السعر قبل الخصم"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">اختر القسم</option>
            {categories
              .filter((cat) => cat.active)
              .map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
          </select>

          <div className="product-options">
            <label>
              <input
                type="checkbox"
                checked={offer}
                onChange={(e) => setOffer(e.target.checked)}
              />
              🔥 عرض
            </label>

            <label>
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(e) => setBestSeller(e.target.checked)}
              />
              ⭐ الأكثر مبيعاً
            </label>

            <label>
              <input
                type="checkbox"
                checked={newArrival}
                onChange={(e) => setNewArrival(e.target.checked)}
              />
              🆕 جديد
            </label>

            <label>
              <input
                type="checkbox"
                checked={recommended}
                onChange={(e) => setRecommended(e.target.checked)}
              />
              ❤️ مميز
            </label>
          </div>

          <div className="price-row">
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
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />

          {image && (
            <img src={image} className="img-preview" alt="preview" />
          )}

          <button type="submit" className="save-btn">
            {editingId ? "💾 حفظ التعديل" : "➕ إضافة المنتج"}
          </button>
        </form>
      )}

      {/* =====================
      CATEGORY FORM
      ===================== */}

      {tab === "categories" && (
        <div className="category-box">
          <h2>🗂️ إدارة الأقسام</h2>

          <input
            placeholder="اسم القسم"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <input
            placeholder="أيقونة القسم"
            value={categoryIcon}
            onChange={(e) => setCategoryIcon(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleCategoryImageUpload}
          />

          {categoryImage && (
            <img
              src={categoryImage}
              className="category-img-preview"
              alt="category"
            />
          )}

          <button onClick={saveCategory} className="save-btn">
            {editingCategoryId ? "💾 حفظ التعديل" : "➕ إضافة قسم"}
          </button>
        </div>
      )}

      {/* =====================
      PRODUCTS TABLE
      ===================== */}

      {tab === "products" && (
        <div className="table-container">
          <h2>📦 قائمة المنتجات</h2>

          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>السعر</th>
                  <th>القسم</th>
                  <th>الحالة</th>
                  <th>المخزون</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        src={product.image || "https://via.placeholder.com/80"}
                        className="table-img"
                        alt={product.title}
                      />
                    </td>
                    <td>{product.title}</td>
                    <td>{product.price} ج.م</td>
                    <td>{product.category}</td>
                    <td>{product.offer ? "🔥 عرض" : "عادي"}</td>
                    <td>{product.stock}</td>
                    <td>
<button
 type="button"
 className="edit-btn"
 onClick={() => saveTrackingNumber(order.id)}
>
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(product.id)}
                      >
                        🗑 حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================
      ORDERS TABLE
      ===================== */}

      {tab === "orders" && (
        <div className="table-container">
          <h2>🧾 الطلبات</h2>

          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>العنوان</th>
                  <th>المنتجات</th>
                  <th>الحالة</th>
                  <th>رقم التتبع</th>
                  <th>واتساب</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.customerName}</td>
                    <td>{order.phone}</td>
                    <td>{order.address}</td>
                    <td>
                      {order.products?.map((item, index) => (
                        <div key={index}>
                          {item.title || item.name} × {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td>
                      <select
                        value={order.status || "pending"}
                        onChange={(e) =>
                          changeOrderStatus(order.id, e.target.value)
                        }
                      >
                        <option value="pending">جديد</option>
                        <option value="shipping">جاري الشحن</option>
                        <option value="done">تم التسليم</option>
                        <option value="cancel">ملغي</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="رقم التتبع"
                        value={
                          trackingNumbers[order.id] ??
                          order.trackingNumber ??
                          ""
                        }
                        onChange={(e) =>
                          setTrackingNumbers((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        style={{
                          width: "150px",
                          padding: "6px",
                          marginBottom: "8px",
                        }}
                      />
                      <br />
                      <button
                        className="edit-btn"
                        onClick={() => saveTrackingNumber(order.id)}
                      >
                        💾 حفظ
                      </button>
                    </td>
                    <td>
                      <button
                        className="whatsapp-btn"
                        onClick={() => {
                          let phone = order.phone;
                          if (phone?.startsWith("0")) {
                            phone = "2" + phone;
                          }
                          window.open(
                            `https://wa.me/${phone}`,
                            "_blank"
                          );
                        }}
                      >
                        💬 واتساب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================
      CATEGORIES TABLE
      ===================== */}

      {tab === "categories" && (
        <div className="table-container">
          <h2>🗂️ الأقسام</h2>

          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      {cat.image ? (
                        <img
                          src={cat.image}
                          className="category-img"
                          alt={cat.name}
                        />
                      ) : (
                        cat.icon
                      )}
                    </td>
                    <td>{cat.name}</td>
                    <td>
                      <button
                        className={
                          cat.active ? "active-btn" : "inactive-btn"
                        }
                        onClick={() => toggleCategoryStatus(cat)}
                      >
                        {cat.active ? "مفعلة ✅" : "موقوفة ❌"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditCategory(cat)}
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        🗑 حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;