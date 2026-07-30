import React, {
  useContext
} from "react";


import {
  useSearchParams,
  useNavigate
} from "react-router-dom";


import StoreLayout from "../components/StoreLayout/StoreLayout";


import {
  CartContext
} from "../context/CartContext";


import "../styles/store.css";



function SearchResults({

products,

admin,

searchTerm,

setSearchTerm,

setCurrentView

}) {



const [params] = useSearchParams();


const navigate = useNavigate();



const query =

params.get("q") || "";






const {

cart,

addToCart

} = useContext(CartContext);






const cartCount = cart.reduce(

(total,item)=>

total + item.quantity,

0

);









const results = products.filter((product)=>{


const name =

product.title ||

product.name ||

product.productName ||

"";



const description =

product.description ||

"";





return (

name

.toLowerCase()

.includes(

query.toLowerCase()

)

||

description

.toLowerCase()

.includes(

query.toLowerCase()

)

);


});









return (



<StoreLayout


products={products}


admin={admin}


cartCount={cartCount}


searchTerm={searchTerm}


setSearchTerm={setSearchTerm}


setCurrentView={setCurrentView}



>





<section className="products-section">





<button


className="details-btn"


onClick={()=>navigate("/")}



>


⬅ العودة للمتجر


</button>








<h2 className="section-title">


🔍 نتائج البحث عن:


{" "}

{query}



</h2>








<p className="search-count">


عدد المنتجات:


{" "}

{results.length}



</p>









<div className="product-grid">





{


results.length > 0 ?



results.map((product)=>{


const id =

product.id ||

product._id;





return (



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


{product.price || 0}

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



<h3 className="no-products">


لا توجد منتجات مطابقة


</h3>



}





</div>







</section>







</StoreLayout>



);



}




export default SearchResults;