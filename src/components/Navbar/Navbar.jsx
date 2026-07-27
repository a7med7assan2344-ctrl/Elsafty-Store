import React, {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import "./Navbar.css";

import {
  auth
} from "../../firebase";

import {
  getCategories
} from "../../services/categoryService";


function Navbar({

  setCurrentView,
  cartCount,
  searchTerm,
  setSearchTerm,
  admin

}) {


const navigate = useNavigate();


const [user,setUser] = useState(null);

const [menuOpen,setMenuOpen] = useState(false);

const [logoZoom,setLogoZoom] = useState(false);

const [categories,setCategories] = useState([]);


const menuRef = useRef(null);





useEffect(()=>{

const unsubscribe = onAuthStateChanged(
  auth,
  (currentUser)=>{
    setUser(currentUser);
  }
);


return ()=>unsubscribe();


},[]);





useEffect(()=>{


const fetchCategories = async()=>{

try{

const data = await getCategories();

setCategories(data);

}

catch(error){

console.log(error);

}

};


fetchCategories();


},[]);






useEffect(()=>{


const closeMenu=(e)=>{


if(
menuRef.current &&
!menuRef.current.contains(e.target)
){

setMenuOpen(false);

}


};


document.addEventListener(
"click",
closeMenu
);


return ()=>{

document.removeEventListener(
"click",
closeMenu
);

};


},[]);






const logout = async()=>{


try{

await signOut(auth);

setMenuOpen(false);

navigate("/");


}

catch(error){

console.log(error);

}


};







const scrollToSection=(className)=>{


document

.querySelector(className)

?.scrollIntoView({

behavior:"smooth"

});


};






const moveCategories=(direction)=>{


const bar=document.querySelector(
".navbar-bottom"
);


if(bar){

bar.scrollBy({

left:direction,

behavior:"smooth"

});

}


};






return (

<>

<div className="top-offer-bar">

<div className="offer-text">

🚚 شحن مجاني للطلبات فوق 500 جنيه

<span>|</span>

🔥 خصومات حتى 50%

<span>|</span>

💳 دفع آمن 100%

<span>|</span>

📞 دعم فني طوال الأسبوع

<span>|</span>

⭐ منتجات أصلية بضمان الجودة

<span>|</span>

🎁 عروض حصرية كل يوم


</div>

</div>




<header className="navbar">


<div className="navbar-top">



<div

className="logo"

onClick={()=>setCurrentView("store")}

>


<img

src="/logo/logo.png"

alt="Elsafty Store"

onClick={(e)=>{

e.stopPropagation();

setLogoZoom(true);

}}

/>



<div className="logo-text">

<h2>

Elsafty Store

</h2>


<span>

Everything You Need

</span>


</div>


</div>





<div className="search-box">


<input

type="text"

placeholder="ابحث عن أي منتج..."

value={searchTerm}

onChange={(e)=>setSearchTerm(e.target.value)}

/>


<button>

🔍

</button>


</div>





<div className="actions">
  <div className="nav-icon">

<span>
❤️
</span>

<p>
المفضلة
</p>

</div>





<div

className="account-menu"

ref={menuRef}

>


<div

className="nav-icon"

onClick={()=>setMenuOpen(!menuOpen)}

>

<span>
👤
</span>


<p>

{

user

?

user.displayName || "حسابي"

:

"تسجيل الدخول"

}

</p>


</div>





{

menuOpen && (

<div className="account-dropdown">


{

!user ? (

<>

<button

onClick={()=>{

setMenuOpen(false);

navigate("/login");

}}

>

🔑 تسجيل الدخول

</button>



<button

onClick={()=>{

setMenuOpen(false);

navigate("/register");

}}

>

➕ إنشاء حساب

</button>

</>


)

:

(

<>

<div className="user-info">

<strong>

{user.displayName || "المستخدم"}

</strong>


<small>

{user.email}

</small>


</div>


<hr />


<button

onClick={()=>{

setMenuOpen(false);

navigate("/account");

}}

>

👤 حسابي

</button>




<button

onClick={()=>{

setMenuOpen(false);

navigate("/orders");

}}

>

📦 طلباتي

</button>





<button

onClick={logout}

>

🚪 تسجيل الخروج

</button>


</>

)

}


</div>

)

}


</div>





{

admin && (

<button

className="admin-btn"

onClick={()=>navigate("/admin")}

>

⚙️ لوحة الإدارة

</button>

)

}





<div

className="cart-icon"

onClick={()=>setCurrentView("cart")}

>


{

cartCount > 0 && (

<span className="cart-badge">

{cartCount}

</span>

)

}



<span className="cart-symbol">

🛒

</span>


<p>

السلة

</p>


</div>





</div> 
{/* نهاية actions */}



</div>
{/* نهاية navbar-top */}







<div className="category-wrapper">


<button

className="category-arrow"

onClick={()=>moveCategories(300)}

>

❯

</button>





<div className="navbar-bottom">



<button

onClick={()=>navigate("/")}

>

🏠 الرئيسية

</button>




<button

onClick={()=>scrollToSection(".categories")}

>

📱 الأقسام

</button>





{

categories.map((cat)=>(


<button

key={cat.id}

onClick={()=>{


window.dispatchEvent(

new CustomEvent(

"filterCategory",

{

detail:cat.name

}

)

);


}}

>

{cat.icon} {cat.name}

</button>


))

}





<button

onClick={()=>scrollToSection(".offer-banner")}

>

🔥 العروض

</button>




<button

onClick={()=>scrollToSection(".best-selling-section")}

>

⭐ الأكثر مبيعًا

</button>




<button

onClick={()=>scrollToSection(".new-arrivals-section")}

>

🆕 وصل حديثًا

</button>




</div>






<button

className="category-arrow"

onClick={()=>moveCategories(-300)}

>

❮

</button>




</div>



</header>







{

logoZoom && (


<div

className="logo-modal"

onClick={()=>setLogoZoom(false)}

>


<button

className="close-logo"

onClick={()=>setLogoZoom(false)}

>

✕

</button>



<img

src="/logo/logo.png"

alt="Elsafty Store"

/>



</div>


)

}



</>

);


}


export default Navbar;