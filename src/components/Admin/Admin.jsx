// ============================================================
// Admin.jsx - PART 1 / 3
// Elsafty Store - Full Admin Panel
// ============================================================

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

import "./Admin.css";


// ============================================================
// HELPERS
// ============================================================

const toDate = (value) => {
  if (!value) return null;

  if (value?.toDate) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};


const formatDate = (value) => {
  const date = toDate(value);

  if (!date) {
    return "غير متوفر";
  }

  return date.toLocaleString(
    "ar-EG",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};


const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


const getUserName = (user) =>
  user?.name ||
  user?.displayName ||
  user?.fullName ||
  user?.username ||
  "بدون اسم";


const getUserEmail = (user) =>
  user?.email ||
  user?.mail ||
  "لا يوجد بريد";


const getUserPhone = (user) =>
  user?.phone ||
  user?.phoneNumber ||
  user?.mobile ||
  "لا يوجد هاتف";


const getUserAddress = (user) => {
  if (typeof user?.address === "string") {
    return user.address || "لا يوجد عنوان";
  }

  if (user?.address) {
    return (
      [
        user.address.governorate,
        user.address.city,
        user.address.area,
        user.address.street,
        user.address.details,
      ]
        .filter(Boolean)
        .join(" - ") ||
      "لا يوجد عنوان"
    );
  }

  return (
    user?.shippingAddress ||
    user?.location ||
    "لا يوجد عنوان"
  );
};


const getUserRole = (user) =>
  user?.role === "admin"
    ? "مشرف"
    : "عميل";


const getLoginCount = (user) =>
  Number(
    user?.loginCount ||
      user?.loginAttempts ||
      user?.visitsCount ||
      0
  );


const getVisits = (user) => {
  if (Array.isArray(user?.visits)) {
    return user.visits;
  }

  if (Array.isArray(user?.visitHistory)) {
    return user.visitHistory;
  }

  if (Array.isArray(user?.loginHistory)) {
    return user.loginHistory;
  }

  return [];
};


const getPaymentMethodText = (method) => {
  const value = normalizeText(method);

  if (
    value === "cash" ||
    value === "cod" ||
    value.includes("cash")
  ) {
    return "الدفع عند الاستلام";
  }

  if (
    value === "card" ||
    value === "credit" ||
    value === "visa" ||
    value === "online"
  ) {
    return "الدفع الإلكتروني";
  }

  return method || "غير محدد";
};


const getPaymentStatusText = (status) => {
  const value = normalizeText(status);

  if (
    value === "paid" ||
    value === "success" ||
    value === "completed"
  ) {
    return "مدفوع";
  }

  if (
    value === "failed" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "فشل";
  }

  return "معلق";
};


const getPaymentStatusClass = (status) => {
  const value = normalizeText(status);

  if (
    value === "paid" ||
    value === "success" ||
    value === "completed"
  ) {
    return "payment-paid";
  }

  if (
    value === "failed" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "payment-failed";
  }

  return "payment-pending";
};


const getOrderStatusText = (status) => {
  const value = normalizeText(status);

  const statuses = {
    pending: "قيد الانتظار",
    processing: "جاري التجهيز",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    completed: "مكتمل",
    cancelled: "ملغي",
    canceled: "ملغي",
  };

  return (
    statuses[value] ||
    status ||
    "قيد الانتظار"
  );
};


// ============================================================
// ADMIN COMPONENT
// ============================================================

function Admin() {
const navigate = useNavigate();
  // ==========================================================
  // MAIN STATE
  // ==========================================================

  const [tab, setTab] =
    useState("dashboard");

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [banners, setBanners] =
    useState([]);

  const [coupons, setCoupons] =
    useState([]);

  const [announcements, setAnnouncements] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [supportMessages, setSupportMessages] =
    useState([]);

  const [favorites, setFavorites] =
    useState([]);

  const [blockedUsers, setBlockedUsers] =
    useState([]);

  const [shippingZones, setShippingZones] =
    useState([]);

  const [paymentMethods, setPaymentMethods] =
    useState([]);

  const [admins, setAdmins] =
    useState([]);

  const [activityLogs, setActivityLogs] =
    useState([]);


  // ==========================================================
  // STORE SETTINGS
  // ==========================================================

  const [
    storeSettings,
    setStoreSettings,
  ] = useState({
    storeName: "Elsafty Store",
    logo: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    facebook: "",
    instagram: "",
    telegram: "",
    announcement: "",

    theme: {
      primary: "#071A36",
      secondary: "#0B1F3A",
      accent: "#D4AF37",

      pageBackground: "#F0F4F8",
      cardBackground: "#FFFFFF",

      textPrimary: "#071A36",
      textSecondary: "#64748B",

      border: "#D9DFE8",

      buttonBackground: "#0B1F3A",
      buttonText: "#FFFFFF",

      navbarBackground: "#071A36",
      navbarText: "#FFFFFF",

      categoryBarBackground: "#FFFFFF",
      categoryBarText: "#071A36",

      topStripBackground: "#071A36",
      topStripText: "#FFFFFF",

      footerBackground: "#071A36",
      footerText: "#FFFFFF",
    },

    bannerSettings: {
      heightDesktop: 420,
      heightTablet: 350,
      heightMobile: 240,
      borderRadius: 0,
      overlayOpacity: 0.35,
    },

    topStrip: {
      enabled: true,
      direction: "rtl",
      speed: 40,
      height: 42,
      fontSize: 15,

      items: [
        {
          icon: "🚚",
          text: "شحن سريع لجميع المحافظات",
          active: true,
        },
        {
          icon: "💰",
          text: "أفضل الأسعار",
          active: true,
        },
        {
          icon: "🔥",
          text: "عروض وخصومات مستمرة",
          active: true,
        },
        {
          icon: "🎟️",
          text: "استخدم أكواد الخصم عند إتمام الطلب",
          active: true,
        },
        {
          icon: "🛍️",
          text: "تسوق الآن من Elsafty Store",
          active: true,
        },
      ],
    },

    featuresBar: {
      enabled: true,
      background: "#FFFFFF",
      color: "#071A36",
      accentColor: "#D4AF37",
      height: 80,
      fontSize: 16,

      items: [
        {
          icon: "🚚",
          title: "شحن سريع",
          text: "لجميع المحافظات",
          active: true,
        },
        {
          icon: "💳",
          title: "طرق دفع متعددة",
          text: "دفع عند الاستلام وإلكتروني",
          active: true,
        },
        {
          icon: "🎟️",
          title: "كوبونات خصم",
          text: "وفر أكثر عند الشراء",
          active: true,
        },
        {
          icon: "⭐",
          title: "منتجات مميزة",
          text: "اختيارات تناسبك",
          active: true,
        },
      ],
    },
  });


  // ==========================================================
  // PRODUCT FORM
  // ==========================================================

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [productForm, setProductForm] = useState({
    title: "",
    price: "",
    oldPrice: "",
    image: "",
    description: "",
    categoryId: "",
    stock: "",
    offer: false,
    bestSeller: false,
    newArrival: false,
    recommended: false,
    active: true,
  });


  // ==========================================================
  // CATEGORY FORM
  // ==========================================================

  const [showCategoryForm, setShowCategoryForm] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [categoryForm, setCategoryForm] =
    useState({
      name: "",
      description: "",
      image: "",
      categoryNumber: "",
      whatsapp: "",
      parentId: "",
      active: true,
    });


  // ==========================================================
  // USER DETAILS
  // ==========================================================

  const [showUserDetails, setShowUserDetails] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [userSearch, setUserSearch] =
    useState("");


  // ==========================================================
  // ORDER DETAILS
  // ==========================================================

  const [showOrderDetails, setShowOrderDetails] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState(null);


  // ==========================================================
  // SEARCH / FILTER
  // ==========================================================

  const [productSearch, setProductSearch] =
    useState("");

  const [orderSearch, setOrderSearch] =
    useState("");

  const [categorySearch, setCategorySearch] =
    useState("");

  const [orderStatusFilter, setOrderStatusFilter] =
    useState("all");


  // ==========================================================
  // GENERIC FORMS
  // ==========================================================

  const [showGenericForm, setShowGenericForm] =
    useState(false);

  const [genericType, setGenericType] =
    useState("");

  const [genericEditingId, setGenericEditingId] =
    useState(null);

  const [genericForm, setGenericForm] =
    useState({});

  const [actionLoading, setActionLoading] =
    useState(false);


  // ==========================================================
  // REALTIME FIRESTORE
  // ==========================================================

  useEffect(() => {

    const unsubscribers = [];


    const watchCollection = (
      collectionName,
      setter,
      sorter = null
    ) => {

      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {

          let data =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          if (sorter) {
            data.sort(sorter);
          }

          setter(data);
        },
        (error) => {

          console.error(
            `${collectionName} error:`,
            error
          );

          setter([]);
        }
      );

      unsubscribers.push(
        unsubscribe
      );
    };


    watchCollection(
      "products",
      setProducts
    );

    watchCollection(
      "categories",
      setCategories
    );

    watchCollection(
      "orders",
      setOrders,
      (a, b) =>
        (
          toDate(
            b.createdAt
          )?.getTime() || 0
        ) -
        (
          toDate(
            a.createdAt
          )?.getTime() || 0
        )
    );

    watchCollection(
      "users",
      setUsers
    );

    watchCollection(
      "banners",
      setBanners
    );

    watchCollection(
      "coupons",
      setCoupons
    );

    watchCollection(
      "announcements",
      setAnnouncements
    );

    watchCollection(
      "notifications",
      setNotifications,
      (a, b) =>
        (
          toDate(
            b.createdAt
          )?.getTime() || 0
        ) -
        (
          toDate(
            a.createdAt
          )?.getTime() || 0
        )
    );

    watchCollection(
      "supportMessages",
      setSupportMessages
    );

    watchCollection(
      "favorites",
      setFavorites
    );

    watchCollection(
      "blockedUsers",
      setBlockedUsers
    );

    watchCollection(
      "shippingZones",
      setShippingZones
    );

    watchCollection(
      "paymentMethods",
      setPaymentMethods
    );

    watchCollection(
      "admins",
      setAdmins
    );

    watchCollection(
      "activityLogs",
      setActivityLogs,
      (a, b) =>
        (
          toDate(
            b.createdAt
          )?.getTime() || 0
        ) -
        (
          toDate(
            a.createdAt
          )?.getTime() || 0
        )
    );


    const unsubscribeSettings =
      onSnapshot(
        doc(
          db,
          "settings",
          "store"
        ),
        (snapshot) => {

          if (
            snapshot.exists()
          ) {

            setStoreSettings(
              (previous) => ({
                ...previous,
                ...snapshot.data(),
              })
            );
          }
        },
        (error) => {

          console.error(
            "Store settings error:",
            error
          );
        }
      );


    unsubscribers.push(
      unsubscribeSettings
    );


    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };

  }, []);


  // ==========================================================
  // CATEGORY MAP
  // ==========================================================

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


  const getCategoryFullName =
    (categoryId) => {

      if (!categoryId) {
        return "";
      }

      const category =
        categoryMap[categoryId];

      if (!category) {
        return "بدون قسم";
      }

      const names = [
        category.name,
      ];

      let current = category;

      const visited =
        new Set();

      while (
        current?.parentId &&
        !visited.has(
          current.parentId
        )
      ) {

        visited.add(
          current.parentId
        );

        const parent =
          categoryMap[
            current.parentId
          ];

        if (!parent) {
          break;
        }

        names.unshift(
          parent.name
        );

        current = parent;
      }

      return names.join(" ← ");
    };


  // ==========================================================
  // FILTERING
  // ==========================================================

  const filteredProducts =
    useMemo(() => {

      const search =
        normalizeText(
          productSearch
        );

      if (!search) {
        return products;
      }

      return products.filter(
        (product) =>
          [
            product.title,
            product.name,
            product.description,
            getCategoryFullName(
              product.categoryId
            ),
          ]
            .filter(Boolean)
            .map(normalizeText)
            .some(
              (value) =>
                value.includes(
                  search
                )
            )
      );

    }, [
      products,
      productSearch,
      categories,
    ]);


  const filteredCategories =
    useMemo(() => {

      const search =
        normalizeText(
          categorySearch
        );

      if (!search) {
        return categories;
      }

      return categories.filter(
        (category) =>
          [
            category.name,
            category.categoryNumber,
            category.whatsapp,
          ]
            .filter(Boolean)
            .map(normalizeText)
            .some(
              (value) =>
                value.includes(
                  search
                )
            )
      );

    }, [
      categories,
      categorySearch,
    ]);


  const filteredOrders =
    useMemo(() => {

      const search =
        normalizeText(
          orderSearch
        );

      return orders.filter(
        (order) => {

          const status =
            order?.status ||
            order?.orderStatus ||
            "pending";

          const matchesStatus =
            orderStatusFilter ===
              "all" ||
            normalizeText(
              status
            ) ===
              normalizeText(
                orderStatusFilter
              );

          const searchable =
            [
              order?.id,
              order?.orderNumber,
              order?.customerName,
              order?.name,
              order?.email,
              order?.phone,
              order?.customerPhone,
            ]
              .filter(Boolean)
              .join(" ");

          return (
            matchesStatus &&
            (
              !search ||
              normalizeText(
                searchable
              ).includes(search)
            )
          );
        }
      );

    }, [
      orders,
      orderSearch,
      orderStatusFilter,
    ]);


  const sortedUsers =
    useMemo(() => {

      const search =
        normalizeText(
          userSearch
        );

      let result = [
        ...users,
      ];

      if (search) {

        result =
          result.filter(
            (user) =>
              [
                getUserName(user),
                getUserEmail(user),
                getUserPhone(user),
              ]
                .join(" ")
                .toLowerCase()
                .includes(search)
          );
      }

      result.sort(
        (a, b) =>
          (
            toDate(
              b.lastLoginAt ||
                b.lastLogin ||
                b.createdAt
            )?.getTime() || 0
          ) -
          (
            toDate(
              a.lastLoginAt ||
                a.lastLogin ||
                a.createdAt
            )?.getTime() || 0
          )
      );

      return result;

    }, [
      users,
      userSearch,
    ]);


  // ==========================================================
  // USER / ORDER HELPERS
  // ==========================================================

  const getOrdersForUser =
    (userId) =>
      orders.filter(
        (order) =>
          order?.userId === userId ||
          order?.uid === userId ||
          order?.customerId === userId ||
          order?.userUID === userId
      );


  const selectedUserOrders =
    useMemo(() => {

      if (!selectedUser) {
        return [];
      }

      return getOrdersForUser(
        selectedUser.id
      );

    }, [
      selectedUser,
      orders,
    ]);


  const getUserTotalPurchases =
    (userId) =>
      getOrdersForUser(
        userId
      ).reduce(
        (sum, order) =>
          sum +
          Number(
            order?.total ||
              order?.grandTotal ||
              order?.amount ||
              0
          ),
        0
      );


  // ==========================================================
  // SALES
  // ==========================================================

  const totalSales =
    useMemo(
      () =>
        orders.reduce(
          (sum, order) => {

            const status =
              normalizeText(
                order?.status ||
                  order?.orderStatus
              );

            if (
              status ===
              "cancelled" ||
              status ===
              "canceled"
            ) {
              return sum;
            }

            return (
              sum +
              Number(
                order?.total ||
                  order?.grandTotal ||
                  order?.amount ||
                  0
              )
            );
          },
          0
        ),
      [orders]
    );


  const paidSales =
    useMemo(
      () =>
        orders.reduce(
          (sum, order) => {

            const orderStatus =
              normalizeText(
                order?.status ||
                  order?.orderStatus
              );

            const paymentStatus =
              normalizeText(
                order?.paymentStatus
              );

            if (
              orderStatus ===
                "cancelled" ||
              orderStatus ===
                "canceled"
            ) {
              return sum;
            }

            if (
              ![
                "paid",
                "success",
                "successful",
                "completed",
              ].includes(
                paymentStatus
              )
            ) {
              return sum;
            }

            return (
              sum +
              Number(
                order?.total ||
                  order?.grandTotal ||
                  order?.amount ||
                  0
              )
            );
          },
          0
        ),
      [orders]
    );


  const offerProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.offer === true
        ),
      [products]
    );


  const bestSellerProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.bestSeller === true
        ),
      [products]
    );


  const newArrivalProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.newArrival === true
        ),
      [products]
    );


  const recommendedProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.recommended === true
        ),
      [products]
    );


  const pendingOrders =
    orders.filter(
      (order) =>
        normalizeText(
          order?.status ||
            order?.orderStatus
        ) === "pending"
    ).length;


  const deliveredOrders =
    orders.filter(
      (order) =>
        [
          "delivered",
          "completed",
        ].includes(
          normalizeText(
            order?.status ||
              order?.orderStatus
          )
        )
    ).length;


  const unreadNotifications =
    notifications.filter(
      (item) =>
        item?.read !== true
    ).length;


  // ==========================================================
  // USER DETAILS
  // ==========================================================

  const openUserDetails =
    (user) => {

      setSelectedUser(user);
      setShowUserDetails(true);
    };


  const closeUserDetails =
    () => {

      setSelectedUser(null);
      setShowUserDetails(false);
    };


  // ==========================================================
  // PRODUCT ACTIONS
  // ==========================================================

  const resetProductForm =
    () => {

      setProductForm({
        title: "",
        price: "",
        oldPrice: "",
        image: "",
        description: "",
        categoryId: "",
        stock: "",
        offer: false,
        bestSeller: false,
        newArrival: false,
        recommended: false,
        active: true,
      });

      setEditingProduct(null);
      setShowProductForm(false);
    };


  const handleProductChange =
    (event) => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setProductForm(
        (previous) => ({
          ...previous,
          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );
    };


  const handleProductSubmit =
    async (event) => {

      event.preventDefault();

      setActionLoading(true);

      try {

        const productData = {
          title:
            productForm.title.trim(),

          price:
            Number(
              productForm.price || 0
            ),

          oldPrice:
            Number(
              productForm.oldPrice || 0
            ),

          image:
            productForm.image.trim(),

          description:
            productForm.description.trim(),

          categoryId:
            productForm.categoryId,

          stock:
            Number(
              productForm.stock || 0
            ),

          offer:
            Boolean(
              productForm.offer
            ),

          bestSeller:
            Boolean(
              productForm.bestSeller
            ),

          newArrival:
            Boolean(
              productForm.newArrival
            ),

          recommended:
            Boolean(
              productForm.recommended
            ),

          active:
            Boolean(
              productForm.active
            ),

          updatedAt:
            serverTimestamp(),
        };


        if (editingProduct) {

          await updateDoc(
            doc(
              db,
              "products",
              editingProduct.id
            ),
            productData
          );

        } else {

          await setDoc(
            doc(
              collection(
                db,
                "products"
              )
            ),
            {
              ...productData,
              createdAt:
                serverTimestamp(),
            }
          );
        }

        resetProductForm();

      } catch (error) {

        console.error(
          "Product save error:",
          error
        );

        alert(
          "حدث خطأ أثناء حفظ المنتج."
        );

      } finally {

        setActionLoading(false);
      }
    };


  const handleAddProduct =
    () => {

      setEditingProduct(null);

      setProductForm({
        title: "",
        price: "",
        oldPrice: "",
        image: "",
        description: "",
        categoryId: "",
        stock: "",
        offer: false,
        bestSeller: false,
        newArrival: false,
        recommended: false,
        active: true,
      });

      setShowProductForm(true);
      setTab("products");
    };


  const handleEdit =
    (product) => {

      setEditingProduct(product);

      setProductForm({
        title:
          product?.title ||
          product?.name ||
          "",

        price:
          product?.price ?? "",

        oldPrice:
          product?.oldPrice ?? "",

        image:
          product?.image || "",

        description:
          product?.description || "",

        categoryId:
          product?.categoryId || "",

        stock:
          product?.stock ?? "",

        offer:
          Boolean(product?.offer),

        bestSeller:
          Boolean(
            product?.bestSeller
          ),

        newArrival:
          Boolean(
            product?.newArrival
          ),

        recommended:
          Boolean(
            product?.recommended
          ),

        active:
          product?.active !== false,
      });

      setShowProductForm(true);
      setTab("products");
    };


  const handleCancelProduct =
    () => {
      resetProductForm();
    };


  const handleDeleteProduct =
    async (product) => {

      if (
        !window.confirm(
          `هل أنت متأكد من حذف المنتج "${product?.title || product?.name || ""}"؟`
        )
      ) {
        return;
      }

      try {

        await deleteDoc(
          doc(
            db,
            "products",
            product.id
          )
        );

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء حذف المنتج."
        );
      }
    };


  // ==========================================================
  // CATEGORY ACTIONS
  // ==========================================================

  const resetCategoryForm =
    () => {

      setCategoryForm({
        name: "",
        description: "",
        image: "",
        categoryNumber: "",
        whatsapp: "",
        parentId: "",
        active: true,
      });

      setEditingCategory(null);
      setShowCategoryForm(false);
    };


  const handleCategoryChange =
    (event) => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setCategoryForm(
        (previous) => ({
          ...previous,
          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );
    };


  const handleCategorySubmit =
    async (event) => {

      event.preventDefault();

      setActionLoading(true);

      try {

        const categoryData = {

          name:
            categoryForm.name.trim(),

          description:
            categoryForm.description?.trim() ||
            "",

          image:
            categoryForm.image.trim(),

          categoryNumber:
            categoryForm.categoryNumber.trim(),

          whatsapp:
            categoryForm.whatsapp.trim(),

          parentId:
            categoryForm.parentId ||
            null,

          active:
            Boolean(
              categoryForm.active
            ),

          updatedAt:
            serverTimestamp(),
        };


        if (editingCategory) {

          await updateDoc(
            doc(
              db,
              "categories",
              editingCategory.id
            ),
            categoryData
          );

        } else {

          await setDoc(
            doc(
              collection(
                db,
                "categories"
              )
            ),
            {
              ...categoryData,
              createdAt:
                serverTimestamp(),
            }
          );
        }

        resetCategoryForm();

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء حفظ القسم."
        );

      } finally {

        setActionLoading(false);
      }
    };


  const handleEditCategory =
    (category) => {

      setEditingCategory(category);

      setCategoryForm({
        name:
          category?.name || "",

        description:
          category?.description || "",

        image:
          category?.image || "",

        categoryNumber:
          category?.categoryNumber || "",

        whatsapp:
          category?.whatsapp || "",

        parentId:
          category?.parentId || "",

        active:
          category?.active !== false,
      });

      setShowCategoryForm(true);
      setTab("categories");
    };


  const handleDeleteCategory =
    async (category) => {

      const hasChildren =
        categories.some(
          (item) =>
            item.parentId ===
            category.id
        );

      if (hasChildren) {

        alert(
          "لا يمكن حذف هذا القسم لأنه يحتوي على أقسام فرعية."
        );

        return;
      }


      if (
        !window.confirm(
          `هل أنت متأكد من حذف القسم "${category?.name || ""}"؟`
        )
      ) {
        return;
      }


      try {

        await deleteDoc(
          doc(
            db,
            "categories",
            category.id
          )
        );

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء حذف القسم."
        );
      }
    };


  const renderCategoryTree =
    (
      items,
      level = 0
    ) => (

      <div>

        {items.map(
          (category) => {

            const children =
              categories.filter(
                (item) =>
                  item.parentId ===
                  category.id
              );

            return (
              <div
                key={
                  category.id
                }
              >

                <div
                  className="category-tree-item"
                  style={{
                    paddingRight:
                      `${level * 24}px`,
                  }}
                >

                  <strong>
                    {
                      level > 0
                        ? "↳ "
                        : "📂 "
                    }

                    {
                      category.name
                    }
                  </strong>

                  <span>
                    {
                      category.categoryNumber ||
                      "—"
                    }
                  </span>

                  <div
                    className="table-actions"
                  >

                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() =>
                        handleEditCategory(
                          category
                        )
                      }
                    >
                      ✏️ تعديل
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        handleDeleteCategory(
                          category
                        )
                      }
                    >
                      🗑️ حذف
                    </button>

                  </div>

                </div>

                {children.length >
                  0 &&
                  renderCategoryTree(
                    children,
                    level + 1
                  )}

              </div>
            );
          }
        )}

      </div>
    );
      // ==========================================================
  // ACTIVITY / ORDERS
  // ==========================================================

  const addActivityLog =
    async (
      action,
      description
    ) => {

      try {

        await setDoc(
          doc(
            collection(
              db,
              "activityLogs"
            )
          ),
          {
            action,
            description,
            createdAt:
              serverTimestamp(),
          }
        );

      } catch (error) {

        console.error(
          "Activity log error:",
          error
        );
      }
    };


  const updateOrderStatus =
    async (
      order,
      newStatus
    ) => {

      try {

        await updateDoc(
          doc(
            db,
            "orders",
            order.id
          ),
          {
            status:
              newStatus,

            orderStatus:
              newStatus,

            updatedAt:
              serverTimestamp(),
          }
        );


        await addActivityLog(
          "تحديث طلب",
          `تم تغيير حالة الطلب ${order.id} إلى ${getOrderStatusText(newStatus)}`
        );

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء تحديث الطلب."
        );
      }
    };


  const handleOrderStatusChange =
    async (
      orderId,
      newStatus
    ) => {

      const order =
        orders.find(
          (item) =>
            item.id === orderId
        );

      if (!order) {
        return;
      }

      await updateOrderStatus(
        order,
        newStatus
      );
    };


  const openOrderDetails =
    (order) => {

      setSelectedOrder(order);
      setShowOrderDetails(true);
    };


  const closeOrderDetails =
    () => {

      setSelectedOrder(null);
      setShowOrderDetails(false);
    };


  const deleteOrder =
    async (order) => {

      if (
        !window.confirm(
          "هل أنت متأكد من حذف هذا الطلب؟"
        )
      ) {
        return;
      }

      try {

        await deleteDoc(
          doc(
            db,
            "orders",
            order.id
          )
        );

        await addActivityLog(
          "حذف طلب",
          `تم حذف الطلب: ${order.id}`
        );

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء حذف الطلب."
        );
      }
    };


  // ==========================================================
  // GENERIC ACTIONS
  // ==========================================================

  const getGenericCollection =
    (type) => {

      const collections = {

        banners:
          "banners",

        coupons:
          "coupons",

        announcements:
          "announcements",

        notifications:
          "notifications",

        support:
          "supportMessages",

        favorites:
          "favorites",

        "blocked-users":
          "blockedUsers",

        shipping:
          "shippingZones",

        payments:
          "paymentMethods",

        admins:
          "admins",
      };

      return collections[type];
    };


  const openGenericForm =
    (
      type,
      item = null
    ) => {

      setGenericType(type);

      setGenericEditingId(
        item?.id || null
      );

      setGenericForm(
        item
          ? {
              ...item,
              imageFile:
                null,
              imagePreview:
                "",
            }
          : {}
      );

      setShowGenericForm(true);
    };


  const closeGenericForm =
    () => {

      setShowGenericForm(false);
      setGenericType("");
      setGenericEditingId(null);
      setGenericForm({});
    };


  const handleGenericChange =
    (event) => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setGenericForm(
        (previous) => ({
          ...previous,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );
    };


  // ==========================================================
  // CLOUDINARY BANNER UPLOAD
  // ==========================================================

  const uploadBannerImage =
    async (file) => {

      if (!file) {
        return "";
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "upload_preset",
        "elsafty_store"
      );

      const response =
        await fetch(
          "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      if (!response.ok) {

        let message =
          "فشل رفع صورة البانر";

        try {

          const errorData =
            await response.json();

          if (
            errorData?.error?.message
          ) {
            message =
              errorData.error.message;
          }

        } catch {
          // ignore
        }

        throw new Error(
          message
        );
      }

      const data =
        await response.json();

      if (
        !data.secure_url
      ) {
        throw new Error(
          "لم يتم الحصول على رابط الصورة"
        );
      }

      return data.secure_url;
    };


  // ==========================================================
  // GENERIC SUBMIT
  // ==========================================================

  const handleGenericSubmit =
    async (event) => {

      event.preventDefault();

      const collectionName =
        getGenericCollection(
          genericType
        );

      if (!collectionName) {
        return;
      }

      setActionLoading(true);

      try {

        // ==================================================
        // PREPARE DATA
        // ==================================================

        const dataToSave = {
          ...genericForm,
        };


        // ==================================================
        // BANNER IMAGE
        // ==================================================

        if (
          genericType === "banners" &&
          genericForm.imageFile
        ) {

          const imageUrl =
            await uploadBannerImage(
              genericForm.imageFile
            );

          dataToSave.image =
            imageUrl;
        }


        // ==================================================
        // REMOVE LOCAL FILE DATA
        // ==================================================

        delete dataToSave.imageFile;
        delete dataToSave.imagePreview;


        // ==================================================
        // BANNER NORMALIZATION
        // ==================================================

        if (
          genericType === "banners"
        ) {

          dataToSave.order =
            Number(
              dataToSave.order || 0
            );

          dataToSave.titleFontSize =
            Number(
              dataToSave.titleFontSize ||
              42
            );

          dataToSave.descriptionFontSize =
            Number(
              dataToSave.descriptionFontSize ||
              20
            );

          dataToSave.active =
            dataToSave.active !==
            false;

          dataToSave.fontFamily =
            dataToSave.fontFamily ||
            "Cairo";

          dataToSave.textColor =
            dataToSave.textColor ||
            "#ffffff";

          dataToSave.fontWeight =
            dataToSave.fontWeight ||
            "700";

          dataToSave.textAlign =
            dataToSave.textAlign ||
            "right";

          dataToSave.textPositionX =
            dataToSave.textPositionX ||
            "right";

          dataToSave.textPositionY =
            dataToSave.textPositionY ||
            "center";

          dataToSave.tag =
            dataToSave.tag ||
            "🔥 عرض خاص";

          dataToSave.buttonText =
            dataToSave.buttonText ||
            "تسوق الآن";

          dataToSave.link =
            dataToSave.link ||
            "/";

        }


        // ==================================================
        // OTHER GENERIC DATA
        // ==================================================

        if (
          genericType === "coupons"
        ) {

          dataToSave.value =
            Number(
              dataToSave.value || 0
            );

          dataToSave.minOrder =
            Number(
              dataToSave.minOrder || 0
            );

          dataToSave.active =
            dataToSave.active !==
            false;
        }


        if (
          genericType === "shipping"
        ) {

          dataToSave.price =
            Number(
              dataToSave.price || 0
            );

          dataToSave.active =
            dataToSave.active !==
            false;
        }


        // ==================================================
        // UPDATE
        // ==================================================

        if (
          genericEditingId
        ) {

          await updateDoc(
            doc(
              db,
              collectionName,
              genericEditingId
            ),
            {
              ...dataToSave,

              updatedAt:
                serverTimestamp(),
            }
          );

        } else {

          // ==================================================
          // CREATE
          // ==================================================

          await addDoc(
            collection(
              db,
              collectionName
            ),
            {
              ...dataToSave,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );
        }


        // ==================================================
        // ACTIVITY LOG
        // ==================================================

        await addActivityLog(
          genericEditingId
            ? "تعديل بيانات"
            : "إضافة بيانات",

          `تم ${
            genericEditingId
              ? "تعديل"
              : "إضافة"
          } بيانات في قسم ${genericType}`
        );


        alert(
          genericEditingId
            ? "✅ تم التعديل بنجاح."
            : "✅ تمت الإضافة بنجاح."
        );


        closeGenericForm();

      } catch (error) {

        console.error(
          "Generic save error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء الحفظ."
        );

      } finally {

        setActionLoading(
          false
        );
      }
    };


  const deleteGenericItem =
    async (
      type,
      item
    ) => {

      const collectionName =
        getGenericCollection(type);

      if (!collectionName) {
        return;
      }

      if (
        !window.confirm(
          "هل أنت متأكد من الحذف؟"
        )
      ) {
        return;
      }

      try {

        await deleteDoc(
          doc(
            db,
            collectionName,
            item.id
          )
        );

        await addActivityLog(
          "حذف بيانات",
          `تم حذف عنصر من قسم ${type}`
        );

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء الحذف."
        );
      }
    };


  // ==========================================================
  // STORE SETTINGS
  // ==========================================================

  const saveStoreSettings =
    async (event) => {

      if (
        event?.preventDefault
      ) {
        event.preventDefault();
      }

      try {

        await setDoc(
          doc(
            db,
            "settings",
            "store"
          ),
          {
            ...storeSettings,

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await addActivityLog(
          "إعدادات المتجر",
          "تم تحديث إعدادات المتجر"
        );

        alert(
          "تم حفظ إعدادات المتجر بنجاح."
        );

      } catch (error) {

        console.error(error);

        alert(
          "حدث خطأ أثناء حفظ الإعدادات."
        );
      }
    };


  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const menuSections = [
    {
      title: "الرئيسية",

      items: [
        {
          id: "dashboard",
          icon: "🏠",
          title: "الرئيسية",
        },

        {
          id: "reports",
          icon: "📈",
          title: "الإحصائيات والتقارير",
        },
      ],
    },

    {
      title: "المتجر",

      items: [
        {
          id: "products",
          icon: "📦",
          title: "المنتجات",
          count: products.length,
        },

        {
          id: "categories",
          icon: "📂",
          title: "الأقسام",
          count: categories.length,
        },

        {
          id: "offers",
          icon: "⭐",
          title: "العروض",
          count:
            offerProducts.length,
        },

        {
          id: "bestsellers",
          icon: "🔥",
          title: "الأكثر مبيعًا",
          count:
            bestSellerProducts.length,
        },

        {
          id: "new-arrivals",
          icon: "🆕",
          title: "المنتجات الجديدة",
          count:
            newArrivalProducts.length,
        },

        {
          id: "recommended",
          icon: "👍",
          title: "المنتجات المقترحة",
          count:
            recommendedProducts.length,
        },
      ],
    },

    {
      title: "العملاء والطلبات",

      items: [
        {
          id: "users",
          icon: "👥",
          title: "المستخدمون",
          count: users.length,
        },

        {
          id: "customers",
          icon: "🧑‍💼",
          title: "العملاء",
          count: users.length,
        },

        {
          id: "orders",
          icon: "🛒",
          title: "الطلبات",
          count: orders.length,
        },

        {
          id: "sales",
          icon: "💰",
          title: "المبيعات",
        },

        {
          id: "favorites",
          icon: "❤️",
          title: "المفضلة",
          count:
            favorites.length,
        },

        {
          id: "blocked-users",
          icon: "🚫",
          title: "المحظورون",
          count:
            blockedUsers.length,
        },

        {
          id: "support",
          icon: "💬",
          title: "خدمة العملاء",
          count:
            supportMessages.length,
        },
      ],
    },

    {
      title: "التسويق",

      items: [
        {
          id: "banners",
          icon: "🖼️",
          title: "البانرات",
          count:
            banners.length,
        },

        {
          id: "coupons",
          icon: "🏷️",
          title: "الكوبونات والخصومات",
          count:
            coupons.length,
        },

        {
          id: "announcements",
          icon: "📢",
          title: "الإعلانات",
          count:
            announcements.length,
        },

        {
          id: "notifications",
          icon: "🔔",
          title: "الإشعارات",
          count:
            unreadNotifications,
        },
      ],
    },

    {
      title: "الإعدادات",

      items: [
        {
          id: "settings",
          icon: "⚙️",
          title: "إعدادات المتجر",
        },

        {
          id: "shipping",
          icon: "🚚",
          title: "الشحن والتوصيل",
          count:
            shippingZones.length,
        },

        {
          id: "payments",
          icon: "💳",
          title: "طرق الدفع",
          count:
            paymentMethods.length,
        },

        {
          id: "contact",
          icon: "📱",
          title: "بيانات التواصل",
        },

        {
          id: "admins",
          icon: "🔐",
          title: "المشرفون والصلاحيات",
          count:
            admins.length,
        },

        {
          id: "activity-log",
          icon: "📝",
          title: "سجل العمليات",
          count:
            activityLogs.length,
        },

        {
          id: "security",
          icon: "🔑",
          title: "الأمان",
        },
      ],
    },
  ];


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="admin-page"
      dir="rtl"
    >

      <aside
        className="admin-sidebar"
      >

        <div
          className="admin-sidebar-logo"
        >

          <div
            className="admin-logo-icon"
          >
            🛍️
          </div>

          <div>

            <strong>
              Elsafty Store
            </strong>

            <small>
              لوحة الإدارة
            </small>

          </div>

        </div>


        <div
          className="admin-menu"
        >

          {menuSections.map(
            (section) => (

              <div
                className="admin-menu-section"
                key={
                  section.title
                }
              >

                <div
                  className="admin-menu-title"
                >
                  {
                    section.title
                  }
                </div>


                {section.items.map(
                  (item) => (

                    <button
                      type="button"
                      key={item.id}
                      className={
                        tab === item.id
                          ? "admin-menu-item active"
                          : "admin-menu-item"
                      }

                      onClick={() => {

                        setTab(
                          item.id
                        );

                        setShowUserDetails(
                          false
                        );

                        setShowOrderDetails(
                          false
                        );

                        setShowGenericForm(
                          false
                        );

                      }}
                    >

                      <span
                        className="admin-menu-icon"
                      >
                        {
                          item.icon
                        }
                      </span>

                      <span
                        className="admin-menu-text"
                      >
                        {
                          item.title
                        }
                      </span>

                      {item.count !==
                        undefined && (

                        <span
                          className="admin-menu-count"
                        >
                          {
                            item.count
                          }
                        </span>

                      )}

                    </button>

                  )
                )}

              </div>

            )
          )}

        </div>

      </aside>


      <main
        className="admin-main"
      >

        <header
          className="admin-topbar"
        >

          <div>

            <h1>

              {
                menuSections
                  .flatMap(
                    (section) =>
                      section.items
                  )
                  .find(
                    (item) =>
                      item.id === tab
                  )?.title ||
                "لوحة الإدارة"
              }

            </h1>

            <p>
              إدارة Elsafty Store
            </p>

          </div>


          <div
            className="admin-topbar-stats"
          >

            <span>
              👥 {users.length} عميل
            </span>

            <span>
              🛒 {orders.length} طلب
            </span>

            <span>

              💰{" "}

              {
                totalSales.toLocaleString(
                  "ar-EG"
                )
              }

              {" "}
              ج.م

            </span>
<button
  type="button"
  className="back-to-store-btn"
  onClick={() => navigate("/")}
>
  🏠 العودة للمتجر
</button>
          </div>

        </header>


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {tab === "dashboard" && (

          <div
            className="admin-dashboard"
          >

            <div
              className="admin-stats"
            >

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab("users")
                }
              >

                <h3>
                  👥 المستخدمون
                </h3>

                <p>
                  {
                    users.length
                  }
                </p>

              </button>


              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab("products")
                }
              >

                <h3>
                  📦 المنتجات
                </h3>

                <p>
                  {
                    products.length
                  }
                </p>

              </button>


              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab("categories")
                }
              >

                <h3>
                  📂 الأقسام
                </h3>

                <p>
                  {
                    categories.length
                  }
                </p>

              </button>


              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab("orders")
                }
              >

                <h3>
                  🛒 الطلبات
                </h3>

                <p>
                  {
                    orders.length
                  }
                </p>

              </button>


              <div
                className="stat-card"
              >

                <h3>
                  ⏳ طلبات معلقة
                </h3>

                <p>
                  {
                    pendingOrders
                  }
                </p>

              </div>


              <div
                className="stat-card"
              >

                <h3>
                  ✅ طلبات مكتملة
                </h3>

                <p>
                  {
                    deliveredOrders
                  }
                </p>

              </div>


              <div
                className="stat-card"
              >

                <h3>
                  💰 إجمالي المبيعات
                </h3>

                <p>

                  {
                    totalSales.toLocaleString(
                      "ar-EG"
                    )
                  }

                  {" "}
                  ج.م

                </p>

              </div>


              <div
                className="stat-card"
              >

                <h3>
                  💳 مدفوع إلكترونيًا
                </h3>

                <p>

                  {
                    paidSales.toLocaleString(
                      "ar-EG"
                    )
                  }

                  {" "}
                  ج.م

                </p>

              </div>

            </div>


            <div
              className="admin-dashboard-grid"
            >

              <div
                className="table-container"
              >

                <div
                  className="section-header"
                >

                  <div>

                    <h2>
                      🛒 آخر الطلبات
                    </h2>

                    <p>
                      أحدث الطلبات المسجلة
                    </p>

                  </div>


                  <button
                    type="button"
                    className="save-btn"
                    onClick={() =>
                      setTab("orders")
                    }
                  >
                    عرض كل الطلبات
                  </button>

                </div>


                <div
                  className="table-scroll"
                >

                  <table
                    className="admin-table"
                  >

                    <thead>
                      <tr>
                        <th>الطلب</th>
                        <th>العميل</th>
                        <th>الإجمالي</th>
                        <th>الحالة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>

                    <tbody>

                      {orders
                        .slice(0, 8)
                        .map(
                          (order) => {

                            const status =
                              order?.status ||
                              order?.orderStatus ||
                              "pending";

                            return (

                              <tr
                                key={
                                  order.id
                                }
                              >

                                <td dir="ltr">

                                  #
                                  {
                                    order.orderNumber ||
                                    order.id?.slice(
                                      0,
                                      8
                                    )
                                  }

                                </td>

                                <td>

                                  {
                                    order?.customerName ||
                                    order?.name ||
                                    "عميل"
                                  }

                                </td>

                                <td>

                                  {
                                    Number(
                                      order?.total ||
                                      0
                                    ).toLocaleString(
                                      "ar-EG"
                                    )
                                  }

                                  {" "}
                                  ج.م

                                </td>

                                <td>

                                  <span
                                    className={`order-status status-${status}`}
                                  >
                                    {
                                      getOrderStatusText(
                                        status
                                      )
                                    }
                                  </span>

                                </td>

                                <td>

                                  {
                                    formatDate(
                                      order?.createdAt
                                    )
                                  }

                                </td>

                              </tr>

                            );
                          }
                        )}


                      {orders.length ===
                        0 && (

                        <tr>

                          <td colSpan="5">
                            لا توجد طلبات حتى الآن.
                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              <div
                className="table-container"
              >

                <div
                  className="section-header"
                >

                  <div>

                    <h2>
                      👥 أحدث العملاء
                    </h2>

                    <p>
                      آخر الحسابات المسجلة
                    </p>

                  </div>


                  <button
                    type="button"
                    className="save-btn"
                    onClick={() =>
                      setTab("users")
                    }
                  >
                    عرض العملاء
                  </button>

                </div>


                <div
                  className="dashboard-users-list"
                >

                  {
                    sortedUsers
                      .slice(0, 8)
                      .map(
                        (user) => (

                          <button
                            type="button"
                            className="dashboard-user-item"
                            key={user.id}

                            onClick={() => {

                              setTab(
                                "users"
                              );

                              openUserDetails(
                                user
                              );

                            }}
                          >

                            <span>
                              👤
                            </span>

                            <div>

                              <strong>
                                {
                                  getUserName(
                                    user
                                  )
                                }
                              </strong>

                              <small>
                                {
                                  getUserEmail(
                                    user
                                  )
                                }
                              </small>

                            </div>

                          </button>

                        )
                      )
                  }


                  {users.length ===
                    0 && (

                    <div
                      className="empty-state"
                    >

                      <div>
                        👥
                      </div>

                      <p>
                        لا يوجد عملاء حتى الآن.
                      </p>

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            PRODUCTS
        ==================================================== */}

        {tab === "products" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  📦 إدارة المنتجات
                </h2>

                <p>
                  إجمالي المنتجات:
                  {" "}
                  <strong>
                    {products.length}
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="save-btn"
                onClick={
                  handleAddProduct
                }
              >
                ➕ إضافة منتج
              </button>

            </div>


            <div
              className="accounts-search"
            >

              <input
                type="search"
                placeholder="🔎 ابحث عن منتج..."
                value={
                  productSearch
                }
                onChange={(event) =>
                  setProductSearch(
                    event.target.value
                  )
                }
              />

              {productSearch && (

                <button
                  type="button"
                  onClick={() =>
                    setProductSearch("")
                  }
                >
                  ✕
                </button>

              )}

            </div>


            {showProductForm && (

              <form
                className="admin-form"
                onSubmit={
                  handleProductSubmit
                }
              >

                <h3>

                  {
                    editingProduct
                      ? "✏️ تعديل المنتج"
                      : "➕ إضافة منتج جديد"
                  }

                </h3>


                <div
                  className="form-grid"
                >

                  <label>

                    <span>
                      اسم المنتج
                    </span>

                    <input
                      name="title"
                      value={
                        productForm.title
                      }
                      onChange={
                        handleProductChange
                      }
                      required
                    />

                  </label>


                  <label>

                    <span>
                      السعر
                    </span>

                    <input
                      name="price"
                      type="number"
                      min="0"
                      value={
                        productForm.price
                      }
                      onChange={
                        handleProductChange
                      }
                      required
                    />

                  </label>


                  <label>

                    <span>
                      السعر القديم
                    </span>

                    <input
                      name="oldPrice"
                      type="number"
                      min="0"
                      value={
                        productForm.oldPrice
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                  </label>


                  <label>

                    <span>
                      المخزون
                    </span>

                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={
                        productForm.stock
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                  </label>


                  {/* ========================================
                      PRODUCT IMAGE
                  ======================================== */}

                  <label
                    className="form-group-full"
                  >

                    <span>
                      🖼️ صورة المنتج
                    </span>

                    <input
                      name="image"
                      value={
                        productForm.image
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="رابط صورة المنتج"
                      dir="ltr"
                    />

                  </label>


                  <label>

                    <span>
                      القسم
                    </span>

                    <select
                      name="categoryId"
                      value={
                        productForm.categoryId
                      }
                      onChange={
                        handleProductChange
                      }
                    >

                      <option value="">
                        اختر القسم
                      </option>

                      {categories.map(
                        (category) => (

                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              getCategoryFullName(
                                category.id
                              )
                            }
                          </option>

                        )
                      )}

                    </select>

                  </label>

                </div>


                <label
                  className="form-group-full"
                >

                  <span>
                    وصف المنتج
                  </span>

                  <textarea
                    name="description"
                    value={
                      productForm.description
                    }
                    onChange={
                      handleProductChange
                    }
                    rows="4"
                  />

                </label>


                <div
                  className="admin-checkboxes"
                >

                  <label>

                    <input
                      type="checkbox"
                      name="offer"
                      checked={
                        productForm.offer
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                    ⭐ عرض

                  </label>


                  <label>

                    <input
                      type="checkbox"
                      name="bestSeller"
                      checked={
                        productForm.bestSeller
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                    🔥 الأكثر مبيعًا

                  </label>


                  <label>

                    <input
                      type="checkbox"
                      name="newArrival"
                      checked={
                        productForm.newArrival
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                    🆕 جديد

                  </label>


                  <label>

                    <input
                      type="checkbox"
                      name="recommended"
                      checked={
                        productForm.recommended
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                    👍 مقترح

                  </label>


                  <label>

                    <input
                      type="checkbox"
                      name="active"
                      checked={
                        productForm.active
                      }
                      onChange={
                        handleProductChange
                      }
                    />

                    ✅ ظاهر في المتجر

                  </label>

                </div>


                <div
                  className="form-actions"
                >

                  <button
                    type="submit"
                    className="save-btn"
                    disabled={
                      actionLoading
                    }
                  >
                    {
                      actionLoading
                        ? "⏳ جاري الحفظ..."
                        : "💾 حفظ"
                    }
                  </button>


                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      handleCancelProduct
                    }
                  >
                    إلغاء
                  </button>

                </div>

              </form>
            )}


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>القسم</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredProducts.length ===
                    0 ? (

                    <tr>

                      <td colSpan="6">
                        لا توجد منتجات.
                      </td>

                    </tr>

                  ) : (

                    filteredProducts.map(
                      (product) => (

                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>

                            {product.image ? (

                              <img
                                src={
                                  product.image
                                }
                                className="table-img"
                                alt={
                                  product.title ||
                                  "منتج"
                                }
                              />

                            ) : (

                              <div className="table-img-placeholder">
                                📦
                              </div>

                            )}

                          </td>


                          <td>

                            <strong>

                              {
                                product.title ||
                                product.name
                              }

                            </strong>


                            <div
                              className="product-badges"
                            >

                              {product.offer && (
                                <span>
                                  ⭐ عرض
                                </span>
                              )}

                              {product.bestSeller && (
                                <span>
                                  🔥 مميز
                                </span>
                              )}

                              {product.newArrival && (
                                <span>
                                  🆕 جديد
                                </span>
                              )}

                              {product.recommended && (
                                <span>
                                  👍 مقترح
                                </span>
                              )}

                            </div>

                          </td>


                          <td>

                            <strong>

                              {
                                Number(
                                  product.price ||
                                  0
                                ).toLocaleString(
                                  "ar-EG"
                                )
                              }

                              {" "}
                              ج.م

                            </strong>


                            {product.oldPrice >
                              0 && (

                              <small
                                style={{
                                  display:
                                    "block",

                                  textDecoration:
                                    "line-through",
                                }}
                              >

                                {
                                  Number(
                                    product.oldPrice
                                  ).toLocaleString(
                                    "ar-EG"
                                  )
                                }

                                {" "}
                                ج.م

                              </small>

                            )}

                          </td>


                          <td>

                            {
                              getCategoryFullName(
                                product.categoryId
                              ) ||
                              "بدون قسم"
                            }

                          </td>


                          <td>

                            {
                              product.active !==
                              false

                                ? (

                                  <span className="status-active">
                                    ✅ مفعل
                                  </span>

                                )

                                : (

                                  <span className="status-inactive">
                                    ⛔ غير مفعل
                                  </span>

                                )
                            }

                          </td>


                          <td>

                            <div
                              className="table-actions"
                            >

                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  handleEdit(
                                    product
                                  )
                                }
                              >
                                ✏️ تعديل
                              </button>


                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                  handleDeleteProduct(
                                    product
                                  )
                                }
                              >
                                🗑️ حذف
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


// ==========================================================
// CATEGORIES
// ==========================================================

        {tab === "categories" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  📂 إدارة الأقسام
                </h2>

                <p>
                  إجمالي الأقسام:
                  {" "}
                  <strong>
                    {categories.length}
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="save-btn"
                onClick={() => {

                  setEditingCategory(null);

                  setCategoryForm({
                    name: "",
                    description: "",
                    image: "",
                    categoryNumber: "",
                    whatsapp: "",
                    parentId: "",
                    active: true,
                  });

                  setShowCategoryForm(true);
                  setTab("categories");
                }}
              >
                ➕ إضافة قسم
              </button>

            </div>


            <div
              className="accounts-search"
            >

              <input
                type="search"
                placeholder="🔎 ابحث عن قسم..."
                value={
                  categorySearch
                }
                onChange={(event) =>
                  setCategorySearch(
                    event.target.value
                  )
                }
              />


              {categorySearch && (

                <button
                  type="button"
                  onClick={() =>
                    setCategorySearch("")
                  }
                >
                  ✕
                </button>

              )}

            </div>


            {showCategoryForm && (

              <form
                className="admin-form"
                onSubmit={
                  handleCategorySubmit
                }
              >

                <h3>

                  {
                    editingCategory
                      ? "✏️ تعديل القسم"
                      : "➕ إضافة قسم جديد"
                  }

                </h3>


                <div
                  className="form-grid"
                >

                  <label>

                    <span>
                      اسم القسم
                    </span>

                    <input
                      name="name"
                      value={
                        categoryForm.name
                      }
                      onChange={
                        handleCategoryChange
                      }
                      required
                    />

                  </label>


                  <label>

                    <span>
                      رقم القسم
                    </span>

                    <input
                      name="categoryNumber"
                      value={
                        categoryForm.categoryNumber
                      }
                      onChange={
                        handleCategoryChange
                      }
                    />

                  </label>


                  <label>

                    <span>
                      رقم واتساب القسم
                    </span>

                    <input
                      name="whatsapp"
                      value={
                        categoryForm.whatsapp
                      }
                      onChange={
                        handleCategoryChange
                      }
                      dir="ltr"
                    />

                  </label>


                  <label>

                    <span>
                      القسم الأب
                    </span>


                    <select
                      name="parentId"
                      value={
                        categoryForm.parentId
                      }
                      onChange={
                        handleCategoryChange
                      }
                    >

                      <option value="">
                        قسم رئيسي
                      </option>


                      {categories
                        .filter(
                          (category) =>
                            category.id !==
                            editingCategory?.id
                        )
                        .map(
                          (category) => (

                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                            >

                              {
                                getCategoryFullName(
                                  category.id
                                )
                              }

                            </option>

                          )
                        )}

                    </select>

                  </label>


                  <label>

                    <span>
                      رابط الصورة
                    </span>

                    <input
                      name="image"
                      value={
                        categoryForm.image
                      }
                      onChange={
                        handleCategoryChange
                      }
                      dir="ltr"
                    />

                  </label>


                  <label
                    className="form-group-full"
                  >

                    <span>
                      وصف القسم
                    </span>

                    <textarea
                      name="description"
                      rows="3"
                      value={
                        categoryForm.description
                      }
                      onChange={
                        handleCategoryChange
                      }
                    />

                  </label>

                </div>


                <div
                  className="admin-checkboxes"
                >

                  <label>

                    <input
                      type="checkbox"
                      name="active"
                      checked={
                        categoryForm.active
                      }
                      onChange={
                        handleCategoryChange
                      }
                    />

                    ✅ القسم نشط

                  </label>

                </div>


                <div
                  className="form-actions"
                >

                  <button
                    type="submit"
                    className="save-btn"
                    disabled={
                      actionLoading
                    }
                  >
                    {
                      actionLoading
                        ? "⏳ جاري الحفظ..."
                        : "💾 حفظ القسم"
                    }
                  </button>


                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      resetCategoryForm
                    }
                  >
                    إلغاء
                  </button>

                </div>

              </form>
            )}


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>

                  <tr>
                    <th>الصورة</th>
                    <th>القسم</th>
                    <th>الرقم</th>
                    <th>القسم الأب</th>
                    <th>واتساب</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>

                </thead>


                <tbody>

                  {filteredCategories.length ===
                    0 ? (

                    <tr>

                      <td colSpan="7">
                        لا توجد أقسام.
                      </td>

                    </tr>

                  ) : (

                    filteredCategories.map(
                      (category) => (

                        <tr
                          key={
                            category.id
                          }
                        >

                          <td>

                            {category.image ? (

                              <img
                                src={
                                  category.image
                                }
                                className="table-img"
                                alt={
                                  category.name
                                }
                              />

                            ) : (

                              <div className="table-img-placeholder">
                                📂
                              </div>

                            )}

                          </td>


                          <td>

                            <strong>

                              {
                                category.parentId
                                  ? "↳ "
                                  : "📂 "
                              }

                              {
                                category.name
                              }

                            </strong>

                          </td>


                          <td>

                            {
                              category.categoryNumber ||
                              "—"
                            }

                          </td>


                          <td>

                            {
                              categoryMap[
                                category.parentId
                              ]?.name ||
                              "قسم رئيسي"
                            }

                          </td>


                          <td dir="ltr">

                            {
                              category.whatsapp ||
                              "—"
                            }

                          </td>


                          <td>

                            {
                              category.active !==
                              false

                                ? "🟢 نشط"

                                : "🔴 متوقف"
                            }

                          </td>


                          <td>

                            <div
                              className="table-actions"
                            >

                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  handleEditCategory(
                                    category
                                  )
                                }
                              >
                                ✏️ تعديل
                              </button>


                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                  handleDeleteCategory(
                                    category
                                  )
                                }
                              >
                                🗑️ حذف
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>


            {categories.length >
              0 && (

              <div
                className="category-tree"
              >

                {
                  renderCategoryTree(
                    categories.filter(
                      (category) =>
                        !category.parentId
                    )
                  )
                }

              </div>

            )}

          </div>

        )}
                {/* ====================================================
            ORDERS
        ==================================================== */}

        {tab === "orders" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🛒 إدارة الطلبات
                </h2>

                <p>
                  إجمالي الطلبات:
                  {" "}
                  <strong>
                    {orders.length}
                  </strong>
                </p>

              </div>

            </div>


            <div
              className="orders-toolbar"
            >

              <input
                type="search"
                placeholder="🔎 ابحث برقم الطلب أو اسم العميل أو الهاتف..."
                value={
                  orderSearch
                }
                onChange={(event) =>
                  setOrderSearch(
                    event.target.value
                  )
                }
              />


              <select
                value={
                  orderStatusFilter
                }
                onChange={(event) =>
                  setOrderStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  كل الحالات
                </option>

                <option value="pending">
                  قيد الانتظار
                </option>

                <option value="confirmed">
                  تم التأكيد
                </option>

                <option value="processing">
                  جاري التجهيز
                </option>

                <option value="shipped">
                  تم الشحن
                </option>

                <option value="delivered">
                  تم التسليم
                </option>

                <option value="completed">
                  مكتمل
                </option>

                <option value="cancelled">
                  ملغي
                </option>

              </select>

            </div>


            <div
              className="orders-summary"
            >

              <div>
                <span>
                  كل الطلبات
                </span>

                <strong>
                  {orders.length}
                </strong>
              </div>


              <div>
                <span>
                  قيد الانتظار
                </span>

                <strong>
                  {pendingOrders}
                </strong>
              </div>


              <div>
                <span>
                  قيد التجهيز
                </span>

                <strong>
                  {
                    orders.filter(
                      (order) =>
                        normalizeText(
                          order.status ||
                          order.orderStatus
                        ) ===
                        "processing"
                    ).length
                  }
                </strong>
              </div>


              <div>
                <span>
                  تم التسليم
                </span>

                <strong>
                  {deliveredOrders}
                </strong>
              </div>

            </div>


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>

                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>الهاتف</th>
                    <th>التاريخ</th>
                    <th>الدفع</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>

                </thead>


                <tbody>

                  {filteredOrders.length ===
                    0 ? (

                    <tr>

                      <td colSpan="8">
                        لا توجد طلبات.
                      </td>

                    </tr>

                  ) : (

                    filteredOrders.map(
                      (order) => {

                        const status =
                          order?.status ||
                          order?.orderStatus ||
                          "pending";

                        const paymentStatus =
                          order?.paymentStatus ||
                          "pending";

                        return (

                          <tr
                            key={
                              order.id
                            }
                          >

                            <td dir="ltr">

                              #
                              {
                                order.orderNumber ||
                                order.id?.slice(
                                  0,
                                  8
                                ) ||
                                "—"
                              }

                            </td>


                            <td>

                              <strong>
                                {
                                  order?.customerName ||
                                  order?.name ||
                                  "عميل"
                                }
                              </strong>

                              <small
                                style={{
                                  display:
                                    "block",
                                }}
                              >
                                {
                                  order?.email ||
                                  ""
                                }
                              </small>

                            </td>


                            <td dir="ltr">

                              {
                                order?.phone ||
                                order?.customerPhone ||
                                "—"
                              }

                            </td>


                            <td>
                              {
                                formatDate(
                                  order?.createdAt
                                )
                              }
                            </td>


                            <td>

                              <div>

                                {
                                  getPaymentMethodText(
                                    order?.paymentMethod
                                  )
                                }

                                <small
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >

                                  {
                                    getPaymentStatusText(
                                      paymentStatus
                                    )
                                  }

                                </small>

                              </div>

                            </td>


                            <td>

                              <strong>

                                {
                                  Number(
                                    order?.total ||
                                    order?.grandTotal ||
                                    order?.amount ||
                                    0
                                  ).toLocaleString(
                                    "ar-EG"
                                  )
                                }

                                {" "}
                                ج.م

                              </strong>

                            </td>


                            <td>

                              <select
                                value={
                                  status
                                }
                                onChange={(event) =>
                                  handleOrderStatusChange(
                                    order.id,
                                    event.target.value
                                  )
                                }
                              >

                                <option value="pending">
                                  قيد الانتظار
                                </option>

                                <option value="confirmed">
                                  تم التأكيد
                                </option>

                                <option value="processing">
                                  جاري التجهيز
                                </option>

                                <option value="shipped">
                                  تم الشحن
                                </option>

                                <option value="delivered">
                                  تم التسليم
                                </option>

                                <option value="completed">
                                  مكتمل
                                </option>

                                <option value="cancelled">
                                  ملغي
                                </option>

                              </select>

                            </td>


                            <td>

                              <div
                                className="table-actions"
                              >

                                <button
                                  type="button"
                                  className="edit-btn"
                                  onClick={() =>
                                    openOrderDetails(
                                      order
                                    )
                                  }
                                >
                                  👁️ التفاصيل
                                </button>


                                <button
                                  type="button"
                                  className="delete-btn"
                                  onClick={() =>
                                    deleteOrder(
                                      order
                                    )
                                  }
                                >
                                  🗑️ حذف
                                </button>

                              </div>

                            </td>

                          </tr>

                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* ====================================================
            ORDER DETAILS
        ==================================================== */}

        {showOrderDetails &&
          selectedOrder && (

          <div
            className="order-details-overlay"
            onClick={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeOrderDetails();
              }

            }}
          >

            <div
              className="order-details-modal"
            >

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeOrderDetails
                }
              >
                ✕
              </button>


              <h2>
                🧾 تفاصيل الطلب
              </h2>


              <div
                className="order-detail-grid"
              >

                <div>
                  <span>
                    رقم الطلب
                  </span>

                  <strong dir="ltr">
                    {
                      selectedOrder.orderNumber ||
                      selectedOrder.id ||
                      "—"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    اسم العميل
                  </span>

                  <strong>
                    {
                      selectedOrder.customerName ||
                      selectedOrder.name ||
                      "—"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    الهاتف
                  </span>

                  <strong dir="ltr">
                    {
                      selectedOrder.phone ||
                      selectedOrder.customerPhone ||
                      "—"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    العنوان
                  </span>

                  <strong>
                    {
                      typeof selectedOrder.address ===
                      "object"

                        ? getUserAddress({
                            address:
                              selectedOrder.address,
                          })

                        : selectedOrder.address ||
                          selectedOrder.customerAddress ||
                          "—"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    التاريخ
                  </span>

                  <strong>
                    {
                      formatDate(
                        selectedOrder.createdAt
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    طريقة الدفع
                  </span>

                  <strong>
                    {
                      getPaymentMethodText(
                        selectedOrder.paymentMethod
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    حالة الطلب
                  </span>

                  <strong>
                    {
                      getOrderStatusText(
                        selectedOrder.status ||
                        selectedOrder.orderStatus ||
                        "pending"
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    حالة الدفع
                  </span>

                  <strong
                    className={getPaymentStatusClass(
                      selectedOrder.paymentStatus ||
                      "pending"
                    )}
                  >
                    {
                      getPaymentStatusText(
                        selectedOrder.paymentStatus ||
                        "pending"
                      )
                    }
                  </strong>
                </div>

              </div>


              <div
                className="order-products-details"
              >

                <h3>
                  📦 المنتجات
                </h3>


                {Array.isArray(
                  selectedOrder.products
                ) &&
                selectedOrder.products.length ? (

                  selectedOrder.products.map(
                    (item, index) => (

                      <div
                        className="order-product-row"
                        key={index}
                      >

                        <span>
                          {
                            item?.title ||
                            item?.name ||
                            item?.productName ||
                            "منتج"
                          }
                        </span>

                        <span>
                          ×{" "}
                          {
                            Number(
                              item?.quantity ||
                              item?.qty ||
                              1
                            )
                          }
                        </span>

                        <strong>
                          {
                            Number(
                              item?.price ||
                              0
                            ).toLocaleString(
                              "ar-EG"
                            )
                          }
                          {" "}
                          ج.م
                        </strong>

                      </div>

                    )
                  )

                ) : (

                  <p>
                    لا توجد منتجات مسجلة.
                  </p>

                )}

              </div>


              <div
                className="order-total-box"
              >

                <span>
                  الإجمالي
                </span>

                <strong>
                  {
                    Number(
                      selectedOrder.total ||
                      selectedOrder.grandTotal ||
                      selectedOrder.amount ||
                      0
                    ).toLocaleString(
                      "ar-EG"
                    )
                  }
                  {" "}
                  ج.م
                </strong>

              </div>

            </div>

          </div>
        )}


        {/* ====================================================
            USERS
        ==================================================== */}

        {tab === "users" && (

          <div
            className="table-container accounts-container"
          >

            <div
              className="accounts-header"
            >

              <div>

                <h2>
                  👥 حسابات العملاء
                </h2>

                <p>
                  إجمالي الحسابات:
                  {" "}
                  <strong>
                    {users.length}
                  </strong>
                </p>

              </div>

            </div>


            {!showUserDetails && (

              <div
                className="accounts-search"
              >

                <input
                  type="search"
                  placeholder="🔎 ابحث بالاسم أو البريد أو الهاتف..."
                  value={
                    userSearch
                  }
                  onChange={(event) =>
                    setUserSearch(
                      event.target.value
                    )
                  }
                />


                {userSearch && (

                  <button
                    type="button"
                    onClick={() =>
                      setUserSearch("")
                    }
                  >
                    ✕
                  </button>

                )}

              </div>

            )}


            {!showUserDetails && (

              <div
                className="accounts-list"
              >

                {sortedUsers.length ===
                  0 ? (

                  <div
                    className="empty-state"
                  >

                    <div>
                      👥
                    </div>

                    <h3>
                      {
                        userSearch
                          ? "لا توجد نتائج"
                          : "لا يوجد حسابات"
                      }
                    </h3>

                    <p>
                      {
                        userSearch
                          ? "لم يتم العثور على حساب مطابق للبحث."
                          : "لم يتم تسجيل أي حسابات حتى الآن."
                      }
                    </p>

                  </div>

                ) : (

                  sortedUsers.map(
                    (user) => {

                      const userOrders =
                        getOrdersForUser(
                          user.id
                        );

                      const totalPurchases =
                        getUserTotalPurchases(
                          user.id
                        );

                      return (

                        <button
                          type="button"
                          className="account-list-item"
                          key={
                            user.id
                          }

                          onClick={() =>
                            openUserDetails(
                              user
                            )
                          }
                        >

                          <div
                            className="account-avatar"
                          >
                            👤
                          </div>


                          <div
                            className="account-list-info"
                          >

                            <h3>
                              {
                                getUserName(
                                  user
                                )
                              }
                            </h3>

                            <p>
                              {
                                getUserEmail(
                                  user
                                )
                              }
                            </p>

                            <small>
                              📱{" "}
                              {
                                getUserPhone(
                                  user
                                )
                              }
                            </small>

                          </div>


                          <div
                            className="account-list-meta"
                          >

                            <span>
                              📦{" "}
                              {
                                userOrders.length
                              }{" "}
                              طلب
                            </span>

                            <span>
                              💰{" "}
                              {
                                totalPurchases.toLocaleString(
                                  "ar-EG"
                                )
                              }{" "}
                              ج.م
                            </span>

                            <span>
                              🔐{" "}
                              {
                                getLoginCount(
                                  user
                                )
                              }{" "}
                              دخول
                            </span>

                          </div>


                          <div
                            className="account-arrow"
                          >
                            ←
                          </div>

                        </button>

                      );
                    }
                  )

                )}

              </div>

            )}


            {showUserDetails &&
              selectedUser && (

              <div
                className="account-details"
              >

                <button
                  type="button"
                  className="account-back-button"
                  onClick={
                    closeUserDetails
                  }
                >
                  → رجوع للحسابات
                </button>


                <div
                  className="account-profile-card"
                >

                  <div
                    className="account-profile-avatar"
                  >
                    👤
                  </div>


                  <div>

                    <h2>
                      {
                        getUserName(
                          selectedUser
                        )
                      }
                    </h2>

                    <p>
                      {
                        getUserEmail(
                          selectedUser
                        )
                      }
                    </p>

                    <span>
                      👤 الدور:
                      {" "}
                      <strong>
                        {
                          getUserRole(
                            selectedUser
                          )
                        }
                      </strong>
                    </span>

                  </div>

                </div>


                <div
                  className="account-info-card"
                >

                  <h3>
                    👤 البيانات الشخصية
                  </h3>


                  <div
                    className="account-info-grid"
                  >

                    <div>
                      <span>الاسم</span>

                      <strong>
                        {
                          getUserName(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        البريد الإلكتروني
                      </span>

                      <strong dir="ltr">
                        {
                          getUserEmail(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        رقم الهاتف
                      </span>

                      <strong dir="ltr">
                        {
                          getUserPhone(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        العنوان
                      </span>

                      <strong>
                        {
                          getUserAddress(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        تاريخ التسجيل
                      </span>

                      <strong>
                        {
                          formatDate(
                            selectedUser.createdAt ||
                            selectedUser.registeredAt ||
                            selectedUser.createdDate
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        آخر دخول
                      </span>

                      <strong>
                        {
                          formatDate(
                            selectedUser.lastLoginAt ||
                            selectedUser.lastLogin
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        عدد مرات الدخول
                      </span>

                      <strong>
                        {
                          getLoginCount(
                            selectedUser
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        عدد الطلبات
                      </span>

                      <strong>
                        {
                          selectedUserOrders.length
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        إجمالي المشتريات
                      </span>

                      <strong>
                        {
                          getUserTotalPurchases(
                            selectedUser.id
                          ).toLocaleString(
                            "ar-EG"
                          )
                        }{" "}
                        ج.م
                      </strong>
                    </div>


                    <div>
                      <span>
                        Firebase UID
                      </span>

                      <strong
                        dir="ltr"
                        title={
                          selectedUser.uid ||
                          selectedUser.id
                        }
                      >
                        {
                          selectedUser.uid ||
                          selectedUser.id
                        }
                      </strong>
                    </div>

                  </div>

                </div>


                <div
                  className="account-info-card"
                >

                  <h3>
                    🕐 سجل الزيارات والدخول
                  </h3>


                  {getVisits(
                    selectedUser
                  ).length === 0 ? (

                    <div
                      className="account-empty-history"
                    >
                      لا يوجد سجل زيارات مسجل لهذا الحساب.
                    </div>

                  ) : (

                    <div
                      className="account-visits-list"
                    >

                      {
                        [
                          ...getVisits(
                            selectedUser
                          ),
                        ]
                          .reverse()
                          .map(
                            (
                              visit,
                              index
                            ) => {

                              const visitDate =
                                visit?.date ||
                                visit?.visitedAt ||
                                visit?.loginAt ||
                                visit;

                              const visitType =
                                visit?.type ||
                                "";

                              const visitTypeText =
                                visitType ===
                                "register"
                                  ? "🆕 إنشاء الحساب"
                                  : visitType ===
                                    "login"
                                  ? "🔐 تسجيل دخول"
                                  : "👁️ زيارة";


                              return (

                                <div
                                  className="account-visit-item"
                                  key={`${visitDate}-${index}`}
                                >

                                  <span
                                    className="visit-icon"
                                  >
                                    🕐
                                  </span>

                                  <div>

                                    <strong>
                                      {
                                        formatDate(
                                          visitDate
                                        )
                                      }
                                    </strong>

                                    <small>
                                      {
                                        visitTypeText
                                      }
                                    </small>

                                  </div>

                                </div>

                              );
                            }
                          )
                      }

                    </div>

                  )}

                </div>


                <div
                  className="account-info-card"
                >

                  <h3>
                    🧾 طلبات العميل
                  </h3>


                  {selectedUserOrders.length ===
                    0 ? (

                    <div
                      className="account-empty-history"
                    >
                      هذا العميل لم يقم بعمل طلبات حتى الآن.
                    </div>

                  ) : (

                    <div
                      className="user-orders-list"
                    >

                      {
                        selectedUserOrders.map(
                          (order) => {

                            const paymentStatus =
                              order?.paymentStatus ||
                              "pending";

                            const transactionId =
                              order?.transactionId ||
                              order?.transaction_id ||
                              order?.transactionID ||
                              order?.paymentId ||
                              "";

                            const orderStatus =
                              order?.status ||
                              order?.orderStatus ||
                              "pending";

                            const productsList =
                              Array.isArray(
                                order?.products
                              )
                                ? order.products
                                : [];


                            return (

                              <div
                                className="user-order-card"
                                key={
                                  order.id
                                }
                              >

                                <div
                                  className="user-order-header"
                                >

                                  <strong>

                                    طلب #
                                    {
                                      order.orderNumber ||
                                      order.id?.slice(
                                        0,
                                        8
                                      ) ||
                                      "غير معروف"
                                    }

                                  </strong>

                                  <span>
                                    {
                                      formatDate(
                                        order?.createdAt
                                      )
                                    }
                                  </span>

                                </div>


                                <div
                                  className="user-order-products"
                                >

                                  {productsList.length ===
                                    0 ? (

                                    <div>
                                      لا توجد منتجات مسجلة
                                    </div>

                                  ) : (

                                    productsList.map(
                                      (
                                        item,
                                        index
                                      ) => (

                                        <div
                                          key={`${order.id}-product-${index}`}
                                        >

                                          <span>
                                            {
                                              item?.title ||
                                              item?.name ||
                                              item?.productName ||
                                              "منتج"
                                            }
                                          </span>

                                          <span>
                                            ×{" "}
                                            {
                                              Number(
                                                item?.quantity ||
                                                item?.qty ||
                                                1
                                              )
                                            }
                                          </span>

                                        </div>

                                      )
                                    )

                                  )}

                                </div>


                                <div
                                  className="user-order-payment"
                                >

                                  <div>

                                    <span>
                                      طريقة الدفع
                                    </span>

                                    <strong>
                                      {
                                        getPaymentMethodText(
                                          order?.paymentMethod
                                        )
                                      }
                                    </strong>

                                  </div>


                                  <div>

                                    <span>
                                      حالة الدفع
                                    </span>

                                    <strong
                                      className={getPaymentStatusClass(
                                        paymentStatus
                                      )}
                                    >
                                      {
                                        getPaymentStatusText(
                                          paymentStatus
                                        )
                                      }
                                    </strong>

                                  </div>


                                  {transactionId && (

                                    <div>

                                      <span>
                                        رقم العملية
                                      </span>

                                      <strong dir="ltr">
                                        {
                                          transactionId
                                        }
                                      </strong>

                                    </div>

                                  )}

                                </div>


                                <div
                                  className="user-order-footer"
                                >

                                  <strong>

                                    الإجمالي:
                                    {" "}

                                    {
                                      Number(
                                        order?.total ||
                                        order?.grandTotal ||
                                        order?.amount ||
                                        0
                                      ).toLocaleString(
                                        "ar-EG"
                                      )
                                    }{" "}
                                    ج.م

                                  </strong>


                                  <span
                                    className={`order-status status-${orderStatus}`}
                                  >
                                    {
                                      getOrderStatusText(
                                        orderStatus
                                      )
                                    }
                                  </span>

                                </div>

                              </div>

                            );
                          }
                        )
                      }

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>

        )}


        {/* ====================================================
            OFFERS
        ==================================================== */}

        {tab === "offers" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  ⭐ إدارة العروض
                </h2>

                <p>
                  المنتجات الموجودة حاليًا في العروض:
                  {" "}
                  <strong>
                    {
                      offerProducts.length
                    }
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="add-btn"
                onClick={
                  handleAddProduct
                }
              >
                ➕ إضافة منتج للعرض
              </button>

            </div>


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>السعر القديم</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>


                <tbody>

                  {offerProducts.length ===
                    0 ? (

                    <tr>
                      <td colSpan="6">
                        لا توجد منتجات عروض حاليًا
                      </td>
                    </tr>

                  ) : (

                    offerProducts.map(
                      (product) => (

                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>

                            {product.image ? (

                              <img
                                src={
                                  product.image
                                }
                                className="table-img"
                                alt={
                                  product.title ||
                                  "منتج"
                                }
                              />

                            ) : (
                              "📦"
                            )}

                          </td>


                          <td>
                            {
                              product.title ||
                              "بدون اسم"
                            }
                          </td>


                          <td>
                            {
                              Number(
                                product.price ||
                                0
                              ).toLocaleString(
                                "ar-EG"
                              )
                            }{" "}
                            ج.م
                          </td>


                          <td>
                            {
                              product.oldPrice
                                ? Number(
                                    product.oldPrice
                                  ).toLocaleString(
                                    "ar-EG"
                                  ) +
                                  " ج.م"
                                : "—"
                            }
                          </td>


                          <td>
                            🔥 عرض
                          </td>


                          <td>

                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                handleEdit(
                                  product
                                )
                              }
                            >
                              ✏️ تعديل
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* ====================================================
            BEST SELLERS
        ==================================================== */}

        {tab === "bestsellers" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🔥 الأكثر مبيعًا
                </h2>

                <p>
                  عدد المنتجات:
                  {" "}
                  <strong>
                    {
                      bestSellerProducts.length
                    }
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="add-btn"
                onClick={
                  handleAddProduct
                }
              >
                ➕ إضافة منتج
              </button>

            </div>


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>القسم</th>
                    <th>إجراء</th>
                  </tr>
                </thead>


                <tbody>

                  {bestSellerProducts.length ===
                    0 ? (

                    <tr>
                      <td colSpan="5">
                        لا توجد منتجات محددة كالأكثر مبيعًا
                      </td>
                    </tr>

                  ) : (

                    bestSellerProducts.map(
                      (product) => (

                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>

                            {product.image ? (

                              <img
                                src={
                                  product.image
                                }
                                className="table-img"
                                alt={
                                  product.title ||
                                  "منتج"
                                }
                              />

                            ) : (
                              "📦"
                            )}

                          </td>


                          <td>
                            {
                              product.title ||
                              "بدون اسم"
                            }
                          </td>


                          <td>
                            {
                              Number(
                                product.price ||
                                0
                              ).toLocaleString(
                                "ar-EG"
                              )
                            }{" "}
                            ج.م
                          </td>


                          <td>
                            {
                              getCategoryFullName(
                                product.categoryId
                              ) ||
                              "بدون قسم"
                            }
                          </td>


                          <td>

                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                handleEdit(
                                  product
                                )
                              }
                            >
                              ✏️ تعديل
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* ====================================================
            NEW ARRIVALS
        ==================================================== */}

        {tab === "new-arrivals" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🆕 المنتجات الجديدة
                </h2>

                <p>
                  عدد المنتجات:
                  {" "}
                  <strong>
                    {
                      newArrivalProducts.length
                    }
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="add-btn"
                onClick={
                  handleAddProduct
                }
              >
                ➕ إضافة منتج
              </button>

            </div>


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>القسم</th>
                    <th>إجراء</th>
                  </tr>
                </thead>


                <tbody>

                  {newArrivalProducts.length ===
                    0 ? (

                    <tr>
                      <td colSpan="5">
                        لا توجد منتجات محددة كمنتجات جديدة
                      </td>
                    </tr>

                  ) : (

                    newArrivalProducts.map(
                      (product) => (

                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>

                            {product.image ? (

                              <img
                                src={
                                  product.image
                                }
                                className="table-img"
                                alt={
                                  product.title ||
                                  "منتج"
                                }
                              />

                            ) : (
                              "📦"
                            )}

                          </td>


                          <td>
                            {
                              product.title ||
                              "بدون اسم"
                            }
                          </td>


                          <td>
                            {
                              Number(
                                product.price ||
                                0
                              ).toLocaleString(
                                "ar-EG"
                              )
                            }{" "}
                            ج.م
                          </td>


                          <td>
                            {
                              getCategoryFullName(
                                product.categoryId
                              ) ||
                              "بدون قسم"
                            }
                          </td>


                          <td>

                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                handleEdit(
                                  product
                                )
                              }
                            >
                              ✏️ تعديل
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* ====================================================
            REPORTS
        ==================================================== */}

        {tab === "reports" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  📈 الإحصائيات والتقارير
                </h2>

                <p>
                  ملخص شامل لحالة المتجر والمبيعات والعملاء.
                </p>

              </div>

            </div>


            <div
              className="admin-stats"
            >

              <div className="stat-card">
                <h3>
                  👥 العملاء
                </h3>
                <p>
                  {users.length}
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  📦 المنتجات
                </h3>
                <p>
                  {products.length}
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  📂 الأقسام
                </h3>
                <p>
                  {categories.length}
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  🛒 الطلبات
                </h3>
                <p>
                  {orders.length}
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  💰 المبيعات
                </h3>
                <p>
                  {
                    totalSales.toLocaleString(
                      "ar-EG"
                    )
                  }{" "}
                  ج.م
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  💳 المدفوع إلكترونيًا
                </h3>
                <p>
                  {
                    paidSales.toLocaleString(
                      "ar-EG"
                    )
                  }{" "}
                  ج.م
                </p>
              </div>

            </div>


            <div
              className="orders-summary"
            >

              <div>
                <span>
                  العروض
                </span>

                <strong>
                  {
                    offerProducts.length
                  }
                </strong>
              </div>


              <div>
                <span>
                  الأكثر مبيعًا
                </span>

                <strong>
                  {
                    bestSellerProducts.length
                  }
                </strong>
              </div>


              <div>
                <span>
                  المنتجات الجديدة
                </span>

                <strong>
                  {
                    newArrivalProducts.length
                  }
                </strong>
              </div>


              <div>
                <span>
                  المقترحة
                </span>

                <strong>
                  {
                    recommendedProducts.length
                  }
                </strong>
              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            SALES
        ==================================================== */}

        {tab === "sales" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  💰 المبيعات
                </h2>

                <p>
                  متابعة إجمالي المبيعات والمدفوعات.
                </p>

              </div>

            </div>


            <div
              className="payment-summary"
            >

              <div>
                <span>
                  إجمالي المبيعات
                </span>

                <strong>
                  {
                    totalSales.toLocaleString(
                      "ar-EG"
                    )
                  }{" "}
                  ج.م
                </strong>
              </div>


              <div>
                <span>
                  المبيعات المدفوعة إلكترونيًا
                </span>

                <strong>
                  {
                    paidSales.toLocaleString(
                      "ar-EG"
                    )
                  }{" "}
                  ج.م
                </strong>
              </div>


              <div>
                <span>
                  المبيعات غير المدفوعة إلكترونيًا
                </span>

                <strong>
                  {
                    Math.max(
                      totalSales -
                      paidSales,
                      0
                    ).toLocaleString(
                      "ar-EG"
                    )
                  }{" "}
                  ج.م
                </strong>
              </div>


              <div>
                <span>
                  متوسط الطلب
                </span>

                <strong>

                  {
                    orders.length
                      ? (
                          totalSales /
                          orders.length
                        ).toLocaleString(
                          "ar-EG",
                          {
                            maximumFractionDigits:
                              2,
                          }
                        )
                      : "0"
                  }

                  {" "}
                  ج.م

                </strong>

              </div>

            </div>


            <div
              className="table-scroll"
            >

              <table
                className="admin-table"
              >

                <thead>

                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>طريقة الدفع</th>
                    <th>حالة الدفع</th>
                    <th>الحالة</th>
                    <th>الإجمالي</th>
                  </tr>

                </thead>


                <tbody>

                  {orders.length ===
                    0 ? (

                    <tr>

                      <td colSpan="7">
                        لا توجد مبيعات حتى الآن
                      </td>

                    </tr>

                  ) : (

                    orders.map(
                      (order) => {

                        const orderStatus =
                          order.status ||
                          order.orderStatus ||
                          "pending";

                        const paymentStatus =
                          order.paymentStatus ||
                          "pending";

                        return (

                          <tr
                            key={
                              order.id
                            }
                          >

                            <td dir="ltr">
                              #
                              {
                                order.orderNumber ||
                                order.id?.slice(
                                  0,
                                  8
                                ) ||
                                "—"
                              }
                            </td>


                            <td>
                              {
                                order.customerName ||
                                order.name ||
                                "عميل"
                              }
                            </td>


                            <td>
                              {
                                formatDate(
                                  order.createdAt
                                )
                              }
                            </td>


                            <td>
                              {
                                getPaymentMethodText(
                                  order.paymentMethod
                                )
                              }
                            </td>


                            <td>

                              <span
                                className={getPaymentStatusClass(
                                  paymentStatus
                                )}
                              >
                                {
                                  getPaymentStatusText(
                                    paymentStatus
                                  )
                                }
                              </span>

                            </td>


                            <td>

                              <span
                                className={`order-status status-${orderStatus}`}
                              >
                                {
                                  getOrderStatusText(
                                    orderStatus
                                  )
                                }
                              </span>

                            </td>


                            <td>

                              <strong>
                                {
                                  Number(
                                    order.total ||
                                    order.grandTotal ||
                                    order.amount ||
                                    0
                                  ).toLocaleString(
                                    "ar-EG"
                                  )
                                }{" "}
                                ج.م
                              </strong>

                            </td>

                          </tr>

                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* ====================================================
            CUSTOMERS
        ==================================================== */}

        {tab === "customers" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🧑‍💼 عملاء المتجر
                </h2>

                <p>
                  إدارة ملفات العملاء والطلبات الخاصة بهم.
                </p>

              </div>

            </div>


            <div
              className="admin-stats"
            >

              <div className="stat-card">
                <h3>
                  👥 إجمالي العملاء
                </h3>
                <p>
                  {users.length}
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  🛒 إجمالي الطلبات
                </h3>
                <p>
                  {orders.length}
                </p>
              </div>


              <div className="stat-card">
                <h3>
                  💰 إجمالي المشتريات
                </h3>
                <p>
                  {
                    totalSales.toLocaleString(
                      "ar-EG"
                    )
                  }{" "}
                  ج.م
                </p>
              </div>

            </div>


            <button
              type="button"
              className="save-btn"
              onClick={() =>
                setTab("users")
              }
            >
              👥 فتح إدارة المستخدمين
            </button>

          </div>

        )}


        {/* ====================================================
            BANNERS
        ==================================================== */}

        {tab === "banners" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🖼️ إدارة البانرات
                </h2>

                <p>
                  إدارة صور البانرات والإعلانات الرئيسية للمتجر.
                </p>

              </div>


              <button
                type="button"
                className="add-btn"

                onClick={() => {

                  setGenericType(
                    "banners"
                  );

                  setGenericEditingId(
                    null
                  );


                  setGenericForm({

                    title: "",
                    text: "",
                    image: "",
                    imageFile: null,
                    imagePreview: "",

                    link: "/",

                    tag:
                      "🔥 عرض خاص",

                    buttonText:
                      "تسوق الآن",

                    active:
                      true,

                    order:
                      0,

                    fontFamily:
                      "Cairo",

                    textColor:
                      "#ffffff",

                    titleFontSize:
                      42,

                    descriptionFontSize:
                      20,

                    fontWeight:
                      "700",

                    textAlign:
                      "right",

                    textPositionX:
                      "right",

                    textPositionY:
                      "center",

                  });


                  setShowGenericForm(
                    true
                  );

                }}
              >
                ➕ إضافة بانر
              </button>

            </div>


            {showGenericForm &&
              genericType === "banners" && (

              <form
                className="admin-form"
                onSubmit={
                  handleGenericSubmit
                }
              >

                <h3>

                  {
                    genericEditingId
                      ? "✏️ تعديل البانر"
                      : "➕ إضافة بانر جديد"
                  }

                </h3>


                <div
                  className="form-grid"
                >

                  <label>

                    <span>
                      📝 عنوان البانر
                    </span>

                    <input
                      type="text"
                      name="title"
                      value={
                        genericForm.title ||
                        ""
                      }
                      onChange={
                        handleGenericChange
                      }
                      placeholder="مثال: خصومات حتى 50%"
                    />

                  </label>


                  <label>

                    <span>
                      📄 وصف البانر
                    </span>

                    <input
                      type="text"
                      name="text"
                      value={
                        genericForm.text ||
                        ""
                      }
                      onChange={
                        handleGenericChange
                      }
                      placeholder="مثال: أفضل الأسعار على آلاف المنتجات"
                    />

                  </label>


                  <label
                    className="form-group-full"
                  >

                    <span>
                      🖼️ صورة البانر
                    </span>

                    <input
                      type="file"
                      accept="image/*"

                      onChange={(
                        event
                      ) => {

                        const file =
                          event.target.files?.[0];

                        if (!file) {
                          return;
                        }

                        const maxSize =
                          10 *
                          1024 *
                          1024;

                        if (
                          file.size >
                          maxSize
                        ) {

                          alert(
                            "❌ حجم الصورة كبير جدًا. الحد الأقصى 10MB."
                          );

                          event.target.value =
                            "";

                          return;
                        }

                        const preview =
                          URL.createObjectURL(
                            file
                          );

                        setGenericForm(
                          (previous) => ({

                            ...previous,

                            imageFile:
                              file,

                            imagePreview:
                              preview,

                          })
                        );
                      }}
                    />


                    {
                      (
                        genericForm.imagePreview ||
                        genericForm.image
                      ) && (

                        <div
                          style={{
                            marginTop:
                              "15px",
                          }}
                        >

                          <img
                            src={
                              genericForm.imagePreview ||
                              genericForm.image
                            }
                            alt="معاينة البانر"

                            style={{
                              display:
                                "block",

                              width:
                                "100%",

                              maxHeight:
                                "300px",

                              objectFit:
                                "cover",

                              borderRadius:
                                "12px",

                              border:
                                "2px solid #D4AF37",
                            }}
                          />

                        </div>

                      )
                    }

                  </label>


                  <label>

                    <span>
                      🔗 الرابط عند الضغط
                    </span>

                    <input
                      type="text"
                      name="link"
                      dir="ltr"
                      value={
                        genericForm.link ||
                        ""
                      }
                      onChange={
                        handleGenericChange
                      }
                      placeholder="/ أو /category/..."
                    />

                  </label>


                  <label>

                    <span>
                      🏷️ الشارة
                    </span>

                    <input
                      type="text"
                      name="tag"
                      value={
                        genericForm.tag ||
                        ""
                      }
                      onChange={
                        handleGenericChange
                      }
                      placeholder="🔥 عرض خاص"
                    />

                  </label>


                  <label>

                    <span>
                      🔘 نص الزر
                    </span>

                    <input
                      type="text"
                      name="buttonText"
                      value={
                        genericForm.buttonText ||
                        ""
                      }
                      onChange={
                        handleGenericChange
                      }
                      placeholder="تسوق الآن"
                    />

                  </label>


                  <label>

                    <span>
                      🔢 ترتيب البانر
                    </span>

                    <input
                      type="number"
                      name="order"
                      min="0"
                      value={
                        genericForm.order ??
                        0
                      }
                      onChange={
                        handleGenericChange
                      }
                    />

                  </label>


                  <label>

                    <span>
                      ✏️ نوع الخط
                    </span>

                    <select
                      name="fontFamily"
                      value={
                        genericForm.fontFamily ||
                        "Cairo"
                      }
                      onChange={
                        handleGenericChange
                      }
                    >

                      <option value="Cairo">
                        Cairo
                      </option>

                      <option value="Tahoma">
                        Tahoma
                      </option>

                      <option value="Arial">
                        Arial
                      </option>

                      <option value="sans-serif">
                        Sans Serif
                      </option>

                    </select>

                  </label>


                  <label>

                    <span>
                      🎨 لون النص
                    </span>

                    <input
                      type="color"
                      name="textColor"
                      value={
                        genericForm.textColor ||
                        "#ffffff"
                      }
                      onChange={
                        handleGenericChange
                      }

                      style={{
                        width:
                          "100%",

                        height:
                          "48px",

                        padding:
                          "4px",

                        cursor:
                          "pointer",
                      }}
                    />

                  </label>


                  <label>

                    <span>
                      🔠 حجم العنوان
                    </span>

                    <input
                      type="number"
                      name="titleFontSize"
                      min="16"
                      max="100"
                      value={
                        genericForm.titleFontSize ||
                        42
                      }
                      onChange={
                        handleGenericChange
                      }
                    />

                  </label>


                  <label>

                    <span>
                      📝 حجم الوصف
                    </span>

                    <input
                      type="number"
                      name="descriptionFontSize"
                      min="10"
                      max="60"
                      value={
                        genericForm.descriptionFontSize ||
                        20
                      }
                      onChange={
                        handleGenericChange
                      }
                    />

                  </label>


                  <label>

                    <span>
                      ⚖️ وزن الخط
                    </span>

                    <select
                      name="fontWeight"
                      value={
                        genericForm.fontWeight ||
                        "700"
                      }
                      onChange={
                        handleGenericChange
                      }
                    >

                      <option value="400">
                        عادي
                      </option>

                      <option value="500">
                        متوسط
                      </option>

                      <option value="600">
                        شبه عريض
                      </option>

                      <option value="700">
                        عريض
                      </option>

                      <option value="800">
                        عريض جدًا
                      </option>

                      <option value="900">
                        ثقيل
                      </option>

                    </select>

                  </label>


                  <label>

                    <span>
                      ↔️ محاذاة النص
                    </span>

                    <select
                      name="textAlign"
                      value={
                        genericForm.textAlign ||
                        "right"
                      }
                      onChange={
                        handleGenericChange
                      }
                    >

                      <option value="right">
                        يمين
                      </option>

                      <option value="center">
                        منتصف
                      </option>

                      <option value="left">
                        يسار
                      </option>

                    </select>

                  </label>


                  <label>

                    <span>
                      ↕️ موضع النص رأسيًا
                    </span>

                    <select
                      name="textPositionY"
                      value={
                        genericForm.textPositionY ||
                        "center"
                      }
                      onChange={
                        handleGenericChange
                      }
                    >

                      <option value="top">
                        أعلى
                      </option>

                      <option value="center">
                        منتصف
                      </option>

                      <option value="bottom">
                        أسفل
                      </option>

                    </select>

                  </label>


                  <label>

                    <span>
                      ↔️ موضع النص أفقيًا
                    </span>

                    <select
                      name="textPositionX"
                      value={
                        genericForm.textPositionX ||
                        "right"
                      }
                      onChange={
                        handleGenericChange
                      }
                    >

                      <option value="right">
                        يمين
                      </option>

                      <option value="center">
                        منتصف
                      </option>

                      <option value="left">
                        يسار
                      </option>

                    </select>

                  </label>


                  <label>

                    <span>
                      ✅ الحالة
                    </span>

                    <select
                      name="active"
                      value={
                        genericForm.active !==
                        false
                          ? "true"
                          : "false"
                      }

                      onChange={(event) => {

                        setGenericForm(
                          (previous) => ({

                            ...previous,

                            active:
                              event.target.value ===
                              "true",

                          })
                        );

                      }}
                    >

                      <option value="true">
                        مفعل
                      </option>

                      <option value="false">
                        غير مفعل
                      </option>

                    </select>

                  </label>

                </div>


                <div
                  className="form-actions"
                >

                  <button
                    type="submit"
                    className="save-btn"
                    disabled={
                      actionLoading
                    }
                  >

                    {
                      actionLoading
                        ? "⏳ جاري الحفظ..."
                        : "💾 حفظ البانر"
                    }

                  </button>


                  <button
                    type="button"
                    className="cancel-btn"
                    disabled={
                      actionLoading
                    }
                    onClick={
                      closeGenericForm
                    }
                  >
                    إلغاء
                  </button>

                </div>

              </form>

            )}


            {banners.length ===
              0 ? (

              <div
                className="empty-state"
              >

                <div>
                  🖼️
                </div>

                <h3>
                  لا توجد بانرات
                </h3>

                <p>
                  أضف أول بانر للمتجر.
                </p>

              </div>

            ) : (

              <div
                className="table-scroll"
              >

                <table
                  className="admin-table"
                >

                  <thead>

                    <tr>
                      <th>الصورة</th>
                      <th>العنوان</th>
                      <th>الترتيب</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>

                  </thead>


                  <tbody>

                    {
                      banners
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(
                              a.order || 0
                            ) -
                            Number(
                              b.order || 0
                            )
                        )
                        .map(
                          (banner) => (

                            <tr
                              key={
                                banner.id
                              }
                            >

                              <td>

                                {
                                  banner.image ? (

                                    <img
                                      src={
                                        banner.image
                                      }
                                      className="table-img"
                                      alt={
                                        banner.title ||
                                        "بانر"
                                      }
                                    />

                                  ) : (

                                    <div className="table-img-placeholder">
                                      🖼️
                                    </div>

                                  )
                                }

                              </td>


                              <td>

                                <strong>
                                  {
                                    banner.title ||
                                    "بدون عنوان"
                                  }
                                </strong>


                                {banner.text && (

                                  <small
                                    style={{
                                      display:
                                        "block",

                                      marginTop:
                                        "5px",

                                      opacity:
                                        0.7,
                                    }}
                                  >
                                    {
                                      banner.text
                                    }
                                  </small>

                                )}

                              </td>


                              <td>
                                {
                                  banner.order ??
                                  0
                                }
                              </td>


                              <td>

                                {
                                  banner.active !==
                                  false

                                    ? (

                                      <span className="status-active">
                                        🟢 مفعل
                                      </span>

                                    )

                                    : (

                                      <span className="status-inactive">
                                        🔴 متوقف
                                      </span>

                                    )
                                }

                              </td>


                              <td>

                                <div
                                  className="table-actions"
                                >

                                  <button
                                    type="button"
                                    className="edit-btn"

                                    onClick={() => {

                                      setGenericType(
                                        "banners"
                                      );

                                      setGenericEditingId(
                                        banner.id
                                      );


                                      setGenericForm({

                                        title:
                                          banner.title ||
                                          "",

                                        text:
                                          banner.text ||
                                          "",

                                        image:
                                          banner.image ||
                                          "",

                                        imageFile:
                                          null,

                                        imagePreview:
                                          "",

                                        link:
                                          banner.link ||
                                          "/",

                                        tag:
                                          banner.tag ||
                                          "🔥 عرض خاص",

                                        buttonText:
                                          banner.buttonText ||
                                          "تسوق الآن",

                                        active:
                                          banner.active !==
                                          false,

                                        order:
                                          banner.order ??
                                          0,

                                        fontFamily:
                                          banner.fontFamily ||
                                          "Cairo",

                                        textColor:
                                          banner.textColor ||
                                          "#ffffff",

                                        titleFontSize:
                                          banner.titleFontSize ||
                                          42,

                                        descriptionFontSize:
                                          banner.descriptionFontSize ||
                                          20,

                                        fontWeight:
                                          banner.fontWeight ||
                                          "700",

                                        textAlign:
                                          banner.textAlign ||
                                          "right",

                                        textPositionX:
                                          banner.textPositionX ||
                                          "right",

                                        textPositionY:
                                          banner.textPositionY ||
                                          "center",
                                      });


                                      setShowGenericForm(
                                        true
                                      );

                                    }}
                                  >
                                    ✏️ تعديل
                                  </button>


                                  <button
                                    type="button"
                                    className="delete-btn"
                                    onClick={() =>
                                      deleteGenericItem(
                                        "banners",
                                        banner
                                      )
                                    }
                                  >
                                    🗑️ حذف
                                  </button>

                                </div>

                              </td>

                            </tr>

                          )
                        )
                    }

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}


        {/* ====================================================
            GENERIC ADMIN SECTIONS
        ==================================================== */}

        {[
          {
            id: "coupons",
            icon: "🏷️",
            title:
              "الكوبونات والخصومات",
            collectionType:
              "coupons",
            data:
              coupons,
            fields: [
              {
                name: "code",
                label:
                  "كود الخصم",
              },
              {
                name: "type",
                label:
                  "نوع الخصم",
                type:
                  "select",
                options: [
                  [
                    "percentage",
                    "نسبة مئوية",
                  ],
                  [
                    "fixed",
                    "قيمة ثابتة",
                  ],
                ],
              },
              {
                name: "value",
                label:
                  "قيمة الخصم",
                type:
                  "number",
              },
              {
                name: "minOrder",
                label:
                  "الحد الأدنى للطلب",
                type:
                  "number",
              },
              {
                name: "active",
                label:
                  "الكوبون مفعل",
                type:
                  "checkbox",
              },
            ],
          },


          {
            id: "announcements",
            icon: "📢",
            title:
              "الإعلانات",
            collectionType:
              "announcements",
            data:
              announcements,
            fields: [
              {
                name: "title",
                label:
                  "العنوان",
              },
              {
                name: "text",
                label:
                  "نص الإعلان",
                type:
                  "textarea",
              },
              {
                name: "active",
                label:
                  "الإعلان مفعل",
                type:
                  "checkbox",
              },
            ],
          },


          {
            id: "support",
            icon: "💬",
            title:
              "خدمة العملاء",
            collectionType:
              "support",
            data:
              supportMessages,
            readOnly:
              true,
          },


          {
            id: "notifications",
            icon: "🔔",
            title:
              "الإشعارات",
            collectionType:
              "notifications",
            data:
              notifications,
            readOnly:
              true,
          },


          {
            id: "favorites",
            icon: "❤️",
            title:
              "المفضلة",
            collectionType:
              "favorites",
            data:
              favorites,
            readOnly:
              true,
          },


          {
            id: "blocked-users",
            icon: "🚫",
            title:
              "العملاء المحظورون",
            collectionType:
              "blocked-users",
            data:
              blockedUsers,
            readOnly:
              true,
          },


          {
            id: "shipping",
            icon: "🚚",
            title:
              "الشحن والتوصيل",
            collectionType:
              "shipping",
            data:
              shippingZones,
            fields: [
              {
                name: "name",
                label:
                  "اسم المنطقة",
              },
              {
                name: "price",
                label:
                  "سعر الشحن",
                type:
                  "number",
              },
              {
                name: "active",
                label:
                  "المنطقة مفعلة",
                type:
                  "checkbox",
              },
            ],
          },


          {
            id: "payments",
            icon: "💳",
            title:
              "طرق الدفع",
            collectionType:
              "payments",
            data:
              paymentMethods,
            fields: [
              {
                name: "name",
                label:
                  "اسم طريقة الدفع",
              },
              {
                name: "active",
                label:
                  "مفعلة",
                type:
                  "checkbox",
              },
            ],
          },


          {
            id: "admins",
            icon: "🔐",
            title:
              "المشرفون والصلاحيات",
            collectionType:
              "admins",
            data:
              admins,
            readOnly:
              true,
          },


          {
            id: "activity-log",
            icon: "📝",
            title:
              "سجل العمليات",
            collectionType:
              "activity-log",
            data:
              activityLogs,
            readOnly:
              true,
          },
        ].map(
          (section) =>

            tab === section.id ? (

              <div
                className="table-container"
                key={section.id}
              >

                <div
                  className="section-header"
                >

                  <div>

                    <h2>
                      {
                        section.icon
                      }{" "}
                      {
                        section.title
                      }
                    </h2>

                    <p>
                      إجمالي العناصر:
                      {" "}
                      <strong>
                        {
                          section.data.length
                        }
                      </strong>
                    </p>

                  </div>


                  {!section.readOnly && (

                    <button
                      type="button"
                      className="add-btn"

                      onClick={() => {

                        setGenericType(
                          section.collectionType
                        );

                        setGenericEditingId(
                          null
                        );


                        const initialForm =
                          {};

                        section.fields?.forEach(
                          (field) => {

                            initialForm[
                              field.name
                            ] =
                              field.type ===
                              "checkbox"
                                ? true
                                : field.type ===
                                  "number"
                                ? 0
                                : "";

                          }
                        );


                        setGenericForm(
                          initialForm
                        );

                        setShowGenericForm(
                          true
                        );

                      }}
                    >
                      ➕ إضافة
                    </button>

                  )}

                </div>


                {showGenericForm &&
                  genericType ===
                    section.collectionType &&
                  !section.readOnly && (

                    <form
                      className="admin-form"
                      onSubmit={
                        handleGenericSubmit
                      }
                    >

                      <h3>

                        {
                          genericEditingId
                            ? `✏️ تعديل ${section.title}`
                            : `➕ إضافة ${section.title}`
                        }

                      </h3>


                      <div
                        className="form-grid"
                      >

                        {section.fields?.map(
                          (field) => (

                            <label
                              key={
                                field.name
                              }

                              className={
                                field.type ===
                                "textarea"
                                  ? "form-group-full"
                                  : ""
                              }
                            >

                              {
                                field.type ===
                                "checkbox" ? (

                                  <>

                                    <input
                                      type="checkbox"
                                      name={
                                        field.name
                                      }
                                      checked={
                                        genericForm[
                                          field.name
                                        ] !==
                                        false
                                      }
                                      onChange={
                                        handleGenericChange
                                      }
                                    />

                                    <span>
                                      {
                                        field.label
                                      }
                                    </span>

                                  </>

                                ) : field.type ===
                                  "select" ? (

                                  <>

                                    <span>
                                      {
                                        field.label
                                      }
                                    </span>

                                    <select
                                      name={
                                        field.name
                                      }

                                      value={
                                        genericForm[
                                          field.name
                                        ] ??
                                        ""
                                      }

                                      onChange={
                                        handleGenericChange
                                      }
                                    >

                                      {
                                        field.options?.map(
                                          (
                                            option
                                          ) => (

                                            <option
                                              key={
                                                option[0]
                                              }
                                              value={
                                                option[0]
                                              }
                                            >
                                              {
                                                option[1]
                                              }
                                            </option>

                                          )
                                        )
                                      }

                                    </select>

                                  </>

                                ) : field.type ===
                                  "textarea" ? (

                                  <>

                                    <span>
                                      {
                                        field.label
                                      }
                                    </span>

                                    <textarea
                                      name={
                                        field.name
                                      }
                                      rows="4"
                                      value={
                                        genericForm[
                                          field.name
                                        ] ??
                                        ""
                                      }
                                      onChange={
                                        handleGenericChange
                                      }
                                    />

                                  </>

                                ) : (

                                  <>

                                    <span>
                                      {
                                        field.label
                                      }
                                    </span>

                                    <input
                                      type={
                                        field.type ||
                                        "text"
                                      }
                                      name={
                                        field.name
                                      }
                                      value={
                                        genericForm[
                                          field.name
                                        ] ??
                                        ""
                                      }
                                      onChange={
                                        handleGenericChange
                                      }
                                    />

                                  </>

                                )
                              }

                            </label>

                          )
                        )}

                      </div>


                      <div
                        className="form-actions"
                      >

                        <button
                          type="submit"
                          className="save-btn"
                          disabled={
                            actionLoading
                          }
                        >
                          {
                            actionLoading
                              ? "⏳ جاري الحفظ..."
                              : "💾 حفظ"
                          }
                        </button>


                        <button
                          type="button"
                          className="cancel-btn"
                          onClick={
                            closeGenericForm
                          }
                        >
                          إلغاء
                        </button>

                      </div>

                    </form>

                  )}


                {section.data.length ===
                  0 ? (

                  <div
                    className="empty-state"
                  >

                    <div>
                      {
                        section.icon
                      }
                    </div>

                    <h3>
                      لا توجد بيانات
                    </h3>

                    <p>
                      لا توجد عناصر مسجلة حاليًا في هذا القسم.
                    </p>

                  </div>

                ) : (

                  <div
                    className="table-scroll"
                  >

                    <table
                      className="admin-table"
                    >

                      <thead>

                        <tr>

                          <th>
                            البيانات
                          </th>

                          <th>
                            التاريخ
                          </th>

                          {!section.readOnly && (
                            <th>
                              إجراءات
                            </th>
                          )}

                        </tr>

                      </thead>


                      <tbody>

                        {section.data.map(
                          (item) => (

                            <tr
                              key={
                                item.id
                              }
                            >

                              <td>

                                <strong>

                                  {
                                    item.title ||
                                    item.name ||
                                    item.code ||
                                    item.text ||
                                    item.message ||
                                    item.description ||
                                    item.email ||
                                    item.id
                                  }

                                </strong>


                                {item.message &&
                                  item.title && (

                                    <small
                                      style={{
                                        display:
                                          "block",
                                      }}
                                    >
                                      {
                                        item.message
                                      }
                                    </small>

                                  )}

                              </td>


                              <td>

                                {
                                  formatDate(
                                    item.createdAt
                                  )
                                }

                              </td>


                              {!section.readOnly && (

                                <td>

                                  <div
                                    className="table-actions"
                                  >

                                    <button
                                      type="button"
                                      className="edit-btn"

                                      onClick={() => {

                                        setGenericType(
                                          section.collectionType
                                        );

                                        setGenericEditingId(
                                          item.id
                                        );

                                        setGenericForm({
                                          ...item,
                                        });

                                        setShowGenericForm(
                                          true
                                        );

                                      }}
                                    >
                                      ✏️ تعديل
                                    </button>


                                    <button
                                      type="button"
                                      className="delete-btn"

                                      onClick={() =>
                                        deleteGenericItem(
                                          section.collectionType,
                                          item
                                        )
                                      }
                                    >
                                      🗑️ حذف
                                    </button>

                                  </div>

                                </td>

                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            ) : null
        )}


        {/* ====================================================
            STORE SETTINGS
        ==================================================== */}

        {tab === "settings" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🎨 مظهر المتجر وإعداداته
                </h2>

                <p>
                  تحكم كامل في الألوان والبانر والشريط العلوي وشريط المميزات.
                </p>

              </div>

            </div>


            {/* ================================================
                STORE BASIC DATA
            ================================================= */}

            <div
              className="admin-form-card"
            >

              <h3>
                🏪 البيانات الأساسية
              </h3>


              <div
                className="form-grid"
              >

                <label>

                  <span>
                    اسم المتجر
                  </span>

                  <input
                    type="text"
                    value={
                      storeSettings.storeName ||
                      ""
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,
                          storeName:
                            event.target.value,
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    رقم الهاتف
                  </span>

                  <input
                    type="text"
                    dir="ltr"
                    value={
                      storeSettings.phone ||
                      ""
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,
                          phone:
                            event.target.value,
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    واتساب
                  </span>

                  <input
                    type="text"
                    dir="ltr"
                    value={
                      storeSettings.whatsapp ||
                      ""
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,
                          whatsapp:
                            event.target.value,
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    البريد الإلكتروني
                  </span>

                  <input
                    type="email"
                    dir="ltr"
                    value={
                      storeSettings.email ||
                      ""
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,
                          email:
                            event.target.value,
                        })
                      )
                    }
                  />

                </label>


                <label
                  className="form-group-full"
                >

                  <span>
                    العنوان
                  </span>

                  <input
                    type="text"
                    value={
                      storeSettings.address ||
                      ""
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,
                          address:
                            event.target.value,
                        })
                      )
                    }
                  />

                </label>

              </div>

            </div>


            {/* ================================================
                COLORS
            ================================================= */}

            <div
              className="admin-form-card"
            >

              <h3>
                🎨 ألوان الموقع بالكامل
              </h3>


              <div
                className="form-grid"
              >

                {[
                  [
                    "primary",
                    "اللون الأساسي",
                  ],

                  [
                    "secondary",
                    "اللون الثانوي",
                  ],

                  [
                    "accent",
                    "اللون المميز",
                  ],

                  [
                    "pageBackground",
                    "خلفية الموقع",
                  ],

                  [
                    "cardBackground",
                    "خلفية البطاقات",
                  ],

                  [
                    "textPrimary",
                    "لون النص الرئيسي",
                  ],

                  [
                    "textSecondary",
                    "لون النص الثانوي",
                  ],

                  [
                    "border",
                    "لون الحدود",
                  ],

                  [
                    "buttonBackground",
                    "خلفية الأزرار",
                  ],

                  [
                    "buttonText",
                    "نص الأزرار",
                  ],

                  [
                    "navbarBackground",
                    "خلفية الـ Navbar",
                  ],

                  [
                    "navbarText",
                    "نص الـ Navbar",
                  ],

                  [
                    "categoryBarBackground",
                    "خلفية شريط الأقسام",
                  ],

                  [
                    "categoryBarText",
                    "نص شريط الأقسام",
                  ],

                  [
                    "topStripBackground",
                    "خلفية الشريط العلوي",
                  ],

                  [
                    "topStripText",
                    "نص الشريط العلوي",
                  ],

                  [
                    "footerBackground",
                    "خلفية الـ Footer",
                  ],

                  [
                    "footerText",
                    "لون الـ Footer",
                  ],
                ].map(
                  ([key, label]) => (

                    <label
                      key={key}
                    >

                      <span>
                        {
                          label
                        }
                      </span>


                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            "10px",

                          alignItems:
                            "center",
                        }}
                      >

                        <input
                          type="color"
                          value={
                            storeSettings.theme?.[
                              key
                            ] ||
                            "#ffffff"
                          }

                          onChange={(event) =>
                            setStoreSettings(
                              (previous) => ({
                                ...previous,

                                theme: {
                                  ...(previous.theme ||
                                    {}),

                                  [key]:
                                    event.target.value,
                                },
                              })
                            )
                          }

                          style={{
                            width:
                              "60px",

                            height:
                              "45px",

                            padding:
                              "3px",

                            flexShrink:
                              0,
                          }}
                        />


                        <input
                          type="text"
                          dir="ltr"
                          value={
                            storeSettings.theme?.[
                              key
                            ] ||
                            ""
                          }

                          onChange={(event) =>
                            setStoreSettings(
                              (previous) => ({
                                ...previous,

                                theme: {
                                  ...(previous.theme ||
                                    {}),

                                  [key]:
                                    event.target.value,
                                },
                              })
                            )
                          }
                        />

                      </div>

                    </label>

                  )
                )}

              </div>

            </div>


            {/* ================================================
                BANNER SIZE
            ================================================= */}

            <div
              className="admin-form-card"
            >

              <h3>
                🖼️ حجم البانر
              </h3>


              <div
                className="form-grid"
              >

                <label>

                  <span>
                    ارتفاع Desktop
                  </span>

                  <input
                    type="number"
                    min="150"
                    max="900"
                    value={
                      storeSettings.bannerSettings
                        ?.heightDesktop ??
                      420
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          bannerSettings: {
                            ...(previous.bannerSettings ||
                              {}),

                            heightDesktop:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    ارتفاع Tablet
                  </span>

                  <input
                    type="number"
                    min="120"
                    max="700"
                    value={
                      storeSettings.bannerSettings
                        ?.heightTablet ??
                      350
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          bannerSettings: {
                            ...(previous.bannerSettings ||
                              {}),

                            heightTablet:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    ارتفاع Mobile
                  </span>

                  <input
                    type="number"
                    min="100"
                    max="600"
                    value={
                      storeSettings.bannerSettings
                        ?.heightMobile ??
                      240
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          bannerSettings: {
                            ...(previous.bannerSettings ||
                              {}),

                            heightMobile:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    حواف البانر
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={
                      storeSettings.bannerSettings
                        ?.borderRadius ??
                      0
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          bannerSettings: {
                            ...(previous.bannerSettings ||
                              {}),

                            borderRadius:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    شفافية طبقة البانر
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={
                      storeSettings.bannerSettings
                        ?.overlayOpacity ??
                      0.35
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          bannerSettings: {
                            ...(previous.bannerSettings ||
                              {}),

                            overlayOpacity:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>

              </div>

            </div>


            {/* ================================================
                TOP STRIP
            ================================================= */}

            <div
              className="admin-form-card"
            >

              <h3>
                📢 الشريط العلوي
              </h3>


              <div
                className="admin-checkboxes"
              >

                <label>

                  <input
                    type="checkbox"
                    checked={
                      storeSettings.topStrip
                        ?.enabled !==
                      false
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          topStrip: {
                            ...(previous.topStrip ||
                              {}),

                            enabled:
                              event.target.checked,
                          },
                        })
                      )
                    }
                  />

                  إظهار الشريط العلوي

                </label>

              </div>


              <div
                className="form-grid"
              >

                <label>

                  <span>
                    الاتجاه
                  </span>

                  <select
                    value={
                      storeSettings.topStrip
                        ?.direction ||
                      "rtl"
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          topStrip: {
                            ...(previous.topStrip ||
                              {}),

                            direction:
                              event.target.value,
                          },
                        })
                      )
                    }
                  >

                    <option value="rtl">
                      من اليمين لليسار
                    </option>

                    <option value="ltr">
                      من اليسار لليمين
                    </option>

                  </select>

                </label>


                <label>

                  <span>
                    السرعة
                  </span>

                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={
                      storeSettings.topStrip
                        ?.speed ??
                      40
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          topStrip: {
                            ...(previous.topStrip ||
                              {}),

                            speed:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    ارتفاع الشريط
                  </span>

                  <input
                    type="number"
                    min="25"
                    max="100"
                    value={
                      storeSettings.topStrip
                        ?.height ??
                      42
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          topStrip: {
                            ...(previous.topStrip ||
                              {}),

                            height:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    حجم الخط
                  </span>

                  <input
                    type="number"
                    min="10"
                    max="30"
                    value={
                      storeSettings.topStrip
                        ?.fontSize ??
                      15
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          topStrip: {
                            ...(previous.topStrip ||
                              {}),

                            fontSize:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>

              </div>


              <div
                className="form-actions"
              >

                <button
                  type="button"
                  className="save-btn"
                  onClick={
                    saveStoreSettings
                  }
                >
                  💾 حفظ إعدادات المتجر
                </button>

              </div>

            </div>


            {/* ================================================
                FEATURES BAR
            ================================================= */}

            <div
              className="admin-form-card"
            >

              <h3>
                ⭐ شريط المميزات أسفل البانر
              </h3>


              <div
                className="admin-checkboxes"
              >

                <label>

                  <input
                    type="checkbox"
                    checked={
                      storeSettings.featuresBar
                        ?.enabled !==
                      false
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          featuresBar: {
                            ...(previous.featuresBar ||
                              {}),

                            enabled:
                              event.target.checked,
                          },
                        })
                      )
                    }
                  />

                  إظهار شريط المميزات

                </label>

              </div>


              <div
                className="form-grid"
              >

                <label>

                  <span>
                    لون الخلفية
                  </span>

                  <input
                    type="color"
                    value={
                      storeSettings.featuresBar
                        ?.background ||
                      "#FFFFFF"
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          featuresBar: {
                            ...(previous.featuresBar ||
                              {}),

                            background:
                              event.target.value,
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    لون النص
                  </span>

                  <input
                    type="color"
                    value={
                      storeSettings.featuresBar
                        ?.color ||
                      "#071A36"
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          featuresBar: {
                            ...(previous.featuresBar ||
                              {}),

                            color:
                              event.target.value,
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    لون الـ Accent
                  </span>

                  <input
                    type="color"
                    value={
                      storeSettings.featuresBar
                        ?.accentColor ||
                      "#D4AF37"
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          featuresBar: {
                            ...(previous.featuresBar ||
                              {}),

                            accentColor:
                              event.target.value,
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    الارتفاع
                  </span>

                  <input
                    type="number"
                    min="40"
                    max="150"
                    value={
                      storeSettings.featuresBar
                        ?.height ??
                      80
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          featuresBar: {
                            ...(previous.featuresBar ||
                              {}),

                            height:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>


                <label>

                  <span>
                    حجم الخط
                  </span>

                  <input
                    type="number"
                    min="10"
                    max="30"
                    value={
                      storeSettings.featuresBar
                        ?.fontSize ??
                      16
                    }

                    onChange={(event) =>
                      setStoreSettings(
                        (previous) => ({
                          ...previous,

                          featuresBar: {
                            ...(previous.featuresBar ||
                              {}),

                            fontSize:
                              Number(
                                event.target.value
                              ),
                          },
                        })
                      )
                    }
                  />

                </label>

              </div>


              <div
                className="form-actions"
              >

                <button
                  type="button"
                  className="save-btn"
                  onClick={
                    saveStoreSettings
                  }
                >
                  💾 حفظ المظهر
                </button>

              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            CONTACT
        ==================================================== */}

        {tab === "contact" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  📱 بيانات التواصل
                </h2>

                <p>
                  تعديل بيانات التواصل الخاصة بالمتجر.
                </p>

              </div>

            </div>


            <form
              className="admin-form"
              onSubmit={
                saveStoreSettings
              }
            >

              <div
                className="form-grid"
              >

                {[
                  [
                    "phone",
                    "الهاتف",
                    "ltr",
                  ],
                  [
                    "whatsapp",
                    "واتساب",
                    "ltr",
                  ],
                  [
                    "facebook",
                    "Facebook",
                    "ltr",
                  ],
                  [
                    "instagram",
                    "Instagram",
                    "ltr",
                  ],
                  [
                    "telegram",
                    "Telegram",
                    "ltr",
                  ],
                  [
                    "email",
                    "البريد الإلكتروني",
                    "ltr",
                  ],
                ].map(
                  ([name, label, dir]) => (

                    <label
                      key={name}
                    >

                      <span>
                        {label}
                      </span>

                      <input
                        name={name}
                        dir={dir}
                        value={
                          storeSettings[
                            name
                          ] ||
                          ""
                        }

                        onChange={(event) =>
                          setStoreSettings(
                            (previous) => ({
                              ...previous,

                              [name]:
                                event.target.value,
                            })
                          )
                        }
                      />

                    </label>

                  )
                )}

              </div>


              <div
                className="form-actions"
              >

                <button
                  type="submit"
                  className="save-btn"
                >
                  💾 حفظ بيانات التواصل
                </button>

              </div>

            </form>

          </div>

        )}


        {/* ====================================================
            SECURITY
        ==================================================== */}

        {tab === "security" && (

          <div
            className="table-container"
          >

            <div
              className="section-header"
            >

              <div>

                <h2>
                  🔑 الأمان
                </h2>

                <p>
                  أدوات التحكم في أمان لوحة الإدارة.
                </p>

              </div>

            </div>


            <div
              className="admin-form-card"
            >

              <div
                className="product-flags"
              >

                <label
                  className="flag-checkbox"
                >

                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span>
                    🛡️ حماية لوحة الإدارة
                  </span>

                </label>


                <label
                  className="flag-checkbox"
                >

                  <input
                    type="checkbox"
                  />

                  <span>
                    🔐 التحقق الإضافي
                  </span>

                </label>


                <label
                  className="flag-checkbox"
                >

                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span>
                    🚨 تسجيل محاولات الدخول
                  </span>

                </label>

              </div>


              <div
                className="form-actions"
              >

                <button
                  type="button"
                  className="save-btn"

                  onClick={() =>
                    alert(
                      "إعدادات الأمان الأساسية جاهزة. تفعيل MFA يتم من Firebase Authentication."
                    )
                  }
                >
                  💾 حفظ
                </button>

              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            FALLBACK
        ==================================================== */}

        {![
          "dashboard",
          "products",
          "categories",
          "orders",
          "users",
          "offers",
          "bestsellers",
          "new-arrivals",
          "recommended",
          "reports",
          "sales",
          "customers",
          "banners",
          "coupons",
          "favorites",
          "blocked-users",
          "support",
          "notifications",
          "announcements",
          "settings",
          "shipping",
          "payments",
          "contact",
          "admins",
          "activity-log",
          "security",
        ].includes(tab) && (

          <div
            className="table-container"
          >

            <div
              className="empty-state"
            >

              <div>
                📋
              </div>

              <h3>
                اختر قسمًا من لوحة الإدارة
              </h3>

              <p>
                اختر أحد الأقسام من القائمة الجانبية لعرض وإدارة بياناته.
              </p>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}


export default Admin;