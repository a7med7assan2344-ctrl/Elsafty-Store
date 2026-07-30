import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

import { CartContext } from "../context/CartContext";

import Navbar from "../components/Navbar";



function Cart() {


const navigate = useNavigate();



const {

cart,
updateQuantity,
removeFromCart

} = useContext(CartContext);





const cartCount = cart.reduce(

(total,item)=>

total + item.quantity

,0

);







const totalPrice = cart.reduce(

(sum,item)=>

sum +

Number(item.price || 0)

*

item.quantity

,0

);









if(cart.length === 0){


return(

<div>


<Navbar

setCurrentView={(page)=>{

if(page==="store"){

navigate("/");

}

}}

cartCount={0}

searchTerm=""

setSearchTerm={()=>{}}

admin={false}

/>





<div className="cart-empty">



<h2>

🛒 سلة الصفتي ستور فارغة

</h2>





<p>

ليس لديك أي منتجات في السلة حالياً.

</p>




<button 
onClick={() => navigate("/checkout")}>
  إتمام الطلب
</button>

<button

className="back-store-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>





</div>



</div>

);


}









return(


<div>



<Navbar


setCurrentView={(page)=>{


if(page==="store"){

navigate("/");

}


if(page==="cart"){

navigate("/cart");

}


}}



cartCount={cartCount}



searchTerm=""


setSearchTerm={()=>{}}



admin={false}


/>









<div className="cart-container">





<h2>

🛒 سلة المشتريات

</h2>








<div className="cart-items">



{

cart.map(item=>{


const id =

item.id || item._id;



return(




<div

key={id}

className="cart-item"

>






<img

src={

item.image ||

"https://via.placeholder.com/100"

}


/>








<div className="cart-item-details">






<h4>


{

item.title ||

item.name ||

"منتج بدون اسم"

}


</h4>








<p className="cart-item-price">


{item.price || 0} ج.م


</p>









<div className="cart-controls">





<button

onClick={()=>updateQuantity(id,-1)}

>

-

</button>








<span>

{item.quantity}

</span>








<button

onClick={()=>updateQuantity(id,1)}

>

+

</button>








<button

className="remove-btn"

onClick={()=>removeFromCart(id)}

>

حذف

</button>






</div>







</div>







</div>




);


})


}



</div>









<div className="cart-summary">





<h3>


المجموع الكلي:


<span>

{totalPrice} ج.م

</span>



</h3>








<div className="cart-buttons">





<button

className="back-store-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>







<button

className="checkout-btn"

onClick={()=>navigate("/checkout")}

>

إتمام الطلب عبر واتساب 📱

</button>






</div>






</div>








</div>




</div>


);


}



export default Cart;