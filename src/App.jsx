import Orders from "./pages/Orders";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyAccount from "./pages/MyAccount";

import React, {
  useEffect,
  useState,
  useContext
} from "react";


import Admin from "./components/Admin/Admin.jsx";
import AdminLogin from "./pages/AdminLogin";

import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";


import {
  onAuthStateChanged
} from "firebase/auth";


import { auth } from "./firebase";


import {
  getProducts
} from "./services/productService";



import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate
} from "react-router-dom";


import {
  CartContext
} from "./context/CartContext";





function App(){

  return (

    <BrowserRouter>

      <AppContent />

    </BrowserRouter>

  );

}






function AppContent(){



const [products,setProducts]=useState([]);

const [admin,setAdmin]=useState(false);

const [loading,setLoading]=useState(true);





const navigate = useNavigate();





const loadProducts = async()=>{


try{


const data = await getProducts();


setProducts(data || []);



}

catch(error){


console.log(error);


setProducts([]);


}

finally{


setLoading(false);


}



};





useEffect(()=>{


loadProducts();



const unsubscribe = onAuthStateChanged(

auth,

async(user)=>{


if(!user){


setAdmin(false);

return;


}





const {

doc,

getDoc

} = await import(
"firebase/firestore"
);




const {

db

} = await import(
"./firebase"
);





const adminRef = doc(

db,

"users",

user.uid

);





const adminSnap = await getDoc(adminRef);






if(adminSnap.exists()){


setAdmin(

adminSnap.data().role === "admin"

);



}else{


setAdmin(false);


}



}


);





return ()=>{


unsubscribe();


};



},[]);





if(loading){


return (

<div

style={{

textAlign:"center",

marginTop:"100px",

fontFamily:"Cairo"

}}

>


<h2>

جاري تحميل المتجر... ⏳

</h2>


</div>

);


}
return (

<Routes>



{/* تسجيل دخول العميل */}

<Route

path="/login"

element={<Login />}

/>




{/* إنشاء حساب */}

<Route

path="/register"

element={<Register />}

/>




{/* حساب العميل */}

<Route

path="/account"

element={

<ProtectedRoute>

<MyAccount />

</ProtectedRoute>

}

/>





{/* طلباتي */}

<Route

path="/orders"

element={

<ProtectedRoute>

<Orders />

</ProtectedRoute>

}

/>






{/* الصفحة الرئيسية */}

<Route

path="/"

element={


<Home

products={products}

admin={admin}


setCurrentView={(view)=>{


if(view==="admin"){

navigate("/admin");

}


}}


/>


}

/>








{/* تفاصيل المنتج */}

<Route

path="/product/:id"

element={


<ProductDetailsWrapper

products={products}

/>


}

/>









{/* السلة */}

<Route

path="/cart"

element={


<CartWrapper/>


}

/>








{/* الدفع */}

<Route

path="/checkout"

element={


<ProtectedRoute>

<Checkout/>

</ProtectedRoute>


}

/>









{/* تسجيل دخول الأدمن */}

<Route

path="/admin-login"

element={


admin ?


<Navigate to="/admin"/>


:


<AdminLogin

setAdmin={setAdmin}

/>



}


/>









{/* لوحة التحكم */}

<Route

path="/admin"

element={


admin ?



<Admin

products={products}

loadProducts={loadProducts}


/>



:


<Navigate to="/admin-login"/>



}


/>









{/* أي رابط غير موجود */}

<Route

path="*"

element={


<Navigate to="/"/>


}


/>





</Routes>


);

}
function ProductDetailsWrapper({products}){


const {id}=useParams();





const product = products.find(
(item)=>
String(item.id) === String(id) ||
String(item._id) === String(id)
);






return(


<ProductDetails

product={product}

/>


);


}









function CartWrapper(){



const {


cart,

updateQuantity,

removeFromCart


}=useContext(CartContext);





const navigate = useNavigate();







return(


<Cart


cart={cart}



updateQuantity={updateQuantity}



removeFromCart={removeFromCart}





setCurrentView={(page)=>{



switch(page){



case "store":


navigate("/");


break;





case "checkout":


navigate("/checkout");


break;





default:


break;



}



}}



/>


);



}
export default App;