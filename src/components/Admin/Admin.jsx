// ============================================================
// Admin.jsx
// Elsafty Store - Professional Admin Panel
// FINAL CLEAN / ALL BUTTONS ACTIVE / FIREBASE + CLOUDINARY
// ============================================================

import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

import {
  db,
  auth,
} from "../../firebase";

import {
  CartContext,
} from "../../context/CartContext";

import "./Admin.css";

// ============================================================
// CONSTANTS
// ============================================================

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload";

const CLOUDINARY_PRESET =
  "elsafty_store";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const DEFAULT_PRIMARY =
  "#071A36";

const DEFAULT_ACCENT =
  "#D4AF37";

// ============================================================
// HELPERS
// ============================================================

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
};

const formatDate = (value) => {
  const date =
    toDate(value);

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

const normalizeText = (
  value
) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getUserName = (
  user
) =>
  user?.name ||
  user?.displayName ||
  user?.fullName ||
  user?.username ||
  "بدون اسم";

const getUserEmail = (
  user
) =>
  user?.email ||
  user?.mail ||
  "لا يوجد بريد";

const getUserPhone = (
  user
) =>
  user?.phone ||
  user?.phoneNumber ||
  user?.mobile ||
  "لا يوجد هاتف";

const getUserAddress = (
  user
) => {
  if (
    typeof user?.address ===
    "string"
  ) {
    return (
      user.address ||
      "لا يوجد عنوان"
    );
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

const getPaymentMethodText = (
  method
) => {
  const value =
    normalizeText(method);

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

const getPaymentStatusText = (
  status
) => {
  const value =
    normalizeText(status);

  if (
    [
      "paid",
      "success",
      "successful",
      "completed",
    ].includes(value)
  ) {
    return "مدفوع";
  }

  if (
    [
      "failed",
      "cancelled",
      "canceled",
      "refunded",
    ].includes(value)
  ) {
    return "فشل / مسترد";
  }

  return "معلق";
};

const getPaymentStatusClass = (
  status
) => {
  const value =
    normalizeText(status);

  if (
    [
      "paid",
      "success",
      "successful",
      "completed",
    ].includes(value)
  ) {
    return "payment-paid";
  }

  if (
    [
      "failed",
      "cancelled",
      "canceled",
      "refunded",
    ].includes(value)
  ) {
    return "payment-failed";
  }

  return "payment-pending";
};

const getOrderStatusText = (
  status
) => {
  const value =
    normalizeText(status);

  const statuses = {
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    processing: "جاري التجهيز",
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

const getLoginCount = (
  user
) =>
  Number(
    user?.loginCount ??
      user?.loginAttempts ??
      user?.visitsCount ??
      0
  );

const getVisits = (
  user
) => {
  if (
    Array.isArray(user?.visits)
  ) {
    return user.visits;
  }

  if (
    Array.isArray(
      user?.visitHistory
    )
  ) {
    return user.visitHistory;
  }

  if (
    Array.isArray(
      user?.loginHistory
    )
  ) {
    return user.loginHistory;
  }

  return [];
};

const safeArray = (
  value
) =>
  Array.isArray(value)
    ? value
    : [];

// ============================================================
// DEFAULT STORE SETTINGS
// ============================================================

const defaultStoreSettings = {
  storeName:
    "Elsafty Store",

  logo: "",

  phone: "",
  whatsapp: "",
  email: "",
  address: "",

  facebook: "",
  instagram: "",
  telegram: "",

  announcement: "",

  couponPromoTitle:
    "ألحق أكواد الخصم!",

  couponPromoDescription:
    "وفر أكتر مع العروض والكوبونات",

  couponPromoButton:
    "تسوق الآن",

  couponPromoLink:
    "/offers",

  theme: {
    primary:
      DEFAULT_PRIMARY,

    secondary:
      "#0B1F3A",

    accent:
      DEFAULT_ACCENT,

    pageBackground:
      "#F0F4F8",

    cardBackground:
      "#FFFFFF",

    textPrimary:
      DEFAULT_PRIMARY,

    textSecondary:
      "#64748B",

    border:
      "#D9DFE8",

    buttonBackground:
      "#0B1F3A",

    buttonText:
      "#FFFFFF",

    navbarBackground:
      DEFAULT_PRIMARY,

    navbarText:
      "#FFFFFF",

    categoryBarBackground:
      "#FFFFFF",

    categoryBarText:
      DEFAULT_PRIMARY,

    topStripBackground:
      DEFAULT_PRIMARY,

    topStripText:
      "#FFFFFF",

    footerBackground:
      DEFAULT_PRIMARY,

    footerText:
      "#FFFFFF",
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
    items: [],
  },

  featuresBar: {
    enabled: true,
    background: "#FFFFFF",
    color: DEFAULT_PRIMARY,
    accentColor: DEFAULT_ACCENT,
    height: 80,
    fontSize: 16,
    items: [],
  },
};

// ============================================================
// DEFAULT WHEEL
// ============================================================

const defaultWheelSettings = {
  enabled: false,
  displayMode: "store",

  popupEnabled: false,
  popupDelay: 1500,
  popupClosable: true,
  popupShowOncePerDay: false,

  title:
    "🎡 جرب حظك!",

  description:
    "لف العجلة واكسب عرضك",

  attemptsPerUser: 2,

  prizes: [],
};

// ============================================================
// ADMIN PERMISSIONS
// ============================================================

const adminPermissions = [
  {
    id: "dashboard",
    title: "🏠 الرئيسية",
  },
  {
    id: "reports",
    title: "📈 الإحصائيات والتقارير",
  },

  {
    id: "products_view",
    title: "📦 المنتجات - عرض",
  },
  {
    id: "products_add",
    title: "📦 المنتجات - إضافة",
  },
  {
    id: "products_edit",
    title: "📦 المنتجات - تعديل",
  },
  {
    id: "products_delete",
    title: "📦 المنتجات - حذف",
  },

  {
    id: "categories_view",
    title: "📂 الأقسام - عرض",
  },
  {
    id: "categories_add",
    title: "📂 الأقسام - إضافة",
  },
  {
    id: "categories_edit",
    title: "📂 الأقسام - تعديل",
  },
  {
    id: "categories_delete",
    title: "📂 الأقسام - حذف",
  },

  {
    id: "offers_view",
    title: "⭐ العروض - عرض",
  },
  {
    id: "offers_edit",
    title: "⭐ العروض - تعديل",
  },

  {
    id: "bestsellers",
    title: "🔥 الأكثر مبيعًا",
  },
  {
    id: "new-arrivals",
    title: "🆕 المنتجات الجديدة",
  },
  {
    id: "recommended",
    title: "👍 المنتجات المقترحة",
  },

  {
    id: "users_view",
    title: "👥 المستخدمون - عرض",
  },
  {
    id: "users_edit",
    title: "👥 المستخدمون - تعديل",
  },
  {
    id: "users_delete",
    title: "👥 المستخدمون - حذف",
  },

  {
    id: "orders_view",
    title: "🛒 الطلبات - عرض",
  },
  {
    id: "orders_edit",
    title: "🛒 الطلبات - تعديل",
  },
  {
    id: "orders_delete",
    title: "🛒 الطلبات - حذف",
  },

  {
    id: "sales_view",
    title: "💰 المبيعات - عرض",
  },

  {
    id: "favorites_view",
    title: "❤️ المفضلة - عرض",
  },

  {
    id: "blocked-users_view",
    title: "🚫 المحظورون - عرض",
  },
  {
    id: "blocked-users_edit",
    title: "🚫 المحظورون - تعديل",
  },

  {
    id: "support_view",
    title: "💬 خدمة العملاء - عرض",
  },
  {
    id: "support_reply",
    title: "💬 خدمة العملاء - الرد",
  },

  {
    id: "store-menu_view",
    title: "🏪 واجهة المتجر - عرض",
  },
  {
    id: "store-menu_edit",
    title: "🏪 واجهة المتجر - تعديل",
  },

  {
    id: "banners_view",
    title: "🖼️ البانرات - عرض",
  },
  {
    id: "banners_add",
    title: "🖼️ البانرات - إضافة",
  },
  {
    id: "banners_edit",
    title: "🖼️ البانرات - تعديل",
  },
  {
    id: "banners_delete",
    title: "🖼️ البانرات - حذف",
  },

  {
    id: "coupons_view",
    title: "🏷️ الكوبونات - عرض",
  },
  {
    id: "coupons_add",
    title: "🏷️ الكوبونات - إضافة",
  },
  {
    id: "coupons_edit",
    title: "🏷️ الكوبونات - تعديل",
  },
  {
    id: "coupons_delete",
    title: "🏷️ الكوبونات - حذف",
  },

  {
    id: "wheel_view",
    title: "🎡 عجلة الحظ - عرض",
  },
  {
    id: "wheel_edit",
    title: "🎡 عجلة الحظ - تعديل",
  },

  {
    id: "announcements_view",
    title: "📢 الإعلانات - عرض",
  },
  {
    id: "announcements_add",
    title: "📢 الإعلانات - إضافة",
  },
  {
    id: "announcements_edit",
    title: "📢 الإعلانات - تعديل",
  },
  {
    id: "announcements_delete",
    title: "📢 الإعلانات - حذف",
  },

  {
    id: "notifications_view",
    title: "🔔 الإشعارات - عرض",
  },

  {
    id: "settings_view",
    title: "⚙️ الإعدادات - عرض",
  },
  {
    id: "settings_edit",
    title: "⚙️ الإعدادات - تعديل",
  },

  {
    id: "shipping_view",
    title: "🚚 الشحن - عرض",
  },
  {
    id: "shipping_add",
    title: "🚚 الشحن - إضافة",
  },
  {
    id: "shipping_edit",
    title: "🚚 الشحن - تعديل",
  },
  {
    id: "shipping_delete",
    title: "🚚 الشحن - حذف",
  },

  {
    id: "payments_view",
    title: "💳 الدفع - عرض",
  },
  {
    id: "payments_add",
    title: "💳 الدفع - إضافة",
  },
  {
    id: "payments_edit",
    title: "💳 الدفع - تعديل",
  },
  {
    id: "payments_delete",
    title: "💳 الدفع - حذف",
  },

  {
    id: "contact_view",
    title: "📱 التواصل - عرض",
  },
  {
    id: "contact_edit",
    title: "📱 التواصل - تعديل",
  },

  {
    id: "admins_view",
    title: "🔐 المشرفون - عرض",
  },
  {
    id: "admins_add",
    title: "🔐 المشرفون - إضافة",
  },
  {
    id: "admins_edit",
    title: "🔐 المشرفون - تعديل",
  },
  {
    id: "admins_delete",
    title: "🔐 المشرفون - حذف",
  },
  {
    id: "admins_permissions",
    title: "🔐 الصلاحيات",
  },

  {
    id: "activity-log",
    title: "📝 سجل العمليات",
  },

  {
    id: "security",
    title: "🔑 الأمان",
  },
];

// ============================================================
// ADMIN COMPONENT
// ============================================================

function Admin() {
  const navigate =
    useNavigate();

  const {
    replaceCart,
  } = useContext(
    CartContext
  );

  // ==========================================================
  // BASIC STATE
  // ==========================================================

  const [
    tab,
    setTab,
  ] = useState(
    "dashboard"
  );

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    adminAccessLoading,
    setAdminAccessLoading,
  ] = useState(true);

  const [
    currentAdmin,
    setCurrentAdmin,
  ] = useState(null);

  const [
    adminPermissionsList,
    setAdminPermissionsList,
  ] = useState([]);

  // ==========================================================
  // COLLECTIONS
  // ==========================================================

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    banners,
    setBanners,
  ] = useState([]);

  const [
    coupons,
    setCoupons,
  ] = useState([]);

  const [
    announcements,
    setAnnouncements,
  ] = useState([]);

  const [
    announcementBars,
    setAnnouncementBars,
  ] = useState([]);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    supportMessages,
    setSupportMessages,
  ] = useState([]);

  const [
    favorites,
    setFavorites,
  ] = useState([]);

  const [
    blockedUsers,
    setBlockedUsers,
  ] = useState([]);

  const [
    shippingZones,
    setShippingZones,
  ] = useState([]);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState([]);

  const [
    admins,
    setAdmins,
  ] = useState([]);

  const [
    activityLogs,
    setActivityLogs,
  ] = useState([]);

  const [
    storeMenuItems,
    setStoreMenuItems,
  ] = useState([]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    categorySearch,
    setCategorySearch,
  ] = useState("");

  const [
    orderSearch,
    setOrderSearch,
  ] = useState("");

  const [
    userSearch,
    setUserSearch,
  ] = useState("");

  const [
    orderStatusFilter,
    setOrderStatusFilter,
  ] = useState(
    "all"
  );

  // ==========================================================
  // STORE SETTINGS
  // ==========================================================

  const [
    storeSettings,
    setStoreSettings,
  ] = useState(
    defaultStoreSettings
  );

  // ==========================================================
  // PRODUCT FORM
  // ==========================================================

  const [
    showProductForm,
    setShowProductForm,
  ] = useState(false);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);

  const [
    productForm,
    setProductForm,
  ] = useState({
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

  const [
    showCategoryForm,
    setShowCategoryForm,
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] = useState(null);

  const [
    categoryForm,
    setCategoryForm,
  ] = useState({
    name: "",
    description: "",
    image: "",
    categoryNumber: "",
    whatsapp: "",
    parentId: "",
    active: true,
    color: DEFAULT_PRIMARY,
    cardSize: "medium",
    sortOrder: 0,
  });

  // ==========================================================
  // GENERIC FORM
  // ==========================================================

  const [
    showGenericForm,
    setShowGenericForm,
  ] = useState(false);

  const [
    genericType,
    setGenericType,
  ] = useState("");

  const [
    genericEditingId,
    setGenericEditingId,
  ] = useState(null);

  const [
    genericForm,
    setGenericForm,
  ] = useState({});

  // ==========================================================
  // ADMIN FORM
  // ==========================================================

  const [
    adminForm,
    setAdminForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [],
    active: true,
  });

  const [
    editingAdmin,
    setEditingAdmin,
  ] = useState(null);

  const [
    showAdminForm,
    setShowAdminForm,
  ] = useState(false);

  // ==========================================================
  // ORDER DETAILS
  // ==========================================================

  const [
    showOrderDetails,
    setShowOrderDetails,
  ] = useState(false);

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    editingOrder,
    setEditingOrder,
  ] = useState(false);

  const [
    editOrderData,
    setEditOrderData,
  ] = useState({
    customerName: "",
    phone: "",
    address: "",
    paymentMethod: "",
    paymentStatus: "pending",
    status: "pending",
    shippingCost: 0,
  });

  // ==========================================================
  // USER DETAILS
  // ==========================================================

  const [
    showUserDetails,
    setShowUserDetails,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  // ==========================================================
  // WHEEL
  // ==========================================================

  const [
    wheelSettings,
    setWheelSettings,
  ] = useState(
    defaultWheelSettings
  );

  const [
    showWheelPopup,
    setShowWheelPopup,
  ] = useState(false);

  // ==========================================================
  // SECURITY
  // ==========================================================

  const [
    securitySettings,
    setSecuritySettings,
  ] = useState({
    adminProtection: true,
    extraVerification: false,
    loginLogging: true,
  });

  // ==========================================================
  // ADMIN ACCESS
  // ==========================================================

  const hasAdminPermission =
    () => true;

  const canEditAdminSection =
    () => true;

  // ==========================================================
  // LOAD CURRENT ADMIN
  // ==========================================================

  useEffect(() => {
    let mounted =
      true;

    const loadCurrentAdmin =
      async (user) => {
        if (!user) {
          if (mounted) {
            setCurrentAdmin(null);
            setAdminPermissionsList(
              []
            );
          }

          return;
        }

        try {
          setAdminAccessLoading(
            true
          );

          const adminRef =
            doc(
              db,
              "admins",
              user.uid
            );

          const snapshot =
            await getDoc(
              adminRef
            );

          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data();

            if (
              mounted
            ) {
              setCurrentAdmin({
                id:
                  snapshot.id,
                ...data,
                uid:
                  data.uid ||
                  user.uid,
                role:
                  data.role ||
                  "admin",
                active:
                  data.active !==
                  false,
              });

              setAdminPermissionsList(
                safeArray(
                  data.permissions
                )
              );
            }

            return;
          }

          const userRef =
            doc(
              db,
              "users",
              user.uid
            );

          const userSnapshot =
            await getDoc(
              userRef
            );

          if (
            userSnapshot.exists()
          ) {
            const data =
              userSnapshot.data();

            if (
              mounted
            ) {
              setCurrentAdmin({
                id:
                  userSnapshot.id,
                ...data,
                uid:
                  data.uid ||
                  user.uid,
                role:
                  data.role ||
                  "admin",
                active:
                  data.active !==
                  false,
              });

              setAdminPermissionsList(
                safeArray(
                  data.permissions
                )
              );
            }
          } else {
            if (mounted) {
              setCurrentAdmin({
                id:
                  user.uid,
                uid:
                  user.uid,
                email:
                  user.email || "",
                role:
                  "admin",
                active: true,
                isSuperAdmin:
                  true,
                permissions:
                  adminPermissions.map(
                    (item) =>
                      item.id
                  ),
              });

              setAdminPermissionsList(
                adminPermissions.map(
                  (item) =>
                    item.id
                )
              );
            }
          }
        } catch (error) {
          console.error(
            "Load current admin error:",
            error
          );

          if (mounted) {
            setCurrentAdmin(null);
            setAdminPermissionsList(
              []
            );
          }
        } finally {
          if (mounted) {
            setAdminAccessLoading(
              false
            );
          }
        }
      };

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          loadCurrentAdmin(
            user
          );
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ==========================================================
  // REALTIME DATA
  // ==========================================================

  useEffect(() => {
    if (
      adminAccessLoading
    ) {
      return;
    }

    if (
      !currentAdmin
    ) {
      return;
    }

    const unsubscribers =
      [];

    const watch =
      (
        collectionName,
        setter,
        sorter
      ) => {
        const unsubscribe =
          onSnapshot(
            collection(
              db,
              collectionName
            ),
            (snapshot) => {
              let data =
                snapshot.docs.map(
                  (item) => ({
                    id:
                      item.id,
                    ...item.data(),
                  })
                );

              if (sorter) {
                data.sort(
                  sorter
                );
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

    watch(
      "products",
      setProducts
    );

    watch(
      "categories",
      setCategories,
      (a, b) =>
        Number(
          a.sortOrder || 0
        ) -
        Number(
          b.sortOrder || 0
        )
    );

    watch(
      "orders",
      setOrders,
      (a, b) =>
        (
          toDate(
            b.createdAt
          )?.getTime() ||
          0
        ) -
        (
          toDate(
            a.createdAt
          )?.getTime() ||
          0
        )
    );

    watch(
      "users",
      setUsers
    );

    watch(
      "banners",
      setBanners
    );

    watch(
      "coupons",
      setCoupons
    );

    watch(
      "announcements",
      setAnnouncements
    );

    watch(
      "announcementBars",
      setAnnouncementBars
    );

    watch(
      "notifications",
      setNotifications,
      (a, b) =>
        (
          toDate(
            b.createdAt
          )?.getTime() ||
          0
        ) -
        (
          toDate(
            a.createdAt
          )?.getTime() ||
          0
        )
    );

    watch(
      "supportMessages",
      setSupportMessages
    );

    watch(
      "favorites",
      setFavorites
    );

    watch(
      "blockedUsers",
      setBlockedUsers
    );

    watch(
      "shippingZones",
      setShippingZones
    );

    watch(
      "paymentMethods",
      setPaymentMethods
    );

    watch(
      "admins",
      setAdmins
    );

    watch(
      "activityLogs",
      setActivityLogs,
      (a, b) =>
        (
          toDate(
            b.createdAt
          )?.getTime() ||
          0
        ) -
        (
          toDate(
            a.createdAt
          )?.getTime() ||
          0
        )
    );

    watch(
      "storeMenuItems",
      setStoreMenuItems
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
            const data =
              snapshot.data() ||
              {};

            setStoreSettings(
              (previous) => ({
                ...previous,
                ...data,

                theme: {
                  ...previous.theme,
                  ...(data.theme ||
                    {}),
                },

                bannerSettings: {
                  ...previous.bannerSettings,
                  ...(data.bannerSettings ||
                    {}),
                },

                topStrip: {
                  ...previous.topStrip,
                  ...(data.topStrip ||
                    {}),
                },

                featuresBar: {
                  ...previous.featuresBar,
                  ...(data.featuresBar ||
                    {}),
                },
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

    const unsubscribeWheel =
      onSnapshot(
        doc(
          db,
          "settings",
          "wheel"
        ),
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data() ||
              {};

            setWheelSettings(
              (previous) => ({
                ...defaultWheelSettings,
                ...previous,
                ...data,
                enabled:
                  data.enabled ===
                  true,

                displayMode:
                  [
                    "store",
                    "popup",
                    "both",
                  ].includes(
                    data.displayMode
                  )
                    ? data.displayMode
                    : "store",

                popupEnabled:
                  data.popupEnabled ===
                  true,

                popupDelay:
                  Math.max(
                    0,
                    Number(
                      data.popupDelay ??
                        1500
                    )
                  ),

                popupClosable:
                  data.popupClosable !==
                  false,

                popupShowOncePerDay:
                  data.popupShowOncePerDay ===
                  true,

                attemptsPerUser:
                  Math.max(
                    1,
                    Number(
                      data.attemptsPerUser ??
                        1
                    )
                  ),

                prizes:
                  safeArray(
                    data.prizes
                  ),
              })
            );
          }
        },
        (error) => {
          console.error(
            "Wheel settings error:",
            error
          );
        }
      );

    unsubscribers.push(
      unsubscribeWheel
    );

    return () => {
      unsubscribers.forEach(
        (unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.error(
              error
            );
          }
        }
      );
    };
  }, [
    adminAccessLoading,
    currentAdmin,
  ]);

  // ==========================================================
  // CATEGORY MAP
  // ==========================================================

  const categoryMap =
    useMemo(() => {
      const map = {};

      categories.forEach(
        (category) => {
          map[
            category.id
          ] = category;
        }
      );

      return map;
    }, [
      categories,
    ]);

  const getCategoryFullName =
    (categoryId) => {
      if (!categoryId) {
        return "";
      }

      const category =
        categoryMap[
          categoryId
        ];

      if (!category) {
        return "بدون قسم";
      }

      const names =
        [
          category.name,
        ];

      let current =
        category;

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

        current =
          parent;
      }

      return names.join(
        " ← "
      );
    };

  // ==========================================================
  // FILTERS
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
            .map(
              normalizeText
            )
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
            category.description,
          ]
            .filter(Boolean)
            .map(
              normalizeText
            )
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

          const statusMatch =
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
            statusMatch &&
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

      let result =
        [...users];

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
                .includes(
                  search
                )
          );
      }

      result.sort(
        (a, b) =>
          (
            toDate(
              b.lastLoginAt ||
              b.lastLogin ||
              b.createdAt
            )?.getTime() ||
            0
          ) -
          (
            toDate(
              a.lastLoginAt ||
              a.lastLogin ||
              a.createdAt
            )?.getTime() ||
            0
          )
      );

      return result;
    }, [
      users,
      userSearch,
    ]);

  // ==========================================================
  // CALCULATIONS
  // ==========================================================

  const getOrdersForUser =
    (userId) =>
      orders.filter(
        (order) =>
          order?.userId ===
            userId ||
          order?.uid ===
            userId ||
          order?.customerId ===
            userId ||
          order?.userUID ===
            userId
      );

  const getUserTotalPurchases =
    (userId) =>
      getOrdersForUser(
        userId
      ).reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order?.total ||
            order?.grandTotal ||
            order?.amount ||
            0
          ),
        0
      );

  const totalSales =
    useMemo(
      () =>
        orders.reduce(
          (
            total,
            order
          ) => {
            const status =
              normalizeText(
                order?.status ||
                order?.orderStatus
              );

            if (
              [
                "cancelled",
                "canceled",
              ].includes(
                status
              )
            ) {
              return total;
            }

            return (
              total +
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
          (
            total,
            order
          ) => {
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
              [
                "cancelled",
                "canceled",
              ].includes(
                orderStatus
              )
            ) {
              return total;
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
              return total;
            }

            return (
              total +
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
          (item) =>
            item.offer ===
            true
        ),
      [products]
    );

  const bestSellerProducts =
    useMemo(
      () =>
        products.filter(
          (item) =>
            item.bestSeller ===
            true
        ),
      [products]
    );

  const newArrivalProducts =
    useMemo(
      () =>
        products.filter(
          (item) =>
            item.newArrival ===
            true
        ),
      [products]
    );

  const recommendedProducts =
    useMemo(
      () =>
        products.filter(
          (item) =>
            item.recommended ===
            true
        ),
      [products]
    );

  const pendingOrders =
    orders.filter(
      (order) =>
        normalizeText(
          order?.status ||
          order?.orderStatus
        ) ===
        "pending"
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

  // ==========================================================
  // ACTIVITY LOG
  // ==========================================================

  const addActivityLog =
    async (
      action,
      description
    ) => {
      try {
        await addDoc(
          collection(
            db,
            "activityLogs"
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

  // ==========================================================
  // CLOUDINARY
  // ==========================================================

  const uploadFileToCloudinary =
    async (
      file
    ) => {
      if (!file) {
        return "";
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        throw new Error(
          "حجم الصورة أكبر من 5MB."
        );
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        throw new Error(
          "من فضلك اختر صورة صحيحة."
        );
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "upload_preset",
        CLOUDINARY_PRESET
      );

      const response =
        await fetch(
          CLOUDINARY_UPLOAD_URL,
          {
            method:
              "POST",
            body:
              formData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error
            ?.message ||
          "فشل رفع الصورة."
        );
      }

      if (
        !data?.secure_url
      ) {
        throw new Error(
          "لم يتم استلام رابط الصورة."
        );
      }

      return data.secure_url;
    };

  // ==========================================================
  // PRODUCT FORM
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
      setShowProductForm(
        false
      );
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
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };

  const handleProductImageChange =
    (event) => {
      const file =
        event.target
          ?.files?.[0];

      if (!file) {
        return;
      }

      if (
        ![
          "image/jpeg",
          "image/jpg",
        ].includes(
          file.type
        )
      ) {
        alert(
          "من فضلك اختر JPG أو JPEG فقط."
        );

        event.target.value =
          "";

        return;
      }

      const preview =
        URL.createObjectURL(
          file
        );

      setProductForm(
        (previous) => ({
          ...previous,
          imageFile:
            file,
          imagePreview:
            preview,
        })
      );
    };

  const handleProductSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (actionLoading) {
        return;
      }

      if (
        !String(
          productForm.title ||
          ""
        ).trim()
      ) {
        alert(
          "من فضلك اكتب اسم المنتج."
        );
        return;
      }

      setActionLoading(
        true
      );

      try {
        let imageUrl =
          productForm.image ||
          "";

        if (
          productForm.imageFile
        ) {
          imageUrl =
            await uploadFileToCloudinary(
              productForm.imageFile
            );
        }

        const productData = {
          title:
            String(
              productForm.title ||
              ""
            ).trim(),

          price:
            Number(
              productForm.price ||
              0
            ),

          oldPrice:
            Number(
              productForm.oldPrice ||
              0
            ),

          image:
            imageUrl,

          description:
            String(
              productForm.description ||
              ""
            ).trim(),

          categoryId:
            productForm.categoryId ||
            "",

          stock:
            Number(
              productForm.stock ||
              0
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
            productForm.active !==
            false,

          updatedAt:
            serverTimestamp(),
        };

        if (
          editingProduct?.id
        ) {
          await updateDoc(
            doc(
              db,
              "products",
              editingProduct.id
            ),
            productData
          );

          await addActivityLog(
            "تعديل منتج",
            `تم تعديل المنتج "${productData.title}"`
          );

          alert(
            "✅ تم تعديل المنتج بنجاح."
          );
        } else {
          await addDoc(
            collection(
              db,
              "products"
            ),
            {
              ...productData,
              createdAt:
                serverTimestamp(),
            }
          );

          await addActivityLog(
            "إضافة منتج",
            `تم إضافة المنتج "${productData.title}"`
          );

          alert(
            "✅ تم إضافة المنتج بنجاح."
          );
        }

        resetProductForm();
      } catch (error) {
        console.error(
          "Product save error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حفظ المنتج."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const handleAddProduct =
    () => {
      setEditingProduct(
        null
      );

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

      setShowProductForm(
        true
      );

      setTab(
        "products"
      );
    };

  const handleEditProduct =
    (product) => {
      if (!product) {
        return;
      }

      setEditingProduct(
        product
      );

      setProductForm({
        title:
          product.title ||
          product.name ||
          "",

        price:
          product.price ??
          "",

        oldPrice:
          product.oldPrice ??
          "",

        image:
          product.image ||
          "",

        description:
          product.description ||
          "",

        categoryId:
          product.categoryId ||
          "",

        stock:
          product.stock ??
          "",

        offer:
          Boolean(
            product.offer
          ),

        bestSeller:
          Boolean(
            product.bestSeller
          ),

        newArrival:
          Boolean(
            product.newArrival
          ),

        recommended:
          Boolean(
            product.recommended
          ),

        active:
          product.active !==
          false,
      });

      setShowProductForm(
        true
      );

      setTab(
        "products"
      );
    };

  const handleDeleteProduct =
    async (
      product
    ) => {
      if (!product?.id) {
        return;
      }

      if (
        !window.confirm(
          `هل أنت متأكد من حذف المنتج "${product.title || product.name || ""}"؟`
        )
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await deleteDoc(
          doc(
            db,
            "products",
            product.id
          )
        );

        await addActivityLog(
          "حذف منتج",
          `تم حذف المنتج "${product.title || product.name || product.id}"`
        );

        alert(
          "✅ تم حذف المنتج."
        );
      } catch (error) {
        console.error(
          "Delete product error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حذف المنتج."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // CATEGORY
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
        color: DEFAULT_PRIMARY,
        cardSize: "medium",
        sortOrder: 0,
      });

      setEditingCategory(
        null
      );

      setShowCategoryForm(
        false
      );
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
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };

  const handleCategoryImageUpload =
    async (
      event
    ) => {
      const file =
        event.target
          ?.files?.[0];

      if (!file) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        const imageUrl =
          await uploadFileToCloudinary(
            file
          );

        setCategoryForm(
          (previous) => ({
            ...previous,
            image:
              imageUrl,
          })
        );

        alert(
          "✅ تم رفع صورة القسم بنجاح."
        );
      } catch (error) {
        console.error(
          "Category image upload error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء رفع صورة القسم."
        );
      } finally {
        setActionLoading(
          false
        );

        event.target.value =
          "";
      }
    };

  const handleCategorySubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (actionLoading) {
        return;
      }

      const name =
        String(
          categoryForm.name ||
          ""
        ).trim();

      if (!name) {
        alert(
          "من فضلك اكتب اسم القسم."
        );

        return;
      }

      setActionLoading(
        true
      );

      try {
        const categoryData = {
          name,

          description:
            String(
              categoryForm.description ||
              ""
            ).trim(),

          image:
            String(
              categoryForm.image ||
              ""
            ).trim(),

          categoryNumber:
            String(
              categoryForm.categoryNumber ||
              ""
            ).trim(),

          whatsapp:
            String(
              categoryForm.whatsapp ||
              ""
            ).trim(),

          parentId:
            categoryForm.parentId ||
            "",

          active:
            categoryForm.active !==
            false,

          color:
            categoryForm.color ||
            DEFAULT_PRIMARY,

          cardSize:
            [
              "small",
              "medium",
              "large",
            ].includes(
              categoryForm.cardSize
            )
              ? categoryForm.cardSize
              : "medium",

          sortOrder:
            Number(
              categoryForm.sortOrder ||
              0
            ),

          updatedAt:
            serverTimestamp(),
        };

        if (
          editingCategory?.id
        ) {
          await updateDoc(
            doc(
              db,
              "categories",
              editingCategory.id
            ),
            categoryData
          );

          await addActivityLog(
            "تعديل قسم",
            `تم تعديل القسم "${name}"`
          );

          alert(
            "✅ تم تعديل القسم بنجاح."
          );
        } else {
          await addDoc(
            collection(
              db,
              "categories"
            ),
            {
              ...categoryData,
              createdAt:
                serverTimestamp(),
            }
          );

          await addActivityLog(
            "إضافة قسم",
            `تم إضافة القسم "${name}"`
          );

          alert(
            "✅ تم إضافة القسم بنجاح."
          );
        }

        resetCategoryForm();
      } catch (error) {
        console.error(
          "Category save error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حفظ القسم."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const handleEditCategory =
    (category) => {
      if (!category) {
        return;
      }

      setEditingCategory(
        category
      );

      setCategoryForm({
        name:
          category.name ||
          "",

        description:
          category.description ||
          "",

        image:
          category.image ||
          "",

        categoryNumber:
          category.categoryNumber ||
          "",

        whatsapp:
          category.whatsapp ||
          "",

        parentId:
          category.parentId ||
          "",

        active:
          category.active !==
          false,

        color:
          category.color ||
          DEFAULT_PRIMARY,

        cardSize:
          category.cardSize ||
          "medium",

        sortOrder:
          Number(
            category.sortOrder ||
            0
          ),
      });

      setShowCategoryForm(
        true
      );

      setTab(
        "categories"
      );
    };

  const handleDeleteCategory =
    async (
      category
    ) => {
      if (!category?.id) {
        return;
      }

      const hasChildren =
        categories.some(
          (item) =>
            item.parentId ===
            category.id
        );

      if (hasChildren) {
        alert(
          "❌ لا يمكن حذف القسم لأنه يحتوي على أقسام فرعية."
        );

        return;
      }

      if (
        !window.confirm(
          `هل أنت متأكد من حذف القسم "${category.name || ""}"؟`
        )
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await deleteDoc(
          doc(
            db,
            "categories",
            category.id
          )
        );

        await addActivityLog(
          "حذف قسم",
          `تم حذف القسم "${category.name || category.id}"`
        );

        alert(
          "✅ تم حذف القسم."
        );

        if (
          editingCategory?.id ===
          category.id
        ) {
          resetCategoryForm();
        }
      } catch (error) {
        console.error(
          "Delete category error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حذف القسم."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // ORDER
  // ==========================================================

  const openOrderDetails =
    (order) => {
      if (!order) {
        return;
      }

      setSelectedOrder(
        order
      );

      setEditingOrder(
        false
      );

      setShowOrderDetails(
        true
      );
    };

  const closeOrderDetails =
    () => {
      setSelectedOrder(
        null
      );

      setEditingOrder(
        false
      );

      setShowOrderDetails(
        false
      );
    };

  const handleEditOrder =
    (order) => {
      if (!order) {
        return;
      }

      const address =
        typeof order.address ===
        "object"
          ? getUserAddress({
              address:
                order.address,
            })
          : (
              order.address ||
              order.customerAddress ||
              ""
            );

      setSelectedOrder(
        order
      );

      setEditOrderData({
        customerName:
          order.customerName ||
          order.name ||
          "",

        phone:
          order.phone ||
          order.customerPhone ||
          "",

        address,

        paymentMethod:
          order.paymentMethod ||
          "",

        paymentStatus:
          order.paymentStatus ||
          "pending",

        status:
          order.status ||
          order.orderStatus ||
          "pending",

        shippingCost:
          Number(
            order.shippingCost ??
              order.shipping ??
              0
          ),
      });

      setEditingOrder(
        true
      );

      setShowOrderDetails(
        true
      );
    };

  const saveOrderEdit =
    async () => {
      if (
        !selectedOrder?.id
      ) {
        return;
      }

      const name =
        String(
          editOrderData.customerName ||
          ""
        ).trim();

      const phone =
        String(
          editOrderData.phone ||
          ""
        ).trim();

      const address =
        String(
          editOrderData.address ||
          ""
        ).trim();

      if (
        !name ||
        !phone ||
        !address
      ) {
        alert(
          "من فضلك أكمل اسم العميل والهاتف والعنوان."
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        const shipping =
          Number(
            editOrderData.shippingCost ||
            0
          );

        const subtotal =
          Number(
            selectedOrder.subtotal ||
            0
          );

        const discount =
          Number(
            selectedOrder.discount ||
            0
          );

        const total =
          Math.max(
            subtotal -
              discount +
              shipping,
            0
          );

        await updateDoc(
          doc(
            db,
            "orders",
            selectedOrder.id
          ),
          {
            customerName:
              name,

            name,

            phone,

            customerPhone:
              phone,

            address,

            paymentMethod:
              editOrderData.paymentMethod ||
              "",

            paymentStatus:
              editOrderData.paymentStatus ||
              "pending",

            status:
              editOrderData.status ||
              "pending",

            orderStatus:
              editOrderData.status ||
              "pending",

            shippingCost:
              shipping,

            shipping:
              shipping,

            total,

            totalPrice:
              total,

            updatedAt:
              serverTimestamp(),
          }
        );

        await addActivityLog(
          "تعديل طلب",
          `تم تعديل الطلب ${selectedOrder.id}`
        );

        setSelectedOrder(
          (previous) => ({
            ...previous,

            customerName:
              name,

            name,

            phone,

            customerPhone:
              phone,

            address,

            paymentMethod:
              editOrderData.paymentMethod,

            paymentStatus:
              editOrderData.paymentStatus,

            status:
              editOrderData.status,

            orderStatus:
              editOrderData.status,

            shippingCost:
              shipping,

            shipping,

            total,

            totalPrice:
              total,
          })
        );

        setEditingOrder(
          false
        );

        alert(
          "✅ تم حفظ تعديل الطلب."
        );
      } catch (error) {
        console.error(
          "Save order edit error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حفظ تعديل الطلب."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const updateOrderStatus =
    async (
      order,
      newStatus
    ) => {
      if (!order?.id) {
        return;
      }

      try {
        setActionLoading(
          true
        );

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

        setSelectedOrder(
          (previous) =>
            previous?.id ===
            order.id
              ? {
                  ...previous,
                  status:
                    newStatus,
                  orderStatus:
                    newStatus,
                }
              : previous
        );
      } catch (error) {
        console.error(
          "Update order status error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء تحديث الطلب."
        );
      } finally {
        setActionLoading(
          false
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
            item.id ===
            orderId
        );

      if (!order) {
        return;
      }

      await updateOrderStatus(
        order,
        newStatus
      );
    };

  const deleteOrder =
    async (
      order
    ) => {
      if (!order?.id) {
        return;
      }

      if (
        !window.confirm(
          `هل أنت متأكد من حذف الطلب #${
            order.orderNumber ||
            order.id.slice(0, 8)
          }؟`
        )
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await deleteDoc(
          doc(
            db,
            "orders",
            order.id
          )
        );

        await addActivityLog(
          "حذف طلب",
          `تم حذف الطلب ${order.orderNumber || order.id}`
        );

        if (
          selectedOrder?.id ===
          order.id
        ) {
          closeOrderDetails();
        }

        alert(
          "✅ تم حذف الطلب."
        );
      } catch (error) {
        console.error(
          "Delete order error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حذف الطلب."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const startEditOrder =
    (order) => {
      if (
        !order ||
        !Array.isArray(
          order.products
        ) ||
        order.products.length ===
          0
      ) {
        alert(
          "لا توجد منتجات داخل الطلب لتعديلها."
        );

        return;
      }

      replaceCart(
        order.products
      );

      const editData = {
        customerName:
          order.customerName ||
          order.name ||
          "",

        phone:
          order.phone ||
          order.customerPhone ||
          "",

        address:
          typeof order.address ===
          "object"
            ? getUserAddress({
                address:
                  order.address,
              })
            : (
                order.address ||
                order.customerAddress ||
                ""
              ),

        paymentMethod:
          order.paymentMethod ||
          "",

        paymentStatus:
          order.paymentStatus ||
          "pending",

        status:
          order.status ||
          order.orderStatus ||
          "pending",

        shippingCost:
          Number(
            order.shippingCost ||
            order.shipping ||
            0
          ),
      };

      sessionStorage.setItem(
        "editingOrder",
        JSON.stringify({
          ...editData,
          orderId:
            order.id ||
            "",
          orderNumber:
            order.orderNumber ||
            "",
          shippingZoneId:
            order.shippingZoneId ||
            "",
          shippingZoneName:
            order.shippingZoneName ||
            "",
        })
      );

      navigate(
        "/checkout"
      );
    };

  // ==========================================================
  // USERS
  // ==========================================================

  const openUserDetails =
    (user) => {
      setSelectedUser(
        user
      );

      setShowUserDetails(
        true
      );

      setTab(
        "users"
      );
    };

  const closeUserDetails =
    () => {
      setSelectedUser(
        null
      );

      setShowUserDetails(
        false
      );
    };

  const updateUser =
    async (
      user,
      fields
    ) => {
      if (!user?.id) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await updateDoc(
          doc(
            db,
            "users",
            user.id
          ),
          {
            ...fields,
            updatedAt:
              serverTimestamp(),
          }
        );

        await addActivityLog(
          "تعديل عميل",
          `تم تعديل حساب ${getUserName(user)}`
        );

        alert(
          "✅ تم حفظ بيانات العميل."
        );
      } catch (error) {
        console.error(
          "Update user error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء تعديل العميل."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const deleteUser =
    async (
      user
    ) => {
      if (!user?.id) {
        return;
      }

      if (
        !window.confirm(
          `هل أنت متأكد من حذف حساب "${getUserName(user)}"؟`
        )
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await deleteDoc(
          doc(
            db,
            "users",
            user.id
          )
        );

        await addActivityLog(
          "حذف عميل",
          `تم حذف حساب ${getUserName(user)}`
        );

        if (
          selectedUser?.id ===
          user.id
        ) {
          closeUserDetails();
        }

        alert(
          "✅ تم حذف العميل."
        );
      } catch (error) {
        console.error(
          "Delete user error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حذف العميل."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // GENERIC CRUD
  // ==========================================================

  const getGenericCollection =
    (type) => {
      const map = {
        coupons:
          "coupons",

        announcements:
          "announcements",

        "announcement-bars":
          "announcementBars",

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

        "store-menu":
          "storeMenuItems",
      };

      return map[type] ||
        type;
    };

  const closeGenericForm =
    () => {
      setShowGenericForm(
        false
      );

      setGenericType(
        ""
      );

      setGenericEditingId(
        null
      );

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
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };

  const openGenericForm =
    (
      type,
      item = null
    ) => {
      const fields =
        type === "coupons"
          ? {
              code:
                item?.code ||
                "",
              type:
                item?.type ||
                "percentage",
              value:
                item?.value ??
                0,
              minOrder:
                item?.minOrder ??
                0,
              active:
                item?.active !==
                false,
            }
          : type ===
            "announcements"
          ? {
              title:
                item?.title ||
                "",
              text:
                item?.text ||
                "",
              active:
                item?.active !==
                false,
            }
          : type ===
            "announcement-bars"
          ? {
              text:
                item?.text ||
                "",
              type:
                item?.type ||
                "marquee",
              background:
                item?.background ||
                "#071A36",
              backgroundColor:
                item?.backgroundColor ||
                item?.background ||
                "#071A36",
              textColor:
                item?.textColor ||
                "#FFFFFF",
              fontFamily:
                item?.fontFamily ||
                "Cairo",
              fontSize:
                item?.fontSize ??
                15,
              height:
                item?.height ??
                42,
              speed:
                item?.speed ??
                40,
              direction:
                item?.direction ||
                "rtl",
              sortOrder:
                item?.sortOrder ??
                0,
              enabled:
                item?.enabled !==
                false,
              active:
                item?.active !==
                false,
              link:
                item?.link ||
                "",
            }
          : type ===
            "shipping"
          ? {
              name:
                item?.name ||
                "",
              price:
                item?.price ??
                0,
              active:
                item?.active !==
                false,
            }
          : type ===
            "payments"
          ? {
              name:
                item?.name ||
                "",
              title:
                item?.title ||
                "",
              active:
                item?.active !==
                false,
            }
          : type ===
            "store-menu"
          ? {
              name:
                item?.name ||
                "",
              image:
                item?.image ||
                "",
              icon:
                item?.icon ||
                "📂",
              parentId:
                item?.parentId ||
                "",
              categoryId:
                item?.categoryId ||
                "",
              order:
                item?.order ??
                0,
              active:
                item?.active !==
                false,
            }
          : {
              ...(item ||
                {}),
            };

      setGenericType(
        type
      );

      setGenericEditingId(
        item?.id ||
        null
      );

      setGenericForm(
        fields
      );

      setShowGenericForm(
        true
      );
    };

 const handleGenericSubmit = async (event) => {
  event.preventDefault();

  if (actionLoading) {
    return;
  }

  const collectionName = getGenericCollection(genericType);

  if (!collectionName) {
    alert("❌ لم يتم تحديد مجموعة البيانات.");
    return;
  }

  setActionLoading(true);

  try {
    /*
     * =====================================================
     * تجهيز البيانات
     * =====================================================
     */

    const data = {
      ...genericForm,
    };


const imageFile = data.imageFile;

delete data.id;
delete data.createdAt;
delete data.updatedAt;
delete data.imageFile;
delete data.imagePreview;
    /*
     * =====================================================
     * تحويل القيم الرقمية
     * =====================================================
     */

    const numericFields = [
      "value",
      "minOrder",
      "price",
      "speed",
      "fontSize",
      "height",
      "sortOrder",
      "order",
      "titleFontSize",
      "descriptionFontSize",
      "textPanelOpacity",
      "textPanelBorderRadius",
      "textPanelPadding",
      "textPanelWidth",
      "overlayOpacity",
    ];

    numericFields.forEach((key) => {
      if (key in data) {
        const value = Number(data[key]);

        data[key] = Number.isFinite(value) ? value : 0;
      }
    });

    /*
     * =====================================================
     * Boolean fields
     * =====================================================
     */

    if ("active" in data) {
      data.active = data.active !== false;
    }

    if ("enabled" in data) {
      data.enabled = data.enabled !== false;
    }

    if ("blocked" in data) {
      data.blocked = data.blocked !== false;
    }

    /*
     * =====================================================
     * رفع صورة البنر الجديدة
     * =====================================================
     *
     * مهم جدًا:
     * لو genericType = banners واختار المستخدم صورة جديدة،
     * يتم رفعها إلى Cloudinary ثم حفظ الرابط فقط في Firestore.
     *
     * لو لم يختار صورة جديدة، يتم الاحتفاظ بالصورة القديمة.
     */

    if (
      genericType === "banners" &&
      imageFile instanceof File
    ) {
      console.log("📤 جاري رفع صورة البنر...");

      const uploadedImageUrl =
        await uploadFileToCloudinary(imageFile);

      if (!uploadedImageUrl) {
        throw new Error(
          "❌ فشل رفع صورة البنر."
        );
      }

      data.image = uploadedImageUrl;

      console.log(
        "✅ تم رفع صورة البنر:",
        uploadedImageUrl
      );
    }

    /*
     * =====================================================
     * Store Menu image
     * =====================================================
     */
if (
  genericType === "banners" &&
  imageFile instanceof File
) {
  const uploadedImageUrl =
    await uploadFileToCloudinary(imageFile);

  if (!uploadedImageUrl) {
    throw new Error(
      "❌ فشل رفع صورة البنر."
    );
  }

  data.image = uploadedImageUrl;
}    /*
     * =====================================================
     * تنظيف بيانات البنرات
     * =====================================================
     */

    if (genericType === "banners") {
      data.title = data.title || "";
      data.text = data.text || "";
      data.tag = data.tag || "";
      data.buttonText =
        data.buttonText || "";

      data.link =
        data.link || "/";

      data.image =
        data.image || "";

      data.imageFit =
        data.imageFit || "contain";

      data.imagePosition =
        data.imagePosition || "center";

      data.fontFamily =
        data.fontFamily || "Cairo";

      data.fontWeight =
        String(
          data.fontWeight || "700"
        );

      data.titleFontSize =
        Number(
          data.titleFontSize ?? 42
        );

      data.descriptionFontSize =
        Number(
          data.descriptionFontSize ?? 20
        );

      data.textAlign =
        data.textAlign || "right";

      data.textPositionX =
        data.textPositionX || "right";

      data.textPositionY =
        data.textPositionY || "center";

      data.titleColor =
        data.titleColor || "#ffffff";

      data.descriptionColor =
        data.descriptionColor ||
        "#ffffff";

      data.tagColor =
        data.tagColor || "#ffffff";

      data.textColor =
        data.textColor || "#ffffff";

      data.textPanelEnabled =
        data.textPanelEnabled !== false;

      data.textPanelBackground =
        data.textPanelBackground ||
        "#071A36";

      data.textPanelOpacity =
        Number(
          data.textPanelOpacity ?? 0.72
        );

      data.textPanelBorderRadius =
        Number(
          data.textPanelBorderRadius ?? 16
        );

      data.textPanelPadding =
        Number(
          data.textPanelPadding ?? 24
        );

      data.textPanelWidth =
        Number(
          data.textPanelWidth ?? 520
        );

      data.overlayEnabled =
        data.overlayEnabled !== false;

      data.overlayColor =
        data.overlayColor || "#000000";

      data.overlayOpacity =
        Number(
          data.overlayOpacity ?? 0.35
        );

      data.buttonBackground =
        data.buttonBackground ||
        "#D4AF37";

      data.buttonTextColor =
        data.buttonTextColor ||
        "#071A36";

      data.order =
        Number(data.order) || 0;

      data.active =
        data.active !== false;
    }

    /*
     * =====================================================
     * حفظ / تعديل
     * =====================================================
     */

    if (genericEditingId) {
      console.log(
        "✏️ تعديل:",
        collectionName,
        genericEditingId,
        data
      );

      await updateDoc(
        doc(
          db,
          collectionName,
          genericEditingId
        ),
        {
          ...data,
          updatedAt:
            serverTimestamp(),
        }
      );

      await addActivityLog(
        "تعديل بيانات",
        `تم تعديل بيانات قسم ${genericType}`
      );

      alert(
        "✅ تم تعديل البنر بنجاح."
      );
    } else {
      console.log(
        "➕ إضافة:",
        collectionName,
        data
      );

      await addDoc(
        collection(
          db,
          collectionName
        ),
        {
          ...data,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

      await addActivityLog(
        "إضافة بيانات",
        `تم إضافة بيانات إلى قسم ${genericType}`
      );

      alert(
        "✅ تمت إضافة البنر بنجاح."
      );
    }

    /*
     * =====================================================
     * إغلاق الفورم
     * =====================================================
     */

    closeGenericForm();

  } catch (error) {
    console.error(
      "❌ Generic save error:",
      error
    );

    alert(
      error?.message ||
      "❌ حدث خطأ أثناء حفظ البيانات."
    );
  } finally {
    setActionLoading(false);
  }
};

  const deleteGenericItem =
    async (
      type,
      item
    ) => {
      const collectionName =
        getGenericCollection(
          type
        );

      if (
        !collectionName ||
        !item?.id
      ) {
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
        setActionLoading(
          true
        );

        await deleteDoc(
          doc(
            db,
            collectionName,
            item.id
          )
        );

        await addActivityLog(
          "حذف بيانات",
          `تم حذف عنصر من ${type}`
        );

        alert(
          "✅ تم الحذف بنجاح."
        );
      } catch (error) {
        console.error(
          "Generic delete error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء الحذف."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // STORE SETTINGS
  // ==========================================================

  const handleLogoUpload =
    async (
      event
    ) => {
      const file =
        event.target
          ?.files?.[0];

      if (!file) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        const logoUrl =
          await uploadFileToCloudinary(
            file
          );

        setStoreSettings(
          (previous) => ({
            ...previous,
            logo:
              logoUrl,
          })
        );

        alert(
          "✅ تم رفع اللوجو بنجاح. اضغط حفظ إعدادات المتجر لتثبيته."
        );
      } catch (error) {
        console.error(
          "Logo upload error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء رفع اللوجو."
        );
      } finally {
        setActionLoading(
          false
        );

        event.target.value =
          "";
      }
    };

  const saveStoreSettings =
    async (
      event
    ) => {
      event?.preventDefault?.();

      try {
        setActionLoading(
          true
        );

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
          "✅ تم حفظ إعدادات المتجر."
        );
      } catch (error) {
        console.error(
          "Save store settings error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حفظ الإعدادات."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // WHEEL
  // ==========================================================

  const saveWheelSettings =
    async () => {
      try {
        setActionLoading(
          true
        );

        await setDoc(
          doc(
            db,
            "settings",
            "wheel"
          ),
          {
            enabled:
              wheelSettings.enabled ===
              true,

            displayMode:
              wheelSettings.displayMode ||
              "store",

            popupEnabled:
              wheelSettings.popupEnabled ===
              true,

            popupDelay:
              Math.max(
                0,
                Number(
                  wheelSettings.popupDelay ??
                    1500
                )
              ),

            popupClosable:
              wheelSettings.popupClosable !==
              false,

            popupShowOncePerDay:
              wheelSettings.popupShowOncePerDay ===
              true,

            attemptsPerUser:
              Math.max(
                1,
                Number(
                  wheelSettings.attemptsPerUser ??
                    1
                )
              ),

            title:
              wheelSettings.title ||
              "🎡 جرب حظك!",

            description:
              wheelSettings.description ||
              "لف العجلة واكسب عرضك",

            prizes:
              safeArray(
                wheelSettings.prizes
              ),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await addActivityLog(
          "عجلة الحظ",
          "تم حفظ إعدادات عجلة الحظ"
        );

        alert(
          "✅ تم حفظ إعدادات عجلة الحظ."
        );
      } catch (error) {
        console.error(
          "Wheel save error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حفظ عجلة الحظ."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const addWheelPrize =
    () => {
      setWheelSettings(
        (previous) => ({
          ...previous,

          prizes: [
            ...safeArray(
              previous.prizes
            ),
            {
              id:
                Date.now().toString(),
              title:
                "خصم 10%",
              type:
                "discount",
              value:
                10,
              color:
                "#F68B1E",
              enabled:
                true,
            },
          ],
        })
      );
    };

  const updateWheelPrize =
    (
      index,
      fields
    ) => {
      setWheelSettings(
        (previous) => {
          const prizes =
            [
              ...safeArray(
                previous.prizes
              ),
            ];

          prizes[index] = {
            ...prizes[index],
            ...fields,
          };

          return {
            ...previous,
            prizes,
          };
        }
      );
    };

  const deleteWheelPrize =
    (
      index
    ) => {
      setWheelSettings(
        (previous) => ({
          ...previous,
          prizes:
            safeArray(
              previous.prizes
            ).filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !==
                index
            ),
        })
      );
    };

  // ==========================================================
  // ADMIN MANAGEMENT
  // ==========================================================

  const openAddAdminForm =
    () => {
      setEditingAdmin(
        null
      );

      setAdminForm({
        name: "",
        email: "",
        password: "",
        permissions:
          adminPermissions.map(
            (item) =>
              item.id
          ),
        active: true,
      });

      setShowAdminForm(
        true
      );
    };

  const openEditAdminForm =
    (
      admin
    ) => {
      setEditingAdmin(
        admin
      );

      setAdminForm({
        name:
          admin?.name ||
          "",

        email:
          admin?.email ||
          "",

        password:
          "",

        permissions:
          safeArray(
            admin?.permissions
          ),

        active:
          admin?.active !==
          false,
      });

      setShowAdminForm(
        true
      );
    };

  const closeAdminForm =
    () => {
      setShowAdminForm(
        false
      );

      setEditingAdmin(
        null
      );

      setAdminForm({
        name: "",
        email: "",
        password: "",
        permissions: [],
        active: true,
      });
    };

  const toggleAdminPermission =
    (
      permissionId
    ) => {
      setAdminForm(
        (previous) => {
          const permissions =
            safeArray(
              previous.permissions
            );

          return {
            ...previous,
            permissions:
              permissions.includes(
                permissionId
              )
                ? permissions.filter(
                    (item) =>
                      item !==
                      permissionId
                  )
                : [
                    ...permissions,
                    permissionId,
                  ],
          };
        }
      );
    };

  const selectAllAdminPermissions =
    () => {
      setAdminForm(
        (previous) => ({
          ...previous,
          permissions:
            adminPermissions.map(
              (item) =>
                item.id
            ),
        })
      );
    };

  const clearAllAdminPermissions =
    () => {
      setAdminForm(
        (previous) => ({
          ...previous,
          permissions: [],
        })
      );
    };

  const saveAdmin =
    async () => {
      if (
        !String(
          adminForm.name ||
          ""
        ).trim()
      ) {
        alert(
          "من فضلك اكتب اسم المشرف."
        );
        return;
      }

      if (
        !String(
          adminForm.email ||
          ""
        ).trim()
      ) {
        alert(
          "من فضلك اكتب البريد الإلكتروني."
        );
        return;
      }

      if (
        !editingAdmin &&
        String(
          adminForm.password ||
          ""
        ).length <
          6
      ) {
        alert(
          "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
        );
        return;
      }

      try {
        setActionLoading(
          true
        );

        if (
          editingAdmin?.id
        ) {
          await updateDoc(
            doc(
              db,
              "admins",
              editingAdmin.id
            ),
            {
              name:
                String(
                  adminForm.name
                ).trim(),

              email:
                String(
                  adminForm.email
                )
                  .trim()
                  .toLowerCase(),

              permissions:
                safeArray(
                  adminForm.permissions
                ),

              active:
                adminForm.active !==
                false,

              updatedAt:
                serverTimestamp(),
            }
          );

          alert(
            "✅ تم تعديل المشرف بنجاح."
          );
        } else {
          const functions =
            getFunctions();

          const createAdminAccount =
            httpsCallable(
              functions,
              "createAdminAccount"
            );

          await createAdminAccount({
            name:
              String(
                adminForm.name
              ).trim(),

            email:
              String(
                adminForm.email
              )
                .trim()
                .toLowerCase(),

            password:
              adminForm.password,

            permissions:
              safeArray(
                adminForm.permissions
              ),

            active:
              adminForm.active !==
              false,
          });

          alert(
            "✅ تم إنشاء حساب المشرف بنجاح."
          );
        }

        await addActivityLog(
          editingAdmin
            ? "تعديل مشرف"
            : "إضافة مشرف",
          editingAdmin
            ? `تم تعديل المشرف ${adminForm.email}`
            : `تم إضافة المشرف ${adminForm.email}`
        );

        closeAdminForm();
      } catch (error) {
        console.error(
          "Save admin error:",
          error
        );

        const code =
          error?.code ||
          "";

        if (
          code.includes(
            "already-exists"
          )
        ) {
          alert(
            "❌ البريد الإلكتروني مستخدم بالفعل."
          );
        } else {
          alert(
            error?.message ||
            "❌ حدث خطأ أثناء حفظ المشرف."
          );
        }
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const deleteAdmin =
    async (
      adminId
    ) => {
      if (!adminId) {
        return;
      }

      if (
        !window.confirm(
          "هل أنت متأكد من حذف المشرف؟"
        )
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await deleteDoc(
          doc(
            db,
            "admins",
            adminId
          )
        );

        alert(
          "✅ تم حذف المشرف."
        );
      } catch (error) {
        console.error(
          "Delete admin error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء حذف المشرف."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const toggleAdminActive =
    async (
      admin
    ) => {
      if (!admin?.id) {
        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "admins",
            admin.id
          ),
          {
            active:
              admin.active ===
              false,

            updatedAt:
              serverTimestamp(),
          }
        );
      } catch (error) {
        console.error(
          "Toggle admin error:",
          error
        );

        alert(
          error?.message ||
          "❌ حدث خطأ أثناء تغيير الحالة."
        );
      }
    };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const changeTab =
    (
      nextTab
    ) => {
      setTab(
        nextTab
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

      setShowAdminForm(
        false
      );
    };

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const menuSections = [
    {
      title:
        "الرئيسية",

      items: [
        {
          id:
            "dashboard",
          icon:
            "🏠",
          title:
            "الرئيسية",
        },
        {
          id:
            "reports",
          icon:
            "📈",
          title:
            "الإحصائيات والتقارير",
        },
      ],
    },

    {
      title:
        "المتجر",

      items: [
        {
          id:
            "products",
          icon:
            "📦",
          title:
            "المنتجات",
          count:
            products.length,
        },
        {
          id:
            "categories",
          icon:
            "📂",
          title:
            "الأقسام",
          count:
            categories.length,
        },
        {
          id:
            "offers",
          icon:
            "⭐",
          title:
            "العروض",
          count:
            offerProducts.length,
        },
        {
          id:
            "bestsellers",
          icon:
            "🔥",
          title:
            "الأكثر مبيعًا",
          count:
            bestSellerProducts.length,
        },
        {
          id:
            "new-arrivals",
          icon:
            "🆕",
          title:
            "المنتجات الجديدة",
          count:
            newArrivalProducts.length,
        },
        {
          id:
            "recommended",
          icon:
            "👍",
          title:
            "المنتجات المقترحة",
          count:
            recommendedProducts.length,
        },
      ],
    },

    {
      title:
        "العملاء والطلبات",

      items: [
        {
          id:
            "users",
          icon:
            "👥",
          title:
            "المستخدمون",
          count:
            users.length,
        },
        {
          id:
            "customers",
          icon:
            "🧑‍💼",
          title:
            "العملاء",
          count:
            users.length,
        },
        {
          id:
            "orders",
          icon:
            "🛒",
          title:
            "الطلبات",
          count:
            orders.length,
        },
        {
          id:
            "sales",
          icon:
            "💰",
          title:
            "المبيعات",
        },
        {
          id:
            "favorites",
          icon:
            "❤️",
          title:
            "المفضلة",
          count:
            favorites.length,
        },
        {
          id:
            "blocked-users",
          icon:
            "🚫",
          title:
            "المحظورون",
          count:
            blockedUsers.length,
        },
        {
          id:
            "support",
          icon:
            "💬",
          title:
            "خدمة العملاء",
          count:
            supportMessages.length,
        },
        {
          id:
            "store-menu",
          icon:
            "🏪",
          title:
            "واجهة المتجر",
        },
      ],
    },

    {
      title:
        "التسويق",

      items: [
        {
          id:
            "banners",
          icon:
            "🖼️",
          title:
            "البانرات",
          count:
            banners.length,
        },
        {
          id:
            "coupons",
          icon:
            "🏷️",
          title:
            "الكوبونات والخصومات",
          count:
            coupons.length,
        },
        {
          id:
            "wheel",
          icon:
            "🎡",
          title:
            "عجلة الحظ",
        },
        {
          id:
            "announcements",
          icon:
            "📢",
          title:
            "الإعلانات",
          count:
            announcements.length,
        },
        {
          id:
            "notifications",
          icon:
            "🔔",
          title:
            "الإشعارات",
          count:
            unreadNotifications,
        },
        {
          id:
            "announcement-bars",
          icon:
            "📜",
          title:
            "أشرطة الإعلانات",
          count:
            announcementBars.length,
        },
      ],
    },

    {
      title:
        "الإعدادات",

      items: [
        {
          id:
            "settings",
          icon:
            "⚙️",
          title:
            "إعدادات المتجر",
        },
        {
          id:
            "shipping",
          icon:
            "🚚",
          title:
            "الشحن والتوصيل",
          count:
            shippingZones.length,
        },
        {
          id:
            "payments",
          icon:
            "💳",
          title:
            "طرق الدفع",
          count:
            paymentMethods.length,
        },
        {
          id:
            "contact",
          icon:
            "📱",
          title:
            "بيانات التواصل",
        },
        {
          id:
            "admins",
          icon:
            "🔐",
          title:
            "المشرفون والصلاحيات",
          count:
            admins.length,
        },
        {
          id:
            "activity-log",
          icon:
            "📝",
          title:
            "سجل العمليات",
          count:
            activityLogs.length,
        },
        {
          id:
            "security",
          icon:
            "🔑",
          title:
            "الأمان",
        },
      ],
    },
  ];

  // ==========================================================
  // GENERIC DEFINITIONS
  // ==========================================================

  const genericSections = [
    {
      id:
        "coupons",
      icon:
        "🏷️",
      title:
        "الكوبونات والخصومات",
      collectionType:
        "coupons",
      data:
        coupons,
      fields: [
        {
          name:
            "code",
          label:
            "كود الخصم",
          type:
            "text",
        },
        {
          name:
            "type",
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
          name:
            "value",
          label:
            "قيمة الخصم",
          type:
            "number",
        },
        {
          name:
            "minOrder",
          label:
            "الحد الأدنى للطلب",
          type:
            "number",
        },
        {
          name:
            "active",
          label:
            "الكوبون مفعل",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "announcements",
      icon:
        "📢",
      title:
        "الإعلانات",
      collectionType:
        "announcements",
      data:
        announcements,
      fields: [
        {
          name:
            "title",
          label:
            "العنوان",
          type:
            "text",
        },
        {
          name:
            "text",
          label:
            "نص الإعلان",
          type:
            "textarea",
        },
        {
          name:
            "active",
          label:
            "الإعلان مفعل",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "announcement-bars",
      icon:
        "📜",
      title:
        "أشرطة الإعلانات",
      collectionType:
        "announcement-bars",
      data:
        announcementBars,
      fields: [
        {
          name:
            "text",
          label:
            "نص الشريط",
          type:
            "textarea",
        },
        {
          name:
            "type",
          label:
            "نوع الشريط",
          type:
            "select",
          options: [
            [
              "marquee",
              "شريط متحرك",
            ],
            [
              "text",
              "نص عادي",
            ],
            [
              "offer",
              "عرض",
            ],
            [
              "alert",
              "تنبيه",
            ],
            [
              "discount",
              "خصم",
            ],
            [
              "shipping",
              "شحن",
            ],
          ],
        },
        {
          name:
            "background",
          label:
            "لون الخلفية",
          type:
            "color",
        },
        {
          name:
            "textColor",
          label:
            "لون النص",
          type:
            "color",
        },
        {
          name:
            "fontFamily",
          label:
            "نوع الخط",
          type:
            "text",
        },
        {
          name:
            "fontSize",
          label:
            "حجم الخط",
          type:
            "number",
        },
        {
          name:
            "height",
          label:
            "الارتفاع",
          type:
            "number",
        },
        {
          name:
            "speed",
          label:
            "السرعة",
          type:
            "number",
        },
        {
          name:
            "direction",
          label:
            "الاتجاه",
          type:
            "select",
          options: [
            [
              "rtl",
              "من اليمين لليسار",
            ],
            [
              "ltr",
              "من اليسار لليمين",
            ],
          ],
        },
        {
          name:
            "link",
          label:
            "الرابط",
          type:
            "text",
        },
        {
          name:
            "active",
          label:
            "الشريط مفعل",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "shipping",
      icon:
        "🚚",
      title:
        "الشحن والتوصيل",
      collectionType:
        "shipping",
      data:
        shippingZones,
      fields: [
        {
          name:
            "name",
          label:
            "اسم المنطقة",
          type:
            "text",
        },
        {
          name:
            "price",
          label:
            "سعر الشحن",
          type:
            "number",
        },
        {
          name:
            "active",
          label:
            "المنطقة مفعلة",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "payments",
      icon:
        "💳",
      title:
        "طرق الدفع",
      collectionType:
        "payments",
      data:
        paymentMethods,
      fields: [
        {
          name:
            "name",
          label:
            "اسم طريقة الدفع",
          type:
            "text",
        },
        {
          name:
            "title",
          label:
            "العنوان الظاهر",
          type:
            "text",
        },
        {
          name:
            "active",
          label:
            "مفعلة",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "store-menu",
      icon:
        "🏪",
      title:
        "واجهة المتجر",
      collectionType:
        "store-menu",
      data:
        storeMenuItems,
      fields: [
        {
          name:
            "name",
          label:
            "اسم العنصر",
          type:
            "text",
        },
        {
          name:
            "icon",
          label:
            "الأيقونة",
          type:
            "text",
        },
        {
          name:
            "categoryId",
          label:
            "القسم",
          type:
            "select-category",
        },
        {
          name:
            "order",
          label:
            "الترتيب",
          type:
            "number",
        },
        {
          name:
            "active",
          label:
            "نشط",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "support",
      icon:
        "💬",
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
      id:
        "notifications",
      icon:
        "🔔",
      title:
        "الإشعارات",
      collectionType:
        "notifications",
      data:
        notifications,
      readOnly:
        false,
      fields: [
        {
          name:
            "title",
          label:
            "عنوان الإشعار",
          type:
            "text",
        },
        {
          name:
            "message",
          label:
            "نص الإشعار",
          type:
            "textarea",
        },
        {
          name:
            "active",
          label:
            "مفعل",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "favorites",
      icon:
        "❤️",
      title:
        "المفضلة",
      collectionType:
        "favorites",
      data:
        favorites,
      readOnly:
        false,
      fields: [
        {
          name:
            "productId",
          label:
            "معرف المنتج",
          type:
            "text",
        },
        {
          name:
            "userId",
          label:
            "معرف العميل",
          type:
            "text",
        },
      ],
    },

    {
      id:
        "blocked-users",
      icon:
        "🚫",
      title:
        "العملاء المحظورون",
      collectionType:
        "blocked-users",
      data:
        blockedUsers,
      readOnly:
        false,
      fields: [
        {
          name:
            "userId",
          label:
            "معرف العميل",
          type:
            "text",
        },
        {
          name:
            "reason",
          label:
            "سبب الحظر",
          type:
            "textarea",
        },
        {
          name:
            "active",
          label:
            "محظور",
          type:
            "checkbox",
        },
      ],
    },

    {
      id:
        "activity-log",
      icon:
        "📝",
      title:
        "سجل العمليات",
      collectionType:
        "activityLogs",
      data:
        activityLogs,
      readOnly:
        true,
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  if (
    adminAccessLoading
  ) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <div
          className="empty-state"
          style={{
            minHeight:
              "100vh",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            flexDirection:
              "column",
          }}
        >
          <div
            style={{
              fontSize:
                "48px",
              marginBottom:
                "16px",
            }}
          >
            🔐
          </div>

          <h2>
            جاري تجهيز لوحة الإدارة...
          </h2>

          <p>
            يتم التحقق من صلاحيات الحساب.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="admin-page"
      dir="rtl"
    >
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

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
              لوحة الإدارة الاحترافية
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
                  {section.title}
                </div>

                {section.items.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      className={
                        tab ===
                        item.id
                          ? "admin-menu-item active"
                          : "admin-menu-item"
                      }
                      onClick={() =>
                        changeTab(
                          item.id
                        )
                      }
                    >
                      <span
                        className="admin-menu-icon"
                      >
                        {item.icon}
                      </span>

                      <span
                        className="admin-menu-text"
                      >
                        {item.title}
                      </span>

                      {item.count !==
                        undefined && (
                        <span
                          className="admin-menu-count"
                        >
                          {item.count}
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

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="admin-main"
      >
        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header
          className="admin-topbar"
        >
          <div>
            <h1>
              {menuSections
                .flatMap(
                  (
                    section
                  ) =>
                    section.items
                )
                .find(
                  (item) =>
                    item.id ===
                    tab
                )?.title ||
                "لوحة الإدارة"}
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
              {totalSales.toLocaleString(
                "ar-EG"
              )}{" "}
              ج.م
            </span>

            <button
              type="button"
              className="back-to-store-btn"
              onClick={() =>
                navigate(
                  "/"
                )
              }
            >
              🏠 العودة للمتجر
            </button>
          </div>
        </header>

        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {tab ===
          "dashboard" && (
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
                  setTab(
                    "users"
                  )
                }
              >
                <h3>
                  👥 المستخدمون
                </h3>

                <p>
                  {users.length}
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "products"
                  )
                }
              >
                <h3>
                  📦 المنتجات
                </h3>

                <p>
                  {products.length}
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "categories"
                  )
                }
              >
                <h3>
                  📂 الأقسام
                </h3>

                <p>
                  {categories.length}
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "orders"
                  )
                }
              >
                <h3>
                  🛒 الطلبات
                </h3>

                <p>
                  {orders.length}
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "orders"
                  )
                }
              >
                <h3>
                  ⏳ طلبات معلقة
                </h3>

                <p>
                  {pendingOrders}
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "orders"
                  )
                }
              >
                <h3>
                  ✅ طلبات مكتملة
                </h3>

                <p>
                  {deliveredOrders}
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "sales"
                  )
                }
              >
                <h3>
                  💰 إجمالي المبيعات
                </h3>

                <p>
                  {totalSales.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() =>
                  setTab(
                    "sales"
                  )
                }
              >
                <h3>
                  💳 المدفوع إلكترونيًا
                </h3>

                <p>
                  {paidSales.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </p>
              </button>
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
                      setTab(
                        "orders"
                      )
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
                        <th>
                          الطلب
                        </th>
                        <th>
                          العميل
                        </th>
                        <th>
                          الإجمالي
                        </th>
                        <th>
                          الحالة
                        </th>
                        <th>
                          التاريخ
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (
                            order
                          ) => {
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
                                <td
                                  dir="ltr"
                                >
                                  #
                                  {order.orderNumber ||
                                    order.id?.slice(
                                      0,
                                      8
                                    )}
                                </td>

                                <td>
                                  {order.customerName ||
                                    order.name ||
                                    "عميل"}
                                </td>

                                <td>
                                  {Number(
                                    order.total ||
                                      order.grandTotal ||
                                      order.amount ||
                                      0
                                  ).toLocaleString(
                                    "ar-EG"
                                  )}{" "}
                                  ج.م
                                </td>

                                <td>
                                  <span
                                    className={`order-status status-${status}`}
                                  >
                                    {getOrderStatusText(
                                      status
                                    )}
                                  </span>
                                </td>

                                <td>
                                  {formatDate(
                                    order.createdAt
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}

                      {orders.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan="5"
                          >
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
                      setTab(
                        "users"
                      )
                    }
                  >
                    عرض العملاء
                  </button>
                </div>

                <div
                  className="dashboard-users-list"
                >
                  {sortedUsers
                    .slice(
                      0,
                      8
                    )
                    .map(
                      (
                        user
                      ) => (
                        <button
                          type="button"
                          className="dashboard-user-item"
                          key={
                            user.id
                          }
                          onClick={() =>
                            openUserDetails(
                              user
                            )
                          }
                        >
                          <span>
                            👤
                          </span>

                          <div>
                            <strong>
                              {getUserName(
                                user
                              )}
                            </strong>

                            <small>
                              {getUserEmail(
                                user
                              )}
                            </small>
                          </div>
                        </button>
                      )
                    )}

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

        {tab ===
          "products" && (
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
                  إجمالي المنتجات:{" "}
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
                onChange={(
                  event
                ) =>
                  setProductSearch(
                    event.target
                      .value
                  )
                }
              />

              {productSearch && (
                <button
                  type="button"
                  onClick={() =>
                    setProductSearch(
                      ""
                    )
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
                  {editingProduct
                    ? "✏️ تعديل المنتج"
                    : "➕ إضافة منتج جديد"}
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

                  <label
                    className="form-group-full"
                  >
                    <span>
                      🖼️ صورة المنتج
                    </span>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={
                        handleProductImageChange
                      }
                    />

                    {productForm.imagePreview && (
                      <img
                        src={
                          productForm.imagePreview
                        }
                        alt="معاينة المنتج"
                        style={{
                          width:
                            "120px",
                          height:
                            "120px",
                          objectFit:
                            "cover",
                          marginTop:
                            "10px",
                          borderRadius:
                            "10px",
                        }}
                      />
                    )}

                    {!productForm.imagePreview &&
                      productForm.image && (
                        <img
                          src={
                            productForm.image
                          }
                          alt="صورة المنتج"
                          style={{
                            width:
                              "120px",
                            height:
                              "120px",
                            objectFit:
                              "cover",
                            marginTop:
                              "10px",
                            borderRadius:
                              "10px",
                          }}
                        />
                      )}
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
                        (
                          category
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {getCategoryFullName(
                              category.id
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className="form-group-full"
                  >
                    <span>
                      وصف المنتج
                    </span>

                    <textarea
                      name="description"
                      rows="4"
                      value={
                        productForm.description
                      }
                      onChange={
                        handleProductChange
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
                    {actionLoading
                      ? "⏳ جاري الحفظ..."
                      : "💾 حفظ المنتج"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      resetProductForm
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
                    <th>
                      الصورة
                    </th>
                    <th>
                      المنتج
                    </th>
                    <th>
                      السعر
                    </th>
                    <th>
                      القسم
                    </th>
                    <th>
                      الحالة
                    </th>
                    <th>
                      إجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="6"
                      >
                        لا توجد منتجات.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(
                      (
                        product
                      ) => (
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
                              {product.title ||
                                product.name ||
                                "بدون اسم"}
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
                              {Number(
                                product.price ||
                                  0
                              ).toLocaleString(
                                "ar-EG"
                              )}{" "}
                              ج.م
                            </strong>

                            {Number(
                              product.oldPrice ||
                                0
                            ) > 0 && (
                              <small
                                style={{
                                  display:
                                    "block",
                                  textDecoration:
                                    "line-through",
                                }}
                              >
                                {Number(
                                  product.oldPrice ||
                                    0
                                ).toLocaleString(
                                  "ar-EG"
                                )}{" "}
                                ج.م
                              </small>
                            )}
                          </td>

                          <td>
                            {getCategoryFullName(
                              product.categoryId
                            ) ||
                              "بدون قسم"}
                          </td>

                          <td>
                            {product.active !==
                            false ? (
                              <span className="status-active">
                                ✅ مفعل
                              </span>
                            ) : (
                              <span className="status-inactive">
                                ⛔ غير مفعل
                              </span>
                            )}
                          </td>

                          <td>
                            <div
                              className="table-actions"
                            >
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  handleEditProduct(
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

        {/* ====================================================
            CATEGORIES
        ==================================================== */}

        {tab ===
          "categories" && (
          <div
            className="table-container categories-section"
          >
            <div
              className="section-header"
            >
              <div>
                <h2>
                  📂 إدارة الأقسام
                </h2>

                <p>
                  إجمالي الأقسام:{" "}
                  <strong>
                    {categories.length}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="save-btn"
                onClick={() => {
                  setEditingCategory(
                    null
                  );

                  setCategoryForm({
                    name: "",
                    description:
                      "",
                    image: "",
                    categoryNumber:
                      "",
                    whatsapp:
                      "",
                    parentId:
                      "",
                    active:
                      true,
                    color:
                      DEFAULT_PRIMARY,
                    cardSize:
                      "medium",
                    sortOrder:
                      0,
                  });

                  setShowCategoryForm(
                    true
                  );
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
                onChange={(
                  event
                ) =>
                  setCategorySearch(
                    event.target
                      .value
                  )
                }
              />
            </div>

            {showCategoryForm && (
              <form
                className="admin-form"
                onSubmit={
                  handleCategorySubmit
                }
              >
                <h3>
                  {editingCategory
                    ? "✏️ تعديل القسم"
                    : "➕ إضافة قسم جديد"}
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
                      inputMode="numeric"
                    />
                  </label>

                  <label>
                    <span>
                      📱 رقم واتساب القسم
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
                          (
                            category
                          ) =>
                            category.id !==
                            editingCategory?.id
                        )
                        .map(
                          (
                            category
                          ) => (
                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                            >
                              {getCategoryFullName(
                                category.id
                              )}
                            </option>
                          )
                        )}
                    </select>
                  </label>

                  <label>
                    <span>
                      🖼️ صورة القسم
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleCategoryImageUpload
                      }
                    />

                    {categoryForm.image && (
                      <img
                        src={
                          categoryForm.image
                        }
                        alt="صورة القسم"
                        style={{
                          width:
                            "110px",
                          height:
                            "110px",
                          marginTop:
                            "10px",
                          objectFit:
                            "cover",
                          borderRadius:
                            "12px",
                        }}
                      />
                    )}
                  </label>

                  <label>
                    <span>
                      🎨 لون القسم
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
                        name="color"
                        value={
                          categoryForm.color ||
                          DEFAULT_PRIMARY
                        }
                        onChange={
                          handleCategoryChange
                        }
                      />

                      <input
                        type="text"
                        name="color"
                        dir="ltr"
                        value={
                          categoryForm.color ||
                          DEFAULT_PRIMARY
                        }
                        onChange={
                          handleCategoryChange
                        }
                      />
                    </div>
                  </label>

                  <label>
                    <span>
                      📏 حجم بطاقة القسم
                    </span>

                    <select
                      name="cardSize"
                      value={
                        categoryForm.cardSize ||
                        "medium"
                      }
                      onChange={
                        handleCategoryChange
                      }
                    >
                      <option value="small">
                        صغير
                      </option>

                      <option value="medium">
                        متوسط
                      </option>

                      <option value="large">
                        كبير
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>
                      🔢 ترتيب القسم
                    </span>

                    <input
                      type="number"
                      min="0"
                      name="sortOrder"
                      value={
                        categoryForm.sortOrder ??
                        0
                      }
                      onChange={
                        handleCategoryChange
                      }
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
                      rows="4"
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
                  className="category-live-preview"
                >
                  <h3>
                    👁️ معاينة القسم
                  </h3>

                  <div
                    className="category-preview-area"
                  >
                    <div
                      className={`category-preview-card ${
                        categoryForm.cardSize ||
                        "medium"
                      }`}
                      style={{
                        "--category-color":
                          categoryForm.color ||
                          DEFAULT_PRIMARY,
                      }}
                    >
                      <div className="category-preview-image">
                        {categoryForm.image ? (
                          <img
                            src={
                              categoryForm.image
                            }
                            alt={
                              categoryForm.name ||
                              "القسم"
                            }
                          />
                        ) : (
                          <div className="category-preview-icon">
                            📂
                          </div>
                        )}
                      </div>

                      <div className="category-preview-content">
                        <h4>
                          {categoryForm.name ||
                            "اسم القسم"}
                        </h4>

                        {categoryForm.description && (
                          <p>
                            {
                              categoryForm.description
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
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
                    {actionLoading
                      ? "⏳ جاري الحفظ..."
                      : "💾 حفظ القسم"}
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
                    <th>
                      الصورة
                    </th>
                    <th>
                      القسم
                    </th>
                    <th>
                      اللون
                    </th>
                    <th>
                      الحجم
                    </th>
                    <th>
                      الترتيب
                    </th>
                    <th>
                      الرقم
                    </th>
                    <th>
                      القسم الأب
                    </th>
                    <th>
                      واتساب
                    </th>
                    <th>
                      الحالة
                    </th>
                    <th>
                      إجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="10"
                      >
                        لا توجد أقسام.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories
                      .slice()
                      .sort(
                        (
                          a,
                          b
                        ) =>
                          Number(
                            a.sortOrder ||
                              0
                          ) -
                          Number(
                            b.sortOrder ||
                              0
                          )
                      )
                      .map(
                        (
                          category
                        ) => (
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
                                "📂"
                              )}
                            </td>

                            <td>
                              <strong>
                                {category.parentId
                                  ? "↳ "
                                  : "📂 "}
                                {
                                  category.name
                                }
                              </strong>
                            </td>

                            <td>
                              <span
                                style={{
                                  width:
                                    "25px",
                                  height:
                                    "25px",
                                  display:
                                    "inline-block",
                                  borderRadius:
                                    "6px",
                                  background:
                                    category.color ||
                                    DEFAULT_PRIMARY,
                                  border:
                                    "1px solid #ddd",
                                  marginLeft:
                                    "8px",
                                  verticalAlign:
                                    "middle",
                                }}
                              />

                              <small
                                dir="ltr"
                              >
                                {category.color ||
                                  DEFAULT_PRIMARY}
                              </small>
                            </td>

                            <td>
                              {category.cardSize ===
                              "small"
                                ? "صغير"
                                : category.cardSize ===
                                  "large"
                                ? "كبير"
                                : "متوسط"}
                            </td>

                            <td>
                              {category.sortOrder ||
                                0}
                            </td>

                            <td>
                              {category.categoryNumber ||
                                "—"}
                            </td>

                            <td>
                              {categoryMap[
                                category.parentId
                              ]?.name ||
                                "قسم رئيسي"}
                            </td>

                            <td
                              dir="ltr"
                            >
                              {category.whatsapp ||
                                "—"}
                            </td>

                            <td>
                              {category.active !==
                              false
                                ? "🟢 نشط"
                                : "🔴 متوقف"}
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
          </div>
        )}

        {/* ====================================================
            ORDERS
        ==================================================== */}

        {tab ===
          "orders" && (
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
                  إجمالي الطلبات:{" "}
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
                onChange={(
                  event
                ) =>
                  setOrderSearch(
                    event.target
                      .value
                  )
                }
              />

              <select
                value={
                  orderStatusFilter
                }
                onChange={(
                  event
                ) =>
                  setOrderStatusFilter(
                    event.target
                      .value
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
                      (
                        order
                      ) =>
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
                    <th>
                      رقم الطلب
                    </th>
                    <th>
                      العميل
                    </th>
                    <th>
                      الهاتف
                    </th>
                    <th>
                      التاريخ
                    </th>
                    <th>
                      الدفع
                    </th>
                    <th>
                      الإجمالي
                    </th>
                    <th>
                      الحالة
                    </th>
                    <th>
                      إجراء
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="8"
                      >
                        لا توجد طلبات.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(
                      (
                        order
                      ) => {
                        const status =
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
                            <td
                              dir="ltr"
                            >
                              #
                              {order.orderNumber ||
                                order.id?.slice(
                                  0,
                                  8
                                )}
                            </td>

                            <td>
                              <strong>
                                {order.customerName ||
                                  order.name ||
                                  "عميل"}
                              </strong>

                              <small
                                style={{
                                  display:
                                    "block",
                                }}
                              >
                                {order.email ||
                                  ""}
                              </small>
                            </td>

                            <td
                              dir="ltr"
                            >
                              {order.phone ||
                                order.customerPhone ||
                                "—"}
                            </td>

                            <td>
                              {formatDate(
                                order.createdAt
                              )}
                            </td>

                            <td>
                              <div>
                                {getPaymentMethodText(
                                  order.paymentMethod
                                )}

                                <small
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >
                                  {getPaymentStatusText(
                                    paymentStatus
                                  )}
                                </small>
                              </div>
                            </td>

                            <td>
                              <strong>
                                {Number(
                                  order.total ||
                                    order.grandTotal ||
                                    order.amount ||
                                    0
                                ).toLocaleString(
                                  "ar-EG"
                                )}{" "}
                                ج.م
                              </strong>
                            </td>

                            <td>
                              <select
                                value={
                                  status
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleOrderStatusChange(
                                    order.id,
                                    event.target
                                      .value
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
                                  className="edit-btn"
                                  onClick={() =>
                                    handleEditOrder(
                                      order
                                    )
                                  }
                                >
                                  ✏️ تعديل
                                </button>

                                {status !==
                                  "cancelled" && (
                                  <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                      updateOrderStatus(
                                        order,
                                        "cancelled"
                                      )
                                    }
                                  >
                                    ❌ إلغاء
                                  </button>
                                )}

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
            ORDER DETAILS MODAL
        ==================================================== */}

        {showOrderDetails &&
          selectedOrder && (
            <div
              className="order-details-overlay"
              onClick={(
                event
              ) => {
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

                    <strong
                      dir="ltr"
                    >
                      #
                      {selectedOrder.orderNumber ||
                        selectedOrder.id}
                    </strong>
                  </div>

                  <div>
                    <span>
                      اسم العميل
                    </span>

                    {editingOrder ? (
                      <input
                        value={
                          editOrderData.customerName
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              customerName:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    ) : (
                      <strong>
                        {selectedOrder.customerName ||
                          selectedOrder.name ||
                          "—"}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      الهاتف
                    </span>

                    {editingOrder ? (
                      <input
                        dir="ltr"
                        value={
                          editOrderData.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              phone:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    ) : (
                      <strong
                        dir="ltr"
                      >
                        {selectedOrder.phone ||
                          selectedOrder.customerPhone ||
                          "—"}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      البريد الإلكتروني
                    </span>

                    <strong>
                      {selectedOrder.email ||
                        selectedOrder.customerEmail ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      العنوان
                    </span>

                    {editingOrder ? (
                      <textarea
                        rows="3"
                        value={
                          editOrderData.address
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              address:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    ) : (
                      <strong>
                        {typeof selectedOrder.address ===
                        "object"
                          ? getUserAddress({
                              address:
                                selectedOrder.address,
                            })
                          : selectedOrder.address ||
                            selectedOrder.customerAddress ||
                            "—"}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      التاريخ
                    </span>

                    <strong>
                      {formatDate(
                        selectedOrder.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      طريقة الدفع
                    </span>

                    {editingOrder ? (
                      <select
                        value={
                          editOrderData.paymentMethod
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              paymentMethod:
                                event.target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="">
                          اختر طريقة الدفع
                        </option>

                        {paymentMethods.map(
                          (
                            method
                          ) => (
                            <option
                              key={
                                method.id
                              }
                              value={
                                method.id
                              }
                            >
                              {method.title ||
                                method.name ||
                                "طريقة دفع"}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <strong>
                        {getPaymentMethodText(
                          selectedOrder.paymentMethod
                        )}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      حالة الطلب
                    </span>

                    {editingOrder ? (
                      <select
                        value={
                          editOrderData.status
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              status:
                                event.target
                                  .value,
                            })
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
                    ) : (
                      <strong>
                        {getOrderStatusText(
                          selectedOrder.status ||
                            selectedOrder.orderStatus
                        )}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      حالة الدفع
                    </span>

                    {editingOrder ? (
                      <select
                        value={
                          editOrderData.paymentStatus
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              paymentStatus:
                                event.target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="pending">
                          قيد الانتظار
                        </option>
                        <option value="paid">
                          مدفوع
                        </option>
                        <option value="failed">
                          فشل الدفع
                        </option>
                        <option value="refunded">
                          مسترد
                        </option>
                      </select>
                    ) : (
                      <strong
                        className={getPaymentStatusClass(
                          selectedOrder.paymentStatus
                        )}
                      >
                        {getPaymentStatusText(
                          selectedOrder.paymentStatus
                        )}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      تكلفة الشحن
                    </span>

                    {editingOrder ? (
                      <input
                        type="number"
                        min="0"
                        value={
                          editOrderData.shippingCost
                        }
                        onChange={(
                          event
                        ) =>
                          setEditOrderData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              shippingCost:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    ) : (
                      <strong>
                        {Number(
                          selectedOrder.shippingCost ||
                            selectedOrder.shipping ||
                            0
                        ).toLocaleString(
                          "ar-EG"
                        )}{" "}
                        ج.م
                      </strong>
                    )}
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
                  selectedOrder.products.length >
                    0 ? (
                    selectedOrder.products.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="order-product-row"
                          key={
                            `${selectedOrder.id}-${index}`
                          }
                        >
                          <div>
                            <strong>
                              {item.title ||
                                item.name ||
                                item.productName ||
                                "منتج"}
                            </strong>

                            {(item.variantName ||
                              item.selectedVariant?.name) && (
                              <small
                                style={{
                                  display:
                                    "block",
                                }}
                              >
                                المتغير:{" "}
                                {item.variantName ||
                                  item.selectedVariant?.name}
                              </small>
                            )}
                          </div>

                          <span>
                            ×{" "}
                            {Number(
                              item.quantity ||
                                item.qty ||
                                1
                            )}
                          </span>

                          <strong>
                            {Number(
                              item.price ||
                                0
                            ).toLocaleString(
                              "ar-EG"
                            )}{" "}
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
                  <div>
                    <span>
                      إجمالي المنتجات
                    </span>

                    <strong>
                      {Number(
                        selectedOrder.subtotal ||
                          0
                      ).toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ج.م
                    </strong>
                  </div>

                  <div>
                    <span>
                      الخصم
                    </span>

                    <strong>
                      -{" "}
                      {Number(
                        selectedOrder.discount ||
                          0
                      ).toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ج.م
                    </strong>
                  </div>

                  <div>
                    <span>
                      الشحن
                    </span>

                    <strong>
                      {Number(
                        selectedOrder.shipping ||
                          selectedOrder.shippingCost ||
                          0
                      ).toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ج.م
                    </strong>
                  </div>

                  <div>
                    <span>
                      الإجمالي النهائي
                    </span>

                    <strong>
                      {Number(
                        selectedOrder.total ||
                          selectedOrder.grandTotal ||
                          selectedOrder.amount ||
                          0
                      ).toLocaleString(
                        "ar-EG"
                      )}{" "}
                      ج.م
                    </strong>
                  </div>
                </div>

                <div
                  className="order-details-actions"
                >
                  {editingOrder ? (
                    <>
                      <button
                        type="button"
                        className="save-btn"
                        disabled={
                          actionLoading
                        }
                        onClick={
                          saveOrderEdit
                        }
                      >
                        💾 حفظ التعديلات
                      </button>

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() =>
                          setEditingOrder(
                            false
                          )
                        }
                      >
                        إلغاء التعديل
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          handleEditOrder(
                            selectedOrder
                          )
                        }
                      >
                        ✏️ تعديل الطلب
                      </button>

                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          startEditOrder(
                            selectedOrder
                          )
                        }
                      >
                        🧺 تعديل المنتجات
                      </button>

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() =>
                          updateOrderStatus(
                            selectedOrder,
                            "cancelled"
                          )
                        }
                      >
                        ❌ إلغاء الطلب
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          deleteOrder(
                            selectedOrder
                          )
                        }
                      >
                        🗑️ حذف الطلب
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="back-btn"
                    onClick={
                      closeOrderDetails
                    }
                  >
                    🔙 العودة للطلبات
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* ====================================================
            USERS
        ==================================================== */}

        {tab ===
          "users" && (
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
                  إجمالي الحسابات:{" "}
                  <strong>
                    {users.length}
                  </strong>
                </p>
              </div>
            </div>

            {!showUserDetails && (
              <>
                <div
                  className="accounts-search"
                >
                  <input
                    type="search"
                    placeholder="🔎 ابحث بالاسم أو البريد أو الهاتف..."
                    value={
                      userSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setUserSearch(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

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
                        {userSearch
                          ? "لا توجد نتائج"
                          : "لا توجد حسابات"}
                      </h3>
                    </div>
                  ) : (
                    sortedUsers.map(
                      (
                        user
                      ) => {
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
                            <div className="account-avatar">
                              👤
                            </div>

                            <div className="account-list-info">
                              <h3>
                                {getUserName(
                                  user
                                )}
                              </h3>

                              <p>
                                {getUserEmail(
                                  user
                                )}
                              </p>

                              <small>
                                📱{" "}
                                {getUserPhone(
                                  user
                                )}
                              </small>
                            </div>

                            <div className="account-list-meta">
                              <span>
                                📦{" "}
                                {
                                  userOrders.length
                                }{" "}
                                طلب
                              </span>

                              <span>
                                💰{" "}
                                {totalPurchases.toLocaleString(
                                  "ar-EG"
                                )}{" "}
                                ج.م
                              </span>

                              <span>
                                🔐{" "}
                                {getLoginCount(
                                  user
                                )}{" "}
                                دخول
                              </span>
                            </div>

                            <div className="account-arrow">
                              ←
                            </div>
                          </button>
                        );
                      }
                    )
                  )}
                </div>
              </>
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
                        {getUserName(
                          selectedUser
                        )}
                      </h2>

                      <p>
                        {getUserEmail(
                          selectedUser
                        )}
                      </p>
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
                        <span>
                          الاسم
                        </span>

                        <strong>
                          {getUserName(
                            selectedUser
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          البريد
                        </span>

                        <strong dir="ltr">
                          {getUserEmail(
                            selectedUser
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          الهاتف
                        </span>

                        <strong dir="ltr">
                          {getUserPhone(
                            selectedUser
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          العنوان
                        </span>

                        <strong>
                          {getUserAddress(
                            selectedUser
                          )}
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
                          {getUserTotalPurchases(
                            selectedUser.id
                          ).toLocaleString(
                            "ar-EG"
                          )}{" "}
                          ج.م
                        </strong>
                      </div>

                      <div>
                        <span>
                          عدد مرات الدخول
                        </span>

                        <strong>
                          {getLoginCount(
                            selectedUser
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          تاريخ التسجيل
                        </span>

                        <strong>
                          {formatDate(
                            selectedUser.createdAt
                          )}
                        </strong>
                      </div>
                    </div>
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
                        {selectedUserOrders.map(
                          (
                            order
                          ) => (
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
                                  {order.orderNumber ||
                                    order.id?.slice(
                                      0,
                                      8
                                    )}
                                </strong>

                                <span>
                                  {formatDate(
                                    order.createdAt
                                  )}
                                </span>
                              </div>

                              <div
                                className="user-order-products"
                              >
                                {safeArray(
                                  order.products
                                ).map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <div
                                      key={
                                        `${order.id}-${index}`
                                      }
                                    >
                                      <span>
                                        {item.title ||
                                          item.name ||
                                          item.productName ||
                                          "منتج"}
                                      </span>

                                      <span>
                                        ×{" "}
                                        {Number(
                                          item.quantity ||
                                            item.qty ||
                                            1
                                        )}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>

                              <div
                                className="user-order-footer"
                              >
                                <strong>
                                  {Number(
                                    order.total ||
                                      order.grandTotal ||
                                      order.amount ||
                                      0
                                  ).toLocaleString(
                                    "ar-EG"
                                  )}{" "}
                                  ج.م
                                </strong>

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
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="form-actions"
                  >
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() =>
                        updateUser(
                          selectedUser,
                          {
                            active:
                              selectedUser.active ===
                              false,
                          }
                        )
                      }
                    >
                      🔄 تغيير حالة الحساب
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        deleteUser(
                          selectedUser
                        )
                      }
                    >
                      🗑️ حذف الحساب
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ====================================================
            OFFERS
        ==================================================== */}

        {[
          {
            id:
              "offers",
            title:
              "⭐ إدارة العروض",
            icon:
              "⭐",
            data:
              offerProducts,
          },
          {
            id:
              "bestsellers",
            title:
              "🔥 الأكثر مبيعًا",
            icon:
              "🔥",
            data:
              bestSellerProducts,
          },
          {
            id:
              "new-arrivals",
            title:
              "🆕 المنتجات الجديدة",
            icon:
              "🆕",
            data:
              newArrivalProducts,
          },
          {
            id:
              "recommended",
            title:
              "👍 المنتجات المقترحة",
            icon:
              "👍",
            data:
              recommendedProducts,
          },
        ].map(
          (
            section
          ) =>
            tab ===
              section.id && (
              <div
                className="table-container"
                key={
                  section.id
                }
              >
                <div
                  className="section-header"
                >
                  <div>
                    <h2>
                      {
                        section.title
                      }
                    </h2>

                    <p>
                      إجمالي المنتجات:{" "}
                      <strong>
                        {
                          section
                            .data
                            .length
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
                        <th>
                          الصورة
                        </th>
                        <th>
                          المنتج
                        </th>
                        <th>
                          السعر
                        </th>
                        <th>
                          القسم
                        </th>
                        <th>
                          إجراء
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {section.data.length ===
                        0 ? (
                        <tr>
                          <td
                            colSpan="5"
                          >
                            لا توجد منتجات.
                          </td>
                        </tr>
                      ) : (
                        section.data.map(
                          (
                            product
                          ) => (
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
                                <strong>
                                  {product.title ||
                                    product.name ||
                                    "بدون اسم"}
                                </strong>
                              </td>

                              <td>
                                {Number(
                                  product.price ||
                                    0
                                ).toLocaleString(
                                  "ar-EG"
                                )}{" "}
                                ج.م
                              </td>

                              <td>
                                {getCategoryFullName(
                                  product.categoryId
                                ) ||
                                  "بدون قسم"}
                              </td>

                              <td>
                                <div
                                  className="table-actions"
                                >
                                  <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() =>
                                      handleEditProduct(
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
            )
        )}

        {/* ====================================================
            REPORTS
        ==================================================== */}

        {tab ===
          "reports" && (
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
                  نظرة شاملة على المتجر.
                </p>
              </div>
            </div>

            <div
              className="admin-stats"
            >
              <div
                className="stat-card"
              >
                <h3>
                  👥 العملاء
                </h3>
                <p>
                  {users.length}
                </p>
              </div>

              <div
                className="stat-card"
              >
                <h3>
                  📦 المنتجات
                </h3>
                <p>
                  {products.length}
                </p>
              </div>

              <div
                className="stat-card"
              >
                <h3>
                  📂 الأقسام
                </h3>
                <p>
                  {categories.length}
                </p>
              </div>

              <div
                className="stat-card"
              >
                <h3>
                  🛒 الطلبات
                </h3>
                <p>
                  {orders.length}
                </p>
              </div>

              <div
                className="stat-card"
              >
                <h3>
                  💰 المبيعات
                </h3>
                <p>
                  {totalSales.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </p>
              </div>

              <div
                className="stat-card"
              >
                <h3>
                  💳 المدفوع إلكترونيًا
                </h3>
                <p>
                  {paidSales.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            SALES
        ==================================================== */}

        {tab ===
          "sales" && (
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
                  ملخص المبيعات والمدفوعات.
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
                  {totalSales.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>
              </div>

              <div>
                <span>
                  المدفوع إلكترونيًا
                </span>

                <strong>
                  {paidSales.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>
              </div>

              <div>
                <span>
                  غير المدفوع إلكترونيًا
                </span>

                <strong>
                  {Math.max(
                    totalSales -
                      paidSales,
                    0
                  ).toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>
              </div>

              <div>
                <span>
                  متوسط الطلب
                </span>

                <strong>
                  {orders.length
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
                    : "0"}{" "}
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
                    <th>
                      رقم الطلب
                    </th>
                    <th>
                      العميل
                    </th>
                    <th>
                      التاريخ
                    </th>
                    <th>
                      الدفع
                    </th>
                    <th>
                      الحالة
                    </th>
                    <th>
                      الإجمالي
                    </th>
                    <th>
                      إجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map(
                    (
                      order
                    ) => (
                      <tr
                        key={
                          order.id
                        }
                      >
                        <td
                          dir="ltr"
                        >
                          #
                          {order.orderNumber ||
                            order.id?.slice(
                              0,
                              8
                            )}
                        </td>

                        <td>
                          {order.customerName ||
                            order.name ||
                            "عميل"}
                        </td>

                        <td>
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        <td>
                          {getPaymentMethodText(
                            order.paymentMethod
                          )}
                        </td>

                        <td>
                          <span
                            className={`order-status status-${
                              order.status ||
                              order.orderStatus ||
                              "pending"
                            }`}
                          >
                            {getOrderStatusText(
                              order.status ||
                                order.orderStatus
                            )}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {Number(
                              order.total ||
                                order.grandTotal ||
                                order.amount ||
                                0
                            ).toLocaleString(
                              "ar-EG"
                            )}{" "}
                            ج.م
                          </strong>
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
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
{/* ====================================================
    BANNERS
==================================================== */}

{tab === "banners" && (

  <div className="table-container">

    {/* ==================================================
        HEADER
    ================================================== */}

    <div className="section-header">

      <div>

        <h2>
          🖼️ إدارة البانرات الاحترافية
        </h2>

        <p>
          تحكم كامل في الصور والنصوص والألوان والخطوط
          ومظهر البانر ومكان المحتوى.
        </p>

      </div>


      <button
        type="button"
        className="add-btn"
        onClick={() => {

          setGenericType("banners");

          setGenericEditingId(null);

          setGenericForm({

            // ==============================
            // BASIC
            // ==============================

            title: "",
            text: "",
            link: "/",
            tag: "🔥 عرض خاص",
            buttonText: "تسوق الآن",

            // ==============================
            // ORDER / STATUS
            // ==============================

            order: 0,
            active: true,

            // ==============================
            // IMAGE
            // ==============================

            image: "",
            imageFile: null,
            imagePreview: "",

            imageFit: "contain",
            imagePosition: "center",

            // ==============================
            // FONT
            // ==============================

            fontFamily: "Cairo",
            fontWeight: "700",

            titleFontSize: 42,
            descriptionFontSize: 20,

            textAlign: "right",

            textPositionX: "right",
            textPositionY: "center",

            // ==============================
            // TEXT COLORS
            // ==============================

            titleColor: "#ffffff",
            descriptionColor: "#ffffff",
            tagColor: "#ffffff",

            // backward compatibility
            textColor: "#ffffff",

            // ==============================
            // TEXT PANEL
            // ==============================

            textPanelEnabled: true,

            textPanelBackground: "#071A36",

            textPanelOpacity: 0.72,

            textPanelBorderRadius: 16,

            textPanelPadding: 24,

            textPanelWidth: 520,

            // ==============================
            // OVERLAY
            // ==============================

            overlayEnabled: true,
            overlayColor: "#000000",
            overlayOpacity: 0.35,

            // ==============================
            // BUTTON COLORS
            // ==============================

            buttonBackground: "#D4AF37",
            buttonTextColor: "#071A36",

          });

          setShowGenericForm(true);

        }}
      >
        ➕ إضافة بانر
      </button>

    </div>


    {/* ==================================================
        BANNER FORM
    ================================================== */}

    {showGenericForm &&
      genericType === "banners" && (

        <form
          className="admin-form"
          onSubmit={handleGenericSubmit}
        >

          {/* ==================================================
              FORM TITLE
          ================================================== */}

          <h3>

            {genericEditingId
              ? "✏️ تعديل البانر"
              : "➕ إضافة بانر جديد"}

          </h3>


          {/* ==================================================
              BASIC CONTENT
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              📝 محتوى البانر
            </h3>


            <div className="form-grid">

              {/* ================================
                  TITLE
              ================================= */}

              <label>

                <span>
                  عنوان البانر
                </span>

                <input
                  type="text"
                  name="title"
                  value={
                    genericForm.title || ""
                  }
                  onChange={
                    handleGenericChange
                  }
                  placeholder="مثال: خصومات حتى 50%"
                />

              </label>


              {/* ================================
                  DESCRIPTION
              ================================= */}

              <label>

                <span>
                  الوصف الرئيسي
                </span>

                <textarea
                  name="text"
                  rows="3"
                  value={
                    genericForm.text || ""
                  }
                  onChange={
                    handleGenericChange
                  }
                  placeholder="أفضل الأسعار على آلاف المنتجات"
                />

              </label>


              {/* ================================
                  TAG
              ================================= */}

              <label>

                <span>
                  🏷️ الشارة
                </span>

                <input
                  type="text"
                  name="tag"
                  value={
                    genericForm.tag || ""
                  }
                  onChange={
                    handleGenericChange
                  }
                  placeholder="🔥 عرض خاص"
                />

              </label>


              {/* ================================
                  BUTTON TEXT
              ================================= */}

              <label>

                <span>
                  🔘 نص الزر
                </span>

                <input
                  type="text"
                  name="buttonText"
                  value={
                    genericForm.buttonText || ""
                  }
                  onChange={
                    handleGenericChange
                  }
                  placeholder="تسوق الآن"
                />

              </label>


              {/* ================================
                  LINK
              ================================= */}

              <label>

                <span>
                  🔗 الرابط
                </span>

                <input
                  type="text"
                  name="link"
                  dir="ltr"
                  value={
                    genericForm.link || ""
                  }
                  onChange={
                    handleGenericChange
                  }
                  placeholder="/ أو /category/..."
                />

              </label>


              {/* ================================
                  ORDER
              ================================= */}

              <label>

                <span>
                  🔢 ترتيب البانر
                </span>

                <input
                  type="number"
                  name="order"
                  min="0"
                  value={
                    genericForm.order ?? 0
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>

            </div>

          </div>


          {/* ==================================================
              IMAGE
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              🖼️ صورة البانر
            </h3>


            <div className="form-grid">

              {/* ================================
                  UPLOAD
              ================================= */}

              <label className="form-group-full">

                <span>
                  اختيار صورة البانر
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={(event) => {

                    const file =
                      event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    if (
                      ![
                        "image/jpeg",
                        "image/jpg",
                        "image/png",
                        "image/webp",
                      ].includes(file.type)
                    ) {

                      alert(
                        "من فضلك اختر JPG أو PNG أو WEBP فقط."
                      );

                      event.target.value = "";

                      return;
                    }

                    if (
                      file.size >
                      10 * 1024 * 1024
                    ) {

                      alert(
                        "حجم الصورة يجب ألا يتجاوز 10MB."
                      );

                      event.target.value = "";

                      return;
                    }

                    const preview =
                      URL.createObjectURL(file);

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

                <small
                  style={{
                    display: "block",
                    marginTop: "7px",
                    color: "#666",
                  }}
                >
                  الصورة سيتم رفعها تلقائيًا إلى Cloudinary.
                  يدعم JPG / PNG / WEBP حتى 10MB.
                </small>

              </label>


              {/* ================================
                  FIT
              ================================= */}

              <label>

                <span>
                  📐 طريقة احتواء الصورة
                </span>

                <select
                  name="imageFit"
                  value={
                    genericForm.imageFit ||
                    "contain"
                  }
                  onChange={
                    handleGenericChange
                  }
                >

                  <option value="contain">
                    إظهار الصورة كاملة
                  </option>

                  <option value="cover">
                    ملء البانر بالكامل
                  </option>

                </select>

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#777",
                  }}
                >
                  اختر "إظهار الصورة كاملة" لعرض الصورة كاملة
                  مهما كان مقاسها الأصلي.
                </small>

              </label>


              {/* ================================
                  POSITION
              ================================= */}

              <label>

                <span>
                  🎯 موضع الصورة
                </span>

                <select
                  name="imagePosition"
                  value={
                    genericForm.imagePosition ||
                    "center"
                  }
                  onChange={
                    handleGenericChange
                  }
                >

                  <option value="center">
                    المنتصف
                  </option>

                  <option value="top">
                    أعلى
                  </option>

                  <option value="bottom">
                    أسفل
                  </option>

                  <option value="left">
                    يسار
                  </option>

                  <option value="right">
                    يمين
                  </option>

                </select>

              </label>

            </div>


            {/* ================================
                IMAGE PREVIEW
            ================================= */}

            {(genericForm.image ||
              genericForm.imagePreview) && (

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "14px",
                  background: "#f8fafc",
                }}
              >

                <strong
                  style={{
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  👁️ معاينة الصورة
                </strong>

                <div
                  style={{
                    width: "100%",
                    minHeight: "220px",
                    maxHeight: "420px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: "12px",
                    background: "#111827",
                  }}
                >

                  <img
                    src={
                      genericForm.imagePreview ||
                      genericForm.image
                    }
                    alt="معاينة البانر"
                    style={{
                      width: "100%",
                      height: "100%",
                      maxHeight: "400px",
                      objectFit:
                        genericForm.imageFit ||
                        "contain",
                      objectPosition:
                        genericForm.imagePosition ||
                        "center",
                      display: "block",
                    }}
                  />

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              TYPOGRAPHY
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              🔤 إعدادات الخطوط والنصوص
            </h3>


            <div className="form-grid">

              {/* ================================
                  FONT FAMILY
              ================================= */}

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

                  <option value="Verdana">
                    Verdana
                  </option>

                  <option value="Trebuchet MS">
                    Trebuchet MS
                  </option>

                  <option value="Georgia">
                    Georgia
                  </option>

                  <option value="Times New Roman">
                    Times New Roman
                  </option>

                  <option value="sans-serif">
                    Sans Serif
                  </option>

                </select>

              </label>


              {/* ================================
                  FONT WEIGHT
              ================================= */}

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


              {/* ================================
                  TITLE SIZE
              ================================= */}

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
                    genericForm.titleFontSize ??
                    42
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>


              {/* ================================
                  DESCRIPTION SIZE
              ================================= */}

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
                    genericForm.descriptionFontSize ??
                    20
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>


              {/* ================================
                  TEXT ALIGN
              ================================= */}

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


              {/* ================================
                  HORIZONTAL POSITION
              ================================= */}

              <label>

                <span>
                  ↔️ موضع المحتوى أفقيًا
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


              {/* ================================
                  VERTICAL POSITION
              ================================= */}

              <label>

                <span>
                  ↕️ موضع المحتوى رأسيًا
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

            </div>

          </div>


          {/* ==================================================
              COLORS
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              🎨 التحكم الكامل في الألوان
            </h3>


            <div className="form-grid">

              {/* ================================
                  TITLE COLOR
              ================================= */}

              <label>

                <span>
                  🎨 لون العنوان
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="titleColor"
                    value={
                      genericForm.titleColor ||
                      "#ffffff"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="titleColor"
                    dir="ltr"
                    value={
                      genericForm.titleColor ||
                      "#ffffff"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  DESCRIPTION COLOR
              ================================= */}

              <label>

                <span>
                  🎨 لون الوصف
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="descriptionColor"
                    value={
                      genericForm.descriptionColor ||
                      "#ffffff"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="descriptionColor"
                    dir="ltr"
                    value={
                      genericForm.descriptionColor ||
                      "#ffffff"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  TAG COLOR
              ================================= */}

              <label>

                <span>
                  🏷️ لون الشارة
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="tagColor"
                    value={
                      genericForm.tagColor ||
                      "#ffffff"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="tagColor"
                    dir="ltr"
                    value={
                      genericForm.tagColor ||
                      "#ffffff"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  BUTTON BACKGROUND
              ================================= */}

              <label>

                <span>
                  🔘 خلفية الزر
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="buttonBackground"
                    value={
                      genericForm.buttonBackground ||
                      "#D4AF37"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="buttonBackground"
                    dir="ltr"
                    value={
                      genericForm.buttonBackground ||
                      "#D4AF37"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  BUTTON TEXT
              ================================= */}

              <label>

                <span>
                  🔘 لون نص الزر
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="buttonTextColor"
                    value={
                      genericForm.buttonTextColor ||
                      "#071A36"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="buttonTextColor"
                    dir="ltr"
                    value={
                      genericForm.buttonTextColor ||
                      "#071A36"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  OVERLAY COLOR
              ================================= */}

              <label>

                <span>
                  🌑 لون طبقة الصورة
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="overlayColor"
                    value={
                      genericForm.overlayColor ||
                      "#000000"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="overlayColor"
                    dir="ltr"
                    value={
                      genericForm.overlayColor ||
                      "#000000"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  OVERLAY OPACITY
              ================================= */}

              <label>

                <span>
                  🌑 شفافية طبقة الصورة
                </span>

                <input
                  type="number"
                  name="overlayOpacity"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    genericForm.overlayOpacity ??
                    0.35
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>

            </div>

          </div>


          {/* ==================================================
              TEXT PANEL / BACKGROUND
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              🪟 خلفية النص الرئيسية والثانوية
            </h3>


            <div className="form-grid">

              {/* ================================
                  ENABLE
              ================================= */}

              <label
                className="admin-checkbox"
                style={{
                  alignSelf: "center",
                }}
              >

                <input
                  type="checkbox"
                  name="textPanelEnabled"
                  checked={
                    genericForm.textPanelEnabled !==
                    false
                  }
                  onChange={
                    handleGenericChange
                  }
                />

                <span>
                  إظهار خلفية خلف النص
                </span>

              </label>


              {/* ================================
                  BACKGROUND COLOR
              ================================= */}

              <label>

                <span>
                  🎨 لون خلفية النص
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="color"
                    name="textPanelBackground"
                    value={
                      genericForm.textPanelBackground ||
                      "#071A36"
                    }
                    onChange={
                      handleGenericChange
                    }
                    style={{
                      width: "60px",
                      height: "44px",
                      padding: "3px",
                      cursor: "pointer",
                    }}
                  />

                  <input
                    type="text"
                    name="textPanelBackground"
                    dir="ltr"
                    value={
                      genericForm.textPanelBackground ||
                      "#071A36"
                    }
                    onChange={
                      handleGenericChange
                    }
                  />

                </div>

              </label>


              {/* ================================
                  OPACITY
              ================================= */}

              <label>

                <span>
                  💧 شفافية خلفية النص
                </span>

                <input
                  type="number"
                  name="textPanelOpacity"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    genericForm.textPanelOpacity ??
                    0.72
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>


              {/* ================================
                  RADIUS
              ================================= */}

              <label>

                <span>
                  ◼️ تدوير حواف خلفية النص
                </span>

                <input
                  type="number"
                  name="textPanelBorderRadius"
                  min="0"
                  max="50"
                  value={
                    genericForm.textPanelBorderRadius ??
                    16
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>


              {/* ================================
                  PADDING
              ================================= */}

              <label>

                <span>
                  📦 المسافة الداخلية للنص
                </span>

                <input
                  type="number"
                  name="textPanelPadding"
                  min="0"
                  max="80"
                  value={
                    genericForm.textPanelPadding ??
                    24
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>


              {/* ================================
                  WIDTH
              ================================= */}

              <label>

                <span>
                  ↔️ عرض صندوق النص
                </span>

                <input
                  type="number"
                  name="textPanelWidth"
                  min="200"
                  max="900"
                  value={
                    genericForm.textPanelWidth ??
                    520
                  }
                  onChange={
                    handleGenericChange
                  }
                />

              </label>

            </div>


            <div
              style={{
                marginTop: "15px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                lineHeight: "1.8",
                color: "#475569",
              }}
            >

              💡 يمكنك تشغيل أو إلغاء خلفية النص،
              واختيار لونها وشفافيتها وحجمها وحوافها
              بشكل مستقل عن صورة البانر.

            </div>

          </div>


          {/* ==================================================
              ACTIVE
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              ⚙️ حالة البانر
            </h3>


            <div className="form-grid">

              <label>

                <span>
                  ✅ حالة البانر
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
                    🟢 مفعل
                  </option>

                  <option value="false">
                    🔴 غير مفعل
                  </option>

                </select>

              </label>

            </div>

          </div>


          {/* ==================================================
              LIVE PREVIEW
          ================================================== */}

          <div className="admin-form-card">

            <h3>
              👁️ معاينة البانر
            </h3>


            <div
              style={{
                width: "100%",
                minHeight: "280px",
                maxHeight: "520px",
                overflow: "hidden",
                borderRadius:
                  `${Math.max(
                    0,
                    Number(
                      genericForm.textPanelBorderRadius ??
                      16
                    )
                  )}px`,
                position: "relative",
                background:
                  "#111827",
              }}
            >

              {/* ================================
                  IMAGE
              ================================= */}

              {(genericForm.imagePreview ||
                genericForm.image) ? (

                <img
                  src={
                    genericForm.imagePreview ||
                    genericForm.image
                  }
                  alt="معاينة البانر"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit:
                      genericForm.imageFit ||
                      "contain",
                    objectPosition:
                      genericForm.imagePosition ||
                      "center",
                    display: "block",
                    background:
                      "#111827",
                  }}
                />

              ) : (

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    background:
                      "#1f2937",
                    fontSize: "18px",
                  }}
                >
                  🖼️ اختر صورة البانر للمعاينة
                </div>

              )}


              {/* ================================
                  OVERLAY
              ================================= */}

              {genericForm.overlayEnabled !==
                false && (

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      genericForm.overlayColor ||
                      "#000000",
                    opacity:
                      Math.min(
                        1,
                        Math.max(
                          0,
                          Number(
                            genericForm.overlayOpacity ??
                            0.35
                          )
                        )
                      ),
                    pointerEvents:
                      "none",
                  }}
                />

              )}


              {/* ================================
                  CONTENT
              ================================= */}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems:
                    genericForm.textPositionY ===
                    "top"
                      ? "flex-start"
                      : genericForm.textPositionY ===
                        "bottom"
                      ? "flex-end"
                      : "center",

                  justifyContent:
                    genericForm.textPositionX ===
                    "left"
                      ? "flex-start"
                      : genericForm.textPositionX ===
                        "center"
                      ? "center"
                      : "flex-end",

                  padding:
                    "25px",
                }}
              >

                <div
                  style={{
                    width:
                      `${Math.min(
                        900,
                        Math.max(
                          200,
                          Number(
                            genericForm.textPanelWidth ??
                            520
                          )
                        )
                      )}px`,

                    maxWidth:
                      "92%",

                    padding:
                      genericForm.textPanelEnabled !==
                      false
                        ? `${Math.max(
                            0,
                            Number(
                              genericForm.textPanelPadding ??
                              24
                            )
                          )}px`
                        : "0",

                    borderRadius:
                      `${Math.max(
                        0,
                        Number(
                          genericForm.textPanelBorderRadius ??
                          16
                        )
                      )}px`,

                    background:
                      genericForm.textPanelEnabled !==
                      false
                        ? genericForm.textPanelBackground ||
                          "#071A36"
                        : "transparent",

                    opacity:
                      1,

                    position:
                      "relative",

                    textAlign:
                      genericForm.textAlign ||
                      "right",

                    direction:
                      "rtl",
                  }}
                >

                  {/* ================================
                      TAG
                  ================================= */}

                  {genericForm.tag && (

                    <span
                      style={{
                        display:
                          "inline-block",

                        color:
                          genericForm.tagColor ||
                          genericForm.textColor ||
                          "#ffffff",

                        fontFamily:
                          genericForm.fontFamily ||
                          "Cairo",

                        fontWeight:
                          genericForm.fontWeight ||
                          "700",

                        marginBottom:
                          "8px",
                      }}
                    >

                      {
                        genericForm.tag
                      }

                    </span>

                  )}


                  {/* ================================
                      TITLE
                  ================================= */}

                  {genericForm.title && (

                    <h2
                      style={{
                        margin:
                          "6px 0",

                        color:
                          genericForm.titleColor ||
                          genericForm.textColor ||
                          "#ffffff",

                        fontFamily:
                          genericForm.fontFamily ||
                          "Cairo",

                        fontWeight:
                          genericForm.fontWeight ||
                          "700",

                        fontSize:
                          `${Math.max(
                            16,
                            Number(
                              genericForm.titleFontSize ??
                              42
                            )
                          )}px`,

                        lineHeight:
                          "1.25",
                      }}
                    >

                      {
                        genericForm.title
                      }

                    </h2>

                  )}


                  {/* ================================
                      DESCRIPTION
                  ================================= */}

                  {genericForm.text && (

                    <p
                      style={{
                        margin:
                          "8px 0 16px",

                        color:
                          genericForm.descriptionColor ||
                          genericForm.textColor ||
                          "#ffffff",

                        fontFamily:
                          genericForm.fontFamily ||
                          "Cairo",

                        fontSize:
                          `${Math.max(
                            10,
                            Number(
                              genericForm.descriptionFontSize ??
                              20
                            )
                          )}px`,

                        fontWeight:
                          "400",

                        lineHeight:
                          "1.8",
                      }}
                    >

                      {
                        genericForm.text
                      }

                    </p>

                  )}


                  {/* ================================
                      BUTTON
                  ================================= */}

                  {genericForm.buttonText && (

                    <button
                      type="button"
                      style={{
                        border: "none",
                        padding:
                          "11px 22px",
                        borderRadius:
                          "8px",

                        background:
                          genericForm.buttonBackground ||
                          "#D4AF37",

                        color:
                          genericForm.buttonTextColor ||
                          "#071A36",

                        fontFamily:
                          genericForm.fontFamily ||
                          "Cairo",

                        fontWeight:
                          genericForm.fontWeight ||
                          "700",

                        cursor:
                          "default",
                      }}
                    >

                      {
                        genericForm.buttonText
                      }

                      {" "}

                      ←

                    </button>

                  )}

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="form-actions">

            <button
              type="submit"
              className="save-btn"
              disabled={
                actionLoading
              }
            >

              {actionLoading
                ? "⏳ جاري حفظ البانر..."
                : genericEditingId
                ? "💾 حفظ تعديلات البانر"
                : "💾 حفظ البانر"}

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


    {/* ==================================================
        BANNERS TABLE
    ================================================== */}

    <div className="table-scroll">

      <table className="admin-table">

        <thead>

          <tr>

            <th>
              الصورة
            </th>

            <th>
              البانر
            </th>

            <th>
              الترتيب
            </th>

            <th>
              الحالة
            </th>

            <th>
              إجراءات
            </th>

          </tr>

        </thead>


        <tbody>

          {banners.length === 0 ? (

            <tr>

              <td
                colSpan="5"
                style={{
                  textAlign: "center",
                  padding: "35px",
                }}
              >
                لا توجد بانرات حاليًا.
              </td>

            </tr>

          ) : (

            banners
              .slice()
              .sort(
                (a, b) =>
                  Number(
                    a?.order ?? 0
                  ) -
                  Number(
                    b?.order ?? 0
                  )
              )
              .map(
                (banner) => (

                  <tr
                    key={
                      banner.id
                    }
                  >

                    {/* ==========================
                        IMAGE
                    =========================== */}

                    <td>

                      {banner.image ? (

                        <img
                          src={
                            banner.image
                          }
                          className="table-img"
                          alt={
                            banner.title ||
                            "بانر"
                          }
                          style={{
                            width:
                              "150px",

                            height:
                              "70px",

                            objectFit:
                              banner.imageFit ||
                              "contain",

                            background:
                              "#111827",

                            borderRadius:
                              "8px",
                          }}
                        />

                      ) : (

                        <div
                          className="table-img-placeholder"
                        >
                          🖼️
                        </div>

                      )}

                    </td>


                    {/* ==========================
                        CONTENT
                    =========================== */}

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


                    {/* ==========================
                        ORDER
                    =========================== */}

                    <td>

                      {
                        banner.order ??
                        0
                      }

                    </td>


                    {/* ==========================
                        STATUS
                    =========================== */}

                    <td>

                      {banner.active !==
                      false ? (

                        <span
                          className="status-active"
                        >
                          🟢 مفعل
                        </span>

                      ) : (

                        <span
                          className="status-inactive"
                        >
                          🔴 متوقف
                        </span>

                      )}

                    </td>


                    {/* ==========================
                        ACTIONS
                    =========================== */}

                    <td>

                      <div
                        className="table-actions"
                      >

                        {/* EDIT */}

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

                              // ======================
                              // BASIC
                              // ======================

                              title:
                                banner.title ||
                                "",

                              text:
                                banner.text ||
                                banner.description ||
                                "",

                              link:
                                banner.link ||
                                "/",

                              tag:
                                banner.tag ||
                                banner.badge ||
                                "🔥 عرض خاص",

                              buttonText:
                                banner.buttonText ||
                                banner.button ||
                                "تسوق الآن",

                              order:
                                Number(
                                  banner.order ??
                                  0
                                ),

                              active:
                                banner.active !==
                                false,

                              // ======================
                              // IMAGE
                              // ======================

                              image:
                                banner.image ||
                                "",

                              imageFile:
                                null,

                              imagePreview:
                                "",

                              imageFit:
                                banner.imageFit ||
                                "contain",

                              imagePosition:
                                banner.imagePosition ||
                                "center",

                              // ======================
                              // FONT
                              // ======================

                              fontFamily:
                                banner.fontFamily ||
                                "Cairo",

                              fontWeight:
                                banner.fontWeight ||
                                "700",

                              titleFontSize:
                                Number(
                                  banner.titleFontSize ??
                                  42
                                ),

                              descriptionFontSize:
                                Number(
                                  banner.descriptionFontSize ??
                                  20
                                ),

                              textAlign:
                                banner.textAlign ||
                                "right",

                              textPositionX:
                                banner.textPositionX ||
                                "right",

                              textPositionY:
                                banner.textPositionY ||
                                "center",

                              // ======================
                              // COLORS
                              // ======================

                              titleColor:
                                banner.titleColor ||
                                banner.textColor ||
                                "#ffffff",

                              descriptionColor:
                                banner.descriptionColor ||
                                banner.textColor ||
                                "#ffffff",

                              tagColor:
                                banner.tagColor ||
                                banner.textColor ||
                                "#ffffff",

                              textColor:
                                banner.textColor ||
                                "#ffffff",

                              buttonBackground:
                                banner.buttonBackground ||
                                "#D4AF37",

                              buttonTextColor:
                                banner.buttonTextColor ||
                                "#071A36",

                              overlayEnabled:
                                banner.overlayEnabled !==
                                false,

                              overlayColor:
                                banner.overlayColor ||
                                "#000000",

                              overlayOpacity:
                                Number(
                                  banner.overlayOpacity ??
                                  0.35
                                ),

                              // ======================
                              // TEXT PANEL
                              // ======================

                              textPanelEnabled:
                                banner.textPanelEnabled !==
                                false,

                              textPanelBackground:
                                banner.textPanelBackground ||
                                "#071A36",

                              textPanelOpacity:
                                Number(
                                  banner.textPanelOpacity ??
                                  0.72
                                ),

                              textPanelBorderRadius:
                                Number(
                                  banner.textPanelBorderRadius ??
                                  16
                                ),

                              textPanelPadding:
                                Number(
                                  banner.textPanelPadding ??
                                  24
                                ),

                              textPanelWidth:
                                Number(
                                  banner.textPanelWidth ??
                                  520
                                ),

                            });

                            setShowGenericForm(
                              true
                            );

                          }}
                        >
                          ✏️ تعديل
                        </button>


                        {/* DELETE */}

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

          )}

        </tbody>

      </table>

    </div>

  </div>

)}
        {/* ====================================================
            WHEEL
        ==================================================== */}

        {tab ===
          "wheel" && (
          <div
            className="table-container"
          >
            <div
              className="section-header"
            >
              <div>
                <h2>
                  🎡 عجلة الحظ
                </h2>

                <p>
                  إدارة العجلة والجوائز وطريقة الظهور.
                </p>
              </div>
            </div>

            <div
              className="admin-form-grid"
            >
              <div
                className="form-group"
              >
                <label>
                  حالة العجلة
                </label>

                <label
                  className="admin-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={
                      wheelSettings.enabled ===
                      true
                    }
                    onChange={(
                      event
                    ) =>
                      setWheelSettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          enabled:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    تفعيل عجلة الحظ
                  </span>
                </label>
              </div>

              <div
                className="form-group"
              >
                <label>
                  طريقة الظهور
                </label>

                <select
                  value={
                    wheelSettings.displayMode ||
                    "store"
                  }
                  onChange={(
                    event
                  ) =>
                    setWheelSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        displayMode:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option value="store">
                    🛍️ داخل المتجر
                  </option>

                  <option value="popup">
                    🔔 Popup
                  </option>

                  <option value="both">
                    ✨ الاثنين
                  </option>
                </select>
              </div>

              <div
                className="form-group"
              >
                <label>
                  العنوان
                </label>

                <input
                  value={
                    wheelSettings.title ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setWheelSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        title:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div
                className="form-group"
              >
                <label>
                  الوصف
                </label>

                <input
                  value={
                    wheelSettings.description ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setWheelSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div
                className="form-group"
              >
                <label>
                  عدد المحاولات اليومية
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    wheelSettings.attemptsPerUser ||
                    1
                  }
                  onChange={(
                    event
                  ) =>
                    setWheelSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        attemptsPerUser:
                          Math.max(
                            1,
                            Number(
                              event.target
                                .value
                            ) || 1
                          ),
                      })
                    )
                  }
                />
              </div>

              <div
                className="form-group"
              >
                <label>
                  تأخير Popup بالمللي ثانية
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    wheelSettings.popupDelay ??
                    1500
                  }
                  onChange={(
                    event
                  ) =>
                    setWheelSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        popupDelay:
                          Math.max(
                            0,
                            Number(
                              event.target
                                .value
                            ) || 0
                          ),
                      })
                    )
                  }
                />
              </div>

              <div
                className="form-group"
              >
                <label
                  className="admin-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={
                      wheelSettings.popupEnabled ===
                      true
                    }
                    onChange={(
                      event
                    ) =>
                      setWheelSettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          popupEnabled:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    تفعيل Popup
                  </span>
                </label>
              </div>

              <div
                className="form-group"
              >
                <label
                  className="admin-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={
                      wheelSettings.popupClosable !==
                      false
                    }
                    onChange={(
                      event
                    ) =>
                      setWheelSettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          popupClosable:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    السماح بالإغلاق
                  </span>
                </label>
              </div>

              <div
                className="form-group"
              >
                <label
                  className="admin-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={
                      wheelSettings.popupShowOncePerDay ===
                      true
                    }
                    onChange={(
                      event
                    ) =>
                      setWheelSettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          popupShowOncePerDay:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    مرة واحدة يوميًا
                  </span>
                </label>
              </div>
            </div>

            <div
              className="section-header"
              style={{
                marginTop:
                  "30px",
              }}
            >
              <div>
                <h2>
                  🎁 الجوائز
                </h2>

                <p>
                  أضف واحذف وعدّل الجوائز مباشرة.
                </p>
              </div>

              <button
                type="button"
                className="save-btn"
                onClick={
                  addWheelPrize
                }
              >
                ➕ إضافة جائزة
              </button>
            </div>

            <div
              className="wheel-prizes-list"
            >
              {safeArray(
                wheelSettings.prizes
              ).map(
                (
                  prize,
                  index
                ) => (
                  <div
                    className="wheel-prize-card"
                    key={
                      prize.id ||
                      index
                    }
                  >
                    <div
                      className="form-grid"
                    >
                      <label>
                        <span>
                          اسم الجائزة
                        </span>

                        <input
                          value={
                            prize.title ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateWheelPrize(
                              index,
                              {
                                title:
                                  event.target
                                    .value,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          النوع
                        </span>

                        <select
                          value={
                            prize.type ||
                            "discount"
                          }
                          onChange={(
                            event
                          ) =>
                            updateWheelPrize(
                              index,
                              {
                                type:
                                  event.target
                                    .value,
                              }
                            )
                          }
                        >
                          <option value="discount">
                            نسبة خصم
                          </option>

                          <option value="fixed">
                            خصم مبلغ
                          </option>

                          <option value="free-shipping">
                            شحن مجاني
                          </option>

                          <option value="gift">
                            هدية
                          </option>

                          <option value="nothing">
                            حظ أوفر
                          </option>
                        </select>
                      </label>

                      {prize.type !==
                        "nothing" &&
                        prize.type !==
                          "free-shipping" && (
                          <label>
                            <span>
                              القيمة
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={
                                prize.value ??
                                0
                              }
                              onChange={(
                                event
                              ) =>
                                updateWheelPrize(
                                  index,
                                  {
                                    value:
                                      Number(
                                        event.target
                                          .value
                                      ) || 0,
                                  }
                                )
                              }
                            />
                          </label>
                        )}

                      <label>
                        <span>
                          اللون
                        </span>

                        <input
                          type="color"
                          value={
                            prize.color ||
                            "#F68B1E"
                          }
                          onChange={(
                            event
                          ) =>
                            updateWheelPrize(
                              index,
                              {
                                color:
                                  event.target
                                    .value,
                              }
                            )
                          }
                        />
                      </label>
                    </div>

                    <div
                      className="form-actions"
                    >
                      <label
                        className="admin-checkbox"
                      >
                        <input
                          type="checkbox"
                          checked={
                            prize.enabled !==
                            false
                          }
                          onChange={(
                            event
                          ) =>
                            updateWheelPrize(
                              index,
                              {
                                enabled:
                                  event.target
                                    .checked,
                              }
                            )
                          }
                        />

                        <span>
                          العرض متاح
                        </span>
                      </label>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          deleteWheelPrize(
                            index
                          )
                        }
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                )
              )}

              {safeArray(
                wheelSettings.prizes
              ).length === 0 && (
                <div
                  className="empty-state"
                >
                  <div>
                    🎁
                  </div>

                  <h3>
                    لا توجد جوائز
                  </h3>
                </div>
              )}
            </div>

            <div
              className="form-actions"
            >
              <button
                type="button"
                className="save-btn"
                disabled={
                  actionLoading
                }
                onClick={
                  saveWheelSettings
                }
              >
                💾 حفظ إعدادات عجلة الحظ
              </button>
            </div>
          </div>
        )}

        {/* ====================================================
            GENERIC SECTIONS
        ==================================================== */}

        {genericSections.map(
          (
            section
          ) =>
            tab ===
              section.id && (
              <div
                className="table-container"
                key={
                  section.id
                }
              >
                <div
                  className="section-header"
                >
                  <div>
                    <h2>
                      {section.icon}{" "}
                      {
                        section.title
                      }
                    </h2>

                    <p>
                      إجمالي العناصر:{" "}
                      <strong>
                        {
                          section.data
                            .length
                        }
                      </strong>
                    </p>
                  </div>

                  {!section.readOnly && (
                    <button
                      type="button"
                      className="add-btn"
                      onClick={() =>
                        openGenericForm(
                          section.id,
                          null
                        )
                      }
                    >
                      ➕ إضافة
                    </button>
                  )}
                </div>

                {showGenericForm &&
                  genericType ===
                    section.id && (
                    <form
                      className="admin-form"
                      onSubmit={
                        handleGenericSubmit
                      }
                    >
                      <h3>
                        {genericEditingId
                          ? `✏️ تعديل ${section.title}`
                          : `➕ إضافة ${section.title}`}
                      </h3>

                      <div
                        className="form-grid"
                      >
                        {section.fields?.map(
                          (
                            field
                          ) => {
                            if (
                              field.type ===
                              "select-category"
                            ) {
                              return (
                                <label
                                  key={
                                    field.name
                                  }
                                >
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
                                      ] ||
                                      ""
                                    }
                                    onChange={
                                      handleGenericChange
                                    }
                                  >
                                    <option value="">
                                      اختر القسم
                                    </option>

                                    {categories.map(
                                      (
                                        category
                                      ) => (
                                        <option
                                          key={
                                            category.id
                                          }
                                          value={
                                            category.id
                                          }
                                        >
                                          {getCategoryFullName(
                                            category.id
                                          )}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </label>
                              );
                            }

                            if (
                              field.type ===
                              "checkbox"
                            ) {
                              return (
                                <label
                                  key={
                                    field.name
                                  }
                                  className="checkbox-field"
                                >
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
                                </label>
                              );
                            }

                            if (
                              field.type ===
                              "textarea"
                            ) {
                              return (
                                <label
                                  key={
                                    field.name
                                  }
                                  className="form-group-full"
                                >
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
                                </label>
                              );
                            }

                            if (
                              field.type ===
                              "select"
                            ) {
                              return (
                                <label
                                  key={
                                    field.name
                                  }
                                >
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
                                    {field.options?.map(
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
                                    )}
                                  </select>
                                </label>
                              );
                            }

                            if (
                              field.type ===
                              "color"
                            ) {
                              return (
                                <label
                                  key={
                                    field.name
                                  }
                                >
                                  <span>
                                    {
                                      field.label
                                    }
                                  </span>

                                  <input
                                    type="color"
                                    name={
                                      field.name
                                    }
                                    value={
                                      genericForm[
                                        field.name
                                      ] ||
                                      "#000000"
                                    }
                                    onChange={
                                      handleGenericChange
                                    }
                                  />
                                </label>
                              );
                            }

                            return (
                              <label
                                key={
                                  field.name
                                }
                              >
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
                              </label>
                            );
                          }
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
                          {actionLoading
                            ? "⏳ جاري الحفظ..."
                            : "💾 حفظ"}
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
                      لا توجد عناصر مسجلة حاليًا.
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

                          <th>
                            إجراءات
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {section.data.map(
                          (
                            item
                          ) => (
                            <tr
                              key={
                                item.id
                              }
                            >
                              <td>
                                <strong>
                                  {item.title ||
                                    item.name ||
                                    item.code ||
                                    item.text ||
                                    item.message ||
                                    item.description ||
                                    item.email ||
                                    item.id}
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
                                {formatDate(
                                  item.createdAt
                                )}
                              </td>

                              <td>
                                <div
                                  className="table-actions"
                                >
                                  <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() =>
                                      openGenericForm(
                                        section.id,
                                        item
                                      )
                                    }
                                  >
                                    ✏️ تعديل
                                  </button>

                                  <button
                                    type="button"
                                    className="delete-btn"
                                    onClick={() =>
                                      deleteGenericItem(
                                        section.id,
                                        item
                                      )
                                    }
                                  >
                                    🗑️ حذف
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
        )}

        {/* ====================================================
            SETTINGS
        ==================================================== */}

        {tab ===
          "settings" && (
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
                  تحكم كامل في بيانات المتجر والألوان والبانرات والشريط العلوي.
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
                className="admin-form-card"
              >
                <h3>
                  🏪 البيانات الأساسية
                </h3>

                <div
                  className="store-logo-setting"
                  style={{
                    marginBottom:
                      "25px",
                    padding:
                      "20px",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "14px",
                    textAlign:
                      "center",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      fontWeight:
                        "700",
                      marginBottom:
                        "15px",
                    }}
                  >
                    🖼️ لوجو المتجر
                  </span>

                  {storeSettings.logo ? (
                    <img
                      src={
                        storeSettings.logo
                      }
                      alt="Store Logo"
                      style={{
                        width:
                          "140px",
                        height:
                          "140px",
                        objectFit:
                          "contain",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "12px",
                        padding:
                          "10px",
                        background:
                          "#fff",
                        display:
                          "block",
                        margin:
                          "0 auto 15px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width:
                          "140px",
                        height:
                          "140px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        border:
                          "2px dashed #ccc",
                        borderRadius:
                          "12px",
                        color:
                          "#888",
                        margin:
                          "0 auto 15px",
                      }}
                    >
                      لا يوجد لوجو
                    </div>
                  )}

                  <label
                    htmlFor="store-logo-upload"
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      padding:
                        "10px 20px",
                      background:
                        DEFAULT_PRIMARY,
                      color:
                        "#fff",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                    }}
                  >
                    📤 تغيير اللوجو

                    <input
                      id="store-logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={
                        handleLogoUpload
                      }
                      style={{
                        display:
                          "none",
                      }}
                    />
                  </label>
                </div>

                <div
                  className="form-grid"
                >
                  <label>
                    <span>
                      اسم المتجر
                    </span>

                    <input
                      value={
                        storeSettings.storeName ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            storeName:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      الهاتف
                    </span>

                    <input
                      dir="ltr"
                      value={
                        storeSettings.phone ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            phone:
                              event.target
                                .value,
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
                      dir="ltr"
                      value={
                        storeSettings.whatsapp ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            whatsapp:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      البريد
                    </span>

                    <input
                      type="email"
                      dir="ltr"
                      value={
                        storeSettings.email ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            email:
                              event.target
                                .value,
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
                      value={
                        storeSettings.address ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            address:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div
                className="admin-form-card"
              >
                <h3>
                  🎨 ألوان الموقع
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
                      "النص الرئيسي",
                    ],
                    [
                      "textSecondary",
                      "النص الثانوي",
                    ],
                    [
                      "border",
                      "الحدود",
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
                      "خلفية الفوتر",
                    ],
                    [
                      "footerText",
                      "نص الفوتر",
                    ],
                  ].map(
                    (
                      [
                        key,
                        label,
                      ]
                    ) => (
                      <label
                        key={
                          key
                        }
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
                            onChange={(
                              event
                            ) =>
                              setStoreSettings(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  theme:
                                    {
                                      ...previous.theme,
                                      [key]:
                                        event.target
                                          .value,
                                    },
                                })
                              )
                            }
                          />

                          <input
                            dir="ltr"
                            value={
                              storeSettings.theme?.[
                                key
                              ] ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              setStoreSettings(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  theme:
                                    {
                                      ...previous.theme,
                                      [key]:
                                        event.target
                                          .value,
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
                        storeSettings.topStrip?.enabled !==
                        false
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            topStrip:
                              {
                                ...previous.topStrip,
                                enabled:
                                  event.target
                                    .checked,
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
                        storeSettings.topStrip?.direction ||
                        "rtl"
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            topStrip:
                              {
                                ...previous.topStrip,
                                direction:
                                  event.target
                                    .value,
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
                      value={
                        storeSettings.topStrip?.speed ??
                        40
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            topStrip:
                              {
                                ...previous.topStrip,
                                speed:
                                  Number(
                                    event.target
                                      .value
                                  ),
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
                      value={
                        storeSettings.topStrip?.height ??
                        42
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            topStrip:
                              {
                                ...previous.topStrip,
                                height:
                                  Number(
                                    event.target
                                      .value
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
                      value={
                        storeSettings.topStrip?.fontSize ??
                        15
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            topStrip:
                              {
                                ...previous.topStrip,
                                fontSize:
                                  Number(
                                    event.target
                                      .value
                                  ),
                              },
                          })
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div
                className="admin-form-card"
              >
                <h3>
                  🏷️ إعلان أكواد الخصم
                </h3>

                <div
                  className="form-grid"
                >
                  <label>
                    <span>
                      العنوان
                    </span>

                    <input
                      value={
                        storeSettings.couponPromoTitle ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            couponPromoTitle:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      الوصف
                    </span>

                    <input
                      value={
                        storeSettings.couponPromoDescription ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            couponPromoDescription:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      نص الزر
                    </span>

                    <input
                      value={
                        storeSettings.couponPromoButton ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            couponPromoButton:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      رابط الزر
                    </span>

                    <input
                      dir="ltr"
                      value={
                        storeSettings.couponPromoLink ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreSettings(
                          (
                            previous
                          ) => ({
                            ...previous,
                            couponPromoLink:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>
                </div>
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
                  💾 حفظ إعدادات المتجر
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ====================================================
            CONTACT
        ==================================================== */}

        {tab ===
          "contact" && (
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
                  ],
                  [
                    "whatsapp",
                    "واتساب",
                  ],
                  [
                    "facebook",
                    "Facebook",
                  ],
                  [
                    "instagram",
                    "Instagram",
                  ],
                  [
                    "telegram",
                    "Telegram",
                  ],
                  [
                    "email",
                    "البريد الإلكتروني",
                  ],
                ].map(
                  (
                    [
                      name,
                      label,
                    ]
                  ) => (
                    <label
                      key={
                        name
                      }
                    >
                      <span>
                        {
                          label
                        }
                      </span>

                      <input
                        name={
                          name
                        }
                        dir="ltr"
                        value={
                          storeSettings[
                            name
                          ] ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          setStoreSettings(
                            (
                              previous
                            ) => ({
                              ...previous,
                              [name]:
                                event.target
                                  .value,
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
                  disabled={
                    actionLoading
                  }
                >
                  💾 حفظ بيانات التواصل
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ====================================================
            ADMINS
        ==================================================== */}

        {tab ===
          "admins" && (
          <div
            className="table-container"
          >
            <div
              className="section-header"
            >
              <div>
                <h2>
                  🔐 المشرفون والصلاحيات
                </h2>

                <p>
                  إدارة المشرفين وتفعيل وتعطيل الحسابات والصلاحيات.
                </p>
              </div>

              <button
                type="button"
                className="add-btn"
                onClick={
                  openAddAdminForm
                }
              >
                ➕ إضافة مشرف
              </button>
            </div>

            {showAdminForm && (
              <div
                className="admin-form"
              >
                <h3>
                  {editingAdmin
                    ? "✏️ تعديل المشرف"
                    : "➕ إضافة مشرف جديد"}
                </h3>

                <div
                  className="form-grid"
                >
                  <label>
                    <span>
                      اسم المشرف
                    </span>

                    <input
                      value={
                        adminForm.name
                      }
                      onChange={(
                        event
                      ) =>
                        setAdminForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            name:
                              event.target
                                .value,
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
                        adminForm.email
                      }
                      onChange={(
                        event
                      ) =>
                        setAdminForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            email:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  {!editingAdmin && (
                    <label>
                      <span>
                        كلمة المرور
                      </span>

                      <input
                        type="password"
                        value={
                          adminForm.password
                        }
                        onChange={(
                          event
                        ) =>
                          setAdminForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              password:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>
                  )}
                </div>

                <div
                  className="admin-checkboxes"
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={
                        adminForm.active !==
                        false
                      }
                      onChange={(
                        event
                      ) =>
                        setAdminForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            active:
                              event.target
                                .checked,
                          })
                        )
                      }
                    />

                    المشرف مفعل
                  </label>
                </div>

                <div
                  style={{
                    marginTop:
                      "20px",
                  }}
                >
                  <div
                    className="section-header"
                  >
                    <h3>
                      🔐 الصلاحيات
                    </h3>

                    <div
                      className="table-actions"
                    >
                      <button
                        type="button"
                        className="add-btn"
                        onClick={
                          selectAllAdminPermissions
                        }
                      >
                        ☑️ تحديد الكل
                      </button>

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={
                          clearAllAdminPermissions
                        }
                      >
                        ⬜ إلغاء الكل
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(220px,1fr))",
                      gap:
                        "12px",
                    }}
                  >
                    {adminPermissions.map(
                      (
                        permission
                      ) => (
                        <label
                          key={
                            permission.id
                          }
                          style={{
                            display:
                              "flex",
                            gap:
                              "10px",
                            alignItems:
                              "center",
                            padding:
                              "12px",
                            border:
                              "1px solid #d9dfe8",
                            borderRadius:
                              "10px",
                            cursor:
                              "pointer",
                            background:
                              adminForm.permissions.includes(
                                permission.id
                              )
                                ? "#f5f8ff"
                                : "#fff",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              adminForm.permissions.includes(
                                permission.id
                              )
                            }
                            onChange={() =>
                              toggleAdminPermission(
                                permission.id
                              )
                            }
                          />

                          <span>
                            {
                              permission.title
                            }
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div
                  className="form-actions"
                >
                  <button
                    type="button"
                    className="save-btn"
                    disabled={
                      actionLoading
                    }
                    onClick={
                      saveAdmin
                    }
                  >
                    💾 حفظ المشرف
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      closeAdminForm
                    }
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            <div
              className="table-scroll"
            >
              <table
                className="admin-table"
              >
                <thead>
                  <tr>
                    <th>
                      الاسم
                    </th>
                    <th>
                      البريد
                    </th>
                    <th>
                      الدور
                    </th>
                    <th>
                      الحالة
                    </th>
                    <th>
                      الصلاحيات
                    </th>
                    <th>
                      إجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {admins.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="6"
                      >
                        لا توجد حسابات مشرفين.
                      </td>
                    </tr>
                  ) : (
                    admins.map(
                      (
                        admin
                      ) => (
                        <tr
                          key={
                            admin.id
                          }
                        >
                          <td>
                            <strong>
                              {admin.name ||
                                "مشرف"}
                            </strong>
                          </td>

                          <td
                            dir="ltr"
                          >
                            {admin.email ||
                              "—"}
                          </td>

                          <td>
                            {admin.isSuperAdmin ||
                            admin.role ===
                              "superadmin"
                              ? "👑 Super Admin"
                              : "🔐 Admin"}
                          </td>

                          <td>
                            {admin.active !==
                            false ? (
                              <span className="status-active">
                                🟢 مفعل
                              </span>
                            ) : (
                              <span className="status-inactive">
                                🔴 متوقف
                              </span>
                            )}
                          </td>

                          <td>
                            {
                              safeArray(
                                admin.permissions
                              ).length
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
                                  openEditAdminForm(
                                    admin
                                  )
                                }
                              >
                                ✏️ تعديل
                              </button>

                              <button
                                type="button"
                                className="cancel-btn"
                                onClick={() =>
                                  toggleAdminActive(
                                    admin
                                  )
                                }
                              >
                                {admin.active !==
                                false
                                  ? "⛔ تعطيل"
                                  : "✅ تفعيل"}
                              </button>

                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                  deleteAdmin(
                                    admin.id
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

        {/* ====================================================
            SECURITY
        ==================================================== */}

        {tab ===
          "security" && (
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
                  التحكم في إعدادات حماية لوحة الإدارة.
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
                    checked={
                      securitySettings.adminProtection
                    }
                    onChange={(
                      event
                    ) =>
                      setSecuritySettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          adminProtection:
                            event.target
                              .checked,
                        })
                      )
                    }
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
                    checked={
                      securitySettings.extraVerification
                    }
                    onChange={(
                      event
                    ) =>
                      setSecuritySettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          extraVerification:
                            event.target
                              .checked,
                        })
                      )
                    }
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
                    checked={
                      securitySettings.loginLogging
                    }
                    onChange={(
                      event
                    ) =>
                      setSecuritySettings(
                        (
                          previous
                        ) => ({
                          ...previous,
                          loginLogging:
                            event.target
                              .checked,
                        })
                      )
                    }
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
                  onClick={async () => {
                    try {
                      setActionLoading(
                        true
                      );

                      await setDoc(
                        doc(
                          db,
                          "settings",
                          "security"
                        ),
                        {
                          ...securitySettings,
                          updatedAt:
                            serverTimestamp(),
                        },
                        {
                          merge:
                            true,
                        }
                      );

                      await addActivityLog(
                        "الأمان",
                        "تم تحديث إعدادات أمان لوحة الإدارة"
                      );

                      alert(
                        "✅ تم حفظ إعدادات الأمان."
                      );
                    } catch (error) {
                      console.error(
                        error
                      );

                      alert(
                        error?.message ||
                        "❌ حدث خطأ أثناء حفظ إعدادات الأمان."
                      );
                    } finally {
                      setActionLoading(
                        false
                      );
                    }
                  }}
                  disabled={
                    actionLoading
                  }
                >
                  💾 حفظ إعدادات الأمان
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
          "wheel",
          "settings",
          "contact",
          "admins",
          "security",
          "coupons",
          "announcements",
          "announcement-bars",
          "notifications",
          "favorites",
          "blocked-users",
          "support",
          "shipping",
          "payments",
          "store-menu",
          "activity-log",
        ].includes(
          tab
        ) && (
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
                اختر قسمًا من القائمة الجانبية.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Admin;