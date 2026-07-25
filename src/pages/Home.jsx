import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";

import { CartContext } from "../context/CartContext";



function Home({ products = [] }) {


const navigate = useNavigate();



const {

cart,

addToCart

}=useContext(CartContext);





const [searchTerm,setSearchTerm] = useState("");






// عدد المنتجات في السلة

const cartCount = cart.reduce(

(total,item)=>

total + item.quantity

,0

);







// البحث

const filteredProducts = products.filter(product=>{


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









return(


<div className="store-container">







<Navbar


setCurrentView={(page)=>{


if(page==="cart"){

navigate("/cart");

}



if(page==="store"){

navigate("/");

}



}}



cartCount={cartCount}



searchTerm={searchTerm}



setSearchTerm={setSearchTerm}



admin={false}



/>









<section className="hero-banner">



<h2>

😍 Elsafty Store الصفتي ستور 😍

</h2>




<p>

الدلتا كلها بتعرض اونلاين في مكان واحد

</p>



</section>













<div className="product-grid">





{


filteredProducts.length > 0 ?



filteredProducts.map(product=>{



const id =

product.id ||

product._id;






return(



<div


className="product-card"



key={id}



onClick={()=>navigate(`/product/${id}`)}



>









<div className="product-img-container">



<img



src={

product.image ||

"/default-product.png"

}



alt="product"



/>



</div>









<h3>



{


product.title ||

product.name ||

"منتج بدون اسم"



}



</h3>









<p className="product-price">



{

product.price || 0

}



جنيه



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



);



})



:



<p className="no-products">



لا توجد منتجات



</p>





}







</div>







</div>



);



}



export default Home;