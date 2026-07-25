import React, {
  useState,
  useContext
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./ProductDetails.css";

import {
  CartContext
} from "../context/CartContext";



function ProductDetails({ product }) {


const navigate = useNavigate();



const {
addToCart,
cart
} = useContext(CartContext);



const [quantity,setQuantity] = useState(1);





const cartCount = cart.reduce(

(total,item)=>

total + item.quantity

,0

);







if(!product){


return (

<div className="no-product">


<h2>
المنتج غير موجود
</h2>



<button

onClick={()=>navigate("/")}

>

الرجوع للمتجر

</button>



</div>

);


}







const increaseQuantity = ()=>{

setQuantity(prev=>prev + 1);

};






const decreaseQuantity = ()=>{

setQuantity(prev=>

prev > 1 ? prev - 1 : 1

);

};









const handleAddToCart = ()=>{


addToCart({

...product,

quantity

});



alert(
`تم إضافة ${quantity} من المنتج للسلة 🛒`
);



};










return (


<div className="product-details">







<div className="details-image">


<img

src={

product.image ||

"https://via.placeholder.com/400"

}


alt={product.title || "Product"}

/>


</div>









<div className="details-info">



<h1>

{

product.title ||

"منتج بدون اسم"

}

</h1>









<div className="details-rating">


⭐⭐⭐⭐⭐


<span>

(
{product.rating || 5}
)

</span>


</div>









<p className="details-description">


{

product.description ||

"منتج مميز بجودة عالية، مناسب للاستخدام اليومي."

}


</p>









<div className="details-price">


{

Number(product.price || 0) * quantity

}

ج.م


</div>









<div className="quantity-box">


<span>

الكمية:

</span>







<button

onClick={decreaseQuantity}

>

-

</button>







<strong>

{quantity}

</strong>







<button

onClick={increaseQuantity}

>

+

</button>





</div>









<div className="details-actions">





<button

className="add-btn"

onClick={handleAddToCart}

>

🛒 أضف للسلة

</button>







<button

className="cart-go-btn"

onClick={()=>navigate("/cart")}

>

🛍 اذهب للسلة

</button>






</div>









<button

className="back-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>







</div>






</div>


);


}


export default ProductDetails;