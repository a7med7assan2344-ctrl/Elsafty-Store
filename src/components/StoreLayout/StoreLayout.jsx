import React from "react";

import Navbar from "../Navbar/Navbar";
import HeroSlider from "../HeroSlider";

import "../../styles/store.css";


function StoreLayout({

children,

products,

admin,

cartCount,

searchTerm,

setSearchTerm,

setCurrentView

}){


return (

<div className="store-container">



<Navbar

products={products}

setCurrentView={setCurrentView}

cartCount={cartCount}

searchTerm={searchTerm}

setSearchTerm={setSearchTerm}

admin={admin}

/>





<HeroSlider />





{children}







<footer className="store-footer">


<div className="footer-content">



<div className="footer-section">


<h3>
Elsafty Store
</h3>


<p>

متجر إلكتروني يوفر أفضل المنتجات بأفضل الأسعار

</p>


</div>







<div className="footer-section">


<h3>
روابط سريعة
</h3>





<button

className="footer-link"

onClick={()=>setCurrentView("store")}

>

🏠 الرئيسية

</button>

{currentView === "account" && (
  <Account setCurrentView={setCurrentView} />
)}





<button

className="footer-link"

onClick={()=>setCurrentView("cart")}

>

🛒 السلة

</button>





<button

className="footer-link"

onClick={()=>setCurrentView("account")}

>

👤 الحساب

</button>





</div>





<div className="footer-section">


<h3>

خدمة العملاء

</h3>


<p>
🚚 شحن لجميع المحافظات
</p>


<p>
🔒 دفع آمن
</p>


<p>
⭐ ضمان الجودة
</p>



</div>






</div>







<hr/>







<p className="copyright">


© {new Date().getFullYear()} Elsafty Store


</p>






</footer>






</div>


);


}


export default StoreLayout;