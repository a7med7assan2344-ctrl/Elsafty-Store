import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

import { CartContext } from "../context/CartContext";


function Cart(){


const navigate = useNavigate();


const {
cart,
updateQuantity,
removeFromCart
}=useContext(CartContext);





const totalPrice = cart.reduce(

(sum,item)=>

sum +

Number(item.price || 0)
*
item.quantity

,0

);








if(cart.length===0){


return(

<div className="cart-empty">


<h2>
🛒 السلة فارغة
</h2>



<p>
لا يوجد منتجات في السلة حالياً
</p>




<button

className="back-store-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>



</div>

);


}









const sendOrder = ()=>{


let msg =
"🛒 طلب جديد من الصفتي ستور\n\n";



cart.forEach((item,index)=>{


msg +=

`${index+1}- ${
item.title || item.name || "منتج"
}

الكمية:
${item.quantity}

السعر:
${Number(item.price || 0) * item.quantity} جنيه

\n`;



});



msg +=

`الإجمالي:
${totalPrice} جنيه`;





window.open(

`https://wa.me/201553570220?text=${encodeURIComponent(msg)}`,

"_blank"

);



};









return(


<div className="cart-container">



<h2>
🛒 سلة المشتريات
</h2>







{

cart.map(item=>{


const id =
item.id || item._id;



return(


<div

className="cart-item"

key={id}

>



<img

src={

item.image ||

"https://via.placeholder.com/100"

}

alt="product"

/>





<div className="cart-item-details">



<h3>

{
item.title ||
item.name ||
"منتج"
}

</h3>





<p>

{item.price} جنيه

</p>







<div className="quantity-controls">


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




<div className="cart-total">


<h2>

الإجمالي:

<span>

{totalPrice}

جنيه

</span>


</h2>


</div>








<div className="cart-buttons">



<button

className="back-store-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>






<button

className="checkout-btn"

onClick={sendOrder}

>

إتمام الطلب واتساب 📱

</button>



</div>







</div>


);


}



export default Cart;