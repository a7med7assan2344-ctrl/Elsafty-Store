import React, {useContext, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./Checkout.css";

import {CartContext} from "../context/CartContext";


function Checkout(){


const navigate = useNavigate();


const {
cart,
setCart
}=useContext(CartContext);




const [name,setName]=useState("");

const [phone,setPhone]=useState("");

const [address,setAddress]=useState("");






const totalPrice = cart.reduce(

(sum,item)=>

sum +

Number(item.price || 0)
*
item.quantity

,0

);








const sendOrder = ()=>{


if(
!name ||
!phone ||
!address
){

alert("من فضلك اكتب الاسم ورقم الهاتف والعنوان");

return;

}





if(cart.length===0){

alert("السلة فارغة");

navigate("/");

return;

}








let message =

`🛒 طلب جديد من الصفتي ستور


👤 الاسم:
${name}


📱 الهاتف:
${phone}


📍 العنوان:
${address}



المنتجات:

`;








cart.forEach((item,index)=>{


message +=

`
${index+1}- ${item.title || item.name || "منتج"}

الكمية:
${item.quantity}

السعر:
${Number(item.price || 0) * item.quantity} جنيه

`;



});








message +=

`

💰 الإجمالي:
${totalPrice} جنيه`;









window.open(

`https://wa.me/201553570220?text=${encodeURIComponent(message)}`,

"_blank"

);





setCart([]);


navigate("/");


};









if(cart.length===0){


return(

<div className="checkout-empty">


<h2>
لا يوجد منتجات لإتمام الطلب 🛒
</h2>



<button

className="back-btn"

onClick={()=>navigate("/")}

>

⬅ العودة للمتجر

</button>



</div>


);


}









return(


<div className="checkout-page">



<h2>
إتمام الطلب 🛒
</h2>







<div className="checkout-form">





<input

placeholder="الاسم بالكامل"

value={name}

onChange={(e)=>
setName(e.target.value)
}

/>







<input

placeholder="رقم الهاتف"

type="tel"

value={phone}

onChange={(e)=>
setPhone(e.target.value)
}

/>







<textarea

placeholder="العنوان بالتفصيل"

value={address}

onChange={(e)=>
setAddress(e.target.value)
}

/>










<div className="checkout-summary">


<h3>
ملخص الطلب
</h3>




{

cart.map(item=>(


<div

className="checkout-item"

key={item.id || item._id}

>


<span>

{item.title || item.name}

</span>



<span>

{item.quantity} × {item.price} جنيه

</span>



</div>



))

}







<h3>

الإجمالي:

<span>

{totalPrice}

جنيه

</span>


</h3>





</div>








<button

className="checkout-btn"

onClick={sendOrder}

>

📱 تأكيد الطلب عبر واتساب

</button>







<button

className="back-btn"

onClick={()=>navigate("/cart")}

>

⬅ الرجوع للسلة

</button>







</div>



</div>


);


}


export default Checkout;