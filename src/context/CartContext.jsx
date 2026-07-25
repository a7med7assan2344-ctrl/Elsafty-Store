import React, { createContext, useState, useEffect } from "react";


export const CartContext = createContext();



export function CartProvider({children}) {


const [cart,setCart] = useState([]);




// تحميل السلة

useEffect(()=>{


const savedCart =

JSON.parse(
localStorage.getItem("cart")
)

|| [];


setCart(savedCart);


},[]);







// حفظ السلة

useEffect(()=>{


localStorage.setItem(

"cart",

JSON.stringify(cart)

);


},[cart]);









// إضافة للسلة

function addToCart(product){


const productId =

product.id || product._id;




setCart(prev=>{



const exist = prev.find(

item =>

(item.id || item._id) === productId

);





if(exist){


return prev.map(item=>{


const itemId =

item.id || item._id;



if(itemId === productId){


return {


...item,


quantity:

item.quantity + 1


};


}



return item;



});


}







return [


...prev,


{


...product,


quantity:1


}


];



});



}









// حذف من السلة

function removeFromCart(id){


setCart(prev=>


prev.filter(item=>


(item.id || item._id) !== id


)


);


}









// زيادة ونقصان الكمية

function updateQuantity(id,change){



setCart(prev=>


prev.map(item=>{


const itemId =

item.id || item._id;



if(itemId === id){


return {


...item,


quantity:

Math.max(

1,

item.quantity + change

)


};


}



return item;



})


);



}







return(


<CartContext.Provider


value={{


cart,

setCart,

addToCart,

removeFromCart,

updateQuantity


}}


>


{children}


</CartContext.Provider>


);



}