import React from "react";
import "./Navbar.css";


function Navbar({

  setCurrentView,

  cartCount,

  searchTerm,

  setSearchTerm,

  admin

}) {


return (


<header className="navbar">





<div className="navbar-top">





{/* اللوجو */}

<div

className="logo"

onClick={()=>setCurrentView("store")}

>


<img

src="/logo/logo.png"

alt="Elsafty Store"

/>


<div>

<h2>

Elsafty Store

</h2>


<span>

Everything You Need

</span>


</div>


</div>









{/* البحث */}

<div className="search-box">


<input


type="text"


placeholder="ابحث عن أي منتج..."


value={searchTerm}


onChange={(e)=>

setSearchTerm(e.target.value)

}


/>



<button>

🔍

</button>



</div>









{/* الأكشن */}

<div className="actions">





{

admin &&

<button

className="admin-btn"

onClick={()=>setCurrentView("admin")}

>

⚙️ لوحة الإدارة

</button>

}





{/* السلة مثل أمازون */}

<div


className="cart-icon"


onClick={()=>setCurrentView("cart")}


title="سلة المشتريات"


>


{

cartCount > 0 &&

<span

className="cart-badge"

>

{cartCount}

</span>

}




<span

className="cart-symbol"

>

🛒

</span>



<p>

السلة

</p>



</div>







</div>







</div>












{/* الأقسام */}


<div className="navbar-bottom">



<button

onClick={()=>setCurrentView("store")}

>

الرئيسية

</button>



<button>

الإلكترونيات

</button>



<button>

الموبايلات

</button>



<button>

اللابتوبات

</button>



<button>

الملابس

</button>



<button>

الأحذية

</button>



<button>

السوبر ماركت

</button>



<button>

العروض

</button>



</div>







</header>


);


}



export default Navbar;