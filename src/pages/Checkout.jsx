import React, {
  useContext,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
} from "../firebase";

import {
  AuthContext,
} from "../context/AuthContext";

import {
  CartContext,
} from "../context/CartContext";

import "./Checkout.css";


function Checkout() {

  const navigate = useNavigate();


  // ==================================================
  // AUTH CONTEXT
  // ==================================================

  const authContext = useContext(
    AuthContext
  );

  const user =
    authContext?.user || null;


  // ==================================================
  // CART CONTEXT
  // ==================================================

  const cartContext = useContext(
    CartContext
  );

  const cart =
    Array.isArray(cartContext?.cart)
      ? cartContext.cart
      : [];

  const setCart =
    cartContext?.setCart;


  // ==================================================
  // CUSTOMER DATA
  // ==================================================

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==================================================
  // TOTAL PRICE
  // ==================================================

  const totalPrice =
    cart.reduce(
      (sum, item) => {

        const price =
          Number(
            item?.price || 0
          );

        const quantity =
          Number(
            item?.quantity || 0
          );

        return (
          sum +
          price * quantity
        );
      },
      0
    );


  // ==================================================
  // NORMALIZE PHONE
  // ==================================================

  const normalizePhone = (
    value
  ) => {

    let cleanPhone =
      String(
        value || ""
      ).replace(
        /\D/g,
        ""
      );

    if (
      cleanPhone.startsWith("0")
    ) {
      cleanPhone =
        "20" +
        cleanPhone.slice(1);
    }

    if (
      cleanPhone.startsWith("+")
    ) {
      cleanPhone =
        cleanPhone.slice(1);
    }

    return cleanPhone;
  };


  // ==================================================
  // SEND ORDER
  // ==================================================

  const sendOrder =
    async () => {

      // ==================================================
      // PREVENT DOUBLE CLICK
      // ==================================================

      if (loading) {
        return;
      }


      // ==================================================
      // VALIDATION
      // ==================================================

      const cleanName =
        name.trim();

      const cleanPhone =
        phone.trim();

      const cleanAddress =
        address.trim();


      if (
        !cleanName ||
        !cleanPhone ||
        !cleanAddress
      ) {

        alert(
          "من فضلك اكتب الاسم ورقم الهاتف والعنوان"
        );

        return;
      }


      if (
        cart.length === 0
      ) {

        alert(
          "السلة فارغة"
        );

        navigate("/");

        return;
      }


      // ==================================================
      // CHECK CART CONTEXT
      // ==================================================

      if (
        typeof setCart !==
        "function"
      ) {

        console.error(
          "CartContext setCart غير متاح"
        );

        alert(
          "حدث خطأ في السلة، برجاء إعادة تحميل الصفحة"
        );

        return;
      }


      setLoading(true);


      try {

        // ==================================================
        // WHATSAPP MESSAGE
        // ==================================================

        let message =
          "🛒 طلب جديد من الصفتي ستور\n\n";


        message +=
          `👤 الاسم:\n${cleanName}\n\n`;


        message +=
          `📱 الهاتف:\n${cleanPhone}\n\n`;


        message +=
          `📍 العنوان:\n${cleanAddress}\n\n`;


        message +=
          "📦 المنتجات:\n\n";


        cart.forEach(
          (
            item,
            index
          ) => {

            const itemName =
              item?.title ||
              item?.name ||
              "منتج";


            const variantName =
              item?.selectedVariant
                ?.name ||
              "";


            const price =
              Number(
                item?.price || 0
              );


            const quantity =
              Number(
                item?.quantity || 0
              );


            const itemTotal =
              price * quantity;


            message +=
              `${index + 1}- ${itemName}\n`;


            if (
              variantName
            ) {

              message +=
                `🔀 النوع: ${variantName}\n`;

            }


            message +=
              `🔢 الكمية: ${quantity}\n`;


            message +=
              `💵 سعر الوحدة: ${price} جنيه\n`;


            message +=
              `💰 إجمالي المنتج: ${itemTotal} جنيه\n\n`;

          }
        );


        message +=
          `💰 الإجمالي النهائي:\n${totalPrice} جنيه`;


        // ==================================================
        // PREPARE ORDER PRODUCTS
        // ==================================================

        const orderProducts =
          cart.map(
            (item) => {

              const productId =
                item?.id ||
                item?._id ||
                null;


              const cartId =
                item?.cartId ||
                productId ||
                null;


              const selectedVariant =
                item?.selectedVariant
                  ? {
                      ...item.selectedVariant,
                    }
                  : null;


              return {

                id:
                  productId,

                cartId:
                  cartId,

                title:
                  item?.title ||
                  item?.name ||
                  "منتج",

                image:
                  item?.image ||
                  item?.images?.[0] ||
                  "",

                price:
                  Number(
                    item?.price || 0
                  ),

                oldPrice:
                  Number(
                    item?.oldPrice || 0
                  ),

                quantity:
                  Number(
                    item?.quantity || 0
                  ),

                stock:
                  Number(
                    item?.stock || 0
                  ),

                selectedVariant:
                  selectedVariant,

                variantName:
                  selectedVariant?.name ||
                  "",

              };

            }
          );


        // ==================================================
        // PHONE
        // ==================================================

        const whatsappPhone =
          normalizePhone(
            cleanPhone
          );


        // ==================================================
        // SAVE ORDER IN FIRESTORE
        // ==================================================

        const orderData = {

          // ==================================================
          // USER
          // ==================================================

          userId:
            user?.uid ||
            null,

          uid:
            user?.uid ||
            null,

          customerId:
            user?.uid ||
            null,

          userUID:
            user?.uid ||
            null,


          // ==================================================
          // CUSTOMER
          // ==================================================

          customerName:
            cleanName,

          email:
            user?.email ||
            "",

          phone:
            cleanPhone,

          address:
            cleanAddress,


          // ==================================================
          // PRODUCTS
          // ==================================================

          products:
            orderProducts,


          // ==================================================
          // TOTAL
          // ==================================================

          total:
            Number(
              totalPrice
            ),


          // ==================================================
          // STATUS
          // ==================================================

          status:
            "pending",


          // ==================================================
          // DATE
          // ==================================================

          createdAt:
            serverTimestamp(),

        };


        console.log(
          "Saving order:",
          orderData
        );


        await addDoc(
          collection(
            db,
            "orders"
          ),
          orderData
        );


        // ==================================================
        // WHATSAPP
        // ==================================================

        if (
          whatsappPhone
        ) {

          const whatsappUrl =
            `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
              message
            )}`;


          window.open(
            whatsappUrl,
            "_blank",
            "noopener,noreferrer"
          );

        } else {

          alert(
            "تم حفظ الطلب، لكن رقم الهاتف غير صالح لفتح واتساب."
          );

        }


        // ==================================================
        // CLEAR CART
        // ==================================================

        setCart([]);


        // ==================================================
        // SUCCESS
        // ==================================================

        alert(
          "تم إرسال الطلب بنجاح ✅"
        );


        navigate("/");


      } catch (
        error
      ) {

        console.error(
          "Order Error:",
          error
        );


        // ==================================================
        // FIREBASE ERROR
        // ==================================================

        if (
          error?.code ===
          "permission-denied"
        ) {

          alert(
            "تم رفض حفظ الطلب من Firebase. راجع Firestore Rules."
          );

        } else {

          alert(
            error?.message ||
            "حدث خطأ أثناء حفظ الطلب"
          );

        }

      } finally {

        setLoading(false);

      }

    };


  // ==================================================
  // EMPTY CART
  // ==================================================

  if (
    cart.length === 0
  ) {

    return (

      <div
        className="checkout-page"
        dir="rtl"
      >

        <div className="checkout-empty">

          <h2>
            لا يوجد منتجات لإتمام الطلب 🛒
          </h2>


          <button
            type="button"
            className="back-btn"
            onClick={() =>
              navigate("/")
            }
          >
            ⬅ العودة للمتجر
          </button>

        </div>

      </div>

    );

  }


  // ==================================================
  // CHECKOUT PAGE
  // ==================================================

  return (

    <div
      className="checkout-page"
      dir="rtl"
    >

      <h2>
        إتمام الطلب 🛒
      </h2>


      <div className="checkout-form">

        {/* ==================================================
            CUSTOMER NAME
        ================================================== */}

        <input
          type="text"
          placeholder="الاسم بالكامل"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
          disabled={loading}
        />


        {/* ==================================================
            PHONE
        ================================================== */}

        <input
          type="tel"
          placeholder="رقم الهاتف"
          value={phone}
          onChange={(e) =>
            setPhone(
              e.target.value
            )
          }
          disabled={loading}
        />


        {/* ==================================================
            ADDRESS
        ================================================== */}

        <textarea
          placeholder="العنوان بالتفصيل"
          value={address}
          onChange={(e) =>
            setAddress(
              e.target.value
            )
          }
          disabled={loading}
        />


        {/* ==================================================
            ORDER SUMMARY
        ================================================== */}

        <div className="checkout-summary">

          <h3>
            ملخص الطلب
          </h3>


          {cart.map(
            (
              item,
              index
            ) => {

              const itemId =
                item?.cartId ||
                item?.id ||
                item?._id ||
                `checkout-item-${index}`;


              const price =
                Number(
                  item?.price || 0
                );


              const quantity =
                Number(
                  item?.quantity || 0
                );


              const itemTotal =
                price * quantity;


              const variantName =
                item?.selectedVariant
                  ?.name ||
                "";


              return (

                <div
                  className="checkout-item"
                  key={itemId}
                >

                  <div className="checkout-item-info">

                    <strong>
                      {
                        item?.title ||
                        item?.name ||
                        "منتج"
                      }
                    </strong>


                    {variantName && (

                      <small>
                        🔀 النوع:{" "}
                        {variantName}
                      </small>

                    )}

                  </div>


                  <span>
                    {quantity} × {price} جنيه
                    {" = "}
                    {itemTotal} جنيه
                  </span>

                </div>

              );

            }
          )}


          {/* ==================================================
              TOTAL
          ================================================== */}

          <div className="checkout-total">

            <strong>
              الإجمالي:
            </strong>

            <strong>
              {totalPrice} جنيه
            </strong>

          </div>

        </div>


        {/* ==================================================
            CONFIRM ORDER
        ================================================== */}

        <button
          type="button"
          className="checkout-btn"
          onClick={
            sendOrder
          }
          disabled={
            loading
          }
        >

          {loading
            ? "⏳ جاري إرسال الطلب..."
            : "📦 تأكيد الطلب"}

        </button>


        {/* ==================================================
            BACK TO CART
        ================================================== */}

        <button
          type="button"
          className="back-btn"
          onClick={() =>
            navigate("/cart")
          }
          disabled={
            loading
          }
        >

          ⬅ الرجوع للسلة

        </button>

      </div>

    </div>

  );

}


export default Checkout;