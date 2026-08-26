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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

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
  // REVIEW
  // ==================================================

  const [showReview, setShowReview] =
    useState(false);

  const [reviewData, setReviewData] =
    useState(null);


  // ==================================================
  // RESTORE CART
  // ==================================================

  useEffect(() => {

    if (
      Array.isArray(cart) &&
      cart.length > 0
    ) {
      return;
    }

    try {

      const savedCart =
        localStorage.getItem("cart");

      if (!savedCart) {
        return;
      }

      const parsedCart =
        JSON.parse(savedCart);

      if (
        !Array.isArray(parsedCart) ||
        parsedCart.length === 0
      ) {
        return;
      }

      const preparedCart =
        parsedCart.map((item) => ({

          ...item,

          id:
            item.id ||
            item.productId ||
            item._id,

          productId:
            item.productId ||
            item.id ||
            item._id,

          quantity:
            Math.max(
              1,
              Number(item.quantity || 1)
            ),

          cartId:
            item.cartId ||
            item.id ||
            item.productId ||
            item._id,

        }));

      setCart(preparedCart);

    } catch (error) {

      console.error(
        "❌ Restore Cart Error:",
        error
      );

    }

  }, [cart, setCart]);


  // ==================================================
  // CURRENT USER
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

    const loadCategories =
      async () => {

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

          setPaymentMethodsLoading(true);

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

          setPaymentMethodsLoading(false);

        }

      };

    loadPaymentMethods();

  }, []);


  // ==================================================
  // DEFAULT PAYMENT METHOD
  // ==================================================

  useEffect(() => {

    if (
      paymentMethods.length === 0
    ) {
      return;
    }

    const selectedStillExists =
      paymentMethods.some(
        (method) =>
          String(method.id) ===
          String(paymentMethod)
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

          setShippingZonesLoading(true);

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

          setShippingZonesLoading(false);

        }

      };

    loadShippingZones();

  }, []);


  // ==================================================
  // SELECTED SHIPPING ZONE
  // ==================================================

  const selectedZone =
    shippingZones.find(
      (zone) =>
        String(zone.id) ===
        String(selectedShippingZone)
    ) || null;


  // ==================================================
  // SHIPPING COST
  // ==================================================

  useEffect(() => {

    if (
      !selectedShippingZone ||
      !selectedZone
    ) {

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
    selectedZone,
  ]);


  // ==================================================
  // NORMALIZE PHONE
  // ==================================================

  const normalizePhone = (value) => {

    if (!value) {
      return "";
    }

    let cleanPhone =
      String(value)
        .replace(/\D/g, "");

    if (
      cleanPhone.startsWith("01") &&
      cleanPhone.length === 11
    ) {

      return cleanPhone;

    }

    if (
      cleanPhone.startsWith("20") &&
      cleanPhone.length === 12
    ) {

      return (
        "0" +
        cleanPhone.slice(2)
      );

    }

    return cleanPhone;

  };


  // ==================================================
  // FIND CATEGORY
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
            String(productCategoryId)
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
  // PAYMENT TEXT
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

    if (foundMethod?.title) {
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
  // PAYMENT NUMBER
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
  // SUBTOTAL
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
  // TOTALS
  // ==================================================

  const totalBeforeShipping =
    Math.max(
      subtotal -
        couponDiscount,
      0
    );

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

      setCouponLoading(true);
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

        setCouponLoading(false);

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
  // PREPARE ORDER
  // ==================================================

  const prepareOrder = () => {

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

    if (paymentMethodsLoading) {

      alert(
        "جاري تحميل طرق الدفع، حاول مرة أخرى بعد لحظات."
      );

      return;

    }

    if (shippingZonesLoading) {

      alert(
        "جاري تحميل مناطق الشحن، حاول مرة أخرى بعد لحظات."
      );

      return;

    }

    const cleanName =
      name.trim();

    const cleanPhone =
      normalizePhone(phone);

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

    if (
      cleanPhone.length < 10 ||
      cleanPhone.length > 15
    ) {

      alert(
        "برجاء إدخال رقم هاتف صحيح"
      );

      return;

    }


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
            Math.max(
              1,
              Number(
                item?.quantity || 1
              )
            );

          const price =
            Number(
              item?.price || 0
            );

          const productId =
            item?.id ||
            item?.productId ||
            item?._id ||
            null;

          const productTitle =
            item?.title ||
            item?.name ||
            "منتج";

          const variantName =
            item?.variantName ||
            item?.selectedVariant?.name ||
            item?.selectedVariant?.title ||
            item?.selectedVariant?.label ||
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
      selectedPayment?.name ||
      getPaymentMethodText(
        paymentMethod
      );


    // ==================================================
    // SHIPPING
    // ==================================================

    const shippingZoneName =
      selectedZone?.name ||
      selectedZone?.title ||
      "";


    // ==================================================
    // REVIEW DATA
    // ==================================================

    const data = {

      cleanName,

      cleanPhone,

      cleanAddress,

      orderProducts,

      departmentWhatsapp,

      departmentCategory,

      paymentMethod,

      paymentNumber,

      paymentTitle,

      shippingZoneId:
        selectedShippingZone ||
        "",

      shippingZoneName,

      subtotal,

      couponDiscount,

      shippingCost,

      finalTotal,

      appliedCoupon:
        appliedCoupon
          ? {
              id:
                appliedCoupon.id ||
                "",
              code:
                appliedCoupon.code ||
                cleanCodeForStorage(
                  appliedCoupon.code
                ),
              type:
                appliedCoupon.type ||
                "",
              value:
                Number(
                  appliedCoupon.value ||
                  0
                ),
            }
          : null,

    };

    setReviewData(data);
    setShowReview(true);

  };


  // ==================================================
  // CLEAN COUPON CODE
  // ==================================================

  const cleanCodeForStorage = (
    value
  ) => {

    return String(
      value || ""
    )
      .trim()
      .toUpperCase();

  };


  // ==================================================
  // EDIT REVIEW
  // ==================================================

  const handleEditOrder =
    () => {

      if (loading) {
        return;
      }

      setShowReview(false);
      setReviewData(null);

    };


  // ==================================================
  // CANCEL REVIEW
  // ==================================================

  const handleCancelReview =
    () => {

      if (loading) {
        return;
      }

      setShowReview(false);
      setReviewData(null);

    };


  // ==================================================
  // CONFIRM FINAL ORDER
  // ==================================================

  const handleConfirmOrder =
    async () => {

      if (
        loading ||
        !reviewData
      ) {

        return;

      }

      if (!currentUser?.uid) {

        alert(
          "يجب تسجيل الدخول أولًا."
        );

        return;

      }

      setLoading(true);

      try {

        const {
          cleanName,
          cleanPhone,
          cleanAddress,
          orderProducts,
          departmentWhatsapp,
          departmentCategory,
          paymentMethod,
          paymentNumber,
          paymentTitle,
          shippingZoneId,
          shippingZoneName,
          subtotal,
          couponDiscount,
          shippingCost,
          finalTotal,
          appliedCoupon: confirmedCoupon,
        } = reviewData;


        // ==================================================
        // ORDER DATA
        // ==================================================

        const orderData = {

          // ==================================================
          // CUSTOMER ID
          // ==================================================

          userId:
            currentUser.uid,

          uid:
            currentUser.uid,

          customerId:
            currentUser.uid,

          userUID:
            currentUser.uid,


          // ==================================================
          // CUSTOMER DATA
          // ==================================================

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


          // ==================================================
          // PRODUCTS
          // ==================================================

          products:
            orderProducts,


          // ==================================================
          // DEPARTMENT
          // ==================================================

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


          // ==================================================
          // SHIPPING
          // ==================================================

          shippingZoneId:
            shippingZoneId ||
            "",

          shippingZoneName:
            shippingZoneName ||
            "",

          shippingCost:
            Number(
              shippingCost || 0
            ),


          // ==================================================
          // TOTALS
          // ==================================================

          subtotal:
            Number(
              subtotal || 0
            ),

          discount:
            Number(
              couponDiscount || 0
            ),

          shipping:
            Number(
              shippingCost || 0
            ),

          total:
            Number(
              finalTotal || 0
            ),

          totalPrice:
            Number(
              finalTotal || 0
            ),


          // ==================================================
          // COUPON
          // ==================================================

          couponId:
            confirmedCoupon?.id ||
            "",

          couponCode:
            confirmedCoupon?.code ||
            "",

          couponType:
            confirmedCoupon?.type ||
            "",

          couponValue:
            Number(
              confirmedCoupon?.value ||
              0
            ),


          // ==================================================
          // PAYMENT
          // ==================================================

          paymentMethod:
            paymentMethod ||
            "",

          paymentMethodName:
            paymentTitle ||
            "",

          paymentNumber:
            paymentNumber ||
            "",

          paymentStatus:
            "pending",


          // ==================================================
          // STATUS
          // ==================================================

          status:
            "pending",

          orderStatus:
            "pending",


          // ==================================================
          // DATES
          // ==================================================

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

        };


        // ==================================================
        // SAVE ORDER TO FIRESTORE
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
          orderRef.id.slice(0, 8);


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
          (
            departmentWhatsapp ||
            "غير متوفر"
          );


        if (
          shippingZoneName
        ) {

          successMessage +=
            "\n🚚 منطقة الشحن: " +
            shippingZoneName;

        }


        if (
          Number(shippingCost) > 0
        ) {

          successMessage +=
            "\n💵 تكلفة الشحن: " +
            Number(
              shippingCost
            ).toLocaleString(
              "ar-EG"
            ) +
            " جنيه";

        }


        if (
          confirmedCoupon &&
          Number(couponDiscount) > 0
        ) {

          successMessage +=
            "\n🎟️ كود الخصم: " +
            confirmedCoupon.code;

          successMessage +=
            "\n💸 قيمة الخصم: " +
            Number(
              couponDiscount
            ).toLocaleString(
              "ar-EG"
            ) +
            " جنيه";

        }


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


        const isCashPayment =
          paymentMethod ===
            "cash_on_delivery" ||
          paymentMethod ===
            "cash" ||
          paymentMethod ===
            "cod";


        if (
          !isCashPayment
        ) {

          successMessage +=
            "\n\nيرجى تحويل قيمة الطلب والاحتفاظ بإثبات الدفع.";

        }


        successMessage +=
          "\n\n💰 إجمالي الطلب النهائي: " +
          Number(
            finalTotal
          ).toLocaleString(
            "ar-EG"
          ) +
          " جنيه";


        // ==================================================
        // CLEAR CART
        // ==================================================

        setCart([]);

        try {

          localStorage.removeItem(
            "cart"
          );

        } catch (error) {

          console.error(
            "❌ Clear Local Cart Error:",
            error
          );

        }


        // ==================================================
        // CLEAR REVIEW
        // ==================================================

        setShowReview(false);
        setReviewData(null);


        // ==================================================
        // SUCCESS
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

        <div className="checkout-navigation">

          <button
            type="button"
            className="checkout-nav-btn back-store-btn"
            onClick={() =>
              setCurrentView("store")
            }
          >
            🏠 العودة للمتجر
          </button>

          <button
            type="button"
            className="checkout-nav-btn back-cart-btn"
            onClick={() =>
              setCurrentView("cart")
            }
          >
            🛒 العودة للسلة
          </button>

        </div>


        <h2>
          🛒 السلة فارغة
        </h2>


        <button
          type="button"
          className="submit-order-btn"
          onClick={() =>
            setCurrentView("store")
          }
        >
          العودة للمتجر 🛍️
        </button>

      </div>

    );

  }


  // ==================================================
  // REVIEW SCREEN
  // ==================================================

  if (
    showReview &&
    reviewData
  ) {

    return (

      <div
        className="checkout-container checkout-review-container"
        dir="rtl"
      >

        <div className="checkout-navigation">

          <button
            type="button"
            className="checkout-nav-btn back-store-btn"
            onClick={() =>
              setCurrentView("store")
            }
            disabled={loading}
          >
            🏠 العودة للمتجر
          </button>


          <button
            type="button"
            className="checkout-nav-btn back-cart-btn"
            onClick={() =>
              setCurrentView("cart")
            }
            disabled={loading}
          >
            🛒 العودة للسلة
          </button>

        </div>


        <h2>
          📝 مراجعة الطلب
        </h2>


        <p className="checkout-subtitle">
          راجع بياناتك والطلب قبل التأكيد النهائي
        </p>


        {/* CUSTOMER */}

        <div className="review-section">

          <h3>
            👤 بيانات العميل
          </h3>


          <div className="review-row">

            <span>
              الاسم
            </span>

            <strong>
              {reviewData.cleanName}
            </strong>

          </div>


          <div className="review-row">

            <span>
              الهاتف
            </span>

            <strong dir="ltr">
              {reviewData.cleanPhone}
            </strong>

          </div>


          <div className="review-row review-address">

            <span>
              العنوان
            </span>

            <strong>
              {reviewData.cleanAddress}
            </strong>

          </div>

        </div>


        {/* PRODUCTS */}

        <div className="review-section">

          <h3>
            📦 المنتجات
          </h3>


          {reviewData.orderProducts.map(
            (item, index) => (

              <div
                className="review-product-row"
                key={
                  item.productId ||
                  item.variantId ||
                  index
                }
              >

                <div>

                  <strong>
                    {item.title}
                  </strong>


                  {item.variantName && (

                    <small>
                      المتغير:{" "}
                      {item.variantName}
                    </small>

                  )}

                </div>


                <span>
                  × {item.quantity}
                </span>


                <strong>
                  {Number(
                    item.total || 0
                  ).toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>

              </div>

            )
          )}

        </div>


        {/* PAYMENT & SHIPPING */}

        <div className="review-section">

          <h3>
            💳 الدفع والشحن
          </h3>


          <div className="review-row">

            <span>
              طريقة الدفع
            </span>

            <strong>
              {reviewData.paymentTitle}
            </strong>

          </div>


          {reviewData.paymentNumber && (

            <div className="review-row">

              <span>
                رقم التحويل
              </span>

              <strong dir="ltr">
                {reviewData.paymentNumber}
              </strong>

            </div>

          )}


          {reviewData.shippingZoneName && (

            <div className="review-row">

              <span>
                منطقة الشحن
              </span>

              <strong>
                {reviewData.shippingZoneName}
              </strong>

            </div>

          )}


          {Number(
            reviewData.shippingCost || 0
          ) > 0 && (

            <div className="review-row">

              <span>
                تكلفة الشحن
              </span>

              <strong>
                {Number(
                  reviewData.shippingCost
                ).toLocaleString(
                  "ar-EG"
                )}{" "}
                ج.م
              </strong>

            </div>

          )}

        </div>


        {/* TOTAL */}

        <div className="review-total-box">

          <div>

            <span>
              إجمالي المنتجات
            </span>

            <strong>
              {Number(
                reviewData.subtotal || 0
              ).toLocaleString(
                "ar-EG"
              )}{" "}
              ج.م
            </strong>

          </div>


          {Number(
            reviewData.couponDiscount || 0
          ) > 0 && (

            <div>

              <span>
                الخصم
              </span>

              <strong>
                -{" "}
                {Number(
                  reviewData.couponDiscount
                ).toLocaleString(
                  "ar-EG"
                )}{" "}
                ج.م
              </strong>

            </div>

          )}


          {Number(
            reviewData.shippingCost || 0
          ) > 0 && (

            <div>

              <span>
                الشحن
              </span>

              <strong>
                {Number(
                  reviewData.shippingCost
                ).toLocaleString(
                  "ar-EG"
                )}{" "}
                ج.م
              </strong>

            </div>

          )}


          <div className="review-final-total">

            <span>
              الإجمالي النهائي
            </span>

            <strong>
              {Number(
                reviewData.finalTotal || 0
              ).toLocaleString(
                "ar-EG"
              )}{" "}
              ج.م
            </strong>

          </div>

        </div>


        {/* ACTIONS */}

        <div className="checkout-review-actions">

          <button
            type="button"
            className="review-edit-btn"
            onClick={handleEditOrder}
            disabled={loading}
          >
            ✏️ تعديل الطلب
          </button>


          <button
            type="button"
            className="review-cancel-btn"
            onClick={handleCancelReview}
            disabled={loading}
          >
            ❌ إلغاء
          </button>


          <button
            type="button"
            className="review-confirm-btn"
            onClick={handleConfirmOrder}
            disabled={loading}
          >
            {loading
              ? "⏳ جاري تسجيل الطلب..."
              : "✅ تأكيد الطلب النهائي"}
          </button>

        </div>

      </div>

    );

  }


  // ==================================================
  // MAIN CHECKOUT
  // ==================================================

  return (

    <div
      className="checkout-container"
      dir="rtl"
    >

      {/* NAVIGATION */}

      <div className="checkout-navigation">

        <button
          type="button"
          className="checkout-nav-btn back-store-btn"
          onClick={() =>
            setCurrentView("store")
          }
          disabled={loading}
        >
          🏠 العودة للمتجر
        </button>


        <button
          type="button"
          className="checkout-nav-btn back-cart-btn"
          onClick={() =>
            setCurrentView("cart")
          }
          disabled={loading}
        >
          🛒 العودة للسلة
        </button>

      </div>


      <h2>
        إتمام الطلب 🛒
      </h2>


      <p className="checkout-subtitle">
        أدخل بيانات الشحن واختر طريقة الدفع
      </p>


      <form
        className="checkout-form"
        onSubmit={(e) => {

          e.preventDefault();

          prepareOrder();

        }}
      >

        {/* NAME */}

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


        {/* PHONE */}

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


        {/* ADDRESS */}

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


        {/* SHIPPING */}

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


        {/* PAYMENT */}

        <div className="payment-method-section">

          <h3>
            💳 اختر طريقة الدفع
          </h3>


          {paymentMethodsLoading ? (

            <div className="empty-state">
              ⏳ جاري تحميل طرق الدفع...
            </div>

          ) : paymentMethods.length === 0 ? (

            <div className="empty-state">
              لا توجد طرق دفع متاحة حاليًا.
            </div>

          ) : (

            <div className="payment-methods">

              {paymentMethods.map(
                (method) => {

                  const isSelected =
                    String(paymentMethod) ===
                    String(method.id);

                  const methodNumber =
                    method.number ||
                    method.phone ||
                    "";

                  const methodDescription =
                    method.description ||
                    "متاح للدفع عند إتمام الطلب";

                  return (

                    <label
                      key={method.id}
                      className={
                        `payment-method-card ${
                          isSelected
                            ? "selected"
                            : ""
                        }`
                      }
                    >

                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={() =>
                          setPaymentMethod(
                            method.id
                          )
                        }
                        disabled={loading}
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
                          {methodDescription}
                        </p>


                        {methodNumber && (

                          <div className="payment-number">

                            📱{" "}

                            <strong>
                              {methodNumber}
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


        {/* COUPON */}

        <div className="coupon-section">

          <h3>
            🎟️ لديك كود خصم؟
          </h3>


          <div className="coupon-input-row">

            <input
              type="text"
              placeholder="أدخل كود الخصم"
              value={couponCode}
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
                disabled={loading}
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


        {/* PRODUCTS */}

        <div className="order-products-preview">

          <h3>
            📦 المنتجات المطلوبة
          </h3>


          {cart.map(
            (item, index) => {

              const quantity =
                Math.max(
                  1,
                  Number(
                    item?.quantity || 1
                  )
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
                    item?.cartId ||
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
                      item?.selectedVariant?.name ||
                      item?.selectedVariant?.title ||
                      item?.selectedVariant?.label) && (

                      <small>

                        المتغير:{" "}

                        {
                          item?.variantName ||
                          item?.selectedVariant?.name ||
                          item?.selectedVariant?.title ||
                          item?.selectedVariant?.label
                        }

                      </small>

                    )}

                  </div>


                  <span>
                    × {quantity}
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


        {/* TOTAL */}

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


          {couponDiscount > 0 && (

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


          {shippingCost > 0 && (

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


        {/* SUBMIT */}

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
            ? "⏳ جاري التجهيز..."
            : categoriesLoading
              ? "⏳ جاري تحميل الأقسام..."
              : paymentMethodsLoading
                ? "⏳ جاري تحميل طرق الدفع..."
                : shippingZonesLoading
                  ? "⏳ جاري تحميل الشحن..."
                  : "مراجعة الطلب وتأكيده ✅"}

        </button>


        {/* CANCEL */}

        <button
          type="button"
          className="checkout-cancel-main-btn"
          onClick={() =>
            setCurrentView("cart")
          }
          disabled={loading}
        >

          ❌ إلغاء والعودة للسلة

        </button>

      </form>

    </div>

  );

}


export default Checkout;