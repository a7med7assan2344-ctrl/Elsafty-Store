import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc
} from "firebase/firestore";

import { db } from "../../firebase";
import "./Admin.css";

import {
  addProduct,
  editProduct,
  removeProduct,
} from "../../services/productService";

import {
  getAllCategories,
  addCategory,
  editCategory,
  removeCategory
} from "../../services/categoryService";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";


function Admin({ products, loadProducts }) {
const navigate = useNavigate();
const [orders, setOrders] = useState([]);

const firstLoad = useRef(true);
useEffect(() => {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}, []);

const audio = useRef(
  new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
);
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [price, setPrice] = useState("");
const [oldPrice, setOldPrice] = useState("");

const [offer, setOffer] = useState(false);

const [bestSeller, setBestSeller] = useState(false);

const [newArrival, setNewArrival] = useState(false);

const [recommended, setRecommended] = useState(false);
const [category, setCategory] = useState("");
const [rating, setRating] = useState(5);
const [stock, setStock] = useState(1);
const [images, setImages] = useState([]);
const [image, setImage] = useState("");
const [editingId, setEditingId] = useState(null);


const [tab, setTab] = useState("products");


const [categories, setCategories] = useState([]);

const [categoryName, setCategoryName] = useState("");

const [categoryIcon, setCategoryIcon] = useState("");

const [editingCategoryId, setEditingCategoryId] = useState(null);
const totalSales = orders.reduce((total, order) => {
  return total + Number(order.total || 0);
}, 0);



const clearForm = ()=>{

setTitle("");
setDescription("");
setPrice("");
setOldPrice("");

setOffer(false);

setBestSeller(false);

setNewArrival(false);

setRecommended(false);
setCategory("إلكترونيات");
setRating(5);
setStock(1);
setImage("");
setEditingId(null);

};



const handleImageUpload = (e) => {

  const files = Array.from(e.target.files);

  if (!files.length) return;

  const loadedImages = [];

  files.forEach((file) => {

    const reader = new FileReader();

    reader.onloadend = () => {

      loadedImages.push(reader.result);

      if (loadedImages.length === files.length) {

        setImages(loadedImages);

        setImage(loadedImages[0]);

      }

    };

    reader.readAsDataURL(file);

  });

};


const handleSubmit = async(e)=>{

e.preventDefault();


if(!title || !price || !image){

alert("اكمل البيانات");
return;

}


try{


let uploadedImages = [];

for (const img of (images.length ? images : [image])) {

  let imageUrl = img;

  if (imageUrl.startsWith("data:")) {

    const formData = new FormData();

    const blob = await (await fetch(imageUrl)).blob();

    formData.append("file", blob);

    formData.append(
      "upload_preset",
      "elsafty_store"
    );

    const upload = await fetch(
      "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const uploadData = await upload.json();

    if (!upload.ok) {

      alert("فشل رفع الصورة");
      return;

    }

    imageUrl = uploadData.secure_url;

  }

  uploadedImages.push(imageUrl);

}

const formData=new FormData();


const blob=await(await fetch(image)).blob();


formData.append("file",blob);

formData.append(
"upload_preset",
"elsafty_store"
);



const upload=await fetch(

"https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",

{

method:"POST",

body:formData

}

);



const uploadData=await upload.json();



if(!upload.ok){

alert("فشل رفع الصورة");
return;

}



imageUrl=uploadData.secure_url;


}



const product = {

  title,

  description,

  price: Number(price),

  oldPrice: Number(oldPrice || 0),

image: uploadedImages[0],
images: uploadedImages,
  images: imageUrl ? [imageUrl] : [],

  category,

  rating: Number(rating),

  stock: Number(stock),

  offer,

  bestSeller,

  newArrival,

  recommended

};

if(editingId){

await editProduct(editingId,product);

}else{

await addProduct(product);

}



await loadProducts();

clearForm();


alert("تم حفظ المنتج");


}catch(error){

console.log(error);

alert("حدث خطأ");

}


};
const handleEdit = (product)=>{

setEditingId(product.id);

setTitle(product.title);

setDescription(product.description);

setPrice(product.price);
setOldPrice(product.oldPrice || "");

setOffer(product.offer || false);

setBestSeller(product.bestSeller || false);

setNewArrival(product.newArrival || false);

setRecommended(product.recommended || false);

setCategory(product.category);

setRating(product.rating);

setStock(product.stock);

setImage(product.image);



window.scrollTo({

top:0,

behavior:"smooth"

});


};



const handleDelete = async(id)=>{


if(!window.confirm("حذف المنتج؟")) return;



try{


await removeProduct(id);


await loadProducts();


alert("تم حذف المنتج");



}catch(error){

console.log(error);

alert("فشل الحذف");

}


};





const changeOrderStatus = async(id,status)=>{


await updateDoc(

doc(db,"orders",id),

{

status

}

);


};





useEffect(() => {

  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {

    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (!firstLoad.current && list.length > orders.length) {

      audio.current.play();

      if (Notification.permission === "granted") {
        new Notification("🛒 طلب جديد", {
          body: `${list[0].customerName} - ${list[0].total} جنيه`
        });
      }

    }

    firstLoad.current = false;

    setOrders(list);
if (!firstLoad.current && list.length > orders.length) {

  audio.current.play();

  if (Notification.permission === "granted") {

    new Notification("🛒 طلب جديد", {
      body: `${list[0].customerName} - ${list[0].total} جنيه`
    });

  }

}

firstLoad.current = false;

setOrders(list);
  });

  return () => unsubscribe();

}, [orders.length]);






const loadCategories = async()=>{


const data = await getAllCategories();


setCategories(data);


};




useEffect(()=>{


loadCategories();


},[]);






const handleLogout = async()=>{


try{


await signOut(auth);



}catch(error){


console.log(error);


}


};






return (


<div className="admin-container">
  {orders.length > 0 && (
  <div
    style={{
      background: "#16a34a",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "10px",
      marginBottom: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontWeight: "bold"
    }}
  >
    <span>🔔 يوجد طلب جديد</span>

    <button
      onClick={() => setTab("orders")}
      style={{
        background: "#fff",
        color: "#16a34a",
        border: "none",
        padding: "8px 15px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      عرض الطلبات
    </button>
  </div>
)}
<div className="admin-stats">


<div className="stat-card">

<Dashboard />
<h3>
📦 المنتجات
</h3>

<p>
{products.length}
</p>

</div>



<div className="stat-card">

<h3>
🧾 الطلبات
</h3>

<p>
{orders.length}
</p>

</div>




<div className="stat-card">

<h3>
🗂️ الفئات
</h3>

<p>
{categories.length}
</p>

</div>




<div className="stat-card">

<h3>
💰 المبيعات
</h3>

<p>
{totalSales} ج.م
</p>

</div>



</div>


<div className="admin-top-bar">


<h2>
لوحة التحكم
</h2>


<div className="admin-actions">


<button

className="store-btn"

onClick={()=>navigate("/")}

>

🛒 العودة للمتجر

</button>



<button

className="logout-btn"

onClick={handleLogout}

>

🚪 تسجيل خروج

</button>


</div>




<div className="admin-tabs">



<button

className={tab==="products"?"active":""}

onClick={()=>setTab("products")}

>

📦 المنتجات

</button>




<button

className={tab==="orders"?"active":""}

onClick={()=>setTab("orders")}

>

🧾 الطلبات ({orders.length})

</button>




<button

className={tab==="categories"?"active":""}

onClick={()=>setTab("categories")}

>

🗂️ الفئات

</button>










</div>



</div>






{
tab==="products" &&

(


<form

className="admin-form"

onSubmit={handleSubmit}

>


<input

type="text"

placeholder="اسم المنتج"

value={title}

onChange={(e)=>setTitle(e.target.value)}

/>




<textarea

placeholder="وصف المنتج"

value={description}

onChange={(e)=>setDescription(e.target.value)}

/>





<input

type="number"

placeholder="السعر"

value={price}

onChange={(e)=>setPrice(e.target.value)}

/>

<input
  type="number"
  placeholder="السعر قبل الخصم"
  value={oldPrice}
  onChange={(e) => setOldPrice(e.target.value)}
/>



<select

value={category}

onChange={(e)=>setCategory(e.target.value)}

>

<option value="">
اختر الفئة
</option>


{

categories.map((cat)=>(

<option

key={cat.id}

value={cat.name}

>

{cat.icon} {cat.name}

</option>

))

}


</select>

<div className="product-options">

  <label>
    <input
      type="checkbox"
      checked={offer}
      onChange={(e) => setOffer(e.target.checked)}
    />
    🔥 عرض اليوم
  </label>

  <label>
    <input
      type="checkbox"
      checked={bestSeller}
      onChange={(e) => setBestSeller(e.target.checked)}
    />
    ⭐ الأكثر مبيعًا
  </label>

  <label>
    <input
      type="checkbox"
      checked={newArrival}
      onChange={(e) => setNewArrival(e.target.checked)}
    />
    🆕 وصل حديثًا
  </label>

  <label>
    <input
      type="checkbox"
      checked={recommended}
      onChange={(e) => setRecommended(e.target.checked)}
    />
    ❤️ قد يعجبك
  </label>

</div>


<input

type="number"

placeholder="التقييم"

value={rating}

onChange={(e)=>setRating(e.target.value)}

/>




<input

type="number"

placeholder="المخزون"

value={stock}

onChange={(e)=>setStock(e.target.value)}

/>





<input
  type="file"
  accept="image/*"
  multiple
  onChange={handleImageUpload}
/>



<input

type="text"

placeholder="رابط الصورة"

value={image.startsWith("data:")?"":image}

onChange={(e)=>setImage(e.target.value)}

/>





{
image &&

<img

src={image}

className="img-preview"

alt="preview"

/>

}





<button type="submit">

{

editingId

?

"حفظ التعديل"

:

"إضافة المنتج"

}


</button>



</form>


)

}
{
tab==="products" &&

(

<>

<h2>
قائمة المنتجات
</h2>


<table className="admin-table">


<thead>
<tr>

<th>الصورة</th>
<th>الاسم</th>
<th>السعر</th>
<th>القسم</th>
<th>🔥 عرض</th>
<th>⭐ الأكثر</th>
<th>🆕 جديد</th>
<th>❤️ مميز</th>
<th>المخزون</th>
<th>الإجراءات</th>
<th>🔥 عرض</th>
<th>⭐ الأكثر</th>
<th>🆕 جديد</th>
<th>❤️ مميز</th>

<th>المخزون</th>
<th>الإجراءات</th>

</tr>
</thead>


<tbody>


{
products.map((p)=>(


<tr key={p.id}>


<td>

<img

src={p.image}

alt={p.title}

className="table-img"

/>

</td>



<td>

{p.title}

</td>



<td>

{p.price} ج.م

</td>



<td>

{p.category}

</td>

<td>{p.offer ? "✅" : "❌"}</td>

<td>{p.bestSeller ? "✅" : "❌"}</td>

<td>{p.newArrival ? "✅" : "❌"}</td>

<td>{p.recommended ? "✅" : "❌"}</td>
<td>{p.offer ? "✅" : "❌"}</td>

<td>{p.bestSeller ? "✅" : "❌"}</td>

<td>{p.newArrival ? "✅" : "❌"}</td>

<td>{p.recommended ? "✅" : "❌"}</td>
<td>

{p.stock}

</td>




<td>


<button

className="edit-btn"

onClick={()=>handleEdit(p)}

>

تعديل

</button>




<button

className="delete-btn"

onClick={()=>handleDelete(p.id)}

>

حذف

</button>


</td>



</tr>


))


}



</tbody>



</table>



</>

)

}






{
tab==="orders" &&

(

<div className="orders-admin">


<h2>
الطلبات
</h2>



<table className="admin-table">


<thead>

<tr>

<th>
العميل
</th>

<th>
الهاتف
</th>

<th>
العنوان
</th>

<th>
المنتجات
</th>

<th>
الحالة
</th>

</tr>

</thead>
<thead>
<tr>

<th>العميل</th>

<th>الهاتف</th>

<th>العنوان</th>

<th>المنتجات</th>

<th>الحالة</th>

<th>واتساب</th>

</tr>
</thead>



<tbody>


{

orders.map(order=>(


<tr key={order.id}>


<td>
{order.customerName}
</td>

<td>

{order.phone}

</td>



<td>

{order.address}

</td>




<td>

{
order.products?.map((item,index)=>(


<div key={index}>

{item.title || item.name} × {item.quantity}

</div>


))

}



</td>




<td>


<select


value={order.status || "pending"}


onChange={(e)=>

changeOrderStatus(

order.id,

e.target.value

)

}


>


<option value="pending">

جديد

</option>


<option value="shipping">

جاري الشحن

</option>



<option value="done">

تم التسليم

</option>



<option value="cancel">

ملغي

</option>



</select>


</td>

<td>
  <button
    className="whatsapp-btn"
    onClick={() => {
      const phone = order.phone.startsWith("0")
        ? `2${order.phone}`
        : order.phone;

      window.open(`https://wa.me/${phone}`, "_blank");
    }}
  >
    💬 واتساب
  </button>
</td>

</tr>


))


}



</tbody>



</table>



</div>


)

}





{
tab==="categories" &&

(

<div className="categories-admin">



<h2>

🗂️ إدارة الفئات

</h2>





<div className="category-form">



<input

type="text"

placeholder="اسم الفئة"

value={categoryName}

onChange={(e)=>

setCategoryName(e.target.value)

}

/>





<input

type="text"

placeholder="أيقونة الفئة 📱"

value={categoryIcon}

onChange={(e)=>

setCategoryIcon(e.target.value)

}

/>






<button

onClick={async()=>{


if(!categoryName)return;



const data={


name:categoryName,


icon:categoryIcon,


active:true



};



if(editingCategoryId){


await editCategory(

editingCategoryId,

data

);



}else{


await addCategory(data);


}





const updated=

await getAllCategories();



setCategories(updated);



setCategoryName("");

setCategoryIcon("");

setEditingCategoryId(null);



}}



>



{

editingCategoryId

?

"حفظ التعديل"

:

"إضافة فئة"

}



</button>



</div>
<table className="admin-table">


<thead>

<tr>

<th>
الأيقونة
</th>
<th>
  واتساب
</th>
<th>
الاسم
</th>


<th>
الحالة
</th>

<th>
الإجراءات
</th>


</tr>


</thead>




<tbody>


{

categories.map((cat)=>(


<tr key={cat.id}>


<td>

{cat.icon}

</td>



<td>

{cat.name}

</td>




<td>

{

cat.active

?

"مفعلة"

:

"مخفية"

}


</td>




<td>



<button

className="edit-btn"

onClick={()=>{


setEditingCategoryId(cat.id);


setCategoryName(cat.name);


setCategoryIcon(cat.icon);



}}


>


تعديل

</button>





<button

className="delete-btn"

onClick={async()=>{


if(window.confirm("حذف الفئة؟")){


await removeCategory(cat.id);



const updated=

await getAllCategories();



setCategories(updated);


}


}}



>


حذف

</button>



</td>



</tr>


))


}



</tbody>



</table>



</div>


)

}



</div>


);


}



export default Admin;