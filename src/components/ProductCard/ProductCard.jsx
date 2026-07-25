import React,{useContext} from "react";
import "./ProductCard.css";
import {CartContext} from "../../context/CartContext";


function ProductCard({product}){


const {addToCart}=useContext(CartContext);



return(

<div className="product-card">


<div className="image-box">

<img
src={
product.image ||
"https://via.placeholder.com/300"
}
/>

</div>



<h3>
{product.title}
</h3>


<p className="description">

{product.description || "منتج مميز بجودة عالية"}

</p>


<div className="price">

{product.price} جنيه

</div>



<button

onClick={()=>addToCart(product)}

>

🛒 أضف للسلة

</button>


</div>

)


}


export default ProductCard;