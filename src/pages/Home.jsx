import React, {
  useState,
  useContext,
  useEffect,
  useRef
} from "react";
import {
  useNavigate
} from "react-router-dom";

import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";

import {
  CartContext
} from "../context/CartContext";


import {
  Swiper,
  SwiperSlide
} from "swiper/react";


import {
  Navigation
} from "swiper/modules";


import "swiper/css";
import "swiper/css/navigation";


import HeroSlider from "../components/HeroSlider";


import {
  getCategories
} from "../services/categoryService";




function Home({
  products,
  admin,
  searchTerm,
  setSearchTerm,
  setCurrentView
}) {


const navigate = useNavigate();

const productsRef = useRef(null);


const {
  cart,
  addToCart
} = useContext(CartContext);






const [categories,setCategories] = useState([]);

const [selectedCategory,setSelectedCategory] = useState("all");
useEffect(()=>{

const loadCategories = async()=>{

try{

const data = await getCategories();

setCategories(data || []);

}
catch(error){

console.log(error);

}

};

loadCategories();

},[]);




const cartCount = cart.reduce(

(total,item)=>

total + item.quantity

,0);







// جلب الفئات من Firebase

useEffect(()=>{


const filterListener=(e)=>{


setSelectedCategory(e.detail);



setTimeout(()=>{


productsRef.current?.scrollIntoView({

behavior:"smooth",

block:"start"

});


},100);



};



window.addEventListener(

"filterCategory",

filterListener

);



return ()=>{


window.removeEventListener(

"filterCategory",

filterListener

);


};



},[]);





// استقبال اختيار الفئة من Navbar

useEffect(()=>{


const filterListener=(e)=>{


setSelectedCategory(e.detail);


};



window.addEventListener(

"filterCategory",

filterListener

);



return ()=>{


window.removeEventListener(

"filterCategory",

filterListener

);


};


},[]);



const scrollToSection = (className)=>{

document
.querySelector(className)
?.scrollIntoView({

behavior:"smooth"

});

};



const filteredProducts = products.filter((product)=>{

const searchText = String(searchTerm || "")
.toLowerCase()
.trim();


const title = String(
product.title ||
product.name ||
product.productName ||
""
).toLowerCase();


const description = String(
product.description ||
""
).toLowerCase();


const category = String(
product.category ||
""
).toLowerCase();



const matchSearch =

searchText === "" ||

title.includes(searchText) ||

description.includes(searchText) ||

category.includes(searchText);



const matchCategory =

selectedCategory === "all" ||

product.category === selectedCategory;



return matchSearch && matchCategory;


});








const bestSellers =

products.slice(0,8);





const newArrivals =

products

.slice(-8)

.reverse();






return (


<div className="store-container">





<Navbar

setCurrentView={setCurrentView}

cartCount={cartCount}

searchTerm={searchTerm}

setSearchTerm={setSearchTerm}

admin={admin}
products={products}

/>






<HeroSlider />







<section className="features-section">



<div className="feature-card">

🚚

<h3>
شحن سريع
</h3>


<p>
توصيل لجميع المحافظات
</p>


</div>






<div className="feature-card">

🔒

<h3>
دفع آمن
</h3>


<p>
طرق دفع آمنة
</p>


</div>







<div className="feature-card">

⭐

<h3>
جودة مضمونة
</h3>


<p>
منتجات أصلية
</p>


</div>







<div className="feature-card">

💬

<h3>
دعم فني
</h3>


<p>
خدمة عملاء مستمرة
</p>


</div>




</section>





<section className="categories">


<h2>
الأقسام
</h2>



<div className="categories-grid">


<div

className="category-card"

onClick={()=>setSelectedCategory("all")}

>

📦

<h3>
كل المنتجات
</h3>

<span>
عرض كل المنتجات
</span>


</div>



{

categories.map((cat)=>(


<div

key={cat.id}

className="category-card"

onClick={()=>setSelectedCategory(cat.name)}

>


<div>

{cat.icon}

</div>


<h3>

{cat.name}

</h3>


<span>

تصفح المنتجات

</span>


</div>


))


}



</div>


</section>
<section className="offer-banner">


<h2>
🔥 خصومات تصل إلى 50%
</h2>


<p>
لفترة محدودة على منتجات مختارة
</p>


</section>






{/* الأكثر مبيعًا */}


<section className="best-selling-section">



<h2 className="section-title">

⭐ الأكثر مبيعًا

</h2>





<Swiper

modules={[Navigation]}

navigation

spaceBetween={20}


breakpoints={{

320:{
slidesPerView:1
},

600:{
slidesPerView:2
},

900:{
slidesPerView:3
},

1200:{
slidesPerView:4
}

}}


>


{


bestSellers.map((product)=>{


const id =
product.id ||
product._id;



return (


<SwiperSlide key={id}>


<div

className="product-card"

onClick={()=>navigate(`/product/${id}`)}

>


<span className="product-badge">

⭐ الأكثر طلبًا

</span>




<div className="product-img-container">


<img

src={
product.image ||
"/default-product.png"
}

alt={
product.title ||
product.name ||
"product"
}

/>


</div>




<h3>

{
product.title ||
product.name ||
"منتج"

}

</h3>




<div className="rating">

{"⭐".repeat(
Math.floor(product.rating || 5)
)}

</div>





<p className="product-price">

{product.price || 0} جنيه

</p>




<button

className="add-to-cart-btn"

onClick={(e)=>{


e.stopPropagation();


addToCart(product);


}}

>

🛒 أضف للسلة

</button>




</div>


</SwiperSlide>


)


})

}



</Swiper>



</section>







{/* وصل حديثًا */}


<section className="new-arrivals-section">


<h2 className="section-title">

🆕 وصل حديثًا

</h2>





<Swiper

modules={[Navigation]}

navigation

spaceBetween={20}


breakpoints={{

320:{
slidesPerView:1
},

600:{
slidesPerView:2
},

900:{
slidesPerView:3
},

1200:{
slidesPerView:4
}

}}


>


{

newArrivals.map((product)=>{


const id =
product.id ||
product._id;



return (


<SwiperSlide key={id}>


<div

className="product-card"

onClick={()=>navigate(`/product/${id}`)}

>


<span className="product-badge new">

🆕 جديد

</span>




<div className="product-img-container">


<img

src={
product.image ||
"/default-product.png"
}

alt={
product.title ||
product.name ||
"product"
}

/>


</div>




<h3>

{
product.title ||
product.name ||
"منتج"

}

</h3>




<div className="rating">

★★★★★

</div>




<p className="product-price">

{product.price || 0} جنيه

</p>




<button

className="add-to-cart-btn"

onClick={(e)=>{


e.stopPropagation();


addToCart(product);


}}

>

🛒 أضف للسلة

</button>




</div>


</SwiperSlide>


)


})

}



</Swiper>


</section>





{/* كل المنتجات */}


<section

className="products-section"

ref={productsRef}

>

<h2 className="section-title">

📦 جميع المنتجات

</h2>




<div className="product-grid">
  
{

filteredProducts.length > 0 ?


filteredProducts.map((product)=>{


const id =
product.id ||
product._id;



return (


<div

className="product-card"

key={id}

onClick={()=>navigate(`/product/${id}`)}

>




<span className="product-badge">

جديد

</span>





<div className="product-img-container">


<img

src={
product.image ||
"/default-product.png"
}

alt={
product.title ||
product.name ||
"product"
}

/>


</div>





<div className="product-info">



<h3>

{
product.title ||
product.name ||
"منتج"

}

</h3>





<div className="rating">

★★★★★

</div>





<p className="product-price">

{product.price || 0} جنيه

</p>






<div className="product-actions">





<button

className="details-btn"

onClick={(e)=>{


e.stopPropagation();


navigate(`/product/${id}`);


}}

>

التفاصيل

</button>






<button

className="add-to-cart-btn"

onClick={(e)=>{


e.stopPropagation();


addToCart(product);


}}

>

🛒 أضف إلى السلة

</button>




</div>





</div>





</div>



)


})



:


<p className="no-products">

لا توجد منتجات مطابقة

</p>


}



</div>



</section>








<footer className="store-footer">


<div className="footer-content">



<div className="footer-section">


<h3>

Elsafty Store

</h3>



<p>

متجر إلكتروني يوفر أفضل المنتجات بأفضل الأسعار

مع خدمة عملاء متميزة.

</p>



</div>






<div className="footer-section">


<h3>

روابط سريعة

</h3>




<button

className="footer-link"

onClick={()=>navigate("/")}

>

🏠 الرئيسية

</button>






<button

className="footer-link"

onClick={()=>navigate("/cart")}

>

🛒 السلة

</button>






<button

className="footer-link"

onClick={()=>scrollToSection(".best-selling-section")}

>

⭐ الأكثر مبيعًا

</button>







<button

className="footer-link"

onClick={()=>scrollToSection(".products-section")}

>

📦 جميع المنتجات

</button>




</div>








<div className="footer-section">


<h3>

خدمة العملاء

</h3>



<p>
📞 دعم طوال الأسبوع
</p>


<p>
🚚 شحن لجميع المحافظات
</p>


<p>
🔒 دفع آمن
</p>


<p>
⭐ ضمان جودة المنتجات
</p>



</div>








<div className="footer-section">


<h3>

تابعنا

</h3>




<div className="social-icons">


<span>
📘
</span>


<span>
📷
</span>


<span>
🎵
</span>


<span>
▶️
</span>



</div>


</div>






</div>







<hr />







<p className="copyright">


© {new Date().getFullYear()} Elsafty Store

- جميع الحقوق محفوظة.


</p>







</footer>






</div>

);


}


export default Home;