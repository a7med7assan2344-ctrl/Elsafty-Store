import React, {
  createContext,
  useState,
  useEffect
} from "react";


export const WishlistContext = createContext();



export function WishlistProvider({ children }) {


  const [wishlist, setWishlist] = useState(() => {

    try {

      const saved =
        localStorage.getItem("wishlist");

      return saved
        ? JSON.parse(saved)
        : [];

    } catch(error) {

      return [];

    }

  });




  useEffect(() => {

    localStorage.setItem(
      "wishlist",
      JSON.stringify(wishlist)
    );

  }, [wishlist]);






  const getProductId = (product) => {

    return product.id || product._id;

  };







  const toggleWishlist = (product) => {


    const productId = getProductId(product);



    const exists = wishlist.some(
      item =>
        getProductId(item) === productId
    );




    if(exists){


      setWishlist(

        wishlist.filter(
          item =>
          getProductId(item) !== productId
        )

      );


    }else{


      setWishlist([

        ...wishlist,

        product

      ]);


    }


  };







  const isFavorite = (id) => {


    return wishlist.some(

      item =>
      getProductId(item) === id

    );


  };







  const clearWishlist = ()=>{

    setWishlist([]);

  };








  return (

    <WishlistContext.Provider

      value={{

        wishlist,

        toggleWishlist,

        isFavorite,

        clearWishlist

      }}

    >

      {children}

    </WishlistContext.Provider>

  );


}