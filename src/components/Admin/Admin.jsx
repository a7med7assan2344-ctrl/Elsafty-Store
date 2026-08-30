// ============================================================
// Admin.jsx - PART 1 / 3
// Elsafty Store - Full Admin Panel
// ============================================================

import { CartContext } from "../../context/CartContext";
import { getFunctions, httpsCallable } from "firebase/functions";
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
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  where,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  db,
  auth
} from "../../firebase";
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
// ADMIN PERMISSIONS
// ============================================================

// الصلاحيات المتاحة للمشرفين
// ============================================================

const adminPermissions = [

  // ==========================================================
  // الرئيسية والتقارير
  // ==========================================================

  {
    id: "dashboard",
    title: "🏠 الرئيسية",
  },

  {
    id: "reports",
    title: "📈 الإحصائيات والتقارير",
  },


  // ==========================================================
  // المنتجات
  // ==========================================================

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


  // ==========================================================
  // الأقسام
  // ==========================================================

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


  // ==========================================================
  // العروض
  // ==========================================================

  {
    id: "offers_view",
    title: "⭐ العروض - عرض",
  },

  {
    id: "offers_add",
    title: "⭐ العروض - إضافة",
  },

  {
    id: "offers_edit",
    title: "⭐ العروض - تعديل",
  },

  {
    id: "offers_delete",
    title: "⭐ العروض - حذف",
  },


  // ==========================================================
  // الأكثر مبيعًا
  // ==========================================================

  {
    id: "bestsellers",
    title: "🔥 الأكثر مبيعًا",
  },


  // ==========================================================
  // المنتجات الجديدة
  // ==========================================================

  {
    id: "new-arrivals",
    title: "🆕 المنتجات الجديدة",
  },


  // ==========================================================
  // المنتجات المقترحة
  // ==========================================================

  {
    id: "recommended",
    title: "👍 المنتجات المقترحة",
  },


  // ==========================================================
  // المستخدمون
  // ==========================================================

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


  // ==========================================================
  // العملاء
  // ==========================================================

  {
    id: "customers_view",
    title: "🧑‍💼 العملاء - عرض",
  },

  {
    id: "customers_edit",
    title: "🧑‍💼 العملاء - تعديل",
  },


  // ==========================================================
  // الطلبات
  // ==========================================================

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


  // ==========================================================
  // المبيعات
  // ==========================================================

  {
    id: "sales_view",
    title: "💰 المبيعات - عرض",
  },


  // ==========================================================
  // المفضلة
  // ==========================================================

  {
    id: "favorites_view",
    title: "❤️ المفضلة - عرض",
  },


  // ==========================================================
  // المحظورون
  // ==========================================================

  {
    id: "blocked-users_view",
    title: "🚫 المحظورون - عرض",
  },

  {
    id: "blocked-users_edit",
    title: "🚫 المحظورون - تعديل",
  },


  // ==========================================================
  // خدمة العملاء
  // ==========================================================

  {
    id: "support_view",
    title: "💬 خدمة العملاء - عرض",
  },

  {
    id: "support_reply",
    title: "💬 خدمة العملاء - الرد",
  },


  // ==========================================================
  // واجهة المتجر
  // ==========================================================

  {
    id: "store-menu_view",
    title: "🏪 واجهة المتجر - عرض",
  },

  {
    id: "store-menu_edit",
    title: "🏪 واجهة المتجر - تعديل",
  },


  // ==========================================================
  // البانرات
  // ==========================================================

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


  // ==========================================================
  // الكوبونات
  // ==========================================================

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


  // ==========================================================
  // عجلة الحظ
  // ==========================================================

  {
    id: "wheel_view",
    title: "🎡 عجلة الحظ - عرض",
  },

  {
    id: "wheel_edit",
    title: "🎡 عجلة الحظ - تعديل",
  },


  // ==========================================================
  // الإعلانات
  // ==========================================================

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


  // ==========================================================
  // أشرطة الإعلانات
  // ==========================================================

  {
    id: "announcement-bars_view",
    title: "📢 أشرطة الإعلانات - عرض",
  },

  {
    id: "announcement-bars_add",
    title: "📢 أشرطة الإعلانات - إضافة",
  },

  {
    id: "announcement-bars_edit",
    title: "📢 أشرطة الإعلانات - تعديل",
  },

  {
    id: "announcement-bars_delete",
    title: "📢 أشرطة الإعلانات - حذف",
  },


  // ==========================================================
  // الإشعارات
  // ==========================================================

  {
    id: "notifications_view",
    title: "🔔 الإشعارات - عرض",
  },


  // ==========================================================
  // إعدادات المتجر
  // ==========================================================

  {
    id: "settings_view",
    title: "⚙️ إعدادات المتجر - عرض",
  },

  {
    id: "settings_edit",
    title: "⚙️ إعدادات المتجر - تعديل",
  },


  // ==========================================================
  // الشحن
  // ==========================================================

  {
    id: "shipping_view",
    title: "🚚 الشحن والتوصيل - عرض",
  },

  {
    id: "shipping_add",
    title: "🚚 الشحن والتوصيل - إضافة",
  },

  {
    id: "shipping_edit",
    title: "🚚 الشحن والتوصيل - تعديل",
  },

  {
    id: "shipping_delete",
    title: "🚚 الشحن والتوصيل - حذف",
  },


  // ==========================================================
  // الدفع
  // ==========================================================

  {
    id: "payments_view",
    title: "💳 طرق الدفع - عرض",
  },

  {
    id: "payments_add",
    title: "💳 طرق الدفع - إضافة",
  },

  {
    id: "payments_edit",
    title: "💳 طرق الدفع - تعديل",
  },

  {
    id: "payments_delete",
    title: "💳 طرق الدفع - حذف",
  },


  // ==========================================================
  // بيانات التواصل
  // ==========================================================

  {
    id: "contact_view",
    title: "📱 بيانات التواصل - عرض",
  },

  {
    id: "contact_edit",
    title: "📱 بيانات التواصل - تعديل",
  },


  // ==========================================================
  // المشرفون والصلاحيات
  // ==========================================================

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
    title: "🔐 المشرفون - التحكم في الصلاحيات",
  },


  // ==========================================================
  // سجل العمليات
  // ==========================================================

  {
    id: "activity-log",
    title: "📝 سجل العمليات",
  },


  // ==========================================================
  // الأمان
  // ==========================================================

  {
    id: "security",
    title: "🔑 الأمان",
  },

  // ==========================================================
  // ANNOUNCEMENT BARS
  // ==========================================================

  {
    id: "announcement-bars",
    title: "📢 أشرطة الإعلانات",
  },

  {
    id: "notifications",
    title: "🔔 الإشعارات",
  },

  {
    id: "settings",
    title: "⚙️ إعدادات المتجر",
  },

  {
    id: "shipping",
    title: "🚚 الشحن والتوصيل",
  },

  {
    id: "payments",
    title: "💳 طرق الدفع",
  },

  {
    id: "contact",
    title: "📱 بيانات التواصل",
  },

  {
    id: "admins",
    title: "🔐 المشرفون والصلاحيات",
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

  const navigate = useNavigate();

  const { replaceCart } =
    useContext(CartContext);
const handleCategoryImageUpload = (event) => {

  const file =
    event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {

    alert(
      "من فضلك اختر ملف صورة فقط."
    );

    event.target.value = "";

    return;
  }

  const maxSize =
    5 * 1024 * 1024;

  if (file.size > maxSize) {

    alert(
      "حجم الصورة يجب ألا يتجاوز 5 ميجابايت."
    );

    event.target.value = "";

    return;
  }

  setCategoryForm(
    (prev) => ({
      ...prev,
      image: file,
    })
  );

};
  // MAIN STATE
  // ==========================================================

  const [wheelSettings, setWheelSettings] =
    useState({
      enabled: false,

      title: "🎡 جرب حظك!",

      description:
        "لف العجلة واكسب عرضك",

      attemptsPerUser: 1,

      prizes: [],
    });


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


const [announcementBars, setAnnouncementBars] =
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
  // ADMINS MANAGEMENT
  // ==========================================================

  const [adminForm, setAdminForm] =
    useState({
      name: "",
      email: "",
      password: "",
      permissions: [],
      active: true,
    });


  const [editingAdmin, setEditingAdmin] =
    useState(null);


  const [showAdminForm, setShowAdminForm] =
    useState(false);


  // ==========================================================
  // STORE SETTINGS
  // ==========================================================

  const [
    storeSettings,
    setStoreSettings,
  ] = useState({

    storeName:
      "Elsafty Store",

    logo:
      "",

    phone:
      "",

    whatsapp:
      "",

    email:
      "",

    address:
      "",

    facebook:
      "",

    instagram:
      "",

    telegram:
      "",

    announcement:
      "",


    // ========================================================
    // THEME
    // ========================================================

    theme: {

      primary:
        "#071A36",

      secondary:
        "#0B1F3A",

      accent:
        "#D4AF37",

      pageBackground:
        "#F0F4F8",

      cardBackground:
        "#FFFFFF",

      textPrimary:
        "#071A36",

      textSecondary:
        "#64748B",

      border:
        "#D9DFE8",

      buttonBackground:
        "#0B1F3A",

      buttonText:
        "#FFFFFF",

      navbarBackground:
        "#071A36",

      navbarText:
        "#FFFFFF",

      categoryBarBackground:
        "#FFFFFF",

      categoryBarText:
        "#071A36",

      topStripBackground:
        "#071A36",

      topStripText:
        "#FFFFFF",

      footerBackground:
        "#071A36",

      footerText:
        "#FFFFFF",
    },


    // ========================================================
    // BANNER SETTINGS
    // ========================================================

    bannerSettings: {

      heightDesktop:
        420,

      heightTablet:
        350,

      heightMobile:
        240,

      borderRadius:
        0,

      overlayOpacity:
        0.35,
    },


    // ========================================================
    // TOP STRIP
    // ========================================================

    topStrip: {

      enabled:
        true,

      direction:
        "rtl",

      speed:
        40,

      height:
        42,

      fontSize:
        15,


      items: [

        {
          icon:
            "🚚",

          text:
            "شحن سريع لجميع المحافظات",

          active:
            true,
        },

        {
          icon:
            "💰",

          text:
            "أفضل الأسعار",

          active:
            true,
        },

        {
          icon:
            "🔥",

          text:
            "عروض وخصومات مستمرة",

          active:
            true,
        },

        {
          icon:
            "🎟️",

          text:
            "استخدم أكواد الخصم عند إتمام الطلب",

          active:
            true,
        },

        {
          icon:
            "🛍️",

          text:
            "تسوق الآن من Elsafty Store",

          active:
            true,
        },

      ],
    },


    // ========================================================
    // FEATURES BAR
    // ========================================================

    featuresBar: {

      enabled:
        true,

      background:
        "#FFFFFF",

      color:
        "#071A36",

      accentColor:
        "#D4AF37",

      height:
        80,

      fontSize:
        16,


      items: [

        {
          icon:
            "🚚",

          title:
            "شحن سريع",

          text:
            "لجميع المحافظات",

          active:
            true,
        },

        {
          icon:
            "💳",

          title:
            "طرق دفع متعددة",

          text:
            "دفع عند الاستلام وإلكتروني",

          active:
            true,
        },

        {
          icon:
            "🎟️",

          title:
            "كوبونات خصم",

          text:
            "وفر أكثر عند الشراء",

          active:
            true,
        },

        {
          icon:
            "⭐",

          title:
            "منتجات مميزة",

          text:
            "اختيارات تناسبك",

          active:
            true,
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

const [categoryForm, setCategoryForm] = useState({
  name: "",
  description: "",
  image: "",
  categoryNumber: "",
  whatsapp: "",
  parentId: "",
  active: true,

  // 🎨 تخصيص شكل القسم
  color: "#071a36",
  cardSize: "medium",
  sortOrder: 0,
});
  // ==========================================================
  // STORE MENU / CUSTOMER INTERFACE
  // ==========================================================

  const [storeMenuItems, setStoreMenuItems] =
    useState([]);

  const [showStoreMenuForm, setShowStoreMenuForm] =
    useState(false);

  const [editingStoreMenuItem, setEditingStoreMenuItem] =
    useState(null);

  const [storeMenuForm, setStoreMenuForm] =
    useState({
      name: "",
      image: "",
      icon: "📂",
      parentId: "",
      categoryId: "",
      order: 0,
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
const [editingOrder, setEditingOrder] = useState(false);

const [editOrderData, setEditOrderData] = useState({
  customerName: "",
  phone: "",
  address: "",
  paymentMethod: "",
  paymentStatus: "pending",
  status: "pending",
  shippingCost: 0,
});

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
  // CURRENT ADMIN / PERMISSIONS
  // ==========================================================

  const [currentAdmin, setCurrentAdmin] =
    useState(null);

  const [adminPermissionsList, setAdminPermissionsList] =
    useState([]);

  const [adminAccessLoading, setAdminAccessLoading] =
    useState(true);


  // ==========================================================
  // CHECK ADMIN PERMISSION
  // ==========================================================

  const hasAdminPermission = (permissionId) => {

    // المشرف الرئيسي له كل الصلاحيات
    if (
      currentAdmin?.isSuperAdmin === true ||
      currentAdmin?.role === "superadmin"
    ) {
      return true;
    }

    // لو مفيش مشرف حالي
    if (!currentAdmin) {
      return false;
    }

    // الصلاحيات المحفوظة للمشرف
    const permissions =
      Array.isArray(
        currentAdmin.permissions
      )
        ? currentAdmin.permissions
        : adminPermissionsList;

    return permissions.includes(
      permissionId
    );
  };


  // ==========================================================
  // CHECK WRITE PERMISSION
  // ==========================================================

  const canEditAdminSection = (
    permissionId
  ) => {

    return hasAdminPermission(
      permissionId
    );

  };
// ==========================================================
// LOAD CURRENT ADMIN
// ==========================================================

useEffect(() => {

  const loadCurrentAdmin = async () => {

    setAdminAccessLoading(true);

    try {

      const user = auth.currentUser;
console.log("AUTH USER UID:", user?.uid);
console.log("AUTH USER EMAIL:", user?.email);
      if (!user) {

        setCurrentAdmin(null);
        setAdminPermissionsList([]);

        return;
      }


      // =====================================================
      // قراءة الأدمن مباشرة باستخدام UID كـ Document ID
      // =====================================================

      const adminRef = doc(
        db,
        "admins",
        user.uid
      );

      const adminSnapshot =
        await getDoc(adminRef);
console.log(
  "ADMIN DOC EXISTS:",
  adminSnapshot.exists()
);

console.log(
  "ADMIN DOC DATA:",
  adminSnapshot.exists()
    ? adminSnapshot.data()
    : null
);

      // =====================================================
      // لو الأدمن موجود
      // =====================================================

      if (adminSnapshot.exists()) {

        const adminData =
          adminSnapshot.data();


        // التأكد أن الحساب أدمن ومفعل
        if (
          adminData.role === "admin" &&
          adminData.active !== false
        ) {

          setCurrentAdmin({
            id: adminSnapshot.id,
            ...adminData,
          });


          setAdminPermissionsList(
            Array.isArray(
              adminData.permissions
            )
              ? adminData.permissions
              : []
          );

        } else {

          setCurrentAdmin(null);
          setAdminPermissionsList([]);

          console.warn(
            "Current user is not an active admin."
          );
        }


        return;
      }


      // =====================================================
      // FALLBACK:
      // البحث في users لو مفيش document في admins
      // =====================================================

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot =
        await getDoc(userRef);


      if (userSnapshot.exists()) {

        const userData =
          userSnapshot.data();


        setCurrentAdmin({
          id: userSnapshot.id,
          ...userData,
        });


        setAdminPermissionsList(
          Array.isArray(
            userData.permissions
          )
            ? userData.permissions
            : []
        );

      } else {

        setCurrentAdmin(null);
        setAdminPermissionsList([]);

      }

    } catch (error) {

      console.error(
        "Load current admin error:",
        error
      );

      setCurrentAdmin(null);
      setAdminPermissionsList([]);

    } finally {

      setAdminAccessLoading(false);

    }

  };


  // ==========================================================
  // مهم: ننتظر Firebase Auth قبل التحميل
  // ==========================================================

  const unsubscribe =
    onAuthStateChanged(
      auth,
      (user) => {

        if (user) {

          loadCurrentAdmin();

        } else {

          setCurrentAdmin(null);
          setAdminPermissionsList([]);
          setAdminAccessLoading(false);

        }

      }
    );


  return () => {
    unsubscribe();
  };

}, []);
  // ==========================================================
// REALTIME FIRESTORE
// ==========================================================

useEffect(() => {

  // ========================================================
  // نستنى لحد ما نعرف حالة الأدمن
  // ========================================================

  if (adminAccessLoading) {
    return;
  }

  // ========================================================
  // لو مفيش أدمن فعال، ممنوع نشغل listeners المحمية
  // ========================================================

  if (!currentAdmin) {

    console.warn(
      "Realtime Firestore skipped: no active admin."
    );

    return;
  }


  const unsubscribers = [];


  // ========================================================
  // WATCH COLLECTION
  // ========================================================

  const watchCollection = (
    collectionName,
    setter,
    sorter = null
  ) => {

    const unsubscribe = onSnapshot(

      collection(
        db,
        collectionName
      ),

      (snapshot) => {

        let data =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
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


  // ========================================================
  // PRODUCTS
  // ========================================================

  watchCollection(
    "products",
    setProducts
  );


  // ========================================================
  // CATEGORIES
  // ========================================================

  watchCollection(
    "categories",
    setCategories
  );


  // ========================================================
  // ORDERS
  // ========================================================

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


  // ========================================================
  // USERS
  // ========================================================

  watchCollection(
    "users",
    setUsers
  );


  // ========================================================
  // BANNERS
  // ========================================================

  watchCollection(
    "banners",
    setBanners
  );


  // ========================================================
  // COUPONS
  // ========================================================

  watchCollection(
    "coupons",
    setCoupons
  );


  // ========================================================
  // ANNOUNCEMENTS
  // ========================================================

  watchCollection(
    "announcements",
    setAnnouncements
  );


  // ========================================================
  // ANNOUNCEMENT BARS
  // ========================================================

  watchCollection(
    "announcementBars",
    setAnnouncementBars
  );


  // ========================================================
  // NOTIFICATIONS
  // ========================================================

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


  // ========================================================
  // SUPPORT MESSAGES
  // ========================================================

  watchCollection(
    "supportMessages",
    setSupportMessages
  );


  // ========================================================
  // FAVORITES
  // ========================================================

  watchCollection(
    "favorites",
    setFavorites
  );


  // ========================================================
  // BLOCKED USERS
  // ========================================================

  watchCollection(
    "blockedUsers",
    setBlockedUsers
  );


  // ========================================================
  // SHIPPING ZONES
  // ========================================================

  watchCollection(
    "shippingZones",
    setShippingZones
  );


  // ========================================================
  // PAYMENT METHODS
  // ========================================================

  watchCollection(
    "paymentMethods",
    setPaymentMethods
  );


  // ========================================================
  // ADMINS
  // ========================================================

  watchCollection(
    "admins",
    setAdmins
  );


  // ========================================================
  // ACTIVITY LOGS
  // ========================================================

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


  // ========================================================
  // STORE SETTINGS
  // ========================================================

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


  // ========================================================
  // CLEANUP
  // ========================================================

  return () => {

    unsubscribers.forEach(
      (unsubscribe) => {

        try {

          unsubscribe();

        } catch (error) {

          console.error(
            "Firestore unsubscribe error:",
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


const handleProductImageChange =
  (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // السماح فقط بـ JPG / JPEG
    if (
      file.type !== "image/jpeg"
    ) {

      alert(
        "من فضلك اختر صورة بصيغة JPG أو JPEG فقط."
      );

      event.target.value = "";

      return;
    }

    setProductForm(
      (previous) => ({
        ...previous,
        imageFile: file,
        imagePreview:
          URL.createObjectURL(file),
      })
    );
  };

const handleProductSubmit =
  async (event) => {

    event.preventDefault();

    setActionLoading(true);

    try {

      let imageUrl =
        productForm.image || "";


      // ==============================================
      // رفع الصورة الجديدة إلى Cloudinary
      // ==============================================

      if (productForm.imageFile) {

        const formData =
          new FormData();

        formData.append(
          "file",
          productForm.imageFile
        );

        formData.append(
          "upload_preset",
          "elsafty_store"
        );


        const cloudinaryResponse =
          await fetch(
            "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
            {
              method: "POST",
              body: formData,
            }
          );


        if (
          !cloudinaryResponse.ok
        ) {

          throw new Error(
            "فشل رفع الصورة إلى Cloudinary"
          );

        }


        const cloudinaryData =
          await cloudinaryResponse.json();


        imageUrl =
          cloudinaryData.secure_url;

      }


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
          imageUrl,

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
const handleEditOrder = (order) => {

  if (!order) {
    return;
  }

  console.log("📝 Order being edited:", order);

  setSelectedOrder(order);

  const addressValue =
    typeof order.address === "object" &&
    order.address !== null
      ? getUserAddress({
          address: order.address,
        })
      : (
          order.address ||
          order.customerAddress ||
          ""
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

    address:
      addressValue,

    paymentMethod:
      order.paymentMethod ||
      "",

    status:
      order.status ||
      order.orderStatus ||
      "pending",

    paymentStatus:
      order.paymentStatus ||
      "pending",

    shippingCost:
      order.shippingCost ??
      order.shipping ??
      0,

  });

  setEditingOrder(true);

  setShowOrderDetails(true);
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

      // ======================================================
      // 🖼️ رفع صورة القسم إلى Cloudinary
      // ======================================================

      let imageUrl =
        typeof categoryForm.image === "string"
          ? categoryForm.image
          : "";

      if (
        categoryForm.image instanceof File
      ) {
const handleLogoUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  // التأكد أن الملف صورة
  if (!file.type.startsWith("image/")) {
    alert("من فضلك اختر صورة صحيحة");
    return;
  }

  // حجم أقصى 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert("حجم اللوجو يجب ألا يتجاوز 5MB");
    return;
  }

  try {
    setSaving(true);

    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "upload_preset",
      "elsafty_store"
    );

    const cloudinaryResponse = await fetch(
      "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!cloudinaryResponse.ok) {
      throw new Error(
        "فشل رفع اللوجو إلى Cloudinary"
      );
    }

    const cloudinaryData =
      await cloudinaryResponse.json();

    const logoUrl =
      cloudinaryData.secure_url;

    // تحديث اللوجو داخل الحالة
    setStoreSettings((previous) => ({
      ...previous,
      logo: logoUrl,
    }));

    alert("تم رفع اللوجو بنجاح ✅");

  } catch (error) {
    console.error(
      "Logo upload error:",
      error
    );

    alert(
      "حدث خطأ أثناء رفع اللوجو"
    );

  } finally {
    setSaving(false);

    // السماح باختيار نفس الصورة مرة أخرى
    event.target.value = "";
  }
};

        const formData =
          new FormData();

        formData.append(
          "file",
          categoryForm.image
        );

        formData.append(
          "upload_preset",
          "elsafty_store"
        );

        const cloudinaryResponse =
          await fetch(
            "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
            {
              method: "POST",
              body: formData,
            }
          );

        if (
          !cloudinaryResponse.ok
        ) {

          const errorText =
            await cloudinaryResponse.text();

          console.error(
            "Cloudinary error:",
            errorText
          );

          throw new Error(
            "فشل رفع صورة القسم"
          );

        }

        const cloudinaryData =
          await cloudinaryResponse.json();

        imageUrl =
          cloudinaryData.secure_url ||
          "";

        if (!imageUrl) {

          throw new Error(
            "لم يتم الحصول على رابط الصورة من Cloudinary"
          );

        }

      }


      // ======================================================
      // 📂 بيانات القسم
      // ======================================================

      const categoryData = {

        name:
          categoryForm.name
            ?.trim() ||
          "",

        description:
          categoryForm.description
            ?.trim() ||
          "",

        image:
          imageUrl,

        categoryNumber:
          categoryForm.categoryNumber
            ?.trim() ||
          "",

        whatsapp:
          categoryForm.whatsapp
            ?.trim() ||
          "",

        parentId:
          categoryForm.parentId ||
          null,

        active:
          Boolean(
            categoryForm.active
          ),

        // 🎨 لون القسم
        color:
          categoryForm.color ||
          "#071a36",

        // 📏 حجم بطاقة القسم
        cardSize:
          categoryForm.cardSize ||
          "medium",

        // 🔢 ترتيب القسم
        sortOrder:
          Number(
            categoryForm.sortOrder || 0
          ),

        updatedAt:
          serverTimestamp(),

      };


      // ======================================================
      // ✏️ تعديل قسم موجود
      // ======================================================

      if (editingCategory) {

        await updateDoc(

          doc(
            db,
            "categories",
            editingCategory.id
          ),

          categoryData

        );

      }


      // ======================================================
      // ➕ إضافة قسم جديد
      // ======================================================

      else {

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


      // ======================================================
      // ✅ نجاح الحفظ
      // ======================================================

      resetCategoryForm();

      alert(
        editingCategory
          ? "✅ تم تعديل القسم بنجاح."
          : "✅ تم إضافة القسم بنجاح."
      );


    } catch (error) {

      console.error(
        "handleCategorySubmit error:",
        error
      );

      alert(
        "❌ حدث خطأ أثناء حفظ القسم أو رفع الصورة."
      );


    } finally {

      setActionLoading(false);

    }

  };
  
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

      // 🎨 لون القسم
      color:
        category?.color || "#071a36",

      // 📏 حجم القسم
      cardSize:
        category?.cardSize || "medium",

      // 🔢 ترتيب القسم
      sortOrder:
        Number(
          category?.sortOrder || 0
        ),

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

const handleEditCategory = (category) => {
  if (!category) {
    return;
  }

  setEditingCategory(category);

  setCategoryForm({
    name: category.name || "",
    description: category.description || "",
    image: category.image || "",
    categoryNumber: category.categoryNumber || "",
    whatsapp: category.whatsapp || "",
    parentId: category.parentId || "",
    active: category.active !== false,
    color: category.color || "#071a36",
    cardSize: category.cardSize || "medium",
    sortOrder: Number(category.sortOrder || 0),
  });

  setShowCategoryForm(true);
  setTab("categories");
};
const renderCategoryTree = (
  items,
  level = 0
) => (

  <div
    className={
      level === 0
        ? "category-tree-root"
        : "category-tree-children"
    }
  >

    {items.map(
      (category) => {

        const children =
          categories
            .filter(
              (item) =>
                item.parentId ===
                category.id
            )
            .sort(
              (a, b) =>
                Number(
                  a.sortOrder || 0
                ) -
                Number(
                  b.sortOrder || 0
                )
            );

        return (

          <div
            key={
              category.id
            }
            className="category-tree-node"
          >

            {/* ==========================
                CATEGORY
            ========================== */}

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


            {/* ==========================
                CHILDREN
            ========================== */}

            {children.length > 0 && (

              <div
                className="category-tree-children"
              >

                {renderCategoryTree(
                  children,
                  level + 1
                )}

              </div>

            )}

          </div>

        );
      }
    )}

  </div>
);
      const saveWheelSettings = async () => {
    try {
      await setDoc(
        doc(db, "settings", "wheel"),
        {
          ...wheelSettings,
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      alert("تم حفظ إعدادات عجلة الحظ بنجاح 🎡");

    } catch (error) {
      console.error(
        "Wheel Settings Error:",
        error
      );

      alert(
        "حدث خطأ أثناء حفظ إعدادات عجلة الحظ"
      );
    }
  };


  useEffect(() => {
    const wheelRef = doc(
      db,
      "settings",
      "wheel"
    );

    const unsubscribe = onSnapshot(
      wheelRef,
      (snapshot) => {

        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();

        setWheelSettings((previous) => ({
          ...previous,
          ...data,
          prizes: Array.isArray(data.prizes)
            ? data.prizes
            : [],
        }));

      },
      (error) => {
        console.error(
          "Wheel Settings Error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);
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

const saveOrderEdit = async () => {
  if (!selectedOrder?.id) {
    return;
  }

  const cleanName =
    editOrderData.customerName.trim();

  const cleanPhone =
    editOrderData.phone.trim();

  const cleanAddress =
    editOrderData.address.trim();

  if (
    !cleanName ||
    !cleanPhone ||
    !cleanAddress
  ) {
    alert(
      "من فضلك أكمل اسم العميل والهاتف والعنوان."
    );
    return;
  }

  try {
    setLoading(true);

    const shipping =
      Number(
        editOrderData.shippingCost || 0
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
        customerName: cleanName,
        name: cleanName,

        phone: cleanPhone,
        customerPhone: cleanPhone,

        address: cleanAddress,

        paymentMethod:
          editOrderData.paymentMethod,

        paymentStatus:
          editOrderData.paymentStatus,

        status:
          editOrderData.status,

        orderStatus:
          editOrderData.status,

        shippingCost: shipping,
        shipping: shipping,

        total,
        totalPrice: total,

        updatedAt:
          serverTimestamp(),
      }
    );

    setSelectedOrder({
      ...selectedOrder,
      customerName: cleanName,
      name: cleanName,
      phone: cleanPhone,
      customerPhone: cleanPhone,
      address: cleanAddress,
      paymentMethod:
        editOrderData.paymentMethod,
      paymentStatus:
        editOrderData.paymentStatus,
      status:
        editOrderData.status,
      orderStatus:
        editOrderData.status,
      shippingCost: shipping,
      shipping,
      total,
      totalPrice: total,
    });

    setEditingOrder(false);

    await addActivityLog(
      "تعديل طلب",
      `تم تعديل الطلب: ${selectedOrder.id}`
    );

    alert(
      "تم حفظ تعديل الطلب بنجاح ✅"
    );

  } catch (error) {
    console.error(
      "❌ Save Order Edit Error:",
      error
    );

    alert(
      "حدث خطأ أثناء حفظ تعديل الطلب."
    );

  } finally {
    setLoading(false);
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
const startEditOrder = (order) => {
  if (!order) {
    return;
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  const products = Array.isArray(order.products)
    ? order.products
    : [];

  if (products.length === 0) {
    alert("لا توجد منتجات في هذا الطلب لتعديلها.");
    return;
  }

  // ==========================================
  // LOAD OLD ORDER INTO CART
  // ==========================================

  replaceCart(products);

  // ==========================================
  // SAVE CUSTOMER DATA FOR CHECKOUT
  // ==========================================

  const editData = {
    customerName:
      order?.customerName ||
      order?.name ||
      "",

    phone:
      order?.phone ||
      order?.customerPhone ||
      "",

    address:
      typeof order?.address === "object"
        ? getUserAddress({
            address: order.address,
          })
        : order?.address ||
          order?.customerAddress ||
          "",

    paymentMethod:
      order?.paymentMethod ||
      "",

    paymentStatus:
      order?.paymentStatus ||
      "pending",

    status:
      order?.status ||
      order?.orderStatus ||
      "pending",

    shippingCost:
      Number(
        order?.shippingCost ||
        order?.shipping ||
        0
      ),
  };

  setEditOrderData(editData);

  // ==========================================
  // SAVE FOR CHECKOUT
  // ==========================================

  sessionStorage.setItem(
    "editingOrder",
    JSON.stringify({
      ...editData,
      orderId: order?.id || "",
      orderNumber:
        order?.orderNumber ||
        "",
      shippingZoneId:
        order?.shippingZoneId ||
        "",
      shippingZoneName:
        order?.shippingZoneName ||
        "",
    })
  );

  // ==========================================
  // OPEN CHECKOUT
  // ==========================================

  navigate("/checkout");
};
// ==========================================================
// ADMINS MANAGEMENT ACTIONS
// ==========================================================

// فتح نموذج إضافة أدمن جديد
const openAddAdminForm = () => {
  setEditingAdmin(null);

  setAdminForm({
    name: "",
    email: "",
    password: "",
    permissions: [],
    active: true,
  });

  setShowAdminForm(true);
};


// ==========================================================
// فتح نموذج تعديل أدمن
// ==========================================================

const openEditAdminForm = (admin) => {
  setEditingAdmin(admin);

  setAdminForm({
    name:
      admin?.name || "",

    email:
      admin?.email || "",

    password:
      "",

    permissions:
      Array.isArray(admin?.permissions)
        ? admin.permissions
        : [],

    active:
      admin?.active !== false,
  });

  setShowAdminForm(true);
};


// ==========================================================
// إغلاق النموذج
// ==========================================================

const closeAdminForm = () => {
  setShowAdminForm(false);

  setEditingAdmin(null);

  setAdminForm({
    name: "",
    email: "",
    password: "",
    permissions: [],
    active: true,
  });
};


// ==========================================================
// تحديد / إلغاء تحديد صلاحية
// ==========================================================

const toggleAdminPermission = (
  permissionId
) => {

  setAdminForm((previous) => {

    const permissions =
      Array.isArray(
        previous.permissions
      )
        ? previous.permissions
        : [];

    const exists =
      permissions.includes(
        permissionId
      );

    return {
      ...previous,

      permissions: exists
        ? permissions.filter(
            (id) =>
              id !== permissionId
          )
        : [
            ...permissions,
            permissionId,
          ],
    };
  });
};


// ==========================================================
// تحديد كل الصلاحيات
// ==========================================================

const selectAllAdminPermissions = () => {

  setAdminForm((previous) => ({

    ...previous,

    permissions:
      adminPermissions.map(
        (permission) =>
          permission.id
      ),

  }));
};


// ==========================================================
// إلغاء كل الصلاحيات
// ==========================================================

const clearAllAdminPermissions = () => {

  setAdminForm((previous) => ({

    ...previous,

    permissions: [],

  }));
};


// ==========================================================
// حفظ الأدمن
// ==========================================================

const saveAdmin = async () => {

  try {

    // ========================================================
    // التحقق من البيانات
    // ========================================================

    if (
      !adminForm.name ||
      !adminForm.name.trim()
    ) {

      alert(
        "من فضلك اكتب اسم المشرف"
      );

      return;
    }


    if (
      !adminForm.email ||
      !adminForm.email.trim()
    ) {

      alert(
        "من فضلك اكتب البريد الإلكتروني"
      );

      return;
    }


    if (
      !editingAdmin &&
      (
        !adminForm.password ||
        !adminForm.password.trim()
      )
    ) {

      alert(
        "من فضلك اكتب كلمة المرور"
      );

      return;
    }


    if (
      !editingAdmin &&
      adminForm.password.length < 6
    ) {

      alert(
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
      );

      return;
    }


    if (
      !Array.isArray(
        adminForm.permissions
      ) ||
      adminForm.permissions.length === 0
    ) {

      alert(
        "اختر صلاحية واحدة على الأقل"
      );

      return;
    }


    // ========================================================
    // تعديل أدمن موجود
    // ========================================================

    if (
      editingAdmin?.id
    ) {

      const adminRef =
        doc(
          db,
          "admins",
          editingAdmin.id
        );


      const updateData = {

        name:
          adminForm.name.trim(),

        email:
          adminForm.email
            .trim()
            .toLowerCase(),

        permissions:
          adminForm.permissions,

        active:
          adminForm.active,

        updatedAt:
          serverTimestamp(),

      };


      // ------------------------------------------------------
      // مهم:
      // لا نحفظ كلمة المرور في Firestore
      // ------------------------------------------------------

      await updateDoc(
        adminRef,
        updateData
      );


      alert(
        "تم تعديل بيانات المشرف بنجاح ✅"
      );

    }


    // ========================================================
    // إضافة أدمن جديد
    // ========================================================

    else {

      const functions =
        getFunctions();


      const createAdminAccount =
        httpsCallable(
          functions,
          "createAdminAccount"
        );


      await createAdminAccount({

        name:
          adminForm.name.trim(),

        email:
          adminForm.email
            .trim()
            .toLowerCase(),

        password:
          adminForm.password,

        permissions:
          adminForm.permissions,

        active:
          adminForm.active,

      });


      alert(
        "تم إنشاء حساب المشرف بنجاح ✅"
      );
    }


    // ========================================================
    // إغلاق النموذج
    // ========================================================

    closeAdminForm();


  } catch (error) {

    console.error(
      "Error saving admin:",
      error
    );


    // --------------------------------------------------------
    // رسائل Firebase واضحة
    // --------------------------------------------------------

    const errorCode =
      error?.code || "";


    if (
      errorCode.includes(
        "already-exists"
      )
    ) {

      alert(
        "❌ هذا البريد الإلكتروني مستخدم بالفعل."
      );

    } else if (
      errorCode.includes(
        "unauthenticated"
      )
    ) {

      alert(
        "❌ يجب تسجيل الدخول أولاً."
      );

    } else if (
      errorCode.includes(
        "permission-denied"
      )
    ) {

      alert(
        "❌ ليس لديك صلاحية لإنشاء مشرف."
      );

    } else {

      alert(
        error?.message ||
        "❌ حدث خطأ أثناء حفظ بيانات المشرف."
      );
    }
  }
};

// ==========================================================
// حذف أدمن
// ==========================================================

const deleteAdmin = async (
  adminId
) => {

  if (!adminId) {
    return;
  }


  const confirmed =
    window.confirm(
      "هل أنت متأكد من حذف هذا المشرف؟"
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "admins",
        adminId
      )
    );


    alert(
      "تم حذف المشرف بنجاح ✅"
    );


  } catch (error) {

    console.error(
      "Error deleting admin:",
      error
    );


    alert(
      error?.message ||
      "❌ حدث خطأ أثناء حذف المشرف."
    );
  }
};


// ==========================================================
// تفعيل / تعطيل الأدمن
// ==========================================================

const toggleAdminActive = async (
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
          admin.active === false,

        updatedAt:
          serverTimestamp(),

      }

    );


  } catch (error) {

    console.error(
      "Error updating admin status:",
      error
    );


    alert(
      error?.message ||
      "❌ حدث خطأ أثناء تغيير حالة المشرف."
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

  {/* ====================================================
      ADMIN FORM
  ==================================================== */}

  {showAdminForm && tab === "admins" && (

    <form
      className="admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveAdmin();
      }}
    >

      <h3>
        {editingAdmin
          ? "✏️ تعديل المشرف"
          : "➕ إضافة مشرف جديد"}
      </h3>


      <div className="form-grid">

        {/* اسم المشرف */}

        <label>
          <span>اسم المشرف</span>

          <input
            type="text"
            value={adminForm.name}
            onChange={(event) =>
              setAdminForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
          />
        </label>


        {/* البريد الإلكتروني */}

        <label>
          <span>البريد الإلكتروني</span>

          <input
            type="email"
            value={adminForm.email}
            onChange={(event) =>
              setAdminForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))
            }
          />
        </label>


        {/* كلمة المرور */}

        <label>
          <span>
            {editingAdmin
              ? "كلمة المرور الجديدة (اختياري)"
              : "كلمة المرور"}
          </span>

          <input
            type="password"
            value={adminForm.password}
            onChange={(event) =>
              setAdminForm((previous) => ({
                ...previous,
                password:
                  event.target.value,
              }))
            }
          />
        </label>


        {/* الحالة */}

        <label className="checkbox-field">

          <input
            type="checkbox"
            checked={
              adminForm.active !== false
            }
            onChange={(event) =>
              setAdminForm((previous) => ({
                ...previous,
                active:
                  event.target.checked,
              }))
            }
          />

          <span>
            المشرف مفعل
          </span>

        </label>

      </div>


    {/* ====================================================
        PERMISSIONS
    ==================================================== */}

    <div style={{ marginTop: "25px" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >

        <h3>
          🔐 صلاحيات المشرف
        </h3>


        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
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
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >

        {adminPermissions.map(
          (permission) => (

            <label
              key={permission.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px",
                border:
                  "1px solid #d9dfe8",
                borderRadius: "10px",
                cursor: "pointer",
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
                {permission.title}
              </span>

            </label>

          )
        )}

      </div>

    </div>


    {/* ====================================================
        ACTIONS
    ==================================================== */}

    <div className="form-actions">

      <button
        type="submit"
        className="save-btn"
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

  </form>

)}
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
// UPLOAD STORE LOGO
// ==========================================================

const handleLogoUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("حجم اللوجو يجب ألا يتجاوز 5MB.");
    event.target.value = "";
    return;
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ];

  if (!allowedTypes.includes(file.type)) {
    alert(
      "من فضلك اختر صورة PNG أو JPG أو WEBP أو SVG."
    );

    event.target.value = "";
    return;
  }

  try {
    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "upload_preset",
      "elsafty_store"
    );

    const cloudinaryResponse =
      await fetch(
        "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

    if (!cloudinaryResponse.ok) {
      throw new Error(
        "Cloudinary upload failed"
      );
    }

    const data =
      await cloudinaryResponse.json();

    if (!data.secure_url) {
      throw new Error(
        "لم يتم الحصول على رابط اللوجو"
      );
    }

    setStoreSettings(
      (previous) => ({
        ...previous,
        logo: data.secure_url,
      })
    );

    alert(
      "تم رفع اللوجو بنجاح. اضغط حفظ إعدادات المتجر لتثبيته."
    );

  } catch (error) {
    console.error(
      "Logo Upload Error:",
      error
    );

    alert(
      "حدث خطأ أثناء رفع اللوجو."
    );
  } finally {
    event.target.value = "";
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
        {
  id: "store-menu",
  icon: "🏪",
  title: "واجهة المتجر",
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
  id: "wheel",
  icon: "🎡",
  title: "عجلة الحظ",
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

          <div className="admin-dashboard">

            <div className="admin-stats">

              <button
                type="button"
                className="stat-card"
                onClick={() => setTab("users")}
              >
                <h3>👥 المستخدمون</h3>
                <p>{users.length}</p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() => setTab("products")}
              >
                <h3>📦 المنتجات</h3>
                <p>{products.length}</p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() => setTab("categories")}
              >
                <h3>📂 الأقسام</h3>
                <p>{categories.length}</p>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() => setTab("orders")}
              >
                <h3>🛒 الطلبات</h3>
                <p>{orders.length}</p>
              </button>

              <div className="stat-card">
                <h3>⏳ طلبات معلقة</h3>
                <p>{pendingOrders}</p>
              </div>

              <div className="stat-card">
                <h3>✅ طلبات مكتملة</h3>
                <p>{deliveredOrders}</p>
              </div>

              <div className="stat-card">
                <h3>💰 إجمالي المبيعات</h3>
                <p>
                  {totalSales.toLocaleString("ar-EG")} ج.م
                </p>
              </div>

              <div className="stat-card">
                <h3>💳 مدفوع إلكترونيًا</h3>
                <p>
                  {paidSales.toLocaleString("ar-EG")} ج.م
                </p>
              </div>

            </div>


            <div className="admin-dashboard-grid">

              {/* =========================
                  LATEST ORDERS
              ========================= */}

              <div className="table-container">

                <div className="section-header">

                  <div>
                    <h2>🛒 آخر الطلبات</h2>

                    <p>
                      أحدث الطلبات المسجلة
                    </p>
                  </div>

                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => setTab("orders")}
                  >
                    عرض كل الطلبات
                  </button>

                </div>


                <div className="table-scroll">

                  <table className="admin-table">

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
                        .map((order) => {

                          const status =
                            order?.status ||
                            order?.orderStatus ||
                            "pending";

                          return (
                            <tr key={order.id}>

                              <td dir="ltr">
                                #
                                {order.orderNumber ||
                                  order.id?.slice(0, 8)}
                              </td>

                              <td>
                                {order?.customerName ||
                                  order?.name ||
                                  "عميل"}
                              </td>

                              <td>
                                {Number(
                                  order?.total || 0
                                ).toLocaleString("ar-EG")}
                                {" "}
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
                                  order?.createdAt
                                )}
                              </td>

                            </tr>
                          );
                        })}


                      {orders.length === 0 && (

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


              {/* =========================
                  LATEST USERS
              ========================= */}

              <div className="table-container">

                <div className="section-header">

                  <div>
                    <h2>👥 أحدث العملاء</h2>

                    <p>
                      آخر الحسابات المسجلة
                    </p>
                  </div>

                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => setTab("users")}
                  >
                    عرض العملاء
                  </button>

                </div>


                <div className="dashboard-users-list">

                  {sortedUsers
                    .slice(0, 8)
                    .map((user) => (

                      <button
                        type="button"
                        className="dashboard-user-item"
                        key={user.id}
                        onClick={() => {

                          setTab("users");

                          openUserDetails(user);

                        }}
                      >

                        <span>👤</span>

                        <div>

                          <strong>
                            {getUserName(user)}
                          </strong>

                          <small>
                            {getUserEmail(user)}
                          </small>

                        </div>

                      </button>

                    ))}


                  {users.length === 0 && (

                    <div className="empty-state">

                      <div>👥</div>

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
            WHEEL OF LUCK
        ==================================================== */}

        {tab === "wheel" && (

          <div className="admin-dashboard">

            <div className="table-container">

              <div className="section-header">

                <div>
                  <h2>
                    🎡 عجلة الحظ
                  </h2>

                  <p>
                    إدارة الجوائز والعروض التي تظهر للعملاء في عجلة الحظ
                  </p>
                </div>

              </div>


              <div className="admin-form-grid">

                {/* تفعيل العجلة */}

                <div className="form-group">

                  <label>
                    حالة عجلة الحظ
                  </label>

                  <label className="admin-checkbox">

                    <input
                      type="checkbox"
                      checked={
                        wheelSettings?.enabled || false
                      }
                      onChange={(event) =>
                        setWheelSettings(
                          (previous) => ({
                            ...previous,
                            enabled:
                              event.target.checked,
                          })
                        )
                      }
                    />

                    <span>
                      تفعيل عجلة الحظ للعملاء
                    </span>

                  </label>

                </div>


                {/* عنوان العجلة */}

                <div className="form-group">

                  <label>
                    عنوان العجلة
                  </label>

                  <input
                    type="text"
                    value={
                      wheelSettings?.title ||
                      "🎡 جرب حظك!"
                    }
                    onChange={(event) =>
                      setWheelSettings(
                        (previous) => ({
                          ...previous,
                          title:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="مثال: جرب حظك واكسب!"
                  />

                </div>


                {/* الوصف */}

                <div className="form-group">

                  <label>
                    وصف العجلة
                  </label>

                  <input
                    type="text"
                    value={
                      wheelSettings?.description ||
                      "لف العجلة واكسب عرضك"
                    }
                    onChange={(event) =>
                      setWheelSettings(
                        (previous) => ({
                          ...previous,
                          description:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="وصف يظهر أسفل العنوان"
                  />

                </div>


                {/* عدد المحاولات */}

                <div className="form-group">

                  <label>
                    عدد المحاولات لكل عميل
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      wheelSettings?.attemptsPerUser ||
                      1
                    }
                    onChange={(event) =>
                      setWheelSettings(
                        (previous) => ({
                          ...previous,
                          attemptsPerUser:
                            Number(
                              event.target.value
                            ),
                        })
                      )
                    }
                  />

                </div>

              </div>


              {/* ====================================================
                  PRIZES
              ==================================================== */}

              <div className="section-header">

                <div>
                  <h2>
                    🎁 جوائز عجلة الحظ
                  </h2>

                  <p>
                    أضف العروض التي تريد أن يفوز بها العميل
                  </p>
                </div>

                <button
                  type="button"
                  className="save-btn"
                  onClick={() =>
                    setWheelSettings(
                      (previous) => ({
                        ...previous,

                        prizes: [
                          ...(previous?.prizes || []),
                          {
                            id:
                              Date.now().toString(),
                            title: "خصم 10%",
                            type: "discount",
                            value: 10,
                            color: "#F68B1E",
                            enabled: true,
                          },
                        ],
                      })
                    )
                  }
                >
                  ➕ إضافة جائزة
                </button>

              </div>


              <div className="wheel-prizes-list">

                {(wheelSettings?.prizes || [])
                  .map(
                    (prize, index) => (

                      <div
                        className="wheel-prize-card"
                        key={
                          prize?.id ||
                          index
                        }
                      >

                        {/* اسم الجائزة */}

                        <div className="form-group">

                          <label>
                            اسم العرض
                          </label>

                          <input
                            type="text"
                            value={
                              prize?.title ||
                              ""
                            }
                            onChange={(event) => {

                              const prizes = [
                                ...(
                                  wheelSettings?.prizes ||
                                  []
                                ),
                              ];

                              prizes[index] = {
                                ...prizes[index],
                                title:
                                  event.target.value,
                              };

                              setWheelSettings(
                                (previous) => ({
                                  ...previous,
                                  prizes,
                                })
                              );

                            }}
                            placeholder="مثال: خصم 20%"
                          />

                        </div>


                        {/* نوع العرض */}

                        <div className="form-group">

                          <label>
                            نوع العرض
                          </label>

                          <select
                            value={
                              prize?.type ||
                              "discount"
                            }
                            onChange={(event) => {

                              const prizes = [
                                ...(
                                  wheelSettings?.prizes ||
                                  []
                                ),
                              ];

                              prizes[index] = {
                                ...prizes[index],
                                type:
                                  event.target.value,
                              };

                              setWheelSettings(
                                (previous) => ({
                                  ...previous,
                                  prizes,
                                })
                              );

                            }}
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

                        </div>


                        {/* قيمة العرض */}

                        {prize?.type !==
                          "free-shipping" &&
                          prize?.type !==
                            "nothing" && (

                          <div className="form-group">

                            <label>
                              قيمة العرض
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={
                                prize?.value ??
                                ""
                              }
                              onChange={(event) => {

                                const prizes = [
                                  ...(
                                    wheelSettings?.prizes ||
                                    []
                                  ),
                                ];

                                prizes[index] = {
                                  ...prizes[index],
                                  value:
                                    Number(
                                      event.target.value
                                    ),
                                };

                                setWheelSettings(
                                  (previous) => ({
                                    ...previous,
                                    prizes,
                                  })
                                );

                              }}
                            />

                          </div>

                        )}


                        {/* اللون */}

                        <div className="form-group">

                          <label>
                            لون الجزء
                          </label>

                          <input
                            type="color"
                            value={
                              prize?.color ||
                              "#F68B1E"
                            }
                            onChange={(event) => {

                              const prizes = [
                                ...(
                                  wheelSettings?.prizes ||
                                  []
                                ),
                              ];

                              prizes[index] = {
                                ...prizes[index],
                                color:
                                  event.target.value,
                              };

                              setWheelSettings(
                                (previous) => ({
                                  ...previous,
                                  prizes,
                                })
                              );

                            }}
                          />

                        </div>


                        {/* تفعيل */}

                        <div className="form-group">

                          <label>
                            حالة العرض
                          </label>

                          <label className="admin-checkbox">

                            <input
                              type="checkbox"
                              checked={
                                prize?.enabled !==
                                false
                              }
                              onChange={(event) => {

                                const prizes = [
                                  ...(
                                    wheelSettings?.prizes ||
                                    []
                                  ),
                                ];

                                prizes[index] = {
                                  ...prizes[index],
                                  enabled:
                                    event.target
                                      .checked,
                                };

                                setWheelSettings(
                                  (previous) => ({
                                    ...previous,
                                    prizes,
                                  })
                                );

                              }}
                            />

                            <span>
                              العرض متاح
                            </span>

                          </label>

                        </div>


                        {/* حذف */}

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => {

                            const prizes =
                              (
                                wheelSettings?.prizes ||
                                []
                              ).filter(
                                (_, prizeIndex) =>
                                  prizeIndex !==
                                  index
                              );

                            setWheelSettings(
                              (previous) => ({
                                ...previous,
                                prizes,
                              })
                            );

                          }}
                        >
                          🗑️ حذف
                        </button>

                      </div>

                    )
                  )}


                {(wheelSettings?.prizes || [])
                  .length === 0 && (

                  <div className="empty-state">

                    <div>
                      🎁
                    </div>

                    <h3>
                      لا توجد جوائز
                    </h3>

                    <p>
                      أضف العروض التي تريد ظهورها في عجلة الحظ
                    </p>

                  </div>

                )}

              </div>


              {/* ====================================================
                  SAVE
              ==================================================== */}

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="save-btn"
                  onClick={saveWheelSettings}
                >
                  💾 حفظ إعدادات عجلة الحظ
                </button>

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
  type="file"
  accept=".jpg,.jpeg,image/jpeg"
  onChange={handleProductImageChange}
/>
{productForm.imagePreview && (
  <img
    src={productForm.imagePreview}
    alt="معاينة المنتج"
    style={{
      width: "120px",
      height: "120px",
      objectFit: "cover",
      marginTop: "10px",
      borderRadius: "10px",
      border: "1px solid #ddd",
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
    openOrderDetails(order)
  }
>
  👁️ التفاصيل / تعديل
</button>

<button
  type="button"
  className="cancel-btn"
  onClick={() =>
    handleOrderStatusChange(
      order.id,
      "cancelled"
    )
  }
>
  ❌ إلغاء
</button>

<button
  type="button"
  className="delete-btn"
  onClick={() =>
    deleteOrder(order)
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


{tab === "categories" && (

  <div className="table-container">

    {/* ======================================================
        HEADER
    ====================================================== */}

    <div className="section-header">

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

            // 🎨 القيم الافتراضية
            color: "#071a36",
            cardSize: "medium",
            sortOrder: 0,
          });

          setShowCategoryForm(true);
          setTab("categories");

        }}
      >
        ➕ إضافة قسم
      </button>

    </div>


    {/* ======================================================
        SEARCH
    ====================================================== */}

    <div className="accounts-search">

      <input
        type="search"
        placeholder="🔎 ابحث عن قسم..."
        value={categorySearch}
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


    {/* ======================================================
        CATEGORY FORM
    ====================================================== */}

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


        <div className="form-grid">

          {/* ==================================================
              NAME
          ================================================== */}

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


          {/* ==================================================
              CATEGORY NUMBER
          ================================================== */}

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


          {/* ==================================================
              WHATSAPP
          ================================================== */}

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
              inputMode="tel"
              placeholder="مثال: 201553570236"
            />

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color: "#666",
              }}
            >
              سيتم إرسال طلبات منتجات هذا القسم إلى هذا الرقم.
            </small>

          </label>


          {/* ==================================================
              PARENT CATEGORY
          ================================================== */}

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


          {/* ==================================================
              IMAGE
          ================================================== */}

          <label>

            <span>
              🖼️ صورة القسم
            </span>

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={
                handleCategoryImageUpload
              }
            />

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color: "#666",
              }}
            >
              اختر صورة من جهازك — JPG أو PNG أو WEBP
            </small>


            {/* ==================================================
                IMAGE PREVIEW
            ================================================== */}

            {categoryForm.image && (

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >

                <img
                  src={
                    categoryForm.image
                  }
                  alt="صورة القسم"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid #ddd",
                    background: "#f5f5f5",
                  }}
                />


                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {

                    setCategoryForm(
                      (prev) => ({
                        ...prev,
                        image: "",
                      })
                    );

                  }}
                >
                  🗑️ إزالة الصورة
                </button>

              </div>

            )}

          </label>


          {/* ==================================================
              COLOR
          ================================================== */}

          <label>

            <span>
              🎨 لون القسم
            </span>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >

              <input
                type="color"
                name="color"
                value={
                  categoryForm.color ||
                  "#071a36"
                }
                onChange={
                  handleCategoryChange
                }
                style={{
                  width: "55px",
                  height: "42px",
                  padding: "3px",
                  cursor: "pointer",
                }}
              />


              <input
                type="text"
                name="color"
                value={
                  categoryForm.color ||
                  "#071a36"
                }
                onChange={
                  handleCategoryChange
                }
                dir="ltr"
                placeholder="#071a36"
              />

            </div>

          </label>


          {/* ==================================================
              CARD SIZE
          ================================================== */}

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


          {/* ==================================================
              SORT ORDER
          ================================================== */}

          <label>

            <span>
              🔢 ترتيب القسم
            </span>

            <input
              type="number"
              name="sortOrder"
              min="0"
              value={
                categoryForm.sortOrder ?? 0
              }
              onChange={
                handleCategoryChange
              }
            />

          </label>


          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <label className="form-group-full">

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


        {/* ======================================================
            ACTIVE
        ====================================================== */}

        <div className="admin-checkboxes">

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


        {/* ======================================================
            LIVE PREVIEW
        ====================================================== */}

        <div
          className="category-live-preview"
        >

          <h3>
            👁️ معاينة القسم
          </h3>


          <div className="category-preview-area">

            <div
              className={
                `category-preview-card ${
                  categoryForm.cardSize ||
                  "medium"
                }`
              }
              style={{
                "--category-color":
                  categoryForm.color ||
                  "#071a36",
              }}
            >

              {/* IMAGE */}

              <div className="category-preview-image">

                {categoryForm.image ? (

                  <img
                    src={
                      categoryForm.image
                    }
                    alt={
                      categoryForm.name ||
                      "معاينة القسم"
                    }
                    onError={(event) => {

                      event.currentTarget.style.display =
                        "none";

                    }}
                  />

                ) : (

                  <div className="category-preview-icon">
                    📂
                  </div>

                )}

              </div>


              {/* NAME */}

              <div className="category-preview-content">

                <h4>

                  {
                    categoryForm.name ||
                    "اسم القسم"
                  }

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


        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <div className="form-actions">

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


    {/* ======================================================
        CATEGORIES TABLE
    ====================================================== */}

    <div className="table-scroll">

      <table className="admin-table">

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

          {filteredCategories.length === 0 ? (

            <tr>

              <td colSpan="10">
                لا توجد أقسام.
              </td>

            </tr>

          ) : (

            filteredCategories
              .slice()
              .sort(
                (a, b) =>
                  Number(
                    a.sortOrder || 0
                  ) -
                  Number(
                    b.sortOrder || 0
                  )
              )
              .map(
                (category) => (

                  <tr
                    key={
                      category.id
                    }
                  >

                    {/* IMAGE */}

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


                    {/* NAME */}

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


                    {/* COLOR */}

                    <td>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >

                        <span
                          style={{
                            width: "25px",
                            height: "25px",
                            borderRadius: "6px",
                            background:
                              category.color ||
                              "#071a36",
                            border:
                              "1px solid #ddd",
                            display:
                              "inline-block",
                          }}
                        />


                        <small
                          dir="ltr"
                        >
                          {
                            category.color ||
                            "#071a36"
                          }
                        </small>

                      </div>

                    </td>


                    {/* SIZE */}

                    <td>

                      {
                        category.cardSize ===
                        "small"
                          ? "صغير"
                          : category.cardSize ===
                            "large"
                          ? "كبير"
                          : "متوسط"
                      }

                    </td>


                    {/* SORT */}

                    <td>

                      {
                        category.sortOrder || 0
                      }

                    </td>


                    {/* NUMBER */}

                    <td>

                      {
                        category.categoryNumber ||
                        "—"
                      }

                    </td>


                    {/* PARENT */}

                    <td>

                      {
                        categoryMap[
                          category.parentId
                        ]?.name ||
                        "قسم رئيسي"
                      }

                    </td>


                    {/* WHATSAPP */}

                    <td dir="ltr">

                      {
                        category.whatsapp ||
                        "—"
                      }

                    </td>


                    {/* STATUS */}

                    <td>

                      {
                        category.active !== false
                          ? "🟢 نشط"
                          : "🔴 متوقف"
                      }

                    </td>


                    {/* ACTIONS */}

                    <td>

                      <div className="table-actions">

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


    {/* ======================================================
        CATEGORY TREE
    ====================================================== */}

    {categories.length > 0 && (

      <div className="category-tree">

        {
          renderCategoryTree(
            categories
              .filter(
                (category) =>
                  !category.parentId
              )
              .sort(
                (a, b) =>
                  Number(
                    a.sortOrder || 0
                  ) -
                  Number(
                    b.sortOrder || 0
                  )
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

  <div className="table-container">

    {/* HEADER */}
    <div className="section-header">

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


    {/* SEARCH + FILTER */}
    <div className="orders-toolbar">

      <input
        type="search"
        placeholder="🔎 ابحث برقم الطلب أو اسم العميل أو الهاتف..."
        value={orderSearch}
        onChange={(event) =>
          setOrderSearch(
            event.target.value
          )
        }
      />


      <select
        value={orderStatusFilter}
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


    {/* SUMMARY */}
    <div className="orders-summary">

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
                ) === "processing"
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


    {/* ORDERS TABLE */}
    <div className="table-scroll">

      <table className="admin-table">

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

          {filteredOrders.length === 0 ? (

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
                    key={order.id}
                  >

                    {/* رقم الطلب */}
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


                    {/* العميل */}
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


                    {/* الهاتف */}
                    <td dir="ltr">

                      {
                        order?.phone ||
                        order?.customerPhone ||
                        "—"
                      }

                    </td>


                    {/* التاريخ */}
                    <td>

                      {
                        formatDate(
                          order?.createdAt
                        )
                      }

                    </td>


                    {/* الدفع */}
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


                    {/* الإجمالي */}
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


                    {/* الحالة */}
                    <td>

                      <select
                        value={status}
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


                    {/* الإجراءات */}
                    <td>

                      <div className="table-actions">

                        {/* تفاصيل الطلب */}
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


                        {/* إلغاء الطلب */}
                        {status !==
                          "cancelled" &&
                          status !==
                            "completed" && (

                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={() =>
                              handleOrderStatusChange(
                                order.id,
                                "cancelled"
                              )
                            }
                          >
                            ❌ إلغاء
                          </button>

                        )}


                        {/* حذف الطلب */}
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={async () => {

                            if (
                              !window.confirm(
                                `هل أنت متأكد من حذف الطلب رقم #${
                                  order.orderNumber ||
                                  order.id?.slice(
                                    0,
                                    8
                                  )
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
                                `تم حذف الطلب رقم ${
                                  order.orderNumber ||
                                  order.id
                                }`
                              );


                              alert(
                                "✅ تم حذف الطلب بنجاح."
                              );

                            } catch (
                              error
                            ) {

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

                          }}
                          disabled={
                            actionLoading
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

      {/* ================================================
          CLOSE
      ================================================ */}

      <button
        type="button"
        className="modal-close"
        onClick={
          closeOrderDetails
        }
      >
        ✕
      </button>


      {/* ================================================
          TITLE
      ================================================ */}

      <h2>
        🧾 تفاصيل الطلب
      </h2>


      {/* ================================================
          ORDER INFO
      ================================================ */}
<div
  className="order-detail-grid"
>

  {/* رقم الطلب */}
  <div>
    <span>
      رقم الطلب
    </span>

    <strong dir="ltr">
      #
      {
        selectedOrder.orderNumber ||
        selectedOrder.id ||
        "—"
      }
    </strong>
  </div>


  {/* اسم العميل */}
  <div>
    <span>
      اسم العميل
    </span>

    {editingOrder ? (

      <input
        type="text"
        value={
          editOrderData.customerName
        }
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            customerName:
              event.target.value,
          })
        }
      />

    ) : (

      <strong>
        {
          selectedOrder.customerName ||
          selectedOrder.name ||
          "—"
        }
      </strong>

    )}
  </div>


  {/* الهاتف */}
  <div>
    <span>
      الهاتف
    </span>

    {editingOrder ? (

      <input
        type="tel"
        dir="ltr"
        value={
          editOrderData.phone
        }
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            phone:
              event.target.value,
          })
        }
      />

    ) : (

      <strong dir="ltr">
        {
          selectedOrder.phone ||
          selectedOrder.customerPhone ||
          "—"
        }
      </strong>

    )}
  </div>


  {/* البريد الإلكتروني */}
  <div>
    <span>
      البريد الإلكتروني
    </span>

    <strong>
      {
        selectedOrder.email ||
        selectedOrder.customerEmail ||
        "—"
      }
    </strong>
  </div>


  {/* العنوان */}
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
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            address:
              event.target.value,
          })
        }
      />

    ) : (

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

    )}
  </div>


  {/* التاريخ */}
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


  {/* طريقة الدفع */}
  <div>
    <span>
      طريقة الدفع
    </span>

    {editingOrder ? (

      <select
        value={
          editOrderData.paymentMethod
        }
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            paymentMethod:
              event.target.value,
          })
        }
      >

        <option value="">
          اختر طريقة الدفع
        </option>

        {paymentMethods.map(
          (method) => (

            <option
              key={method.id}
              value={method.id}
            >
              {
                method.title ||
                method.name ||
                "طريقة دفع"
              }
            </option>

          )
        )}

      </select>

    ) : (

      <strong>
        {
          getPaymentMethodText(
            selectedOrder.paymentMethod
          )
        }
      </strong>

    )}
  </div>


  {/* حالة الطلب */}
  <div>
    <span>
      حالة الطلب
    </span>

    {editingOrder ? (

      <select
        value={
          editOrderData.status
        }
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            status:
              event.target.value,
          })
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
        {
          getOrderStatusText(
            selectedOrder.status ||
            selectedOrder.orderStatus ||
            "pending"
          )
        }
      </strong>

    )}
  </div>


  {/* حالة الدفع */}
  <div>
    <span>
      حالة الدفع
    </span>

    {editingOrder ? (

      <select
        value={
          editOrderData.paymentStatus
        }
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            paymentStatus:
              event.target.value,
          })
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

    )}
  </div>


  {/* تكلفة الشحن */}
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
        onChange={(event) =>
          setEditOrderData({
            ...editOrderData,
            shippingCost:
              event.target.value,
          })
        }
      />

    ) : (

      <strong>
        {
          Number(
            selectedOrder.shippingCost ||
            selectedOrder.shipping ||
            0
          ).toLocaleString(
            "ar-EG"
          )
        }{" "}
        ج.م
      </strong>

    )}
  </div>

</div>

      {/* ================================================
          PRODUCTS
      ================================================ */}

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

                <div>

                  <strong>
                    {
                      item?.title ||
                      item?.name ||
                      item?.productName ||
                      "منتج"
                    }
                  </strong>


                  {(item?.variantName ||
                    item?.selectedVariant?.name) && (

                    <small
                      style={{
                        display:
                          "block",
                        marginTop:
                          "4px",
                      }}
                    >

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


      {/* ================================================
          TOTALS
      ================================================ */}

      <div
        className="order-total-box"
      >

        <div>

          <span>
            إجمالي المنتجات
          </span>

          <strong>
            {
              Number(
                selectedOrder.subtotal ||
                0
              ).toLocaleString(
                "ar-EG"
              )
            }

            {" "}
            ج.م
          </strong>

        </div>


        {Number(
          selectedOrder.discount ||
          0
        ) > 0 && (

          <div>

            <span>
              الخصم
            </span>

            <strong>
              -
              {" "}
              {
                Number(
                  selectedOrder.discount ||
                  0
                ).toLocaleString(
                  "ar-EG"
                )
              }

              {" "}
              ج.م
            </strong>

          </div>

        )}


        {Number(
          selectedOrder.shipping ||
          selectedOrder.shippingCost ||
          0
        ) > 0 && (

          <div>

            <span>
              الشحن
            </span>

            <strong>
              {
                Number(
                  selectedOrder.shipping ||
                  selectedOrder.shippingCost ||
                  0
                ).toLocaleString(
                  "ar-EG"
                )
              }

              {" "}
              ج.م
            </strong>

          </div>

        )}


        <div>

          <span>
            الإجمالي النهائي
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


      {/* ================================================
          ACTIONS
      ================================================ */}

      <div
        className="order-details-actions"
      >
{/* ==========================================
    EDIT
========================================== */}

<button
  type="button"
  className="edit-btn"
  onClick={() =>
    startEditOrder(selectedOrder)
  }
>
  ✏️ تعديل الطلب
</button>

        {/* ==========================================
            CANCEL
        ========================================== */}

        <button
          type="button"
          className="cancel-btn"
          onClick={async () => {

            if (
              !window.confirm(
                "هل أنت متأكد من إلغاء هذا الطلب؟"
              )
            ) {
              return;
            }

            await handleOrderStatusChange(
              selectedOrder.id,
              "cancelled"
            );

            setSelectedOrder({
              ...selectedOrder,
              status:
                "cancelled",
              orderStatus:
                "cancelled",
            });

          }}
        >
          ❌ إلغاء الطلب
        </button>


        {/* ==========================================
            BACK
        ========================================== */}

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

{/* ==============================================
    ACTIONS
================================================ */}

<td>

  <div className="order-actions">

    <button
      type="button"
      className="edit-order-btn"
      onClick={() =>
        handleEditOrder(order)
      }
    >
      ✏️ تعديل
    </button>

    <button
      type="button"
      className="cancel-order-btn"
      onClick={() =>
        handleCancelOrder(order)
      }
    >
      ❌ إلغاء
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

  // ====================================================
  // OLD ANNOUNCEMENTS
  // ====================================================

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
// ====================================================
// ANNOUNCEMENT BARS
// ====================================================

{
  id: "announcement-bars",
  icon: "📜",
  title:
    "أشرطة الإعلانات",
  collectionType:
    "announcementBars",
  data:
    announcementBars,
  fields: [
    {
      name: "text",
      label:
        "نص شريط الإعلان",
    },
    {
      name: "backgroundColor",
      label:
        "لون الخلفية",
      type:
        "color",
    },
    {
      name: "textColor",
      label:
        "لون النص",
      type:
        "color",
    },
    {
      name: "link",
      label:
        "الرابط",
    },
    {
      name: "speed",
      label:
        "سرعة الحركة",
      type:
        "number",
    },
    {
      name: "active",
      label:
        "الشريط مفعل",
      type:
        "checkbox",
    },
  ],
},
  // ====================================================
  // ANNOUNCEMENT BARS
  // ====================================================

  {
    id: "announcement-bars",
    icon: "📢",
    title:
      "أشرطة الإعلانات",
    collectionType:
      "announcementBars",
    data:
      announcementBars,
    fields: [
      {
        name: "text",
        label:
          "نص الشريط",
        type:
          "textarea",
      },

      {
        name: "type",
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
        name: "background",
        label:
          "لون الخلفية",
        type:
          "color",
      },

      {
        name: "textColor",
        label:
          "لون النص",
        type:
          "color",
      },

      {
        name: "fontFamily",
        label:
          "نوع الخط",
        type:
          "text",
      },

      {
        name: "fontSize",
        label:
          "حجم الخط",
        type:
          "number",
      },

      {
        name: "height",
        label:
          "ارتفاع الشريط",
        type:
          "number",
      },

      {
        name: "speed",
        label:
          "سرعة الحركة",
        type:
          "number",
      },

      {
        name: "direction",
        label:
          "اتجاه الحركة",
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
        name: "sortOrder",
        label:
          "ترتيب الشريط",
        type:
          "number",
      },

      {
        name: "enabled",
        label:
          "الشريط مفعل",
        type:
          "checkbox",
      },
    ],
  },

  // ====================================================
  // SUPPORT
  // ====================================================

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

  // ====================================================
  // NOTIFICATIONS
  // ====================================================

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

  // ====================================================
  // FAVORITES
  // ====================================================

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

  // ====================================================
  // BLOCKED USERS
  // ====================================================

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

  // ====================================================
  // SHIPPING
  // ====================================================

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

  // ====================================================
  // PAYMENTS
  // ====================================================

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
  // ====================================================
  // ADMINS
  // ====================================================

  {
    id: "admins",
    icon: "🔐",
    title: "المشرفون والصلاحيات",
    collectionType: "admins",
    data: admins,
    readOnly: false,

    fields: [
      {
        name: "name",
        label: "اسم المشرف",
        type: "text",
      },

      {
        name: "email",
        label: "البريد الإلكتروني",
        type: "email",
      },

      {
        name: "password",
        label: "كلمة المرور",
        type: "password",
      },

      {
        name: "active",
        label: "المشرف مفعل",
        type: "checkbox",
      },
    ],
  },
  // ====================================================
  // ACTIVITY LOG
  // ====================================================

  {
    id: "activity-log",
    icon: "📝",
    title: "سجل العمليات",
    collectionType: "activity-log",
    data: activityLogs,
    readOnly: true,
  },

].map(
  (section) =>

    tab === section.id ? (

      <div
        className="table-container"
        key={section.id}
      >

        {/* ====================================================
            SECTION HEADER
        ==================================================== */}

        <div
          className="section-header"
        >

          <div>

            <h2>
              {section.icon}{" "}
              {section.title}
            </h2>

            <p>
              إجمالي العناصر:
              {" "}
              <strong>
                {section.data.length}
              </strong>
            </p>

          </div>


          {/* ====================================================
              ADD BUTTON
          ==================================================== */}

          {section.id === "admins" ? (

            <button
              type="button"
              className="add-btn"
              onClick={openAddAdminForm}
            >
              ➕ إضافة مشرف
            </button>

          ) : (

            !section.readOnly && (

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

                  const initialForm = {};

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
                          : field.type ===
                            "color"
                          ? "#ffffff"
                          : field.type ===
                            "select"
                          ? (
                              field.options?.[0]?.[0] ||
                              ""
                            )
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

            )

          )}

        </div>
{/* ====================================================
    GENERIC FORM
==================================================== */}

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
                /* ==================================================
                   CHECKBOX
                ================================================== */

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

                ) :

                /* ==================================================
                   SELECT
                ================================================== */

                field.type ===
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

                ) :

                /* ==================================================
                   TEXTAREA
                ================================================== */

                field.type ===
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

                ) :

                /* ==================================================
                   COLOR
                ================================================== */

                field.type ===
                "color" ? (

                  <>

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

                      style={{
                        width:
                          "70px",

                        height:
                          "42px",

                        padding:
                          "3px",

                        cursor:
                          "pointer",
                      }}
                    />

                  </>

                ) :

                /* ==================================================
                   DEFAULT INPUT
                   text / number / url / etc.
                ================================================== */

                (

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


      {/* ==================================================
          FORM ACTIONS
      ================================================== */}

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

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

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

                            {/* EDIT */}

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

                            {/* DELETE */}

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
{/* ================= LOGO ================= */}

<div
  className="store-logo-setting"
  style={{
    marginBottom: "25px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    textAlign: "center",
  }}
>

  <span
    style={{
      display: "block",
      fontWeight: "700",
      marginBottom: "15px",
      fontSize: "16px",
    }}
  >
    🖼️ لوجو المتجر
  </span>

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "15px",
    }}
  >

    {storeSettings.logo ? (
      <img
        src={storeSettings.logo}
        alt="Store Logo"
        style={{
          width: "140px",
          height: "140px",
          objectFit: "contain",
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "10px",
          background: "#fff",
        }}
      />
    ) : (
      <div
        style={{
          width: "140px",
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #ccc",
          borderRadius: "12px",
          color: "#888",
        }}
      >
        لا يوجد لوجو
      </div>
    )}

    <label
      htmlFor="store-logo-upload"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 20px",
        background: "#071a36",
        color: "#fff",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      📤 تغيير اللوجو

      <input
        id="store-logo-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoUpload}
        style={{
          display: "none",
        }}
      />
    </label>

    <small
      style={{
        color: "#777",
      }}
    >
      PNG أو JPG أو WEBP — الحد الأقصى 5MB
    </small>

  </div>

</div>


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
