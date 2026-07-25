import React, {useContext} from "react";
import {useNavigate} from "react-router-dom";

import {CartContext} from "../context/CartContext";

import "./Header.css";


function Header(){


const navigate = useNavigate();


const {cart} = useContext(CartContext);



const count = cart.reduce(

(sum,item)=>

sum + item.quantity

,0

);




return(


<header className="main-header">



<div

className="header-logo"

onClick={()=>navigate("/")}

>

Elsafty Store

</div>






<div className="header-links">



<button

onClick={()=>navigate("/")}

>

الرئيسية

</button>



<button

onClick={()=>navigate("/cart")}

>

🛒 السلة ({count})

</button>



</div>




</header>


);


}


export default Header;