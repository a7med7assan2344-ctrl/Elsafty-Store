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


const [products,setProducts]=useState([]);

const [admin,setAdmin]=useState(false);

const [loading,setLoading]=useState(true);







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



const unsubscribe =

onAuthStateChanged(

auth,

(user)=>{


setAdmin(
!!user
);


}

);




return ()=>{


unsubscribe();


};


},[]);










if(loading){


return(

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









return(


<BrowserRouter>


<Routes>





{/* الصفحة الرئيسية */}

<Route

path="/"

element={


<Home

products={products}

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


<Checkout/>


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









{/* أي رابط خطأ */}

<Route

path="*"

element={


<Navigate to="/"/>


}


/>






</Routes>


</BrowserRouter>


);



}













function ProductDetailsWrapper({products}){


const {id}=useParams();







const product = products.find(


item =>


String(item.id) === String(id)

||

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