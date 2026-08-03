import React, {
  useEffect,
  useRef,
  useState,
  useContext
} from "react";
import offerText from "../../config/offerConfig";
import {
  useNavigate
} from "react-router-dom";
import { useContext } from "react";
import { WishlistContext } from "../../context/WishlistContext";
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
  admin,
  products

}) {
  const handleSearch = () => {

if(searchTerm.trim()){

navigate(`/search?q=${searchTerm}`);

setSuggestions([]);

}

};
const navigate = useNavigate();
const { wishlist } = useContext(WishlistContext);

const [user,setUser] = useState(null);

const [menuOpen,setMenuOpen] = useState(false);

const [logoZoom,setLogoZoom] = useState(false);

const [categories,setCategories] = useState([]);
const [suggestions,setSuggestions] = useState([]);

const menuRef = useRef(null);
const searchRef = useRef(null);




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

  const closeSearch = (e)=>{

    if(
      searchRef.current &&
      !searchRef.current.contains(e.target)
    ){

      setSuggestions([]);

    }

  };


  document.addEventListener(
    "click",
    closeSearch
  );


  return ()=>{

    document.removeEventListener(
      "click",
      closeSearch
    );

  };


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

<div className="offer-track">

{

[
 ...offerText,
 ...offerText,
 ...offerText,
 ...offerText
].map((text,index)=>(
<span key={index}>

{text}

</span>

))

}

</div>

</div>


<header className="navbar">


<div className="navbar-top">



<div

className="logo"

onClick={() => navigate("/")}
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





<div 
className="search-box"
ref={searchRef}
>
<div className="search-input-wrapper">

<input

ref={searchRef}

type="text"

placeholder="ابحث عن أي منتج..."

value={searchTerm}

onChange={(e)=>{

const value = e.target.value;

setSearchTerm(value);


if(value.trim()){

const searchValue = value.toLowerCase();


const results = products

.filter((item)=>{


const name =
item.title ||
item.name ||
item.productName ||
"";


return name
.toLowerCase()
.includes(searchValue);


})


.sort((a,b)=>{


const nameA =
(
a.title ||
a.name ||
a.productName ||
""
)
.toLowerCase();


const nameB =
(
b.title ||
b.name ||
b.productName ||
""
)
.toLowerCase();



return (
nameA.indexOf(searchValue)
-
nameB.indexOf(searchValue)
);


})


.filter(

(item,index,self)=>

index === self.findIndex(

(x)=>

(
x.title ||
x.name ||
x.productName
)

===

(
item.title ||
item.name ||
item.productName
)

)

)


.slice(0,5);



setSuggestions(results);



}else{


setSuggestions([]);


}


}}



onKeyDown={(e)=>{


if(e.key === "Enter"){


if(searchTerm.trim()){


navigate(

`/search?q=${searchTerm}`

);


setSuggestions([]);


}


}


}}


/>{
suggestions.length > 0 && (

<div className="search-suggestions">

{
suggestions.map((item)=>(

<div

key={item.id || item._id}

className="suggestion-item"

onClick={()=>{

const productName =
item.title ||
item.name ||
item.productName ||
"";


setSearchTerm("");

setSuggestions([]);


navigate(`/product/${item.id || item._id}`);


}}
>

{item.title || item.name || item.productName}

</div>

))

}

</div>

)

}


{
searchTerm.trim() &&
suggestions.length === 0 &&
document.activeElement === searchRef.current && (

<div className="search-no-result">

لا توجد منتجات

</div>

)
}
</div>  {/* قفل search-input-wrapper */}


<button

onClick={()=>{

if(searchTerm.trim()){

navigate(
`/search?q=${searchTerm}`
);

setSuggestions([]);

}

}}

>

🔍

</button>
</div>



<div
  className="nav-icon wishlist-icon"
  onClick={() => navigate("/wishlist")}
>

  {wishlist.length > 0 && (
    <span className="wishlist-badge">
      {wishlist.length}
    </span>
  )}

  <span>❤️</span>

  <p>المفضلة</p>

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
  onClick={() => navigate("/cart")}
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