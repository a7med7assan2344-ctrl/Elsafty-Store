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
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
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

  const authContext =
    useContext(AuthContext);

  const user =
    authContext?.user || null;


  // ==================================================
  // CART CONTEXT
  // ==================================================

  const cartContext =
    useContext(CartContext);

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
      cleanPhone.startsWith("00")
    ) {

      cleanPhone =
        cleanPhone.slice(2);

    }


    if (
      cleanPhone.startsWith("0")
    ) {

      cleanPhone =
        "20" +
        cleanPhone.slice(1);

    }


    return cleanPhone;
  };


  // ==================================================
  // GET CATEGORY WHATSAPP
  // ==================================================

  const getCategoryWhatsapp =
    async (
      categoryName
    ) => {

      if (
        !categoryName
      ) {

        return null;

      }


      try {

        const categoriesRef =
          collection(
            db,
            "categories"
          );


        const q =
          query(
            categoriesRef,
            where(
              "name",
              "==",
              categoryName
            )
          );


        const snapshot =
          await getDocs(q);


        if (
          snapshot.empty
        ) {

          return null;

        }


        const categoryDoc =
          snapshot.docs[0];


        const categoryData =
          categoryDoc.data() || {};


        /*
         * ندعم أكثر من اسم محتمل للحقل
         */

        const rawWhatsapp =
          categoryData.whatsapp ||
          categoryData.whatsappPhone ||
          categoryData.whatsappNumber ||
          categoryData.phone ||
          categoryData.phoneNumber ||
          categoryData.contactPhone ||
          "";


        const whatsapp =
          normalizePhone(
            rawWhatsapp
          );


        if (
          !whatsapp
        ) {

          return null;

        }


        return {

          id:
            categoryDoc.id,

          name:
            categoryData.name ||
            categoryName,

          whatsapp:

            whatsapp,

        };

      } catch (
        error
      ) {

        console.error(
          "Category WhatsApp Error:",
          error
        );

        return null;

      }

    };


  // ==================================================
  // GET DEPARTMENTS USED BY CART
  // ==================================================

  const getDepartmentsForOrder =
    async () => {

      const departmentMap =
        new Map();


      for (
        const item of cart
      ) {

        const categoryName =
          String(
            item?.category ||
            item?.categoryName ||
            ""
          ).trim();


        if (
          !categoryName
        ) {

          continue;

        }


        if (
          departmentMap.has(
            categoryName
          )
        ) {

          continue;

        }


        const department =
          await getCategoryWhatsapp(
            categoryName
          );


        departmentMap.set(
          categoryName,
          department
        );

      }


      return Array.from(
        departmentMap.values()
      ).filter(
        Boolean
      );

    };


  // ==================================================
  // CREATE SEQUENTIAL ORDER NUMBER
  // ==================================================

  const createSequentialOrderNumber =
    async () => {

      const counterRef =
        doc(
          db,
          "counters",
          "orders"
        );


      const orderNumber =
        await runTransaction(
          db,
          async (
            transaction
          ) => {

            const counterSnap =
              await transaction.get(
                counterRef
              );


            let nextNumber =
              1;


            if (
              counterSnap.exists()
            ) {

              const currentNumber =
                Number(
                  counterSnap.data()
                    ?.lastNumber || 0
                );


              nextNumber =
                currentNumber + 1;

            }


            transaction.set(
              counterRef,
              {

                lastNumber:
                  nextNumber,

                updatedAt:
                  serverTimestamp(),

              },
              {

                merge:
                  true,

              }
            );


            return nextNumber;

          }
        );


      return orderNumber;

    };


  // ==================================================
  // BUILD WHATSAPP MESSAGE
  // ==================================================

  const buildWhatsappMessage =
    (
      orderNumber,
      departmentName
    ) => {

      let message =
        "🛒 *طلب جديد من Elsafty Store*\n\n";


      message +=
        `🔢 *رقم الطلب: #${orderNumber}*\n\n`;


      if (
        departmentName
      ) {

        message +=
          `🏷️ *القسم: ${departmentName}*\n\n`;

      }


      message +=
        `👤 *اسم العميل:*\n${name.trim()}\n\n`;


      message +=
        `📱 *رقم العميل:*\n${phone.trim()}\n\n`;


      message +=
        `📍 *العنوان:*\n${address.trim()}\n\n`;


      message +=
        "📦 *المنتجات:*\n\n";


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
            item?.variantName ||
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
            `${index + 1}- *${itemName}*\n`;


          if (
            item?.category ||
            item?.categoryName
          ) {

            message +=
              `🏷️ القسم: ${
                item?.category ||
                item?.categoryName
              }\n`;

          }


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
        "━━━━━━━━━━━━━━━━\n";


      message +=
        `💰 *الإجمالي النهائي: ${totalPrice} جنيه*\n\n`;


      message +=
        "🌐 تم تسجيل الطلب على الموقع.";


      return message;

    };


  // ==================================================
  // SEND ORDER
  // ==================================================

  const sendOrder =
    async () => {

      // ==================================================
      // PREVENT DOUBLE CLICK
      // ==================================================

      if (
        loading
      ) {

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
          "من فضلك اكتب الاسم ورقم الهاتف والعنوان."
        );

        return;

      }


      if (
        cart.length === 0
      ) {

        alert(
          "السلة فارغة."
        );

        navigate("/");

        return;

      }


      if (
        typeof setCart !==
        "function"
      ) {

        console.error(
          "CartContext setCart غير متاح"
        );

        alert(
          "حدث خطأ في السلة، برجاء إعادة تحميل الصفحة."
        );

        return;

      }


      setLoading(true);


      try {

        // ==================================================
        // 1 — GET DEPARTMENTS
        // ==================================================

        const departments =
          await getDepartmentsForOrder();


        /*
         * لازم يكون فيه قسم ورقم واتساب
         * قبل السماح بإتمام الطلب.
         */

        if (
          departments.length === 0
        ) {

          alert(
            "لا يمكن إتمام الطلب.\n\nلا يوجد رقم واتساب مضاف للقسم الخاص بالمنتج.\n\nأضف رقم واتساب للقسم من لوحة الأدمن ثم حاول مرة أخرى."
          );

          return;

        }


        // ==================================================
        // 2 — CREATE ORDER NUMBER
        // ==================================================

        const orderNumber =
          await createSequentialOrderNumber();


        // ==================================================
        // 3 — PREPARE PRODUCTS
        // ==================================================

        const orderProducts =
          cart.map(
            (
              item
            ) => {

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

                name:
                  item?.name ||
                  item?.title ||
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

                category:
                  item?.category ||
                  item?.categoryName ||
                  "",

                selectedVariant:
                  selectedVariant,

                variantName:
                  selectedVariant?.name ||
                  item?.variantName ||
                  "",

              };

            }
          );


        // ==================================================
        // 4 — DEPARTMENT DATA
        // ==================================================

        const departmentData =
          departments.map(
            (
              department
            ) => ({

              id:
                department.id,

              name:
                department.name,

              whatsapp:
                department.whatsapp,

            })
          );


        /*
         * أول قسم هو القسم الذي سيتم فتح واتساب الخاص به.
         */

        const firstDepartment =
          departmentData[0];


        const departmentWhatsapp =
          normalizePhone(
            firstDepartment?.whatsapp
          );


        if (
          !departmentWhatsapp
        ) {

          alert(
            "لا يوجد رقم واتساب صالح للقسم.\n\nتم إيقاف الطلب ولم يتم حفظه."
          );

          return;

        }


        // ==================================================
        // 5 — SAVE ORDER IN FIRESTORE FIRST
        // ==================================================

        const orderData = {

          // ----------------------------------------------
          // ORDER NUMBER
          // ----------------------------------------------

          orderNumber:
            orderNumber,

          orderNumberText:
            `#${orderNumber}`,


          // ----------------------------------------------
          // USER
          // ----------------------------------------------

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


          // ----------------------------------------------
          // CUSTOMER
          // ----------------------------------------------

          customerName:
            cleanName,

          email:
            user?.email ||
            "",

          phone:
            cleanPhone,

          address:
            cleanAddress,


          // ----------------------------------------------
          // PRODUCTS
          // ----------------------------------------------

          products:
            orderProducts,


          // ----------------------------------------------
          // TOTAL
          // ----------------------------------------------

          total:
            Number(
              totalPrice
            ),


          // ----------------------------------------------
          // DEPARTMENTS
          // ----------------------------------------------

          departments:
            departmentData,

          departmentName:
            departmentData
              .map(
                (
                  department
                ) =>
                  department.name
              )
              .join(
                "، "
              ),


          // ----------------------------------------------
          // WHATSAPP
          // ----------------------------------------------

          whatsappPhone:
            departmentWhatsapp,

          whatsappSent:
            false,


          // ----------------------------------------------
          // STATUS
          // ----------------------------------------------

          status:
            "pending",


          // ----------------------------------------------
          // DATE
          // ----------------------------------------------

          createdAt:
            serverTimestamp(),

        };


        console.log(
          "Saving order BEFORE WhatsApp:",
          orderData
        );


        /*
         * مهم جدًا:
         *
         * الطلب يتحفظ هنا أولًا.
         *
         * لو addDoc فشل:
         * لن يتم فتح WhatsApp.
         */

        const orderRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            orderData
          );


        console.log(
          "Order saved successfully:",
          orderRef.id
        );


        // ==================================================
        // 6 — BUILD WHATSAPP MESSAGE
        // ==================================================

        const whatsappMessage =
          buildWhatsappMessage(
            orderNumber,
            firstDepartment?.name
          );


        // ==================================================
        // 7 — CREATE WHATSAPP URL
        // ==================================================

        const whatsappUrl =
          `https://wa.me/${departmentWhatsapp}?text=${encodeURIComponent(
            whatsappMessage
          )}`;


        console.log(
          "WhatsApp Department:",
          firstDepartment?.name
        );

        console.log(
          "WhatsApp Number:",
          departmentWhatsapp
        );

        console.log(
          "WhatsApp URL:",
          whatsappUrl
        );


        // ==================================================
        // 8 — CLEAR CART
        // ==================================================

        setCart([]);


        // ==================================================
        // 9 — OPEN WHATSAPP
        // ==================================================

        /*
         * الطلب تم حفظه بالفعل في Firestore.
         * الآن فقط يتم فتح WhatsApp.
         */

        window.location.href =
          whatsappUrl;


        // ==================================================
        // 10 — SUCCESS
        // ==================================================

        setTimeout(
          () => {

            alert(
              `تم تسجيل الطلب رقم #${orderNumber} بنجاح ✅\n\nتم حفظ الطلب في لوحة الأدمن.\n\nسيتم فتح واتساب القسم لإرسال تفاصيل الطلب.`
            );

          },
          300
        );


      } catch (
        error
      ) {

        console.error(
          "Order Error:",
          error
        );


        // ==================================================
        // FIRESTORE ERROR
        // ==================================================

        if (
          error?.code ===
          "permission-denied"
        ) {

          alert(
            "فشل حفظ الطلب في لوحة الأدمن.\n\nتم إيقاف إرسال واتساب لأن حفظ الطلب لم ينجح.\n\nراجع Firestore Rules."
          );

        } else {

          alert(
            error?.message ||
            "حدث خطأ أثناء تسجيل الطلب."
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

        <div
          className="checkout-empty"
        >

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


      <div
        className="checkout-form"
      >

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

        <div
          className="checkout-summary"
        >

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
                item?.variantName ||
                "";


              return (

                <div
                  className="checkout-item"
                  key={itemId}
                >

                  <div
                    className="checkout-item-info"
                  >

                    <strong>

                      {
                        item?.title ||
                        item?.name ||
                        "منتج"
                      }

                    </strong>


                    {(
                      item?.category ||
                      item?.categoryName
                    ) && (

                      <small>

                        🏷️ القسم:{" "}

                        {
                          item?.category ||
                          item?.categoryName
                        }

                      </small>

                    )}


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

          <div
            className="checkout-total"
          >

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

            ? "⏳ جاري تسجيل الطلب وفتح واتساب..."

            : "📦 تأكيد الطلب وإرسال واتساب"

          }

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