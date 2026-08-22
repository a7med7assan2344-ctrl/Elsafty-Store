import React, {
  useState,
  useEffect,
} from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
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
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [categories, setCategories] =
    useState([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [paymentMethods, setPaymentMethods] =
    useState([]);

  const [paymentMethodsLoading, setPaymentMethodsLoading] =
    useState(true);

  const [shippingZones, setShippingZones] =
    useState([]);

  const [shippingZonesLoading, setShippingZonesLoading] =
    useState(true);

  const [selectedShippingZone, setSelectedShippingZone] =
    useState("");

  const [shippingCost, setShippingCost] =
    useState(0);

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [couponLoading, setCouponLoading] =
    useState(false);

  const [couponError, setCouponError] =
    useState("");

  const [couponMessage, setCouponMessage] =
    useState("");


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
  // LOAD PAYMENT METHODS
  // ==================================================

  useEffect(() => {

    const loadPaymentMethods =
      async () => {

        try {

          setPaymentMethodsLoading(
            true
          );

          const snapshot =
            await getDocs(
              collection(
                db,
                "paymentMethods"
              )
            );

          const loadedMethods =
            snapshot.docs
              .map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              )
              .filter(
                (method) =>
                  method.active !== false
              );

          setPaymentMethods(
            loadedMethods
          );

        } catch (error) {

          console.error(
            "❌ خطأ تحميل طرق الدفع:",
            error
          );

          // طريقة احتياطية في حالة عدم
          // وجود بيانات طرق الدفع
          setPaymentMethods([
            {
              id: "cash_on_delivery",
              title: "الدفع عند الاستلام",
              icon: "💵",
              number: "",
              description:
                "ادفع قيمة الطلب عند استلامه",
              active: true,
            },
          ]);

        } finally {

          setPaymentMethodsLoading(
            false
          );

        }

      };

    loadPaymentMethods();

  }, []);


  // ==================================================
  // SET DEFAULT PAYMENT METHOD
  // ==================================================

  useEffect(() => {

    if (
      paymentMethods.length > 0
    ) {

      const selectedStillExists =
        paymentMethods.some(
          (method) =>
            method.id ===
            paymentMethod
        );

      if (
        !paymentMethod ||
        !selectedStillExists
      ) {

        const cashMethod =
          paymentMethods.find(
            (method) =>
              method.id ===
              "cash_on_delivery" ||
              method.id === "cash" ||
              method.id === "cod"
          );

        setPaymentMethod(
          cashMethod?.id ||
          paymentMethods[0].id
        );

      }

    }

  }, [
    paymentMethods,
    paymentMethod,
  ]);


  // ==================================================
  // LOAD SHIPPING ZONES
  // ==================================================

  useEffect(() => {

    const loadShippingZones =
      async () => {

        try {

          setShippingZonesLoading(
            true
          );

          const snapshot =
            await getDocs(
              collection(
                db,
                "shippingZones"
              )
            );

          const loadedZones =
            snapshot.docs
              .map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              )
              .filter(
                (zone) =>
                  zone.active !== false
              );

          setShippingZones(
            loadedZones
          );

        } catch (error) {

          console.error(
            "❌ خطأ تحميل مناطق الشحن:",
            error
          );

          setShippingZones([]);

        } finally {

          setShippingZonesLoading(
            false
          );

        }

      };

    loadShippingZones();

  }, []);


  // ==================================================
  // SET SHIPPING COST
  // ==================================================

  useEffect(() => {

    if (
      !selectedShippingZone
    ) {

      setShippingCost(0);

      return;

    }

    const selectedZone =
      shippingZones.find(
        (zone) =>
          String(zone.id) ===
          String(selectedShippingZone)
      );

    if (!selectedZone) {

      setShippingCost(0);

      return;

    }

    const zonePrice =
      Number(
        selectedZone.price ??
        selectedZone.shippingCost ??
        selectedZone.cost ??
        selectedZone.amount ??
        0
      );

    setShippingCost(
      zonePrice >= 0
        ? zonePrice
        : 0
    );

  }, [
    selectedShippingZone,
    shippingZones,
  ]);


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

    if (
      phone.startsWith("01") &&
      phone.length === 11
    ) {

      return phone;

    }

    if (
      phone.startsWith("20") &&
      phone.length === 12
    ) {

      return "0" +
        phone.slice(2);

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

    const productCategoryId =
      product.categoryId ||
      product.categoryID ||
      product.category_id ||
      product.category?.id ||
      product.category?.categoryId ||
      null;

    if (productCategoryId) {

      const directCategory =
        categories.find(
          (cat) =>
            String(cat.id) ===
            String(
              productCategoryId
            )
        );

      if (directCategory) {

        return directCategory;

      }

    }

    if (
      typeof product.category ===
      "string"
    ) {

      const category =
        categories.find(
          (cat) =>
            String(cat.id) ===
              String(product.category) ||
            String(
              cat.categoryNumber
            ) ===
              String(product.category)
        );

      if (category) {
        return category;
      }

    }

    const productCategoryNumber =
      product.categoryNumber ||
      product.categoryNo ||
      product.departmentNumber ||
      null;

    if (
      productCategoryNumber !==
        null &&
      productCategoryNumber !==
        undefined &&
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

    while (
      category &&
      !visited.has(
        category.id
      )
    ) {

      visited.add(
        category.id
      );

      const whatsapp =
        normalizePhone(
          category.whatsapp
        );

      if (whatsapp) {

        return {
          phone: whatsapp,
          category,
        };

      }

      if (
        category.parentId
      ) {

        category =
          categories.find(
            (cat) =>
              String(cat.id) ===
              String(
                category.parentId
              )
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

    if (!method) {
      return "غير محدد";
    }

    const foundMethod =
      paymentMethods.find(
        (item) =>
          String(item.id) ===
          String(method)
      );

    if (
      foundMethod?.title
    ) {

      return foundMethod.title;

    }

    const value =
      String(method)
        .trim()
        .toLowerCase();

    const fallbackMap = {
      cash_on_delivery:
        "الدفع عند الاستلام",

      cash:
        "الدفع عند الاستلام",

      cod:
        "الدفع عند الاستلام",

      vodafone_cash:
        "Vodafone Cash",

      we_pay:
        "WE Pay",

      instapay:
        "InstaPay",

      card:
        "الدفع الإلكتروني",

      online:
        "الدفع الإلكتروني",
    };

    return (
      fallbackMap[value] ||
      method ||
      "غير محدد"
    );

  };


  // ==================================================
  // GET PAYMENT NUMBER
  // ==================================================

  const getPaymentNumber = (
    method
  ) => {

    const selectedPayment =
      paymentMethods.find(
        (item) =>
          String(item.id) ===
          String(method)
      );

    if (
      selectedPayment?.number
    ) {

      return selectedPayment.number;

    }

    if (
      selectedPayment?.phone
    ) {

      return selectedPayment.phone;

    }

    return "";

  };


  // ==================================================
  // TOTAL PRICE
  // ==================================================

  const subtotal =
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
  // COUPON DISCOUNT
  // ==================================================

  const couponDiscount =
    appliedCoupon
      ? appliedCoupon.type ===
        "percentage"
        ? Math.min(
            subtotal,
            subtotal *
              (
                Number(
                  appliedCoupon.value ||
                  0
                ) / 100
              )
          )
        : Math.min(
            subtotal,
            Number(
              appliedCoupon.value ||
              0
            )
          )
      : 0;


  // ==================================================
  // TOTAL BEFORE SHIPPING
  // ==================================================

  const totalBeforeShipping =
    Math.max(
      subtotal -
        couponDiscount,
      0
    );


  // ==================================================
  // FINAL TOTAL
  // ==================================================

  const finalTotal =
    Math.max(
      totalBeforeShipping +
        shippingCost,
      0
    );


  // ==================================================
  // APPLY COUPON
  // ==================================================

  const handleApplyCoupon =
    async () => {

      const cleanCode =
        couponCode
          .trim()
          .toUpperCase();

      if (!cleanCode) {

        setCouponError(
          "اكتب كود الخصم أولًا."
        );

        setCouponMessage("");

        return;

      }

      setCouponLoading(
        true
      );

      setCouponError("");
      setCouponMessage("");
      setAppliedCoupon(null);

      try {

        const couponQuery =
          query(
            collection(
              db,
              "coupons"
            ),
            where(
              "code",
              "==",
              cleanCode
            )
          );

        const snapshot =
          await getDocs(
            couponQuery
          );

        if (
          snapshot.empty
        ) {

          setCouponError(
            "كود الخصم غير صحيح."
          );

          return;

        }

        const couponDoc =
          snapshot.docs[0];

        const coupon = {
          id: couponDoc.id,
          ...couponDoc.data(),
        };

        if (
          coupon.active === false
        ) {

          setCouponError(
            "كود الخصم غير مفعل."
          );

          return;

        }

        const minimumOrder =
          Number(
            coupon.minOrder || 0
          );

        if (
          subtotal <
          minimumOrder
        ) {

          setCouponError(
            `الحد الأدنى لاستخدام الكوبون هو ${minimumOrder.toLocaleString(
              "ar-EG"
            )} ج.م`
          );

          return;

        }

        const couponValue =
          Number(
            coupon.value || 0
          );

        if (
          couponValue <= 0
        ) {

          setCouponError(
            "قيمة الكوبون غير صحيحة."
          );

          return;

        }

        if (
          coupon.type !==
            "percentage" &&
          coupon.type !==
            "fixed"
        ) {

          setCouponError(
            "نوع الخصم غير صحيح."
          );

          return;

        }

        setAppliedCoupon(
          coupon
        );

        setCouponMessage(
          `✅ تم تطبيق الكوبون ${coupon.code} بنجاح.`
        );

      } catch (error) {

        console.error(
          "❌ Coupon error:",
          error
        );

        setCouponError(
          "حدث خطأ أثناء التحقق من الكوبون."
        );

      } finally {

        setCouponLoading(
          false
        );

      }

    };


  // ==================================================
  // REMOVE COUPON
  // ==================================================

  const handleRemoveCoupon =
    () => {

      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
      setCouponMessage("");

    };


  // ==================================================
  // SUBMIT ORDER
  // ==================================================

  const handleOrder = async (
    e
  ) => {

    e.preventDefault();

    if (loading) {
      return;
    }

    if (!currentUser?.uid) {

      alert(
        "يجب تسجيل الدخول أولًا لإتمام الطلب"
      );

      return;

    }

    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {

      alert(
        "السلة فارغة"
      );

      return;

    }

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

    if (
      paymentMethodsLoading
    ) {

      alert(
        "جاري تحميل طرق الدفع، حاول مرة أخرى بعد لحظات."
      );

      return;

    }

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
        "الرجاء إكمال بيانات الشحن (الاسم، الهاتف، العنوان)"
      );

      return;

    }

    if (!paymentMethod) {

      alert(
        "برجاء اختيار طريقة الدفع"
      );

      return;

    }

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

    if (
      shippingZonesLoading
    ) {

      alert(
        "جاري تحميل مناطق الشحن، حاول مرة أخرى بعد لحظات."
      );

      return;

    }

    setLoading(true);

    try {

      // ==================================================
      // FIND DEPARTMENT
      // ==================================================

      let departmentWhatsapp =
        "";

      let departmentCategory =
        null;

      for (
        const item of cart
      ) {

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

        return;

      }

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
                price *
                quantity,

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
      // PAYMENT
      // ==================================================

      const selectedPayment =
        paymentMethods.find(
          (item) =>
            String(item.id) ===
            String(paymentMethod)
        );

      const paymentNumber =
        getPaymentNumber(
          paymentMethod
        );

      const paymentTitle =
        selectedPayment?.title ||
        getPaymentMethodText(
          paymentMethod
        );


      // ==================================================
      // SHIPPING
      // ==================================================

      const selectedZone =
        shippingZones.find(
          (zone) =>
            String(zone.id) ===
            String(
              selectedShippingZone
            )
        );

      const shippingZoneName =
        selectedZone?.name ||
        selectedZone?.title ||
        "";

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
        // SHIPPING
        // ==============================================

        shippingZoneId:
          selectedShippingZone ||
          "",

        shippingZoneName:
          shippingZoneName,

        shippingCost:
          shippingCost,


        // ==============================================
        // TOTALS
        // ==============================================

        subtotal:
          subtotal,

        discount:
          couponDiscount,

        shipping:
          shippingCost,

        total:
          finalTotal,

        totalPrice:
          finalTotal,


        // ==============================================
        // COUPON
        // ==============================================

        couponId:
          appliedCoupon?.id ||
          "",

        couponCode:
          appliedCoupon?.code ||
          "",

        couponType:
          appliedCoupon?.type ||
          "",

        couponValue:
          Number(
            appliedCoupon?.value ||
            0
          ),


        // ==============================================
        // PAYMENT
        // ==============================================

        paymentMethod:
          paymentMethod,

        paymentMethodName:
          paymentTitle,

        paymentNumber:
          paymentNumber,

        paymentStatus:
          "pending",


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
      // SHIPPING INFO
      // ==================================================

      if (
        shippingZoneName
      ) {

        successMessage +=
          "\n🚚 منطقة الشحن: " +
          shippingZoneName;

      }

      if (
        shippingCost > 0
      ) {

        successMessage +=
          "\n💵 تكلفة الشحن: " +
          shippingCost.toLocaleString(
            "ar-EG"
          ) +
          " جنيه";

      }


      // ==================================================
      // COUPON INFO
      // ==================================================

      if (
        appliedCoupon &&
        couponDiscount > 0
      ) {

        successMessage +=
          "\n🎟️ كود الخصم: " +
          appliedCoupon.code;

        successMessage +=
          "\n💸 قيمة الخصم: " +
          couponDiscount.toLocaleString(
            "ar-EG"
          ) +
          " جنيه";

      }


      // ==================================================
      // PAYMENT INFO
      // ==================================================

      successMessage +=
        "\n\n💳 طريقة الدفع: " +
        paymentTitle;


      if (
        paymentNumber
      ) {

        successMessage +=
          "\n📱 رقم التحويل: " +
          paymentNumber;

      }


      if (
        paymentMethod !==
        "cash_on_delivery" &&
        paymentMethod !==
        "cash" &&
        paymentMethod !==
        "cod"
      ) {

        successMessage +=
          "\n\nيرجى تحويل قيمة الطلب والاحتفاظ بإثبات الدفع.";

      }


      // ==================================================
      // FINAL TOTAL
      // ==================================================

      successMessage +=
        "\n\n💰 إجمالي الطلب النهائي: " +
        finalTotal.toLocaleString(
          "ar-EG"
        ) +
        " جنيه";


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
            SHIPPING
        ============================================ */}

        {shippingZones.length > 0 && (

          <div className="form-group">

            <label>
              🚚 منطقة الشحن:
            </label>

            <select
              value={
                selectedShippingZone
              }
              onChange={(e) =>
                setSelectedShippingZone(
                  e.target.value
                )
              }
              disabled={
                loading ||
                shippingZonesLoading
              }
            >

              <option value="">
                اختر منطقة الشحن
              </option>

              {shippingZones.map(
                (zone) => {

                  const zonePrice =
                    Number(
                      zone.price ??
                      zone.shippingCost ??
                      zone.cost ??
                      zone.amount ??
                      0
                    );

                  return (

                    <option
                      key={zone.id}
                      value={zone.id}
                    >

                      {zone.name ||
                        zone.title ||
                        "منطقة شحن"}

                      {" - "}

                      {zonePrice.toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ج.م

                    </option>

                  );

                }
              )}

            </select>

          </div>

        )}


        {/* ============================================
            PAYMENT METHODS
        ============================================ */}

        <div className="payment-method-section">

          <h3>
            💳 اختر طريقة الدفع
          </h3>


          {paymentMethodsLoading ? (

            <div className="empty-state">
              ⏳ جاري تحميل طرق الدفع...
            </div>

          ) : paymentMethods.length ===
            0 ? (

            <div className="empty-state">
              لا توجد طرق دفع متاحة حاليًا.
            </div>

          ) : (

            <div className="payment-methods">

              {paymentMethods.map(
                (method) => {

                  const isSelected =
                    paymentMethod ===
                    method.id;

                  const methodNumber =
                    method.number ||
                    method.phone ||
                    "";

                  const methodDescription =
                    method.description ||
                    "متاح للدفع عند إتمام الطلب";

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
                              method.icon ||
                              "💳"
                            }
                          </span>

                          <strong>
                            {
                              method.title ||
                              method.name ||
                              "طريقة دفع"
                            }
                          </strong>

                        </div>


                        <p>
                          {
                            methodDescription
                          }
                        </p>


                        {methodNumber && (

                          <div className="payment-number">

                            📱{" "}

                            <strong>
                              {
                                methodNumber
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

          )}


          {paymentMethod &&
            paymentMethod !==
              "cash_on_delivery" &&
            paymentMethod !==
              "cash" &&
            paymentMethod !==
              "cod" && (

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
            COUPON
        ============================================ */}

        <div className="coupon-section">

          <h3>
            🎟️ لديك كود خصم؟
          </h3>


          <div className="coupon-input-row">

            <input
              type="text"
              placeholder="أدخل كود الخصم"
              value={
                couponCode
              }
              onChange={(e) => {

                setCouponCode(
                  e.target.value.toUpperCase()
                );

                setCouponError("");
                setCouponMessage("");

              }}
              disabled={
                loading ||
                couponLoading ||
                !!appliedCoupon
              }
            />


            {!appliedCoupon ? (

              <button
                type="button"
                className="save-btn"
                onClick={
                  handleApplyCoupon
                }
                disabled={
                  loading ||
                  couponLoading
                }
              >

                {couponLoading
                  ? "⏳ جاري التحقق..."
                  : "تطبيق"}

              </button>

            ) : (

              <button
                type="button"
                className="cancel-btn"
                onClick={
                  handleRemoveCoupon
                }
                disabled={
                  loading
                }
              >

                إزالة الكوبون

              </button>

            )}

          </div>


          {couponError && (

            <div className="coupon-error">

              ❌{" "}
              {couponError}

            </div>

          )}


          {couponMessage && (

            <div className="coupon-success">

              {couponMessage}

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
                price *
                quantity;

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

            إجمالي المنتجات:

            <span>

              {subtotal.toLocaleString(
                "ar-EG"
              )}

              {" "}
              جنيه

            </span>

          </h4>


          {couponDiscount >
            0 && (

            <h4>

              الخصم:

              <span>

                -{" "}
                {couponDiscount.toLocaleString(
                  "ar-EG"
                )}

                {" "}
                جنيه

              </span>

            </h4>

          )}


          {shippingCost >
            0 && (

            <h4>

              الشحن:

              <span>

                {shippingCost.toLocaleString(
                  "ar-EG"
                )}

                {" "}
                جنيه

              </span>

            </h4>

          )}


          <h4>

            الإجمالي النهائي:

            <span>

              {finalTotal.toLocaleString(
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
            categoriesLoading ||
            paymentMethodsLoading ||
            shippingZonesLoading
          }
        >

          {loading
            ? "⏳ جاري تسجيل الطلب..."
            : categoriesLoading
              ? "⏳ جاري تحميل الأقسام..."
              : paymentMethodsLoading
                ? "⏳ جاري تحميل طرق الدفع..."
                : shippingZonesLoading
                  ? "⏳ جاري تحميل الشحن..."
                  : "تأكيد الطلب الآن ✅"}

        </button>


      </form>

    </div>

  );

}


export default Checkout;