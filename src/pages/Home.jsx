import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/store.css";
import Navbar from "../components/Navbar/Navbar";
import { CartContext } from "../context/CartContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import HeroSlider from "../components/HeroSlider";


function Home({ products = [] }) {


  const navigate = useNavigate();


  const { cart, addToCart } = useContext(CartContext);


  const [searchTerm, setSearchTerm] = useState("");



  const cartCount = cart.reduce(
    (total,item)=> total + item.quantity,
    0
  );



  const filteredProducts = products.filter((product)=>{

    const title =
      product.title ||
      product.name ||
      "";


    return title
      .toLowerCase()
      .includes(
        searchTerm.toLowerCase()
      );

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

setCurrentView={(page)=>{

if(page==="cart")
navigate("/cart");

if(page==="store")
navigate("/");

}}

cartCount={cartCount}

searchTerm={searchTerm}

setSearchTerm={setSearchTerm}

admin={false}

/>



{/* Hero */}

<HeroSlider />




{/* Features */}

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




{/* Categories */}

<section className="categories">


<h2>
الأقسام
</h2>



<div className="categories-grid">


<div className="category-card">

📱

<h3>
الموبايلات
</h3>

<span>
أحدث الهواتف
</span>

</div>




<div className="category-card">

💻

<h3>
اللابتوبات
</h3>

<span>
أفضل الماركات
</span>

</div>




<div className="category-card">

🎧

<h3>
الإكسسوارات
</h3>

<span>
كل ما تحتاجه
</span>

</div>




<div className="category-card">

⌚

<h3>
الساعات الذكية
</h3>

<span>
أحدث الموديلات
</span>

</div>


</div>


</section>





{/* Offer */}


<section className="offer-banner">


<h2>
🔥 خصومات تصل إلى 50%
</h2>


<p>
لفترة محدودة على منتجات مختارة
</p>


</section>





{/* هنا هيبدأ قسم الأكثر مبيعًا */}

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
product.name
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
{/* New Arrivals */}

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
product.name
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






{/* All Products */}


<section className="products-section">


<h2 className="section-title">

📦 جميع المنتجات

</h2>




<div className="product-grid">



{

filteredProducts.length > 0 ? (


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
product.name
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


)

:


<p className="no-products">

لا توجد منتجات مطابقة

</p>



}



</div>


</section>





{/* Footer */}

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

onClick={()=>{

document

.querySelector(".best-selling-section")

?.scrollIntoView({

behavior:"smooth"

})

}}

>

⭐ الأكثر مبيعًا

</button>




<button

className="footer-link"

onClick={()=>{

document

.querySelector(".products-section")

?.scrollIntoView({

behavior:"smooth"

})

}}

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