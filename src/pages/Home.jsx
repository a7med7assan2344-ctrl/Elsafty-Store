import ProductsSlider from "../components/ProductsSlider";

import React, {
  useState,
  useContext,
  useEffect,
  useRef
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./Home.css";
import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";

import {
  CartContext
} from "../context/CartContext";


import {
  getCategories
} from "../services/categoryService";


import HeroSlider from "../components/HeroSlider";



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

const [selectedCategory,setSelectedCategory] = useState("الكل");

const [sortBy,setSortBy] = useState("default");

const [showOffersOnly,setShowOffersOnly] = useState(false);

const [minPrice,setMinPrice] = useState("");

const [maxPrice,setMaxPrice] = useState("");





const cartCount = cart.reduce(

(total,item)=>

total + item.quantity

,0

);







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







const scrollToSection=(className)=>{


document

.querySelector(className)

?.scrollIntoView({

behavior:"smooth"

});


};






const filteredProducts = (products || [])

.filter((product)=>{



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




const searchText = String(

searchTerm || ""

).toLowerCase().trim();





const matchSearch =

searchText === "" ||

title.includes(searchText) ||

description.includes(searchText) ||

category.includes(searchText);






const matchCategory =

selectedCategory === "الكل" ||

product.category === selectedCategory;






if(!matchSearch || !matchCategory){

return false;

}





if(

showOffersOnly &&

!product.offer

){

return false;

}





if(

minPrice &&

Number(product.price || 0) < Number(minPrice)

){

return false;

}




if(

maxPrice &&

Number(product.price || 0) > Number(maxPrice)

){

return false;

}





return true;



})

.sort((a,b)=>{


switch(sortBy){


case "low":

return Number(a.price || 0) - Number(b.price || 0);



case "high":

return Number(b.price || 0) - Number(a.price || 0);



case "rating":

return Number(b.rating || 0) - Number(a.rating || 0);



case "new":

return Number(!!b.newArrival) - Number(!!a.newArrival);



case "best":

return Number(!!b.bestSeller) - Number(!!a.bestSeller);



default:

return 0;


}


});






const offers = (products || []).filter(

(p)=>p.offer

);



const bestSellers = (products || []).filter(

(p)=>p.bestSeller

);



const newArrivals = (products || []).filter(

(p)=>p.newArrival

);



const recommended = (products || []).filter(

(p)=>p.recommended

);
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

onClick={()=>setSelectedCategory("الكل")}

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

categories
.filter(cat => cat.active === true)
.map((cat)=>(


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






<section className="offers-section">


<ProductsSlider

title="🔥 عروض اليوم"

badge="🔥 خصم"

badgeClass="offer"

products={offers}

addToCart={addToCart}

/>



<ProductsSlider

title="⭐ الأكثر مبيعًا"

badge="⭐ الأكثر طلبًا"

badgeClass="best"

products={bestSellers}

addToCart={addToCart}

/>



<ProductsSlider

title="🆕 وصل حديثًا"

badge="🆕 جديد"

badgeClass="new"

products={newArrivals}

addToCart={addToCart}

/>



<ProductsSlider

title="❤️ قد يعجبك"

badge="❤️ مميز"

badgeClass="recommended"

products={recommended}

addToCart={addToCart}

/>



</section>







<section

className="products-section"

ref={productsRef}

>


<h2 className="section-title">

📦 جميع المنتجات

</h2>





<div className="filters-bar">



<select

value={sortBy}

onChange={(e)=>setSortBy(e.target.value)}

>


<option value="default">

ترتيب افتراضي

</option>



<option value="low">

💰 الأقل سعرًا

</option>



<option value="high">

💰 الأعلى سعرًا

</option>



<option value="rating">

⭐ الأعلى تقييمًا

</option>



<option value="new">

🆕 الأحدث

</option>



<option value="best">

🔥 الأكثر مبيعًا

</option>



</select>





<input

type="number"

placeholder="من سعر"

value={minPrice}

onChange={(e)=>setMinPrice(e.target.value)}

/>





<input

type="number"

placeholder="إلى سعر"

value={maxPrice}

onChange={(e)=>setMaxPrice(e.target.value)}

/>





<label>


<input

type="checkbox"

checked={showOffersOnly}

onChange={(e)=>

setShowOffersOnly(e.target.checked)

}

/>


🔥 العروض فقط


</label>



</div>






<div className="product-grid">


{

filteredProducts.length > 0 ? (


filteredProducts.map((product)=>{


const id = product.id || product._id;



return (

<div

className="product-card"

key={id}

onClick={()=>navigate(`/product/${id}`)}

>


<img

src={

product.image ||

"https://via.placeholder.com/300"

}

alt={product.title || "product"}

/>


<h3>

{product.title || product.name}

</h3>



<p>

{product.price} ج.م

</p>



<button

onClick={(e)=>{

e.stopPropagation();

addToCart(product);

}}

>

🛒 أضف للسلة

</button>


</div>


);


})


)

:(


<h3>

لا توجد منتجات

</h3>


)


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

onClick={()=>scrollToSection(".products-section")}

>

📦 جميع المنتجات

</button>




<button

className="footer-link"

onClick={()=>scrollToSection(".offer-banner")}

>

🔥 العروض

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