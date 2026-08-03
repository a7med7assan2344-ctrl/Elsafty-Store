import React, {
  useContext
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  WishlistContext
} from "../context/WishlistContext";

import ProductCard from "../components/ProductCard/ProductCard";

import "./Wishlist.css";



function Wishlist() {


const {
  wishlist
} = useContext(WishlistContext);



const navigate = useNavigate();




return (

<div className="wishlist-page">



<h1>
❤️ المنتجات المفضلة
</h1>





{

!wishlist || wishlist.length === 0 ?


(

<div className="empty-wishlist">


<h2>
لا توجد منتجات في المفضلة
</h2>



<button

onClick={()=>navigate("/")}

>

🛒 تصفح المنتجات

</button>


</div>

)



:


(

<div className="wishlist-grid">


{

wishlist.map(product=>(


<ProductCard

key={
product.id || product._id
}

product={product}

/>


))


}


</div>

)


}



</div>

);


}



export default Wishlist;