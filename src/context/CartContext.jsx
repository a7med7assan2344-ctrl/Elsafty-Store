import React, {
  createContext,
  useState,
  useEffect
} from "react";


export const CartContext =
  createContext();


export function CartProvider({
  children
}) {

  const [cart, setCart] =
    useState([]);


  // =====================
  // تحميل السلة من LocalStorage
  // =====================

  useEffect(() => {

    try {

      const savedCart =
        JSON.parse(
          localStorage.getItem("cart")
        ) || [];


      setCart(
        Array.isArray(savedCart)
          ? savedCart
          : []
      );

    } catch (error) {

      console.error(
        "خطأ في تحميل السلة:",
        error
      );

      setCart([]);

    }

  }, []);


  // =====================
  // حفظ السلة
  // =====================

  useEffect(() => {

    try {

      localStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );

    } catch (error) {

      console.error(
        "خطأ في حفظ السلة:",
        error
      );

    }

  }, [cart]);


  // =====================
  // إضافة للسلة
  // =====================

  function addToCart(product) {

    if (!product) {
      return;
    }


    // =====================
    // PRODUCT ID
    // =====================

    const productId =
      product.id ||
      product._id;


    if (!productId) {

      console.error(
        "المنتج لا يحتوي على ID"
      );

      return;

    }


    // =====================
    // CART ID
    // =====================

    // لو فيه Variant:
    // المنتج + Variant ID
    //
    // مثال:
    // product123-red
    // product123-blue

    const cartId =
      product.cartId ||
      (
        product.selectedVariant?.id
          ? `${productId}-${product.selectedVariant.id}`
          : String(productId)
      );


    // =====================
    // REQUESTED QUANTITY
    // =====================

    const requestedQuantity =
      Math.max(
        1,
        Number(
          product.quantity || 1
        )
      );


    // =====================
    // STOCK
    // =====================

    const stock =
      Number(
        product.stock || 0
      );


    // =====================
    // UPDATE CART
    // =====================

    setCart(prev => {

      const existingIndex =
        prev.findIndex(
          item => {

            const itemCartId =
              item.cartId ||
              item.id ||
              item._id;

            return (
              String(itemCartId) ===
              String(cartId)
            );

          }
        );


      // =====================
      // المنتج موجود
      // =====================

      if (
        existingIndex !== -1
      ) {

        return prev.map(
          (item, index) => {

            if (
              index !==
              existingIndex
            ) {

              return item;

            }


            const oldQuantity =
              Number(
                item.quantity || 0
              );


            let newQuantity =
              oldQuantity +
              requestedQuantity;


            // منع تجاوز المخزون

            if (stock > 0) {

              newQuantity =
                Math.min(
                  newQuantity,
                  stock
                );

            }


            return {

              ...item,

              quantity:
                newQuantity,

              price:
                product.price ??
                item.price,

              oldPrice:
                product.oldPrice ??
                item.oldPrice,

              stock:
                product.stock ??
                item.stock,

              selectedVariant:
                product.selectedVariant ??
                item.selectedVariant,

              cartId

            };

          }
        );

      }


      // =====================
      // منتج جديد
      // =====================

      const newItem = {

        ...product,

        id:
          product.id ||
          product._id,

        quantity:
          stock > 0
            ? Math.min(
                requestedQuantity,
                stock
              )
            : requestedQuantity,

        cartId,

        selectedVariant:
          product.selectedVariant ||
          null

      };


      return [
        ...prev,
        newItem
      ];

    });

  }


  // =====================
  // حذف منتج من السلة
  // =====================

  function removeFromCart(id) {

    setCart(prev =>

      prev.filter(item => {

        const itemCartId =
          item.cartId ||
          item.id ||
          item._id;


        return (
          String(itemCartId) !==
          String(id)
        );

      })

    );

  }


  // =====================
  // زيادة / نقص الكمية
  // =====================

  function updateQuantity(
    id,
    change
  ) {

    setCart(prev =>

      prev.map(item => {

        const itemCartId =
          item.cartId ||
          item.id ||
          item._id;


        if (
          String(itemCartId) !==
          String(id)
        ) {

          return item;

        }


        const currentQuantity =
          Number(
            item.quantity || 1
          );


        const stock =
          Number(
            item.stock || 0
          );


        let newQuantity =
          currentQuantity +
          Number(
            change || 0
          );


        // أقل كمية = 1

        newQuantity =
          Math.max(
            1,
            newQuantity
          );


        // منع تجاوز المخزون

        if (stock > 0) {

          newQuantity =
            Math.min(
              newQuantity,
              stock
            );

        }


        return {

          ...item,

          quantity:
            newQuantity

        };

      })

    );

  }


  // =====================
  // تفريغ السلة
  // =====================

  function clearCart() {

    setCart([]);

  }


  // =====================
  // Context
  // =====================

  return (

    <CartContext.Provider
      value={{

        cart,

        setCart,

        addToCart,

        removeFromCart,

        updateQuantity,

        clearCart

      }}
    >

      {children}

    </CartContext.Provider>

  );

}


export default CartContext;