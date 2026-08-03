import React, {
  useContext
} from "react";

import "./ProductCard.css";

import {
  CartContext
} from "../../context/CartContext";

import {
  WishlistContext
} from "../../context/WishlistContext";



function ProductCard({ product }) {


const {
  addToCart
} = useContext(CartContext);



const {
  toggleWishlist,
  isFavorite
} = useContext(WishlistContext);




const productId =
product.id || product._id;



const favorite =
isFavorite(productId);





return (

<div className="product-card">



<div className="image-box">



<button

className="wishlist-btn"

onClick={(e)=>{

e.stopPropagation();

toggleWishlist(product);

}}

>

{

favorite
?
"❤️"
:
"🤍"

}

</button>





{
product.offer &&
product.oldPrice > product.price && (

<span className="offer-badge">

🔥 -
{
Math.round(
(
(product.oldPrice - product.price) /
product.oldPrice
) * 100
)
}
%

</span>

)

}






<img

src={

product.image ||

"https://via.placeholder.com/300"

}

alt={

product.title ||

product.name ||

"Product"

}

/>



</div>








<h3>

{

product.title ||

product.name ||

"منتج بدون اسم"

}

</h3>







<p className="description">

{

product.description ||

"منتج مميز بجودة عالية"

}

</p>







<div className="product-price">


{

product.oldPrice >

product.price && (

<span className="old-price">

{product.oldPrice} ج.م

</span>

)

}





<span className="current-price">

{product.price} ج.م

</span>


</div>







<button

onClick={()=>addToCart(product)}

>

🛒 أضف للسلة

</button>





</div>


);


}



export default ProductCard;