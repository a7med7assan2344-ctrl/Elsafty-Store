import {createContext,useState} from "react";


export const CartContext = createContext();


export function CartProvider({children}){


const [cart,setCart]=useState([]);



function addToCart(product){

setCart(prev=>{

const exist=prev.find(
item=>item.id===product.id
);


if(exist){

return prev.map(item=>

item.id===product.id

?

{
...item,
quantity:item.quantity+1
}

:

item

);

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



function removeFromCart(id){

setCart(
prev=>prev.filter(
item=>item.id!==id
)
);

}



function updateQuantity(id,change){


setCart(prev=>

prev.map(item=>{


if(item.id===id){

return {

...item,

quantity:
Math.max(1,item.quantity+change)

}

}


return item;


})

);


}



return(

<CartContext.Provider

value={{

cart,
addToCart,
removeFromCart,
updateQuantity,
setCart

}}

>

{children}

</CartContext.Provider>

)


}