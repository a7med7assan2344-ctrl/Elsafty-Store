import React, {
  useState,
  useEffect,
} from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase";

import "./Checkout.css";


function Checkout({
  cart,
  setCart,
  setCurrentView,
}) {

  // ==================================================
  // STATES
  // ==================================================

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("cash_on_delivery");

  const [loading, setLoading] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [categories, setCategories] =
    useState([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);


  // ==================================================
  // PAYMENT METHODS
  // ==================================================

  const paymentMethods = [
    {
      id: "cash_on_delivery",
      title: "الدفع عند الاستلام",
      icon: "💵",
      number: "",
      description:
        "ادفع قيمة الطلب عند استلامه",
    },

    {
      id: "vodafone_cash",
      title: "Vodafone Cash",
      icon: "🔴",
      number: "01289930155",
      description:
        "حوّل المبلغ على الرقم ثم أكمل الطلب",
    },

    {
      id: "we_pay",
      title: "WE Pay",
      icon: "🟣",
      number: "01553570220",
      description:
        "حوّل المبلغ على الرقم ثم أكمل الطلب",
    },

    {
      id: "instapay",
      title: "InstaPay",
      icon: "🟢",
      number: "01553570220",
      description:
        "حوّل المبلغ على الرقم ثم أكمل الطلب",
    },
  ];


  // ==================================================
  // GET CURRENT USER
  // ==================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          setCurrentUser(
            user || null
          );

        }
      );

    return () => {
      unsubscribe();
    };

  }, []);


  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  useEffect(() => {

    const loadCategories = async () => {

      try {

        setCategoriesLoading(true);

        const snapshot =
          await getDocs(
            collection(
              db,
              "categories"
            )
          );

        const loadedCategories =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...item.data(),
            })
          );

        console.log(
          "✅ تم تحميل الأقسام:",
          loadedCategories
        );

        setCategories(
          loadedCategories
        );

      } catch (error) {

        console.error(
          "❌ خطأ تحميل الأقسام:",
          error
        );

        setCategories([]);

      } finally {

        setCategoriesLoading(false);

      }

    };

    loadCategories();

  }, []);


  // ==================================================
  // NORMALIZE PHONE
  // ==================================================

  const normalizePhone = (
    value
  ) => {

    if (!value) {
      return "";
    }

    let phone =
      String(value)
        .replace(
          /\D/g,
          ""
        );

    // 01xxxxxxxxx
    if (
      phone.startsWith("01") &&
      phone.length === 11
    ) {
      return phone;
    }

    // 201xxxxxxxxx
    if (
      phone.startsWith("20") &&
      phone.length === 12
    ) {
      return "0" + phone.slice(2);
    }

    return phone;

  };


  // ==================================================
  // FIND CATEGORY FOR PRODUCT
  // ==================================================

  const findCategoryForProduct = (
    product
  ) => {

    if (!product) {
      return null;
    }


    // ------------------------------------------
    // CATEGORY ID
    // ------------------------------------------

    const productCategoryId =
      product.categoryId ||
      product.categoryID ||
      product.category_id ||
      product.category?.id ||
      product.category?.categoryId ||
      null;


    console.log(
      "🔎 Product Category ID:",
      productCategoryId
    );


    if (productCategoryId) {

      const directCategory =
        categories.find(
          (cat) =>
            String(cat.id) ===
            String(productCategoryId)
        );

      if (directCategory) {

        console.log(
          "✅ تم العثور على القسم:",
          directCategory
        );

        return directCategory;

      }

    }


    // ------------------------------------------
    // CATEGORY OBJECT / STRING
    // ------------------------------------------

    if (
      typeof product.category ===
      "string"
    ) {

      const category =
        categories.find(
          (cat) =>
            String(cat.id) ===
              String(product.category) ||
            String(cat.categoryNumber) ===
              String(product.category)
        );

      if (category) {
        return category;
      }

    }


    // ------------------------------------------
    // CATEGORY NUMBER
    // ------------------------------------------

    const productCategoryNumber =
      product.categoryNumber ||
      product.categoryNo ||
      product.departmentNumber ||
      null;


    if (
      productCategoryNumber !== null &&
      productCategoryNumber !== undefined &&
      productCategoryNumber !== ""
    ) {

      const category =
        categories.find(
          (cat) =>
            String(
              cat.categoryNumber
            ) ===
            String(
              productCategoryNumber
            )
        );

      if (category) {
        return category;
      }

    }


    return null;

  };


  // ==================================================
  // FIND DEPARTMENT WHATSAPP
  // ==================================================

  const getDepartmentWhatsapp = (
    product
  ) => {

    let category =
      findCategoryForProduct(
        product
      );

    const visited =
      new Set();


    // ------------------------------------------
    // القسم ثم الأب ثم الجد...
    // ------------------------------------------

    while (
      category &&
      !visited.has(category.id)
    ) {

      visited.add(
        category.id
      );


      const whatsapp =
        normalizePhone(
          category.whatsapp
        );


      if (whatsapp) {

        console.log(
          "✅ WhatsApp Found:",
          whatsapp,
          "Category:",
          category.name
        );

        return {
          phone: whatsapp,
          category,
        };

      }


      // ----------------------------------------
      // البحث في القسم الأب
      // ----------------------------------------

      if (
        category.parentId
      ) {

        category =
          categories.find(
            (cat) =>
              String(cat.id) ===
              String(category.parentId)
          );

      } else {

        category = null;

      }

    }


    return {
      phone: "",
      category: null,
    };

  };


  // ==================================================
  // PAYMENT METHOD TEXT
  // ==================================================

  const getPaymentMethodText = (
    method
  ) => {

    switch (method) {

      case "cash_on_delivery":
        return "الدفع عند الاستلام";

      case "vodafone_cash":
        return "Vodafone Cash";

      case "we_pay":
        return "WE Pay";

      case "instapay":
        return "InstaPay";

      default:
        return "غير محدد";

    }

  };


  // ==================================================
  // PAYMENT NUMBER
  // ==================================================

  const getPaymentNumber = (
    method
  ) => {

    switch (method) {

      case "vodafone_cash":
        return "01289930155";

      case "we_pay":
        return "01553570220";

      case "instapay":
        return "01553570220";

      default:
        return "";

    }

  };


  // ==================================================
  // TOTAL PRICE
  // ==================================================

  const totalPrice =
    Array.isArray(cart)
      ? cart.reduce(
          (sum, item) => {

            const price =
              Number(
                item?.price || 0
              );

            const quantity =
              Number(
                item?.quantity || 1
              );

            return (
              sum +
              price * quantity
            );

          },
          0
        )
      : 0;


  // ==================================================
  // SUBMIT ORDER
  // ==================================================

  const handleOrder = async (
    e
  ) => {

    e.preventDefault();


    // ------------------------------------------
    // منع الضغط مرتين
    // ------------------------------------------

    if (loading) {
      return;
    }


    // ------------------------------------------
    // LOGIN
    // ------------------------------------------

    if (!currentUser?.uid) {

      alert(
        "يجب تسجيل الدخول أولًا لإتمام الطلب"
      );

      return;

    }


    // ------------------------------------------
    // CART
    // ------------------------------------------

    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {

      alert(
        "السلة فارغة"
      );

      return;

    }


    // ------------------------------------------
    // CATEGORIES
    // ------------------------------------------

    if (categoriesLoading) {

      alert(
        "جاري تحميل بيانات الأقسام، حاول مرة أخرى بعد لحظات."
      );

      return;

    }


    if (
      !Array.isArray(categories) ||
      categories.length === 0
    ) {

      alert(
        "لم يتم تحميل الأقسام من Firebase."
      );

      return;

    }


    // ==================================================
    // CLEAN DATA
    // ==================================================

    const cleanName =
      name.trim();

    const cleanPhone =
      phone.trim();

    const cleanAddress =
      address.trim();


    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !cleanName ||
      !cleanPhone ||
      !cleanAddress
    ) {

      alert(
        "الرجاء إكمال بيانات الشحن (الاسم، الهاتف، العنوان)"
      );

      return;

    }


    // ==================================================
    // PAYMENT VALIDATION
    // ==================================================

    if (!paymentMethod) {

      alert(
        "برجاء اختيار طريقة الدفع"
      );

      return;

    }


    // ==================================================
    // PHONE VALIDATION
    // ==================================================

    const phoneDigits =
      cleanPhone.replace(
        /\D/g,
        ""
      );


    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 15
    ) {

      alert(
        "برجاء إدخال رقم هاتف صحيح"
      );

      return;

    }


    // ==================================================
    // START LOADING
    // ==================================================

    setLoading(true);


    try {

      // ==================================================
      // FIND DEPARTMENT
      // ==================================================

      let departmentWhatsapp =
        "";

      let departmentCategory =
        null;


      // ------------------------------------------
      // فحص كل المنتجات
      // ------------------------------------------

      for (
        const item of cart
      ) {

        console.log(
          "🛒 Cart Product:",
          item
        );


        const result =
          getDepartmentWhatsapp(
            item
          );


        if (
          result.phone
        ) {

          departmentWhatsapp =
            result.phone;

          departmentCategory =
            result.category;

          break;

        }

      }


      // ==================================================
      // NO WHATSAPP
      // ==================================================

      if (
        !departmentWhatsapp
      ) {

        console.error(
          "❌ لم يتم العثور على واتساب للقسم",
          {
            cart,
            categories,
          }
        );


        alert(
          "لا يوجد رقم واتساب صالح للقسم.\n\n" +
          "تأكد أن المنتج مرتبط بقسم، وأن القسم أو القسم الأب يحتوي على رقم واتساب في Firebase."
        );


        setLoading(false);

        return;

      }


      console.log(
        "===================================="
      );

      console.log(
        "✅ القسم:",
        departmentCategory?.name
      );

      console.log(
        "✅ رقم القسم:",
        departmentCategory?.categoryNumber
      );

      console.log(
        "✅ واتساب:",
        departmentWhatsapp
      );

      console.log(
        "===================================="
      );


      // ==================================================
      // PREPARE PRODUCTS
      // ==================================================

      const orderProducts =
        cart.map(
          (item) => {

            const quantity =
              Number(
                item?.quantity || 1
              );

            const price =
              Number(
                item?.price || 0
              );


            const productId =
              item?.id ||
              item?.productId ||
              null;


            const productTitle =
              item?.title ||
              item?.name ||
              "منتج";


            const variantName =
              item?.variantName ||
              item?.selectedVariant?.name ||
              "";


            const variantId =
              item?.variantId ||
              item?.selectedVariant?.id ||
              null;


            const category =
              findCategoryForProduct(
                item
              );


            return {

              productId,

              title:
                productTitle,

              name:
                productTitle,

              quantity,

              price,

              total:
                price * quantity,

              variantName,

              variantId,

              categoryId:
                category?.id ||
                item?.categoryId ||
                null,

              categoryNumber:
                category?.categoryNumber ||
                item?.categoryNumber ||
                "",

              categoryName:
                category?.name ||
                "",

            };

          }
        );


      // ==================================================
      // PAYMENT NUMBER
      // ==================================================

      const paymentNumber =
        getPaymentNumber(
          paymentMethod
        );


      // ==================================================
      // CREATE ORDER DATA
      // ==================================================

      const orderData = {

        // ==============================================
        // CUSTOMER ID
        // ==============================================

        userId:
          currentUser.uid,

        uid:
          currentUser.uid,

        customerId:
          currentUser.uid,

        userUID:
          currentUser.uid,


        // ==============================================
        // CUSTOMER DATA
        // ==============================================

        customerName:
          cleanName,

        name:
          cleanName,

        customerEmail:
          currentUser.email ||
          "",

        email:
          currentUser.email ||
          "",

        customerPhone:
          cleanPhone,

        phone:
          cleanPhone,

        address:
          cleanAddress,


        // ==============================================
        // PRODUCTS
        // ==============================================

        products:
          orderProducts,


        // ==============================================
        // DEPARTMENT
        // ==============================================

        departmentId:
          departmentCategory?.id ||
          "",

        departmentNumber:
          departmentCategory?.categoryNumber ||
          "",

        departmentName:
          departmentCategory?.name ||
          "",

        departmentWhatsapp:
          departmentWhatsapp,


        // ==============================================
        // TOTAL
        // ==============================================

        total:
          totalPrice,

        totalPrice:
          totalPrice,


        // ==============================================
        // PAYMENT
        // ==============================================

        paymentMethod:
          paymentMethod,

        paymentMethodName:
          getPaymentMethodText(
            paymentMethod
          ),

        paymentStatus:
          "pending",

        paymentNumber:
          paymentNumber,


        // ==============================================
        // ORDER STATUS
        // ==============================================

        status:
          "pending",

        orderStatus:
          "pending",


        // ==============================================
        // DATES
        // ==============================================

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

      };


      // ==================================================
      // SAVE ORDER
      // ==================================================

      const orderRef =
        await addDoc(
          collection(
            db,
            "orders"
          ),
          orderData
        );


      console.log(
        "✅ تم إنشاء الطلب:",
        orderRef.id
      );


      // ==================================================
      // SUCCESS MESSAGE
      // ==================================================

      let successMessage =
        "تم تسجيل طلبك بنجاح ✅\n\n" +
        "رقم الطلب: " +
        orderRef.id.slice(
          0,
          8
        );


      // ==================================================
      // DEPARTMENT INFO
      // ==================================================

      successMessage +=
        "\n🏷️ القسم: " +
        (
          departmentCategory?.name ||
          "غير محدد"
        );


      if (
        departmentCategory?.categoryNumber
      ) {

        successMessage +=
          "\n🔢 رقم القسم: " +
          departmentCategory.categoryNumber;

      }


      successMessage +=
        "\n📱 واتساب القسم: " +
        departmentWhatsapp;


      // ==================================================
      // PAYMENT INFO
      // ==================================================

      if (
        paymentMethod !==
        "cash_on_delivery"
      ) {

        const selectedPayment =
          paymentMethods.find(
            (item) =>
              item.id ===
              paymentMethod
          );


        successMessage +=
          "\n\n💳 طريقة الدفع: " +
          (
            selectedPayment?.title ||
            getPaymentMethodText(
              paymentMethod
            )
          );


        successMessage +=
          "\n📱 رقم التحويل: " +
          paymentNumber;


        successMessage +=
          "\n\n💰 إجمالي الطلب: " +
          totalPrice.toLocaleString(
            "ar-EG"
          ) +
          " جنيه";


        successMessage +=
          "\n\nيرجى تحويل قيمة الطلب والاحتفاظ بإثبات الدفع.";

      } else {

        successMessage +=
          "\n\n💵 طريقة الدفع: الدفع عند الاستلام";


        successMessage +=
          "\n💰 إجمالي الطلب: " +
          totalPrice.toLocaleString(
            "ar-EG"
          ) +
          " جنيه";

      }


      // ==================================================
      // CLEAR CART
      // ==================================================

      setCart([]);


      // ==================================================
      // SHOW SUCCESS
      // ==================================================

      alert(
        successMessage
      );


      // ==================================================
      // RETURN STORE
      // ==================================================

      setCurrentView(
        "store"
      );


    } catch (error) {

      console.error(
        "❌ Create Order Error:",
        error
      );


      alert(
        error?.message ||
        "حدث خطأ أثناء تسجيل الطلب، حاول مرة أخرى."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==================================================
  // EMPTY CART
  // ==================================================

  if (
    !Array.isArray(cart) ||
    cart.length === 0
  ) {

    return (

      <div
        className="checkout-container"
        dir="rtl"
      >

        <h2>
          🛒 السلة فارغة
        </h2>


        <button
          type="button"
          className="submit-order-btn"
          onClick={() =>
            setCurrentView(
              "store"
            )
          }
        >

          العودة للمتجر 🛍️

        </button>

      </div>

    );

  }


  // ==================================================
  // RETURN
  // ==================================================

  return (

    <div
      className="checkout-container"
      dir="rtl"
    >

      <h2>
        إتمام الطلب 🛒
      </h2>


      <p className="checkout-subtitle">
        أدخل بيانات الشحن واختر طريقة الدفع
      </p>


      <form
        onSubmit={handleOrder}
        className="checkout-form"
      >

        {/* ============================================
            NAME
        ============================================ */}

        <div className="form-group">

          <label>
            الاسم الكامل:
          </label>

          <input
            type="text"
            placeholder="أدخل اسمك هنا"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            disabled={loading}
            required
          />

        </div>


        {/* ============================================
            PHONE
        ============================================ */}

        <div className="form-group">

          <label>
            رقم الهاتف:
          </label>

          <input
            type="tel"
            inputMode="tel"
            placeholder="01553570220"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            disabled={loading}
            required
          />

        </div>


        {/* ============================================
            ADDRESS
        ============================================ */}

        <div className="form-group">

          <label>
            عنوان الشحن بالتفصيل:
          </label>

          <textarea
            placeholder="المحافظة - المدينة - الشارع - رقم المنزل"
            value={address}
            onChange={(e) =>
              setAddress(
                e.target.value
              )
            }
            rows="4"
            disabled={loading}
            required
          />

        </div>


        {/* ============================================
            PAYMENT METHODS
        ============================================ */}

        <div className="payment-method-section">

          <h3>
            💳 اختر طريقة الدفع
          </h3>


          <div className="payment-methods">

            {paymentMethods.map(
              (method) => {

                const isSelected =
                  paymentMethod ===
                  method.id;


                return (

                  <label
                    key={
                      method.id
                    }
                    className={`payment-method-card ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                  >

                    <input
                      type="radio"
                      name="paymentMethod"
                      value={
                        method.id
                      }
                      checked={
                        isSelected
                      }
                      onChange={() =>
                        setPaymentMethod(
                          method.id
                        )
                      }
                      disabled={
                        loading
                      }
                    />


                    <div className="payment-method-content">

                      <div className="payment-method-title">

                        <span className="payment-icon">
                          {
                            method.icon
                          }
                        </span>


                        <strong>
                          {
                            method.title
                          }
                        </strong>

                      </div>


                      <p>
                        {
                          method.description
                        }
                      </p>


                      {method.number && (

                        <div className="payment-number">

                          📱{" "}

                          <strong>
                            {
                              method.number
                            }
                          </strong>

                        </div>

                      )}

                    </div>

                  </label>

                );

              }
            )}

          </div>


          {/* =========================================
              PAYMENT NOTICE
          ========================================= */}

          {paymentMethod !==
            "cash_on_delivery" && (

            <div className="payment-notice">

              ⚠️{" "}

              <strong>
                تنبيه:
              </strong>

              <br />

              بعد تحويل مبلغ الطلب على الرقم الموضح،
              يرجى الاحتفاظ بإثبات الدفع.

            </div>

          )}

        </div>


        {/* ============================================
            PRODUCTS
        ============================================ */}

        <div className="order-products-preview">

          <h3>
            📦 المنتجات المطلوبة
          </h3>


          {cart.map(
            (item, index) => {

              const quantity =
                Number(
                  item?.quantity || 1
                );

              const price =
                Number(
                  item?.price || 0
                );

              const itemTotal =
                price * quantity;


              return (

                <div
                  className="checkout-product-row"
                  key={
                    item?.id ||
                    item?.productId ||
                    index
                  }
                >

                  <div>

                    <strong>
                      {
                        item?.title ||
                        item?.name ||
                        "منتج"
                      }
                    </strong>


                    {(item?.variantName ||
                      item?.selectedVariant?.name) && (

                      <small>

                        المتغير:{" "}

                        {
                          item?.variantName ||
                          item?.selectedVariant?.name
                        }

                      </small>

                    )}

                  </div>


                  <span>
                    ×{" "}
                    {quantity}
                  </span>


                  <strong>

                    {itemTotal.toLocaleString(
                      "ar-EG"
                    )}

                    {" "}
                    ج.م

                  </strong>

                </div>

              );

            }
          )}

        </div>


        {/* ============================================
            TOTAL
        ============================================ */}

        <div className="order-summary-box">

          <h4>

            إجمالي الطلب:

            <span>

              {totalPrice.toLocaleString(
                "ar-EG"
              )}

              {" "}
              جنيه

            </span>

          </h4>

        </div>


        {/* ============================================
            SUBMIT
        ============================================ */}

        <button
          type="submit"
          className="submit-order-btn"
          disabled={
            loading ||
            categoriesLoading
          }
        >

          {loading
            ? "⏳ جاري تسجيل الطلب..."
            : categoriesLoading
              ? "⏳ جاري تحميل الأقسام..."
              : "تأكيد الطلب الآن ✅"}

        </button>


      </form>

    </div>

  );

}


export default Checkout;