import React, {
  useContext,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import {
  db
} from "../firebase";

import {
  AuthContext
} from "../context/AuthContext";

import {
  CartContext
} from "../context/CartContext";

import "./Checkout.css";


function Checkout() {

  const navigate = useNavigate();

  const { user } =
    useContext(AuthContext);

  const {
    cart,
    setCart
  } = useContext(CartContext);


  // =====================
  // CUSTOMER DATA
  // =====================

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =====================
  // TOTAL PRICE
  // =====================

  const totalPrice =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );


  // =====================
  // SEND ORDER
  // =====================

  const sendOrder = async () => {

    // =====================
    // VALIDATION
    // =====================

    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim()
    ) {

      alert(
        "من فضلك اكتب الاسم ورقم الهاتف والعنوان"
      );

      return;
    }


    if (cart.length === 0) {

      alert(
        "السلة فارغة"
      );

      navigate("/");

      return;
    }


    if (loading) {
      return;
    }


    setLoading(true);


    // =====================
    // WHATSAPP MESSAGE
    // =====================

    let message =
      "🛒 طلب جديد من الصفتي ستور\n\n";


    message +=
      `👤 الاسم:\n${name.trim()}\n\n`;


    message +=
      `📱 الهاتف:\n${phone.trim()}\n\n`;


    message +=
      `📍 العنوان:\n${address.trim()}\n\n`;


    message +=
      "📦 المنتجات:\n\n";


    cart.forEach(
      (item, index) => {

        const itemName =
          item.title ||
          item.name ||
          "منتج";


        const variantName =
          item.selectedVariant?.name ||
          "";


        const price =
          Number(item.price || 0);


        const quantity =
          Number(item.quantity || 0);


        const itemTotal =
          price * quantity;


        message +=
          `${index + 1}- ${itemName}\n`;


        if (variantName) {

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


    // =====================
    // FIRESTORE PRODUCTS
    // =====================

    const orderProducts =
      cart.map(
        (item) => {

          const productId =
            item.id ||
            item._id ||
            null;


          const cartId =
            item.cartId ||
            productId;


          return {

            id:
              productId,

            cartId:
              cartId,

            title:
              item.title ||
              item.name ||
              "منتج",

            image:
              item.image ||
              item.images?.[0] ||
              "",

            price:
              Number(item.price || 0),

            oldPrice:
              Number(item.oldPrice || 0),

            quantity:
              Number(item.quantity || 0),

            stock:
              Number(item.stock || 0),

            selectedVariant:
              item.selectedVariant
                ? {
                    ...item.selectedVariant
                  }
                : null,

            variantName:
              item.selectedVariant?.name ||
              ""

          };

        }
      );


    // =====================
    // SAVE ORDER
    // =====================

    try {

      await addDoc(
        collection(
          db,
          "orders"
        ),
        {

          // =====================
          // CUSTOMER
          // =====================

          userId:
            user?.uid || null,

          customerName:
            name.trim(),

          email:
            user?.email || "",

          phone:
            phone.trim(),

          address:
            address.trim(),


          // =====================
          // PRODUCTS
          // =====================

          products:
            orderProducts,


          // =====================
          // TOTAL
          // =====================

          total:
            totalPrice,


          // =====================
          // STATUS
          // =====================

          status:
            "Pending",


          // =====================
          // DATE
          // =====================

          createdAt:
            serverTimestamp()

        }
      );


      // =====================
      // WHATSAPP
      // =====================

      const whatsappUrl =
        `https://wa.me/201553570220?text=${encodeURIComponent(
          message
        )}`;


      window.open(
        whatsappUrl,
        "_blank"
      );


      // =====================
      // CLEAR CART
      // =====================

      setCart([]);


      alert(
        "تم إرسال الطلب بنجاح ✅"
      );


      navigate("/");


    } catch (error) {

      console.error(
        "Order Error:",
        error
      );


      alert(
        "حدث خطأ أثناء حفظ الطلب"
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================
  // EMPTY CART
  // =====================

  if (cart.length === 0) {

    return (

      <div className="checkout-page">

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


  // =====================
  // RETURN
  // =====================

  return (

    <div className="checkout-page">

      <h2>
        إتمام الطلب 🛒
      </h2>


      <div className="checkout-form">

        {/* =====================
            CUSTOMER NAME
        ===================== */}

        <input
          type="text"
          placeholder="الاسم بالكامل"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />


        {/* =====================
            PHONE
        ===================== */}

        <input
          type="tel"
          placeholder="رقم الهاتف"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />


        {/* =====================
            ADDRESS
        ===================== */}

        <textarea
          placeholder="العنوان بالتفصيل"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
        />


        {/* =====================
            ORDER SUMMARY
        ===================== */}

        <div className="checkout-summary">

          <h3>
            ملخص الطلب
          </h3>


          {cart.map(
            (item, index) => {

              const itemId =
                item.cartId ||
                item.id ||
                item._id ||
                index;


              const price =
                Number(
                  item.price || 0
                );


              const quantity =
                Number(
                  item.quantity || 0
                );


              const itemTotal =
                price * quantity;


              const variantName =
                item.selectedVariant?.name;


              return (

                <div
                  className="checkout-item"
                  key={itemId}
                >

                  <div className="checkout-item-info">

                    <strong>
                      {
                        item.title ||
                        item.name ||
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


          {/* =====================
              TOTAL
          ===================== */}

          <div className="checkout-total">

            <strong>
              الإجمالي:
            </strong>

            <strong>
              {totalPrice} جنيه
            </strong>

          </div>

        </div>


        {/* =====================
            CONFIRM ORDER
        ===================== */}

        <button
          type="button"
          className="checkout-btn"
          onClick={sendOrder}
          disabled={loading}
        >

          {
            loading
              ? "جاري إرسال الطلب..."
              : "📦 تأكيد الطلب"
          }

        </button>


        {/* =====================
            BACK TO CART
        ===================== */}

        <button
          type="button"
          className="back-btn"
          onClick={() =>
            navigate("/cart")
          }
          disabled={loading}
        >

          ⬅ الرجوع للسلة

        </button>

      </div>

    </div>

  );

}


export default Checkout;