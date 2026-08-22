import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase";

import {
  CartContext,
} from "../context/CartContext";

import "./Checkout.css";


function Checkout() {

  const navigate = useNavigate();


  // ==================================================
  // AUTH
  // ==================================================

  const [user, setUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);


  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(
            currentUser || null
          );

          setAuthLoading(false);

        }
      );

    return () => {
      unsubscribe();
    };

  }, []);


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
  // FIREBASE DATA
  // ==================================================

  const [categories, setCategories] =
    useState([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [paymentMethods, setPaymentMethods] =
    useState([]);

  const [paymentMethodsLoading, setPaymentMethodsLoading] =
    useState(true);

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [shippingZones, setShippingZones] =
    useState([]);

  const [shippingZonesLoading, setShippingZonesLoading] =
    useState(true);

  const [selectedShippingZone, setSelectedShippingZone] =
    useState("");


  // ==================================================
  // COUPON
  // ==================================================

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

        const data =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...item.data(),
            })
          );

        setCategories(data);

      } catch (error) {

        console.error(
          "Categories Error:",
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

    const loadPaymentMethods = async () => {

      try {

        setPaymentMethodsLoading(true);

        const snapshot =
          await getDocs(
            collection(
              db,
              "paymentMethods"
            )
          );

        const data =
          snapshot.docs
            .map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            )
            .filter(
              (item) =>
                item.active !== false
            );

        if (data.length === 0) {

          setPaymentMethods([
            {
              id: "cash_on_delivery",
              title: "الدفع عند الاستلام",
              name: "الدفع عند الاستلام",
              icon: "💵",
              number: "",
              description:
                "ادفع قيمة الطلب عند استلامه",
              active: true,
            },
          ]);

        } else {

          setPaymentMethods(data);

        }

      } catch (error) {

        console.error(
          "Payment Methods Error:",
          error
        );

        setPaymentMethods([
          {
            id: "cash_on_delivery",
            title: "الدفع عند الاستلام",
            name: "الدفع عند الاستلام",
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
  // SET DEFAULT PAYMENT METHOD
  // ==================================================

  useEffect(() => {

    if (
      paymentMethods.length === 0
    ) {
      return;
    }

    const exists =
      paymentMethods.some(
        (item) =>
          String(item.id) ===
          String(paymentMethod)
      );

    if (!exists) {

      const cashMethod =
        paymentMethods.find(
          (item) =>
            String(item.id) ===
              "cash_on_delivery" ||
            String(item.id) ===
              "cash" ||
            String(item.id) ===
              "cod"
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

    const loadShippingZones = async () => {

      try {

        setShippingZonesLoading(true);

        const snapshot =
          await getDocs(
            collection(
              db,
              "shippingZones"
            )
          );

        const data =
          snapshot.docs
            .map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            )
            .filter(
              (item) =>
                item.active !== false
            );

        setShippingZones(data);

      } catch (error) {

        console.error(
          "Shipping Zones Error:",
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
  // NORMALIZE PHONE
  // ==================================================

  const normalizePhone = (
    value
  ) => {

    let cleanPhone =
      String(
        value || ""
      )
        .replace(
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
  // CATEGORY MAP
  // ==================================================

  const categoryMap =
    useMemo(() => {

      const map = {};

      categories.forEach(
        (category) => {

          map[category.id] =
            category;

        }
      );

      return map;

    }, [categories]);


  // ==================================================
  // FIND CATEGORY FOR PRODUCT
  // ==================================================

  const findCategoryForProduct =
    (product) => {

      if (!product) {
        return null;
      }

      const categoryId =
        product.categoryId ||
        product.categoryID ||
        product.category_id ||
        product.category?.id ||
        product.category?.categoryId ||
        null;


      if (
        categoryId
      ) {

        const directCategory =
          categories.find(
            (item) =>
              String(item.id) ===
              String(categoryId)
          );

        if (
          directCategory
        ) {

          return directCategory;

        }

      }


      if (
        typeof product.category ===
        "string"
      ) {

        const category =
          categories.find(
            (item) =>
              String(item.id) ===
                String(
                  product.category
                ) ||
              String(
                item.categoryNumber
              ) ===
                String(
                  product.category
                ) ||
              String(
                item.name || ""
              )
                .trim()
                .toLowerCase() ===
                String(
                  product.category || ""
                )
                  .trim()
                  .toLowerCase()
          );

        if (
          category
        ) {

          return category;

        }

      }


      const categoryNumber =
        product.categoryNumber ||
        product.categoryNo ||
        product.departmentNumber ||
        null;


      if (
        categoryNumber !== null &&
        categoryNumber !== undefined &&
        categoryNumber !== ""
      ) {

        const category =
          categories.find(
            (item) =>
              String(
                item.categoryNumber
              ) ===
              String(
                categoryNumber
              )
          );

        if (
          category
        ) {

          return category;

        }

      }

      return null;

    };


  // ==================================================
  // GET CATEGORY WHATSAPP
  // القسم ثم الأب ثم الجد
  // ==================================================

  const getCategoryWhatsapp =
    (product) => {

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

        const rawWhatsapp =
          category.whatsapp ||
          category.whatsappPhone ||
          category.whatsappNumber ||
          category.phone ||
          category.phoneNumber ||
          category.contactPhone ||
          "";

        const whatsapp =
          normalizePhone(
            rawWhatsapp
          );

        if (
          whatsapp
        ) {

          return {
            id:
              category.id,

            name:
              category.name ||
              "قسم",

            whatsapp,
          };

        }


        if (
          category.parentId
        ) {

          category =
            categoryMap[
              category.parentId
            ] ||
            categories.find(
              (item) =>
                String(item.id) ===
                String(
                  category.parentId
                )
            );

        } else {

          category = null;

        }

      }

      return null;

    };


  // ==================================================
  // GET ALL DEPARTMENTS USED BY CART
  // ==================================================

  const getDepartmentsForOrder =
    () => {

      const departmentMap =
        new Map();

      for (
        const item of cart
      ) {

        const department =
          getCategoryWhatsapp(
            item
          );

        if (
          !department
        ) {

          continue;

        }

        if (
          !departmentMap.has(
            department.id
          )
        ) {

          departmentMap.set(
            department.id,
            department
          );

        }

      }

      return Array.from(
        departmentMap.values()
      );

    };


  // ==================================================
  // PAYMENT HELPERS
  // ==================================================

  const getPaymentMethodText =
    (methodId) => {

      const method =
        paymentMethods.find(
          (item) =>
            String(item.id) ===
            String(methodId)
        );

      if (
        method?.title
      ) {

        return method.title;

      }

      const value =
        String(
          methodId || ""
        )
          .toLowerCase()
          .trim();

      const fallback = {

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
        fallback[value] ||
        methodId ||
        "غير محدد"
      );

    };


  const getPaymentNumber =
    (methodId) => {

      const method =
        paymentMethods.find(
          (item) =>
            String(item.id) ===
            String(methodId)
        );

      return (
        method?.number ||
        method?.phone ||
        method?.paymentNumber ||
        ""
      );

    };


  const isCashPayment =
    [
      "cash_on_delivery",
      "cash",
      "cod",
    ].includes(
      String(
        paymentMethod || ""
      ).toLowerCase()
    );


  // ==================================================
  // TOTALS
  // ==================================================

  const subtotal =
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
  // SELECTED SHIPPING ZONE
  // ==================================================

  const selectedZone =
    shippingZones.find(
      (zone) =>
        String(zone.id) ===
        String(
          selectedShippingZone
        )
    ) || null;


  // ==================================================
  // SHIPPING COST
  // ==================================================

  const shippingCost =
    selectedZone
      ? Math.max(
          Number(
            selectedZone.price ??
            selectedZone.shippingCost ??
            selectedZone.cost ??
            selectedZone.amount ??
            0
          ),
          0
        )
      : 0;


  // ==================================================
  // SHIPPING ZONE NAME
  // ==================================================

  const shippingZoneName =
    selectedZone?.name ||
    selectedZone?.title ||
    "";


  // ==================================================
  // COUPON DISCOUNT
  // ==================================================

  const couponDiscount =
    appliedCoupon
      ? String(
          appliedCoupon.type ||
          ""
        )
          .toLowerCase()
          .trim() ===
        "percentage"

        ? Math.min(
            subtotal,
            subtotal *
              (
                Number(
                  appliedCoupon.value ||
                  0
                ) /
                100
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

      if (
        !cleanCode
      ) {

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
      setAppliedCoupon(
        null
      );

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
          id:
            couponDoc.id,
          ...couponDoc.data(),
        };


        // --------------------------------------------
        // ACTIVE
        // --------------------------------------------

        if (
          coupon.active === false
        ) {

          setCouponError(
            "كود الخصم غير مفعل."
          );

          return;

        }


        // --------------------------------------------
        // MINIMUM ORDER
        // --------------------------------------------

        const minOrder =
          Number(
            coupon.minOrder ||
            coupon.minimumOrder ||
            0
          );


        if (
          subtotal <
          minOrder
        ) {

          setCouponError(
            `الحد الأدنى لاستخدام الكوبون هو ${minOrder.toLocaleString(
              "ar-EG"
            )} ج.م`
          );

          return;

        }


        // --------------------------------------------
        // VALUE
        // --------------------------------------------

        const value =
          Number(
            coupon.value || 0
          );


        if (
          value <= 0
        ) {

          setCouponError(
            "قيمة الخصم غير صحيحة."
          );

          return;

        }


        // --------------------------------------------
        // TYPE
        // --------------------------------------------

        const type =
          String(
            coupon.type ||
            "percentage"
          )
            .toLowerCase()
            .trim();


        if (
          type !== "percentage" &&
          type !== "fixed"
        ) {

          setCouponError(
            "نوع الخصم غير صحيح."
          );

          return;

        }


        // --------------------------------------------
        // PERCENTAGE VALIDATION
        // --------------------------------------------

        if (
          type === "percentage" &&
          value > 100
        ) {

          setCouponError(
            "نسبة الخصم لا يمكن أن تتجاوز 100%."
          );

          return;

        }


        setAppliedCoupon({

          ...coupon,

          type,

          value,

        });


        setCouponMessage(
          `✅ تم تطبيق الكوبون ${coupon.code} بنجاح.`
        );

      } catch (error) {

        console.error(
          "Coupon Error:",
          error
        );

        setCouponError(
          "حدث خطأ أثناء التحقق من كود الخصم."
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

  const removeCoupon =
    () => {

      setAppliedCoupon(
        null
      );

      setCouponCode(
        ""
      );

      setCouponError(
        ""
      );

      setCouponMessage(
        ""
      );

    };


  // ==================================================
  // CREATE ORDER NUMBER
  // ==================================================

  const createOrderNumber =
    () => {

      const now =
        Date.now().toString();

      return Number(
        now.slice(-8)
      );

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


      if (
        shippingZoneName
      ) {

        message +=
          `🚚 *منطقة الشحن:*\n${shippingZoneName}\n\n`;

      }


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
            item?.selectedVariant?.name ||
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
            price *
            quantity;


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
        `💰 إجمالي المنتجات: ${subtotal} جنيه\n`;


      if (
        couponDiscount > 0
      ) {

        message +=
          `🎟️ كود الخصم: ${
            appliedCoupon?.code ||
            ""
          }\n`;

        message +=
          `💸 الخصم: ${couponDiscount} جنيه\n`;

      }


      if (
        shippingCost > 0
      ) {

        message +=
          `🚚 الشحن: ${shippingCost} جنيه\n`;

      }


      message +=
        `💰 *الإجمالي النهائي: ${finalTotal} جنيه*\n\n`;


      message +=
        `💳 *طريقة الدفع: ${getPaymentMethodText(
          paymentMethod
        )}*\n`;


      const paymentNumber =
        getPaymentNumber(
          paymentMethod
        );


      if (
        paymentNumber
      ) {

        message +=
          `📱 رقم التحويل: ${paymentNumber}\n`;

      }


      message +=
        "\n🌐 تم تسجيل الطلب على الموقع.";

      return message;

    };


  // ==================================================
  // SEND ORDER
  // ==================================================

  const sendOrder =
    async () => {

      if (
        loading
      ) {

        return;

      }


      // --------------------------------------------
      // AUTH LOADING
      // --------------------------------------------

      if (
        authLoading
      ) {

        alert(
          "جاري التحقق من تسجيل الدخول، حاول مرة أخرى."
        );

        return;

      }


      // --------------------------------------------
      // AUTH
      // --------------------------------------------

      if (
        !user?.uid
      ) {

        alert(
          "يجب تسجيل الدخول أولًا لإتمام الطلب."
        );

        navigate(
          "/login"
        );

        return;

      }


      // --------------------------------------------
      // CUSTOMER DATA
      // --------------------------------------------

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


      // --------------------------------------------
      // CART
      // --------------------------------------------

      if (
        cart.length === 0
      ) {

        alert(
          "السلة فارغة."
        );

        navigate(
          "/"
        );

        return;

      }


      // --------------------------------------------
      // PAYMENT
      // --------------------------------------------

      if (
        !paymentMethod
      ) {

        alert(
          "برجاء اختيار طريقة الدفع."
        );

        return;

      }


      // --------------------------------------------
      // LOADING STATES
      // --------------------------------------------

      if (
        categoriesLoading
      ) {

        alert(
          "جاري تحميل الأقسام، حاول مرة أخرى."
        );

        return;

      }


      if (
        paymentMethodsLoading
      ) {

        alert(
          "جاري تحميل طرق الدفع، حاول مرة أخرى."
        );

        return;

      }


      if (
        shippingZonesLoading
      ) {

        alert(
          "جاري تحميل بيانات الشحن، حاول مرة أخرى."
        );

        return;

      }


      // --------------------------------------------
      // CART CONTEXT
      // --------------------------------------------

      if (
        typeof setCart !==
        "function"
      ) {

        alert(
          "حدث خطأ في السلة، برجاء إعادة تحميل الصفحة."
        );

        return;

      }


      // --------------------------------------------
      // PHONE VALIDATION
      // --------------------------------------------

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
          "برجاء إدخال رقم هاتف صحيح."
        );

        return;

      }


      setLoading(
        true
      );


      try {

        // ==================================================
        // DEPARTMENTS
        // ==================================================

        const departments =
          getDepartmentsForOrder();


        if (
          departments.length ===
          0
        ) {

          alert(
            "لا يمكن إتمام الطلب.\n\n" +
            "لا يوجد رقم واتساب صالح للقسم المرتبط بالمنتجات.\n\n" +
            "أضف رقم واتساب للقسم أو القسم الأب من لوحة الأدمن."
          );

          return;

        }


        const firstDepartment =
          departments[0];


        const departmentWhatsapp =
          normalizePhone(
            firstDepartment?.whatsapp
          );


        if (
          !departmentWhatsapp
        ) {

          alert(
            "لا يوجد رقم واتساب صالح للقسم."
          );

          return;

        }


        // ==================================================
        // ORDER NUMBER
        // ==================================================

        const orderNumber =
          createOrderNumber();


        // ==================================================
        // PRODUCTS
        // ==================================================

        const orderProducts =
          cart.map(
            (item) => {

              const productId =
                item?.id ||
                item?._id ||
                item?.productId ||
                null;


              const selectedVariant =
                item?.selectedVariant
                  ? {
                      ...item.selectedVariant,
                    }
                  : null;


              const quantity =
                Number(
                  item?.quantity || 0
                );


              const price =
                Number(
                  item?.price || 0
                );


              const category =
                findCategoryForProduct(
                  item
                );


              return {

                id:
                  productId,

                productId:
                  productId,

                cartId:
                  item?.cartId ||
                  productId ||
                  null,

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

                price,

                oldPrice:
                  Number(
                    item?.oldPrice || 0
                  ),

                quantity,

                stock:
                  Number(
                    item?.stock || 0
                  ),

                total:
                  price *
                  quantity,

                categoryId:
                  category?.id ||
                  item?.categoryId ||
                  "",

                categoryNumber:
                  category?.categoryNumber ||
                  item?.categoryNumber ||
                  "",

                categoryName:
                  category?.name ||
                  item?.categoryName ||
                  item?.category ||
                  "",

                category:
                  category?.name ||
                  item?.categoryName ||
                  item?.category ||
                  "",

                selectedVariant,

                variantId:
                  item?.variantId ||
                  selectedVariant?.id ||
                  null,

                variantName:
                  selectedVariant?.name ||
                  item?.variantName ||
                  "",
              };

            }
          );


        // ==================================================
        // PAYMENT
        // ==================================================

        const paymentNumber =
          getPaymentNumber(
            paymentMethod
          );

        const paymentTitle =
          getPaymentMethodText(
            paymentMethod
          );


        // ==================================================
        // ORDER DATA
        // ==================================================

        const orderData = {

          orderNumber,

          orderNumberText:
            `#${orderNumber}`,

          userId:
            user.uid,

          uid:
            user.uid,

          customerId:
            user.uid,

          userUID:
            user.uid,

          customerName:
            cleanName,

          name:
            cleanName,

          email:
            user.email ||
            "",

          customerEmail:
            user.email ||
            "",

          phone:
            cleanPhone,

          customerPhone:
            cleanPhone,

          address:
            cleanAddress,

          products:
            orderProducts,

          departments,

          departmentId:
            firstDepartment?.id ||
            "",

          departmentNumber:
            firstDepartment?.categoryNumber ||
            "",

          departmentName:
            departments
              .map(
                (item) =>
                  item.name
              )
              .join("، "),

          departmentWhatsapp:
            departmentWhatsapp,

          whatsappPhone:
            departmentWhatsapp,

          whatsappSent:
            false,

          shippingZoneId:
            selectedZone?.id ||
            "",

          shippingZoneName:
            shippingZoneName,

          shippingCost:
            Number(
              shippingCost.toFixed(2)
            ),

          subtotal:
            Number(
              subtotal.toFixed(2)
            ),

          discount:
            Number(
              couponDiscount.toFixed(2)
            ),

          shipping:
            Number(
              shippingCost.toFixed(2)
            ),

          total:
            Number(
              finalTotal.toFixed(2)
            ),

          totalPrice:
            Number(
              finalTotal.toFixed(2)
            ),

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

          paymentMethod:
            paymentMethod,

          paymentMethodName:
            paymentTitle,

          paymentNumber:
            paymentNumber,

          paymentStatus:
            "pending",

          status:
            "pending",

          orderStatus:
            "pending",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };


        // ==================================================
        // SAVE ORDER
        // ==================================================

        console.log(
          "Saving Order:",
          orderData
        );


        const orderRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            orderData
          );


        console.log(
          "✅ Order Saved:",
          orderRef.id
        );


        // ==================================================
        // WHATSAPP
        // ==================================================

        const whatsappMessage =
          buildWhatsappMessage(
            orderNumber,
            firstDepartment?.name
          );


        const whatsappUrl =
          `https://wa.me/${departmentWhatsapp}?text=${encodeURIComponent(
            whatsappMessage
          )}`;


        // ==================================================
        // CLEAR CART
        // ==================================================

        setCart([]);


        // ==================================================
        // OPEN WHATSAPP
        // ==================================================

        window.location.href =
          whatsappUrl;

      } catch (error) {

        console.error(
          "Order Error:",
          error
        );


        if (
          error?.code ===
          "permission-denied"
        ) {

          alert(
            "فشل حفظ الطلب في لوحة الأدمن.\n\n" +
            "تم إيقاف إرسال واتساب لأن حفظ الطلب لم ينجح.\n\n" +
            "راجع Firestore Rules."
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
          required
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
          required
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
          required
        />


        {/* ==================================================
            SHIPPING
        ================================================== */}

        {!shippingZonesLoading &&
          shippingZones.length > 0 && (

            <div
              className="form-group"
            >

              <label>
                🚚 منطقة الشحن
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
                disabled={loading}
              >

                <option value="">
                  اختر منطقة الشحن
                </option>


                {shippingZones.map(
                  (zone) => {

                    const price =
                      Number(
                        zone.price ??
                        zone.shippingCost ??
                        zone.cost ??
                        zone.amount ??
                        0
                      );

                    return (

                      <option
                        key={
                          zone.id
                        }
                        value={
                          zone.id
                        }
                      >

                        {
                          zone.name ||
                          zone.title ||
                          "منطقة شحن"
                        }

                        {" - "}

                        {
                          price.toLocaleString(
                            "ar-EG"
                          )
                        }

                        {" ج.م"}

                      </option>

                    );

                  }
                )}

              </select>

            </div>

          )}


        {/* ==================================================
            PAYMENT METHODS
        ================================================== */}

        <div
          className="payment-method-section"
        >

          <h3>
            💳 اختر طريقة الدفع
          </h3>


          {paymentMethodsLoading ? (

            <div
              className="empty-state"
            >
              ⏳ جاري تحميل طرق الدفع...
            </div>

          ) : (

            <div
              className="payment-methods"
            >

              {paymentMethods.map(
                (method) => {

                  const selected =
                    String(
                      paymentMethod
                    ) ===
                    String(
                      method.id
                    );


                  const number =
                    method.number ||
                    method.phone ||
                    method.paymentNumber ||
                    "";


                  return (

                    <label
                      key={
                        method.id
                      }
                      className={
                        `payment-method-card ${
                          selected
                            ? "selected"
                            : ""
                        }`
                      }
                    >

                      <input
                        type="radio"
                        name="paymentMethod"
                        value={
                          method.id
                        }
                        checked={
                          selected
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


                      <div
                        className="payment-method-content"
                      >

                        <div
                          className="payment-method-title"
                        >

                          <span
                            className="payment-icon"
                          >
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
                            method.description ||
                            "متاح للدفع عند إتمام الطلب"
                          }
                        </p>


                        {number && (

                          <div
                            className="payment-number"
                          >

                            📱{" "}

                            <strong>
                              {
                                number
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


          {!isCashPayment &&
            paymentMethod && (

              <div
                className="payment-notice"
              >

                ⚠️{" "}
                <strong>
                  تنبيه:
                </strong>

                <br />

                بعد تحويل قيمة الطلب على الرقم
                الموضح، يرجى الاحتفاظ بإثبات الدفع.

              </div>

            )}

        </div>


        {/* ==================================================
            COUPON
        ================================================== */}

        <div
          className="coupon-section"
          style={{
            display: "block",
            visibility: "visible",
            opacity: 1,
            width: "100%",
            margin: "20px 0",
            padding: "20px",
            background: "#f8fafc",
            border: "2px solid #D4AF37",
            borderRadius: "15px",
            boxSizing: "border-box",
          }}
        >

          <h3
            style={{
              margin:
                "0 0 15px",
              color:
                "#0B1F3A",
              fontSize:
                "20px",
              fontWeight:
                "800",
            }}
          >
            🎟️ لديك كود خصم؟
          </h3>


          <div
            style={{
              display:
                "flex",
              gap:
                "10px",
              width:
                "100%",
              alignItems:
                "stretch",
            }}
          >

            <input
              type="text"
              placeholder="أدخل كود الخصم"
              value={
                couponCode
              }
              onChange={(e) => {

                setCouponCode(
                  e.target.value
                    .toUpperCase()
                );

                setCouponError(
                  ""
                );

                setCouponMessage(
                  ""
                );

              }}
              disabled={
                loading ||
                couponLoading ||
                !!appliedCoupon
              }
              style={{
                flex:
                  1,
                width:
                  "100%",
                minWidth:
                  0,
                padding:
                  "14px",
                border:
                  "1px solid #d9dfe8",
                borderRadius:
                  "10px",
                background:
                  "#fff",
                color:
                  "#071A36",
                fontSize:
                  "16px",
                fontFamily:
                  "inherit",
                outline:
                  "none",
                direction:
                  "ltr",
                textAlign:
                  "left",
                boxSizing:
                  "border-box",
              }}
            />


            {!appliedCoupon ? (

              <button
                type="button"
                onClick={
                  handleApplyCoupon
                }
                disabled={
                  loading ||
                  couponLoading
                }
                style={{
                  minWidth:
                    "120px",
                  padding:
                    "14px 20px",
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  background:
                    "#0B1F3A",
                  color:
                    "#fff",
                  fontSize:
                    "15px",
                  fontWeight:
                    "800",
                  fontFamily:
                    "inherit",
                  cursor:
                    "pointer",
                }}
              >

                {
                  couponLoading
                    ? "⏳ جاري التحقق..."
                    : "تطبيق"
                }

              </button>

            ) : (

              <button
                type="button"
                onClick={
                  removeCoupon
                }
                disabled={
                  loading
                }
                style={{
                  minWidth:
                    "120px",
                  padding:
                    "14px 20px",
                  border:
                    "1px solid #D4AF37",
                  borderRadius:
                    "10px",
                  background:
                    "#fff",
                  color:
                    "#0B1F3A",
                  fontSize:
                    "15px",
                  fontWeight:
                    "800",
                  fontFamily:
                    "inherit",
                  cursor:
                    "pointer",
                }}
              >

                إزالة الكوبون

              </button>

            )}

          </div>


          {couponError && (

            <div
              style={{
                display:
                  "block",
                marginTop:
                  "10px",
                padding:
                  "10px 12px",
                borderRadius:
                  "8px",
                background:
                  "#FEF2F2",
                border:
                  "1px solid #FECACA",
                color:
                  "#991B1B",
                fontSize:
                  "14px",
              }}
            >

              ❌{" "}
              {
                couponError
              }

            </div>

          )}


          {couponMessage && (

            <div
              style={{
                display:
                  "block",
                marginTop:
                  "10px",
                padding:
                  "10px 12px",
                borderRadius:
                  "8px",
                background:
                  "#F0FDF4",
                border:
                  "1px solid #BBF7D0",
                color:
                  "#166534",
                fontSize:
                  "14px",
                fontWeight:
                  "700",
              }}
            >

              {
                couponMessage
              }

            </div>

          )}

        </div>


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
                price *
                quantity;


              const variantName =
                item?.selectedVariant?.name ||
                item?.variantName ||
                "";


              return (

                <div
                  className="checkout-item"
                  key={
                    itemId
                  }
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
                        {
                          variantName
                        }

                      </small>

                    )}

                  </div>


                  <span>

                    {
                      quantity
                    }

                    {" × "}

                    {
                      price.toLocaleString(
                        "ar-EG"
                      )
                    }

                    {" جنيه = "}

                    {
                      itemTotal.toLocaleString(
                        "ar-EG"
                      )
                    }

                    {" جنيه"}

                  </span>

                </div>

              );

            }
          )}


          <div
            className="checkout-total"
          >

            <strong>
              إجمالي المنتجات:
            </strong>

            <strong>
              {
                subtotal.toLocaleString(
                  "ar-EG"
                )
              }{" "}
              جنيه
            </strong>

          </div>


          {couponDiscount > 0 && (

            <div
              className="checkout-total"
            >

              <strong>
                🎟️ الخصم:
              </strong>

              <strong>
                -{" "}
                {
                  couponDiscount.toLocaleString(
                    "ar-EG"
                  )
                }{" "}
                جنيه
              </strong>

            </div>

          )}


          {shippingCost > 0 && (

            <div
              className="checkout-total"
            >

              <strong>
                🚚 الشحن:
              </strong>

              <strong>
                {
                  shippingCost.toLocaleString(
                    "ar-EG"
                  )
                }{" "}
                جنيه
              </strong>

            </div>

          )}


          <div
            className="checkout-total"
            style={{
              borderTop:
                "2px solid #D4AF37",
              marginTop:
                "10px",
              paddingTop:
                "15px",
            }}
          >

            <strong>
              💰 الإجمالي النهائي:
            </strong>

            <strong>
              {
                finalTotal.toLocaleString(
                  "ar-EG"
                )
              }{" "}
              جنيه
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
            loading ||
            authLoading ||
            paymentMethodsLoading ||
            categoriesLoading ||
            shippingZonesLoading
          }
        >

          {loading

            ? "⏳ جاري تسجيل الطلب وفتح واتساب..."

            : authLoading

              ? "⏳ جاري التحقق من الحساب..."

              : paymentMethodsLoading

                ? "⏳ جاري تحميل طرق الدفع..."

                : categoriesLoading

                  ? "⏳ جاري تحميل الأقسام..."

                  : shippingZonesLoading

                    ? "⏳ جاري تحميل الشحن..."

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
            navigate(
              "/cart"
            )
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