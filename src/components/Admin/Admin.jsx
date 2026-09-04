import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase";
import "./Admin.css";

/* ============================================================
   ELSAFTY STORE - ADMIN PANEL
   RTL / Arabic / Firebase / Cloudinary / Responsive
   ============================================================ */

const PRIMARY = "#071A36";
const SECONDARY = "#0B1F3A";
const ACCENT = "#D4AF37";
const PAGE_BG = "#F0F4F8";

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload";
const CLOUDINARY_PRESET = "elsafty_store";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const defaultTheme = {
  primary: PRIMARY,
  secondary: SECONDARY,
  accent: ACCENT,
  pageBackground: PAGE_BG,
  cardBackground: "#FFFFFF",
  textPrimary: PRIMARY,
  textSecondary: "#64748B",
  border: "#D9DFE8",
  buttonBackground: SECONDARY,
  buttonText: "#FFFFFF",
  navbarBackground: PRIMARY,
  navbarText: "#FFFFFF",
  categoryBarBackground: "#FFFFFF",
  categoryBarText: PRIMARY,
  topStripBackground: PRIMARY,
  topStripText: "#FFFFFF",
  footerBackground: PRIMARY,
  footerText: "#FFFFFF",
  footerBrand: ACCENT,
  footerButtonBackground: ACCENT,
  footerButtonText: PRIMARY,
  footerButtonHover: "#B8941F",
  headingColor: PRIMARY,
  linkColor: PRIMARY,
  priceColor: PRIMARY,
  saleColor: "#C62828",
  successColor: "#16803C",
  warningColor: "#B7791F",
  errorColor: "#C62828",
  inputBackground: "#FFFFFF",
  sectionBackground: "#FFFFFF",
};

const defaultStoreSettings = {
  storeName: "ســــَــــــــــوا",
  logo: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  facebook: "",
  instagram: "",
  telegram: "",
  tiktok: "",
  youtube: "",
  announcement: "",
  theme: defaultTheme,

  bannerSettings: {
    heightDesktop: 420,
    heightTablet: 350,
    heightMobile: 240,
    borderRadius: 16,
    overlayOpacity: 0.35,
    autoplay: true,
    autoplayDelay: 5000,
  },

  topStrip: {
    enabled: true,
    direction: "rtl",
    speed: 40,
    height: 42,
    fontSize: 15,
    fontWeight: 700,
    items: [],
  },

  featuresBar: {
    enabled: true,
    background: "#FFFFFF",
    color: PRIMARY,
    accentColor: ACCENT,
    height: 80,
    fontSize: 16,
    items: [],
  },

  texts: {
    homeTitle: "أهلاً بك في ســــَــــــــــوا",
    homeSubtitle: "اختيارات مميزة وأسعار تناسبك",
    productsTitle: "منتجات مميزة",
    offersTitle: "عروض اليوم",
    bestSellersTitle: "الأكثر مبيعًا",
    newArrivalsTitle: "وصل حديثًا",
    recommendedTitle: "قد يعجبك",
    categoriesTitle: "تسوق حسب القسم",
    emptyProducts: "لا توجد منتجات متاحة حاليًا",
    emptyCategories: "لا توجد أقسام متاحة حاليًا",
    cartTitle: "سلة المشتريات",
    checkoutTitle: "إتمام الطلب",
    addToCart: "أضف للسلة",
    buyNow: "اشترِ الآن",
    viewAll: "عرض الكل",
    footerAbout: "متجر ســــَــــــــــوا للتسوق الإلكتروني",
    footerRights: "جميع الحقوق محفوظة",
  },
};

const defaultWheelSettings = {
  enabled: false,
  displayMode: "store",
  popupEnabled: false,
  popupDelay: 1500,
  popupClosable: true,
  popupShowOncePerDay: false,
  title: "🎡 جرب حظك!",
  description: "لف العجلة واكسب عرضك",
  attemptsPerUser: 2,
  prizes: [],
};

const defaultGamesSettings = {
  wheel: {
    enabled: false,
    title: "🎡 عجلة الحظ",
    description: "لف العجلة واربح جائزتك",
    attemptsPerUser: 2,
    requireLogin: false,
    startDate: "",
    endDate: "",
    winnerLimit: 0,
    winnerMessage: "مبروك! لقد فزت بجائزتك 🎉",
    prizes: [],
  },

  cards: {
    enabled: false,
    title: "🃏 الكروت المقلوبة",
    description: "اختار كارت واكتشف جائزتك",
    attemptsPerUser: 2,
    requireLogin: false,
    startDate: "",
    endDate: "",
    winnerLimit: 0,
    winnerMessage: "مبروك! لقد فزت 🎉",
    prizes: [],
  },

  scratch: {
    enabled: false,
    title: "🪙 اكشط واربح",
    description: "اكشط الكارت واكتشف الجائزة",
    attemptsPerUser: 2,
    requireLogin: false,
    startDate: "",
    endDate: "",
    winnerLimit: 0,
    winnerMessage: "مبروك! الجائزة من نصيبك 🎉",
    prizes: [],
  },

  mystery: {
    enabled: false,
    title: "🎁 الصناديق الغامضة",
    description: "اختار صندوق واكتشف المفاجأة",
    attemptsPerUser: 2,
    requireLogin: false,
    startDate: "",
    endDate: "",
    winnerLimit: 0,
    winnerMessage: "مبروك! افتحت صندوقك 🎉",
    prizes: [],
  },

  pick: {
    enabled: false,
    title: "🎯 اختار واربح",
    description: "اختار هدفك واكسب جائزتك",
    attemptsPerUser: 2,
    requireLogin: false,
    startDate: "",
    endDate: "",
    winnerLimit: 0,
    winnerMessage: "مبروك! اختيار موفق 🎉",
    prizes: [],
  },

  dice: {
    enabled: false,
    title: "🎲 النرد الرابح",
    description: "ارمِ النرد وجرب حظك",
    attemptsPerUser: 2,
    requireLogin: false,
    startDate: "",
    endDate: "",
    winnerLimit: 0,
    winnerMessage: "مبروك! 🎉",
    prizes: [],
  },
};

const defaultSecurity = {
  adminProtection: true,
  extraVerification: false,
  loginLogging: true,
};

const collectionMap = {
  products: "products",
  categories: "categories",
  orders: "orders",
  users: "users",
  banners: "banners",
  coupons: "coupons",
  announcements: "announcements",
  "announcement-bars": "announcementBars",
  "popup-ads": "popupAds",
  notifications: "notifications",
  support: "supportMessages",
  favorites: "favorites",
  "blocked-users": "blockedUsers",
  shipping: "shippingZones",
  payments: "paymentMethods",
  "store-menu": "storeMenuItems",
  admins: "admins",
  "activity-log": "activityLogs",
};

const menu = [
  {
    group: "الرئيسية",
    items: [
      ["dashboard", "🏠", "لوحة التحكم"],
      ["reports", "📊", "التقارير"],
      ["sales", "💰", "المبيعات"],
    ],
  },
  {
    group: "المتجر",
    items: [
      ["products", "📦", "المنتجات"],
      ["categories", "🗂️", "الأقسام"],
      ["offers", "🔥", "عروض اليوم"],
      ["bestsellers", "⭐", "الأكثر مبيعًا"],
      ["new-arrivals", "🆕", "وصل حديثًا"],
      ["recommended", "❤️", "قد يعجبك"],
      ["banners", "🖼️", "البانرات"],
    ],
  },
  {
    group: "العملاء والطلبات",
    items: [
      ["users", "👥", "العملاء"],
      ["orders", "🛒", "الطلبات"],
      ["favorites", "❤️", "المفضلة"],
      ["blocked-users", "🚫", "العملاء المحظورون"],
      ["support", "💬", "خدمة العملاء"],
    ],
  },
  {
    group: "التسويق والألعاب",
    items: [
      ["coupons", "🏷️", "الكوبونات"],
      ["announcements", "📢", "الإعلانات"],
      ["announcement-bars", "📜", "أشرطة الإعلانات"],
      ["popup-ads", "🔔", "الإعلانات المنبثقة"],
      ["notifications", "🔔", "الإشعارات"],
      ["wheel", "🎡", "الألعاب والحظ"],
    ],
  },
  {
    group: "الإعدادات",
    items: [
      ["settings", "🎨", "مظهر المتجر"],
      ["contact", "📱", "بيانات التواصل"],
      ["shipping", "🚚", "الشحن"],
      ["payments", "💳", "طرق الدفع"],
      ["store-menu", "📋", "قائمة المتجر"],
      ["admins", "🔐", "المشرفون"],
      ["activity-log", "🧾", "سجل النشاط"],
      ["security", "🛡️", "الأمان"],
    ],
  },
];

const genericConfig = {
  coupons: {
    title: "الكوبونات والخصومات",
    icon: "🏷️",
    fields: [
      ["code", "كود الخصم", "text"],
      [
        "type",
        "نوع الخصم",
        "select",
        [
          ["percentage", "نسبة مئوية"],
          ["fixed", "قيمة ثابتة"],
        ],
      ],
      ["value", "قيمة الخصم", "number"],
      ["minOrder", "الحد الأدنى للطلب", "number"],
      ["active", "مفعل", "checkbox"],
    ],
  },

  announcements: {
    title: "الإعلانات",
    icon: "📢",
    fields: [
      ["title", "العنوان", "text"],
      ["text", "نص الإعلان", "textarea"],
      ["link", "الرابط", "text"],
      ["active", "مفعل", "checkbox"],
    ],
  },

  "announcement-bars": {
    title: "أشرطة الإعلانات",
    icon: "📜",
    fields: [
      ["text", "نص الشريط", "textarea"],
      [
        "type",
        "نوع الشريط",
        "select",
        [
          ["marquee", "متحرك"],
          ["text", "نص ثابت"],
          ["offer", "عرض"],
          ["alert", "تنبيه"],
          ["discount", "خصم"],
          ["shipping", "شحن"],
        ],
      ],
      ["backgroundColor", "لون الخلفية", "color"],
      ["textColor", "لون النص", "color"],
      ["fontFamily", "نوع الخط", "text"],
      ["fontSize", "حجم الخط", "number"],
      ["fontWeight", "وزن الخط", "number"],
      ["height", "الارتفاع", "number"],
      ["speed", "السرعة", "number"],
      [
        "direction",
        "الاتجاه",
        "select",
        [
          ["rtl", "يمين ← يسار"],
          ["ltr", "يسار ← يمين"],
        ],
      ],
      ["link", "الرابط", "text"],
      ["active", "مفعل", "checkbox"],
      ["visible", "ظاهر", "checkbox"],
    ],
  },

  "popup-ads": {
    title: "الإعلانات المنبثقة",
    icon: "🔔",
    fields: [
      ["title", "العنوان", "text"],
      ["text", "النص", "textarea"],
      ["buttonText", "نص الزر", "text"],
      ["link", "الرابط", "text"],
      ["delay", "التأخير بالمللي ثانية", "number"],
      ["active", "مفعل", "checkbox"],
      ["closable", "قابل للإغلاق", "checkbox"],
    ],
  },

  notifications: {
    title: "الإشعارات",
    icon: "🔔",
    fields: [
      ["title", "العنوان", "text"],
      ["message", "الرسالة", "textarea"],
      [
        "type",
        "النوع",
        "select",
        [
          ["info", "معلومة"],
          ["success", "نجاح"],
          ["warning", "تنبيه"],
          ["error", "خطأ"],
        ],
      ],
      ["active", "مفعل", "checkbox"],
    ],
  },

  support: {
    title: "رسائل خدمة العملاء",
    icon: "💬",
    readOnly: true,
    fields: [],
  },

  favorites: {
    title: "المفضلة",
    icon: "❤️",
    readOnly: true,
    fields: [],
  },

  "blocked-users": {
    title: "العملاء المحظورون",
    icon: "🚫",
    fields: [
      ["reason", "سبب الحظر", "textarea"],
      ["active", "الحظر مفعل", "checkbox"],
    ],
  },

  shipping: {
    title: "مناطق الشحن",
    icon: "🚚",
    fields: [
      ["name", "اسم المنطقة", "text"],
      ["cost", "تكلفة الشحن", "number"],
      ["estimatedDays", "المدة المتوقعة", "text"],
      ["active", "مفعل", "checkbox"],
    ],
  },

  payments: {
    title: "طرق الدفع",
    icon: "💳",
    fields: [
      ["name", "اسم الطريقة", "text"],
      ["description", "الوصف", "textarea"],
      ["accountNumber", "رقم التحويل", "text"],
      ["active", "مفعل", "checkbox"],
    ],
  },

  "store-menu": {
    title: "قائمة المتجر",
    icon: "📋",
    fields: [
      ["title", "اسم العنصر", "text"],
      ["link", "الرابط", "text"],
      ["icon", "الأيقونة", "text"],
      ["order", "الترتيب", "number"],
      ["active", "مفعل", "checkbox"],
    ],
  },

  "activity-log": {
    title: "سجل النشاط",
    icon: "🧾",
    readOnly: true,
    fields: [],
  },
};

/* ============================================================
   HELPERS
   ============================================================ */

const safeArray = (value) => (Array.isArray(value) ? value : []);

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const money = (value) =>
  `${asNumber(value).toLocaleString("ar-EG")} جنيه`;

const dateText = (value) => {
  if (!value) return "—";

  try {
    const date = value?.toDate ? value.toDate() : new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("ar-EG");
  } catch {
    return "—";
  }
};

const getCreatedTime = (value) => {
  if (!value) return 0;

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

const clone = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

/* ============================================================
   IMAGE UPLOAD
   ============================================================ */

async function uploadImage(file) {
  if (!file) return "";

  if (!(file instanceof File)) {
    throw new Error("ملف الصورة غير صالح");
  }

  const allowedTypes = ["image/jpeg", "image/jpg"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("مسموح برفع صور JPG أو JPEG فقط");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "فشل رفع الصورة";

    try {
      const errorData = await response.json();
      message =
        errorData?.error?.message ||
        errorData?.message ||
        message;
    } catch {
      // ignore
    }

    throw new Error(message);
  }

  const data = await response.json();

  if (!data?.secure_url) {
    throw new Error("Cloudinary لم يرجع رابط الصورة");
  }

  return data.secure_url;
}

/* ============================================================
   FIELD
   ============================================================ */

function Field({ spec, value, onChange, categories = [] }) {
  const [name, label, type, options] = spec;

  const currentValue =
    value !== undefined && value !== null
      ? value
      : type === "checkbox"
      ? true
      : "";

  if (type === "checkbox") {
    return (
      <label className="admin-checkbox">
        <input
          type="checkbox"
          name={name}
          checked={currentValue === true}
          onChange={onChange}
        />
        <span>{label}</span>
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label>
        <span>{label}</span>
        <textarea
          name={name}
          rows="4"
          value={currentValue}
          onChange={onChange}
        />
      </label>
    );
  }

  if (type === "color") {
    const color =
      /^#[0-9a-f]{6}$/i.test(String(currentValue))
        ? currentValue
        : "#000000";

    return (
      <label>
        <span>{label}</span>
        <input
          type="color"
          name={name}
          value={color}
          onChange={onChange}
        />
      </label>
    );
  }

  if (type === "select") {
    return (
      <label>
        <span>{label}</span>
        <select
          name={name}
          value={currentValue}
          onChange={onChange}
        >
          {safeArray(options).map((option) => (
            <option key={option[0]} value={option[0]}>
              {option[1]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "select-category") {
    return (
      <label>
        <span>{label}</span>
        <select
          name={name}
          value={currentValue}
          onChange={onChange}
        >
          <option value="">اختر القسم</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name || category.title || category.id}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label>
      <span>{label}</span>
      <input
        type={type || "text"}
        name={name}
        value={currentValue}
        onChange={onChange}
      />
    </label>
  );
}

/* ============================================================
   ADMIN
   ============================================================ */

export default function Admin() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [admin, setAdmin] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementBars, setAnnouncementBars] = useState([]);
  const [popupAds, setPopupAds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [support, setSupport] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [shipping, setShipping] = useState([]);
  const [payments, setPayments] = useState([]);
  const [storeMenu, setStoreMenu] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [storeSettings, setStoreSettings] = useState(
    clone(defaultStoreSettings)
  );

  const [wheelSettings, setWheelSettings] = useState(
    clone(defaultWheelSettings)
  );

  const [gamesSettings, setGamesSettings] = useState(
    clone(defaultGamesSettings)
  );

  const [security, setSecurity] = useState(
    clone(defaultSecurity)
  );

  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");

  const [genericType, setGenericType] = useState("");
  const [genericId, setGenericId] = useState(null);
  const [genericForm, setGenericForm] = useState({});
  const [showGeneric, setShowGeneric] = useState(false);

  const [productForm, setProductForm] = useState(null);
  const [categoryForm, setCategoryForm] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [adminForm, setAdminForm] = useState(null);

  /* ==========================================================
     AUTH
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          if (mounted) {
            setAdmin(null);
            setLoading(false);
          }

          return;
        }

        try {
          const adminRef = doc(db, "admins", user.uid);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            const data = adminSnap.data();

            if (data.active === false) {
              setAdmin(null);
              return;
            }

            if (mounted) {
              setAdmin({
                id: user.uid,
                email: user.email || data.email || "",
                ...data,
              });
            }

            return;
          }

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists()
            ? userSnap.data()
            : {};

          const role = userData.role || "";

          const isAdmin =
            role === "admin" ||
            role === "superadmin" ||
            userData.isAdmin === true;

          if (!isAdmin) {
            if (mounted) setAdmin(null);
            return;
          }

          if (mounted) {
            setAdmin({
              id: user.uid,
              email:
                user.email ||
                userData.email ||
                "",
              name:
                userData.name ||
                user.displayName ||
                "مشرف",
              role,
              isSuperAdmin:
                role === "superadmin",
              permissions: safeArray(
                userData.permissions
              ),
            });
          }
        } catch (error) {
          console.error("Admin auth error:", error);

          if (mounted) {
            setAdmin(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /* ==========================================================
     FIRESTORE LISTENERS
     ========================================================== */

  useEffect(() => {
    if (!admin) return undefined;

    const listeners = [];

    const watch = (collectionName, setter) => {
      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          setter(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
        },
        (error) => {
          console.warn(
            `Firestore ${collectionName}:`,
            error?.message || error
          );
        }
      );

      listeners.push(unsubscribe);
    };

    watch("products", setProducts);
    watch("categories", setCategories);
    watch("orders", setOrders);
    watch("users", setUsers);
    watch("banners", setBanners);
    watch("coupons", setCoupons);
    watch("announcements", setAnnouncements);
    watch("announcementBars", setAnnouncementBars);
    watch("popupAds", setPopupAds);
    watch("notifications", setNotifications);
    watch("supportMessages", setSupport);
    watch("favorites", setFavorites);
    watch("blockedUsers", setBlockedUsers);
    watch("shippingZones", setShipping);
    watch("paymentMethods", setPayments);
    watch("storeMenuItems", setStoreMenu);
    watch("activityLogs", setActivityLogs);
    watch("admins", setAdmins);

    const storeUnsubscribe = onSnapshot(
      doc(db, "settings", "store"),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setStoreSettings((previous) => ({
          ...clone(defaultStoreSettings),
          ...previous,
          ...data,
          theme: {
            ...defaultTheme,
            ...(previous?.theme || {}),
            ...(data?.theme || {}),
          },
          texts: {
            ...defaultStoreSettings.texts,
            ...(previous?.texts || {}),
            ...(data?.texts || {}),
          },
          bannerSettings: {
            ...defaultStoreSettings.bannerSettings,
            ...(previous?.bannerSettings || {}),
            ...(data?.bannerSettings || {}),
          },
          topStrip: {
            ...defaultStoreSettings.topStrip,
            ...(previous?.topStrip || {}),
            ...(data?.topStrip || {}),
          },
          featuresBar: {
            ...defaultStoreSettings.featuresBar,
            ...(previous?.featuresBar || {}),
            ...(data?.featuresBar || {}),
          },
        }));
      },
      (error) => {
        console.warn(
          "settings/store:",
          error?.message || error
        );
      }
    );

    const wheelUnsubscribe = onSnapshot(
      doc(db, "settings", "wheel"),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setWheelSettings({
          ...clone(defaultWheelSettings),
          ...data,
          prizes: safeArray(data.prizes),
        });
      },
      (error) => {
        console.warn(
          "settings/wheel:",
          error?.message || error
        );
      }
    );

    const gamesUnsubscribe = onSnapshot(
      doc(db, "settings", "games"),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setGamesSettings((previous) =>
          mergeGames(
            clone(defaultGamesSettings),
            previous,
            data
          )
        );
      },
      (error) => {
        console.warn(
          "settings/games:",
          error?.message || error
        );
      }
    );

    const securityUnsubscribe = onSnapshot(
      doc(db, "settings", "security"),
      (snapshot) => {
        if (!snapshot.exists()) return;

        setSecurity((previous) => ({
          ...previous,
          ...snapshot.data(),
        }));
      },
      (error) => {
        console.warn(
          "settings/security:",
          error?.message || error
        );
      }
    );

    listeners.push(
      storeUnsubscribe,
      wheelUnsubscribe,
      gamesUnsubscribe,
      securityUnsubscribe
    );

    return () => {
      listeners.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch {
          // ignore
        }
      });
    };
  }, [admin]);

  /* ==========================================================
     DATA
     ========================================================== */

  const counts = useMemo(
    () => ({
      products: products.length,
      categories: categories.length,
      orders: orders.length,
      users: users.length,
      pending: orders.filter((order) =>
        ["pending", "new"].includes(
          String(order.status || "").toLowerCase()
        )
      ).length,
      sales: orders
        .filter(
          (order) =>
            String(order.status || "").toLowerCase() !==
            "cancelled"
        )
        .reduce(
          (sum, order) =>
            sum +
            asNumber(
              order.total ?? order.finalTotal
            ),
          0
        ),
    }),
    [products, categories, orders, users]
  );

  const filteredProducts = useMemo(() => {
    const query = normalize(search);

    if (!query) return products;

    return products.filter((product) =>
      normalize(
        `${product.title || ""} ${
          product.name || ""
        } ${product.category || ""} ${
          product.description || ""
        }`
      ).includes(query)
    );
  }, [products, search]);

  const filteredUsers = useMemo(() => {
    const query = normalize(search);

    if (!query) return users;

    return users.filter((user) =>
      normalize(
        `${user.name || ""} ${user.email || ""} ${
          user.phone || ""
        }`
      ).includes(query)
    );
  }, [users, search]);

  const filteredOrders = useMemo(() => {
    const query = normalize(search);

    return orders.filter((order) => {
      const text = normalize(
        `${order.orderNumber || ""} ${
          order.customerName || ""
        } ${order.name || ""} ${order.phone || ""} ${
          order.email || ""
        }`
      );

      const searchMatches =
        !query || text.includes(query);

      const statusMatches =
        orderStatus === "all" ||
        String(order.status || "pending") ===
          orderStatus;

      return searchMatches && statusMatches;
    });
  }, [orders, search, orderStatus]);

  /* ==========================================================
     NAVIGATION
     ========================================================== */

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setSearch("");
    setShowGeneric(false);
    setProductForm(null);
    setCategoryForm(null);
    setAdminForm(null);
    setOrderDetails(null);
    setUserDetails(null);
  };

  const pageTitle =
    menu
      .flatMap((group) => group.items)
      .find((item) => item[0] === tab)?.[2] ||
    "لوحة التحكم";

  /* ==========================================================
     ACTIVITY LOG
     ========================================================== */

  const log = async (action, details) => {
    try {
      await addDoc(collection(db, "activityLogs"), {
        action: String(action || ""),
        details: String(details || ""),
        adminId: admin?.id || null,
        adminName: admin?.name || "مشرف",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn(
        "Activity log:",
        error?.message || error
      );
    }
  };

  /* ==========================================================
     SETTINGS
     ========================================================== */

  const saveSettings = async () => {
    setSaving(true);

    try {
      await setDoc(
        doc(db, "settings", "store"),
        {
          ...storeSettings,
          theme: {
            ...defaultTheme,
            ...(storeSettings.theme || {}),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await log(
        "تعديل إعدادات المتجر",
        "تم حفظ إعدادات المتجر"
      );

      window.alert("✅ تم حفظ إعدادات المتجر");
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ إعدادات المتجر"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveWheel = async () => {
    setSaving(true);

    try {
      await setDoc(
        doc(db, "settings", "wheel"),
        {
          ...wheelSettings,
          prizes: safeArray(wheelSettings.prizes),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await log(
        "تعديل عجلة الحظ",
        "تم حفظ إعدادات عجلة الحظ"
      );

      window.alert(
        "✅ تم حفظ إعدادات عجلة الحظ"
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ إعدادات عجلة الحظ"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveGames = async () => {
    setSaving(true);

    try {
      await setDoc(
        doc(db, "settings", "games"),
        {
          ...gamesSettings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await log(
        "تعديل ألعاب الحظ",
        "تم حفظ إعدادات جميع ألعاب الحظ"
      );

      window.alert(
        "✅ تم حفظ إعدادات الألعاب"
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ إعدادات الألعاب"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PRODUCTS
     ========================================================== */

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!productForm?.title?.trim()) {
      window.alert("اكتب اسم المنتج");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...productForm,
      };

      if (payload.imageFile) {
        payload.image = await uploadImage(
          payload.imageFile
        );
      }

      delete payload.imageFile;
      delete payload.imagePreview;
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;

      payload.title = String(
        payload.title || ""
      ).trim();

      payload.price = asNumber(payload.price);
      payload.oldPrice = asNumber(
        payload.oldPrice
      );
      payload.stock = asNumber(payload.stock);

      payload.offer = payload.offer === true;
      payload.bestSeller =
        payload.bestSeller === true;
      payload.newArrival =
        payload.newArrival === true;
      payload.recommended =
        payload.recommended === true;
      payload.active = payload.active !== false;

      if (productForm.id) {
        await updateDoc(
          doc(db, "products", productForm.id),
          {
            ...payload,
            updatedAt: serverTimestamp(),
          }
        );
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await log(
        productForm.id
          ? "تعديل منتج"
          : "إضافة منتج",
        payload.title
      );

      setProductForm(null);

      window.alert("✅ تم حفظ المنتج");
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ المنتج"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product) => {
    if (
      !window.confirm(
        `هل تريد حذف المنتج «${
          product.title || "بدون اسم"
        }»؟`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "products", product.id)
      );

      await log(
        "حذف منتج",
        product.title || product.id
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حذف المنتج"
      );
    }
  };

  /* ==========================================================
     CATEGORIES
     ========================================================== */

  const saveCategory = async (event) => {
    event.preventDefault();

    if (!categoryForm?.name?.trim()) {
      window.alert("اكتب اسم القسم");
      return;
    }

    if (
      categoryForm.parentId &&
      categoryForm.parentId === categoryForm.id
    ) {
      window.alert(
        "لا يمكن أن يكون القسم أبًا لنفسه"
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...categoryForm,
      };

      if (payload.imageFile) {
        payload.image = await uploadImage(
          payload.imageFile
        );
      }

      delete payload.imageFile;
      delete payload.imagePreview;
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;

      payload.name = String(
        payload.name || ""
      ).trim();

      payload.sortOrder = asNumber(
        payload.sortOrder
      );

      payload.active = payload.active !== false;

      if (categoryForm.id) {
        await updateDoc(
          doc(db, "categories", categoryForm.id),
          {
            ...payload,
            updatedAt: serverTimestamp(),
          }
        );
      } else {
        await addDoc(collection(db, "categories"), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await log(
        categoryForm.id
          ? "تعديل قسم"
          : "إضافة قسم",
        payload.name
      );

      setCategoryForm(null);

      window.alert("✅ تم حفظ القسم");
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ القسم"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    const children = categories.filter(
      (item) =>
        item.parentId === category.id
    );

    if (children.length > 0) {
      window.alert(
        "❌ لا يمكن حذف القسم لأنه يحتوي على أقسام فرعية"
      );
      return;
    }

    if (
      !window.confirm(
        `هل تريد حذف القسم «${
          category.name || "بدون اسم"
        }»؟`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "categories", category.id)
      );

      await log(
        "حذف قسم",
        category.name || category.id
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حذف القسم"
      );
    }
  };

  /* ==========================================================
     ORDERS
     ========================================================== */

  const changeOrderStatus = async (
    order,
    status
  ) => {
    try {
      await updateDoc(
        doc(db, "orders", order.id),
        {
          status,
          updatedAt: serverTimestamp(),
        }
      );

      await log(
        "تحديث حالة طلب",
        `${order.orderNumber || order.id}: ${status}`
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر تحديث حالة الطلب"
      );
    }
  };

  const removeOrder = async (order) => {
    if (
      !window.confirm(
        "هل تريد حذف الطلب نهائيًا؟"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "orders", order.id)
      );

      await log(
        "حذف طلب",
        order.orderNumber || order.id
      );

      setOrderDetails(null);
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حذف الطلب"
      );
    }
  };

  /* ==========================================================
     USERS
     ========================================================== */

  const toggleUserBlock = async (user) => {
    try {
      await updateDoc(
        doc(db, "users", user.id),
        {
          blocked: !Boolean(user.blocked),
          updatedAt: serverTimestamp(),
        }
      );

      await log(
        user.blocked
          ? "إلغاء حظر عميل"
          : "حظر عميل",
        user.email ||
          user.name ||
          user.id
      );

      setUserDetails((previous) =>
        previous
          ? {
              ...previous,
              blocked: !Boolean(
                previous.blocked
              ),
            }
          : null
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر تعديل حالة العميل"
      );
    }
  };

  /* ==========================================================
     GENERIC CRUD
     ========================================================== */

  const openGeneric = (
    type,
    item = null
  ) => {
    setGenericType(type);
    setGenericId(item?.id || null);

    if (item) {
      setGenericForm({
        ...item,
      });
    } else {
      setGenericForm({
        active: true,
        enabled: true,
        visible: true,
        type:
          type === "announcement-bars"
            ? "marquee"
            : "info",
        backgroundColor: PRIMARY,
        background: PRIMARY,
        textColor: "#FFFFFF",
        fontFamily: "Cairo",
        fontSize: 15,
        fontWeight: 700,
        height: 42,
        speed: 40,
        direction: "rtl",
        order: 0,
        delay: 1500,
        closable: true,
      });
    }

    setShowGeneric(true);
  };

  const genericChange = (event) => {
    const {
      name,
      type,
      value,
      checked,
    } = event.target;

    setGenericForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? asNumber(value)
          : value,
    }));
  };

  const saveGeneric = async (event) => {
    event.preventDefault();

    const collectionName =
      collectionMap[genericType];

    if (!collectionName) {
      window.alert(
        "❌ القسم غير معروف"
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...genericForm,
      };

      if (payload.imageFile) {
        payload.image = await uploadImage(
          payload.imageFile
        );
      }

      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.imageFile;
      delete payload.imagePreview;

      if (genericId) {
        await updateDoc(
          doc(
            db,
            collectionName,
            genericId
          ),
          {
            ...payload,
            updatedAt: serverTimestamp(),
          }
        );
      } else {
        await addDoc(
          collection(db, collectionName),
          {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      }

      await log(
        genericId
          ? "تعديل عنصر"
          : "إضافة عنصر",
        genericConfig[genericType]
          ?.title || genericType
      );

      setShowGeneric(false);
      setGenericForm({});
      setGenericId(null);

      window.alert("✅ تم الحفظ");
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر الحفظ"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeGeneric = async (
    type,
    item
  ) => {
    const collectionName =
      collectionMap[type];

    if (!collectionName || !item?.id) {
      return;
    }

    if (
      !window.confirm(
        "هل تريد حذف هذا العنصر؟"
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

      await log(
        "حذف عنصر",
        `${
          genericConfig[type]?.title ||
          type
        }: ${
          item.title ||
          item.name ||
          item.text ||
          item.id
        }`
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر الحذف"
      );
    }
  };

  /* ==========================================================
     WHEEL PRIZES
     ========================================================== */

  const addWheelPrize = () => {
    setWheelSettings((previous) => ({
      ...previous,
      prizes: [
        ...safeArray(previous.prizes),
        {
          id: `${Date.now()}`,
          title: "جائزة جديدة",
          type: "discount",
          value: 10,
          probability: 10,
          color: ACCENT,
          enabled: true,
        },
      ],
    }));
  };

  const updateWheelPrize = (
    index,
    patch
  ) => {
    setWheelSettings((previous) => ({
      ...previous,
      prizes: safeArray(
        previous.prizes
      ).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    }));
  };

  const deleteWheelPrize = (index) => {
    setWheelSettings((previous) => ({
      ...previous,
      prizes: safeArray(
        previous.prizes
      ).filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  if (loading) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <div className="admin-loading">
          ⏳ جاري تحميل لوحة الإدارة...
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <div className="admin-login-required">
          <div>🔐</div>

          <h2>
            الدخول غير مصرح
          </h2>

          <p>
            يجب تسجيل الدخول بحساب
            مشرف للوصول إلى لوحة
            الإدارة.
          </p>

          <button
            type="button"
            className="save-btn"
            onClick={() =>
              navigate("/login")
            }
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const Stat = ({
    icon,
    label,
    value,
    onClick,
  }) => (
    <button
      type="button"
      className="admin-stat-card"
      onClick={onClick}
    >
      <span className="stat-icon">
        {icon}
      </span>

      <span className="stat-label">
        {label}
      </span>

      <strong>
        {typeof value === "number"
          ? value.toLocaleString(
              "ar-EG"
            )
          : value}
      </strong>
    </button>
  );

  return (
    <div
      className="admin-page"
      dir="rtl"
    >
      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-mark">
            س
          </div>

          <div>
            <strong>
              ســــَــــــــــوا
            </strong>

            <small>
              لوحة الإدارة
            </small>
          </div>
        </div>

        <div className="admin-profile">
          <div className="avatar">
            {String(
              admin.name || "م"
            ).slice(0, 1)}
          </div>

          <div>
            <strong>
              {admin.name || "مشرف"}
            </strong>

            <small>
              {admin.isSuperAdmin ||
              admin.role ===
                "superadmin"
                ? "مدير رئيسي"
                : "مشرف"}
            </small>
          </div>
        </div>

        <nav>
          {menu.map((group) => (
            <div
              className="menu-group"
              key={group.group}
            >
              <h4>
                {group.group}
              </h4>

              {group.items.map(
                ([
                  id,
                  icon,
                  text,
                ]) => (
                  <button
                    type="button"
                    key={id}
                    className={
                      tab === id
                        ? "admin-menu-item active"
                        : "admin-menu-item"
                    }
                    onClick={() =>
                      changeTab(id)
                    }
                  >
                    <span>
                      {icon}
                    </span>

                    <span>
                      {text}
                    </span>

                    {id ===
                      "orders" &&
                      counts.pending >
                        0 && (
                        <b>
                          {
                            counts.pending
                          }
                        </b>
                      )}
                  </button>
                )
              )}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="back-store"
          onClick={() =>
            navigate("/")
          }
        >
          ← العودة للمتجر
        </button>
      </aside>

      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">
              لوحة التحكم
            </span>

            <h1>
              {pageTitle}
            </h1>
          </div>

          <div className="top-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
            >
              🏪 المتجر
            </button>

            <div className="top-admin">
              👤{" "}
              {admin.name ||
                "مشرف"}
            </div>
          </div>
        </header>

        {/* ====================================================
            DASHBOARD
            ==================================================== */}

        {tab === "dashboard" && (
          <>
            <div className="admin-hero">
              <div>
                <span>
                  مرحبًا بك 👋
                </span>

                <h2>
                  إدارة ســــَــــــــــوا
                  من مكان واحد
                </h2>

                <p>
                  تابع المبيعات
                  والطلبات والعملاء
                  وتحكم في كل تفاصيل
                  المتجر.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  changeTab(
                    "settings"
                  )
                }
              >
                ⚙️ إعدادات المتجر
              </button>
            </div>

            <div className="stats-grid">
              <Stat
                icon="👥"
                label="العملاء"
                value={
                  counts.users
                }
                onClick={() =>
                  changeTab(
                    "users"
                  )
                }
              />

              <Stat
                icon="📦"
                label="المنتجات"
                value={
                  counts.products
                }
                onClick={() =>
                  changeTab(
                    "products"
                  )
                }
              />

              <Stat
                icon="🗂️"
                label="الأقسام"
                value={
                  counts.categories
                }
                onClick={() =>
                  changeTab(
                    "categories"
                  )
                }
              />

              <Stat
                icon="🛒"
                label="الطلبات"
                value={
                  counts.orders
                }
                onClick={() =>
                  changeTab(
                    "orders"
                  )
                }
              />

              <Stat
                icon="⏳"
                label="طلبات معلقة"
                value={
                  counts.pending
                }
                onClick={() => {
                  changeTab(
                    "orders"
                  );
                  setOrderStatus(
                    "pending"
                  );
                }}
              />

              <Stat
                icon="💰"
                label="إجمالي المبيعات"
                value={money(
                  counts.sales
                )}
                onClick={() =>
                  changeTab(
                    "sales"
                  )
                }
              />
            </div>

            <div className="dashboard-grid">
              <section className="admin-card">
                <div className="section-header">
                  <div>
                    <h2>
                      🛒 أحدث الطلبات
                    </h2>

                    <p>
                      آخر الطلبات
                      المسجلة في
                      المتجر
                    </p>
                  </div>

                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() =>
                      changeTab(
                        "orders"
                      )
                    }
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="table-scroll">
                  <table className="admin-table">
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
                      </tr>
                    </thead>

                    <tbody>
                      {orders
                        .slice()
                        .sort(
                          (
                            a,
                            b
                          ) =>
                            getCreatedTime(
                              b.createdAt
                            ) -
                            getCreatedTime(
                              a.createdAt
                            )
                        )
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (
                            order
                          ) => (
                            <tr
                              key={
                                order.id
                              }
                            >
                              <td>
                                <button
                                  type="button"
                                  className="table-link"
                                  onClick={() =>
                                    setOrderDetails(
                                      order
                                    )
                                  }
                                >
                                  {order.orderNumber ||
                                    order.id.slice(
                                      0,
                                      8
                                    )}
                                </button>
                              </td>

                              <td>
                                {order.customerName ||
                                  order.name ||
                                  order.email ||
                                  "—"}
                              </td>

                              <td>
                                {money(
                                  order.total ??
                                    order.finalTotal
                                )}
                              </td>

                              <td>
                                <span
                                  className={`status-pill ${
                                    order.status ||
                                    "pending"
                                  }`}
                                >
                                  {order.status ||
                                    "pending"}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-card">
                <div className="section-header">
                  <div>
                    <h2>
                      👥 أحدث العملاء
                    </h2>

                    <p>
                      الحسابات
                      المسجلة مؤخرًا
                    </p>
                  </div>

                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() =>
                      changeTab(
                        "users"
                      )
                    }
                  >
                    عرض الكل
                  </button>
                </div>

                {users
                  .slice()
                  .sort(
                    (a, b) =>
                      getCreatedTime(
                        b.createdAt
                      ) -
                      getCreatedTime(
                        a.createdAt
                      )
                  )
                  .slice(
                    0,
                    8
                  )
                  .map((user) => (
                    <button
                      type="button"
                      className="user-row"
                      key={
                        user.id
                      }
                      onClick={() =>
                        setUserDetails(
                          user
                        )
                      }
                    >
                      <span className="avatar">
                        {String(
                          user.name ||
                            "ع"
                        ).slice(
                          0,
                          1
                        )}
                      </span>

                      <span>
                        <strong>
                          {user.name ||
                            "عميل"}
                        </strong>

                        <small>
                          {user.email ||
                            user.phone ||
                            "—"}
                        </small>
                      </span>

                      <span>
                        ›
                      </span>
                    </button>
                  ))}
              </section>
            </div>
          </>
        )}

        {/* ====================================================
            PRODUCTS
            ==================================================== */}

        {tab === "products" && (
          <ProductsSection
            products={
              filteredProducts
            }
            categories={
              categories
            }
            productForm={
              productForm
            }
            setProductForm={
              setProductForm
            }
            saving={saving}
            search={search}
            setSearch={setSearch}
            saveProduct={
              saveProduct
            }
            removeProduct={
              removeProduct
            }
          />
        )}

        {/* ====================================================
            CATEGORIES
            ==================================================== */}

        {tab === "categories" && (
          <CategoriesSection
            categories={
              categories
            }
            categoryForm={
              categoryForm
            }
            setCategoryForm={
              setCategoryForm
            }
            saving={saving}
            saveCategory={
              saveCategory
            }
            removeCategory={
              removeCategory
            }
          />
        )}

        {/* ====================================================
            ORDERS
            ==================================================== */}

        {tab === "orders" && (
          <OrdersSection
            orders={
              filteredOrders
            }
            search={search}
            setSearch={setSearch}
            orderStatus={
              orderStatus
            }
            setOrderStatus={
              setOrderStatus
            }
            changeOrderStatus={
              changeOrderStatus
            }
            removeOrder={
              removeOrder
            }
            setOrderDetails={
              setOrderDetails
            }
          />
        )}

        {/* ====================================================
            USERS
            ==================================================== */}

        {tab === "users" && (
          <UsersSection
            users={
              filteredUsers
            }
            search={search}
            setSearch={setSearch}
            setUserDetails={
              setUserDetails
            }
            toggleUserBlock={
              toggleUserBlock
            }
          />
        )}

        {/* ====================================================
            PRODUCT FLAGS
            ==================================================== */}

        {tab === "offers" && (
          <ProductFlagSection
            title="🔥 عروض اليوم"
            flag="offer"
            products={products}
            setTab={changeTab}
          />
        )}

        {tab === "bestsellers" && (
          <ProductFlagSection
            title="⭐ الأكثر مبيعًا"
            flag="bestSeller"
            products={products}
            setTab={changeTab}
          />
        )}

        {tab === "new-arrivals" && (
          <ProductFlagSection
            title="🆕 وصل حديثًا"
            flag="newArrival"
            products={products}
            setTab={changeTab}
          />
        )}

        {tab === "recommended" && (
          <ProductFlagSection
            title="❤️ قد يعجبك"
            flag="recommended"
            products={products}
            setTab={changeTab}
          />
        )}

        {/* ====================================================
            BANNERS
            ==================================================== */}

        {tab === "banners" && (
          <BannerManager
            banners={banners}
            openGeneric={
              openGeneric
            }
            removeGeneric={
              removeGeneric
            }
            genericForm={
              genericForm
            }
            setGenericForm={
              setGenericForm
            }
            showGeneric={
              showGeneric
            }
            genericId={
              genericId
            }
            saveGeneric={
              saveGeneric
            }
            saving={saving}
          />
        )}

        {/* ====================================================
            GAMES
            ==================================================== */}

        {tab === "wheel" && (
          <GamesPanel
            gamesSettings={
              gamesSettings
            }
            setGamesSettings={
              setGamesSettings
            }
            saveGames={
              saveGames
            }
            saving={saving}
            wheelSettings={
              wheelSettings
            }
            setWheelSettings={
              setWheelSettings
            }
            saveWheel={
              saveWheel
            }
            addWheelPrize={
              addWheelPrize
            }
            updateWheelPrize={
              updateWheelPrize
            }
            deleteWheelPrize={
              deleteWheelPrize
            }
          />
        )}

        {/* ====================================================
            SETTINGS
            ==================================================== */}

        {tab === "settings" && (
          <SettingsPanel
            storeSettings={
              storeSettings
            }
            setStoreSettings={
              setStoreSettings
            }
            saveSettings={
              saveSettings
            }
            saving={saving}
          />
        )}

        {tab === "contact" && (
          <ContactPanel
            storeSettings={
              storeSettings
            }
            setStoreSettings={
              setStoreSettings
            }
            saveSettings={
              saveSettings
            }
            saving={saving}
          />
        )}

        {/* ====================================================
            ADMIN MANAGEMENT
            ==================================================== */}

        {tab === "admins" && (
          <AdminPanel
            admins={admins}
            adminForm={adminForm}
            setAdminForm={
              setAdminForm
            }
            saving={saving}
            setSaving={setSaving}
            log={log}
          />
        )}

        {/* ====================================================
            SECURITY
            ==================================================== */}

        {tab === "security" && (
          <SecurityPanel
            security={security}
            setSecurity={
              setSecurity
            }
            saving={saving}
            setSaving={setSaving}
            log={log}
          />
        )}

        {/* ====================================================
            REPORTS
            ==================================================== */}

        {tab === "reports" && (
          <Reports
            orders={orders}
            products={products}
            users={users}
            categories={
              categories
            }
          />
        )}

        {/* ====================================================
            SALES
            ==================================================== */}

        {tab === "sales" && (
          <Sales
            orders={orders}
          />
        )}

        {/* ====================================================
            GENERIC SECTIONS
            ==================================================== */}

        {tab === "shipping" && (
          <GenericSection
            type="shipping"
            data={shipping}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "payments" && (
          <GenericSection
            type="payments"
            data={payments}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "store-menu" && (
          <GenericSection
            type="store-menu"
            data={storeMenu}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "coupons" && (
          <GenericSection
            type="coupons"
            data={coupons}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "announcements" && (
          <GenericSection
            type="announcements"
            data={announcements}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab ===
          "announcement-bars" && (
          <GenericSection
            type="announcement-bars"
            data={
              announcementBars
            }
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "popup-ads" && (
          <GenericSection
            type="popup-ads"
            data={popupAds}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "notifications" && (
          <GenericSection
            type="notifications"
            data={notifications}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "support" && (
          <GenericSection
            type="support"
            data={support}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "favorites" && (
          <GenericSection
            type="favorites"
            data={favorites}
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "blocked-users" && (
          <GenericSection
            type="blocked-users"
            data={
              blockedUsers
            }
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {tab === "activity-log" && (
          <GenericSection
            type="activity-log"
            data={
              activityLogs
            }
            showGeneric={
              showGeneric
            }
            genericType={
              genericType
            }
            genericId={
              genericId
            }
            genericForm={
              genericForm
            }
            genericConfig={
              genericConfig
            }
            openGeneric={
              openGeneric
            }
            genericChange={
              genericChange
            }
            saveGeneric={
              saveGeneric
            }
            removeGeneric={
              removeGeneric
            }
            setShowGeneric={
              setShowGeneric
            }
            saving={saving}
            categories={
              categories
            }
          />
        )}

        {/* ====================================================
            ORDER MODAL
            ==================================================== */}

        {orderDetails && (
          <Modal
            title={`تفاصيل الطلب ${
              orderDetails.orderNumber ||
              orderDetails.id.slice(
                0,
                8
              )
            }`}
            onClose={() =>
              setOrderDetails(
                null
              )
            }
          >
            <div className="details-grid">
              <Info
                label="العميل"
                value={
                  orderDetails.customerName ||
                  orderDetails.name ||
                  "—"
                }
              />

              <Info
                label="الهاتف"
                value={
                  orderDetails.phone ||
                  "—"
                }
              />

              <Info
                label="البريد"
                value={
                  orderDetails.email ||
                  "—"
                }
              />

              <Info
                label="التاريخ"
                value={dateText(
                  orderDetails.createdAt
                )}
              />

              <Info
                label="الدفع"
                value={
                  orderDetails.paymentMethod ||
                  "—"
                }
              />

              <Info
                label="الإجمالي"
                value={money(
                  orderDetails.total ??
                    orderDetails.finalTotal
                )}
              />
            </div>

            <h3>
              🛍️ المنتجات
            </h3>

            <div className="order-items">
              {safeArray(
                orderDetails.items ||
                  orderDetails.products
              ).map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item.id ||
                      index
                    }
                  >
                    <span>
                      {item.title ||
                        item.name ||
                        "منتج"}
                    </span>

                    <strong>
                      {asNumber(
                        item.quantity,
                        1
                      )}{" "}
                      ×{" "}
                      {money(
                        item.price
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="delete-btn"
                onClick={() =>
                  removeOrder(
                    orderDetails
                  )
                }
              >
                🗑️ حذف الطلب
              </button>
            </div>
          </Modal>
        )}

        {/* ====================================================
            USER MODAL
            ==================================================== */}

        {userDetails && (
          <Modal
            title="بيانات العميل"
            onClose={() =>
              setUserDetails(
                null
              )
            }
          >
            <div className="profile-detail">
              <div className="large-avatar">
                {String(
                  userDetails.name ||
                    "ع"
                ).slice(
                  0,
                  1
                )}
              </div>

              <h3>
                {userDetails.name ||
                  "عميل"}
              </h3>

              <p dir="ltr">
                {userDetails.email ||
                  "—"}
              </p>

              <p dir="ltr">
                {userDetails.phone ||
                  "—"}
              </p>

              <span
                className={
                  userDetails.blocked
                    ? "status-inactive"
                    : "status-active"
                }
              >
                {userDetails.blocked
                  ? "🔴 محظور"
                  : "🟢 نشط"}
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  toggleUserBlock(
                    userDetails
                  )
                }
              >
                {userDetails.blocked
                  ? "✅ إلغاء الحظر"
                  : "🚫 حظر العميل"}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   PRODUCTS SECTION
   ============================================================ */

function ProductsSection({
  products,
  categories,
  productForm,
  setProductForm,
  saving,
  search,
  setSearch,
  saveProduct,
  removeProduct,
}) {
  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            📦 إدارة المنتجات
          </h2>

          <p>
            إضافة وتعديل المنتجات
            والتحكم في ظهورها.
          </p>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={() =>
            setProductForm({
              title: "",
              description: "",
              price: 0,
              oldPrice: 0,
              stock: 0,
              category: "",
              image: "",
              offer: false,
              bestSeller: false,
              newArrival: false,
              recommended: false,
              active: true,
            })
          }
        >
          ＋ إضافة منتج
        </button>
      </div>

      {productForm && (
        <form
          className="admin-form"
          onSubmit={saveProduct}
        >
          <h3>
            {productForm.id
              ? "✏️ تعديل المنتج"
              : "＋ إضافة منتج جديد"}
          </h3>

          <div className="form-grid">
            <label>
              <span>
                اسم المنتج
              </span>

              <input
                required
                value={
                  productForm.title ||
                  ""
                }
                onChange={(event) =>
                  setProductForm(
                    (previous) => ({
                      ...previous,
                      title:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                السعر الحالي
              </span>

              <input
                type="number"
                min="0"
                value={
                  productForm.price ??
                  0
                }
                onChange={(event) =>
                  setProductForm(
                    (previous) => ({
                      ...previous,
                      price:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                السعر القديم
              </span>

              <input
                type="number"
                min="0"
                value={
                  productForm.oldPrice ??
                  0
                }
                onChange={(event) =>
                  setProductForm(
                    (previous) => ({
                      ...previous,
                      oldPrice:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                الكمية
              </span>

              <input
                type="number"
                min="0"
                value={
                  productForm.stock ??
                  0
                }
                onChange={(event) =>
                  setProductForm(
                    (previous) => ({
                      ...previous,
                      stock:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                القسم
              </span>

              <select
                value={
                  productForm.category ||
                  ""
                }
                onChange={(event) =>
                  setProductForm(
                    (previous) => ({
                      ...previous,
                      category:
                        event.target
                          .value,
                    })
                  )
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
                      {category.name ||
                        category.title ||
                        category.id}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                صورة المنتج JPG/JPEG
              </span>

              <input
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={(event) => {
                  const file =
                    event.target
                      .files?.[0];

                  setProductForm(
                    (previous) => ({
                      ...previous,
                      imageFile:
                        file || null,
                      imagePreview:
                        file
                          ? URL.createObjectURL(
                              file
                            )
                          : previous.image,
                    })
                  );
                }}
              />

              {(productForm.imagePreview ||
                productForm.image) && (
                <img
                  className="form-image-preview"
                  src={
                    productForm.imagePreview ||
                    productForm.image
                  }
                  alt=""
                />
              )}
            </label>

            <label className="form-group-full">
              <span>
                الوصف
              </span>

              <textarea
                rows="4"
                value={
                  productForm.description ||
                  ""
                }
                onChange={(event) =>
                  setProductForm(
                    (previous) => ({
                      ...previous,
                      description:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>
          </div>

          <div className="flags-grid">
            {[
              [
                "offer",
                "🔥 عرض اليوم",
              ],
              [
                "bestSeller",
                "⭐ الأكثر مبيعًا",
              ],
              [
                "newArrival",
                "🆕 وصل حديثًا",
              ],
              [
                "recommended",
                "❤️ قد يعجبك",
              ],
              [
                "active",
                "🟢 المنتج مفعل",
              ],
            ].map(
              ([key, label]) => (
                <label
                  className="admin-checkbox"
                  key={key}
                >
                  <input
                    type="checkbox"
                    checked={
                      productForm[
                        key
                      ] === true
                    }
                    onChange={(event) =>
                      setProductForm(
                        (previous) => ({
                          ...previous,
                          [key]:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    {label}
                  </span>
                </label>
              )
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving
                ? "⏳ جاري الحفظ..."
                : "💾 حفظ المنتج"}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                setProductForm(
                  null
                )
              }
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input
          placeholder="🔎 ابحث باسم المنتج أو القسم..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />
      </div>

      <div className="table-scroll">
        <table className="admin-table">
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
                الكمية
              </th>
              <th>
                التصنيفات
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
            {products.map(
              (product) => (
                <tr
                  key={
                    product.id
                  }
                >
                  <td>
                    {product.image ? (
                      <img
                        className="table-img"
                        src={
                          product.image
                        }
                        alt=""
                      />
                    ) : (
                      "🖼️"
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
                    <strong>
                      {money(
                        product.price
                      )}
                    </strong>

                    {asNumber(
                      product.oldPrice
                    ) >
                      asNumber(
                        product.price
                      ) && (
                      <small className="old-price">
                        {money(
                          product.oldPrice
                        )}
                      </small>
                    )}
                  </td>

                  <td>
                    {asNumber(
                      product.stock
                    )}
                  </td>

                  <td>
                    <div className="mini-tags">
                      {product.offer && (
                        <span>
                          🔥
                        </span>
                      )}

                      {product.bestSeller && (
                        <span>
                          ⭐
                        </span>
                      )}

                      {product.newArrival && (
                        <span>
                          🆕
                        </span>
                      )}

                      {product.recommended && (
                        <span>
                          ❤️
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    {product.active !==
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
                    <div className="table-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          setProductForm({
                            ...product,
                          })
                        }
                      >
                        ✏️ تعديل
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          removeProduct(
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
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================
   CATEGORIES
   ============================================================ */

function CategoriesSection({
  categories,
  categoryForm,
  setCategoryForm,
  saving,
  saveCategory,
  removeCategory,
}) {
  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🗂️ إدارة الأقسام
          </h2>

          <p>
            التحكم في الاسم والصورة
            واللون والترتيب والأقسام
            الفرعية.
          </p>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={() =>
            setCategoryForm({
              name: "",
              categoryNumber: "",
              parentId: "",
              image: "",
              color: ACCENT,
              cardSize: "medium",
              sortOrder: 0,
              description: "",
              active: true,
            })
          }
        >
          ＋ إضافة قسم
        </button>
      </div>

      {categoryForm && (
        <form
          className="admin-form"
          onSubmit={saveCategory}
        >
          <h3>
            {categoryForm.id
              ? "✏️ تعديل القسم"
              : "＋ إضافة قسم"}
          </h3>

          <div className="form-grid">
            <label>
              <span>
                اسم القسم
              </span>

              <input
                required
                value={
                  categoryForm.name ||
                  ""
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
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
                رقم القسم
              </span>

              <input
                value={
                  categoryForm.categoryNumber ||
                  ""
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      categoryNumber:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                القسم الرئيسي
              </span>

              <select
                value={
                  categoryForm.parentId ||
                  ""
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      parentId:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="">
                  قسم رئيسي
                </option>

                {categories
                  .filter(
                    (category) =>
                      category.id !==
                      categoryForm.id
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
                        {category.name ||
                          category.title ||
                          category.id}
                      </option>
                    )
                  )}
              </select>
            </label>

            <label>
              <span>
                اللون
              </span>

              <input
                type="color"
                value={
                  /^#[0-9a-f]{6}$/i.test(
                    categoryForm.color ||
                      ""
                  )
                    ? categoryForm.color
                    : ACCENT
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      color:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                حجم البطاقة
              </span>

              <select
                value={
                  categoryForm.cardSize ||
                  "medium"
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      cardSize:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="small">
                  صغيرة
                </option>

                <option value="medium">
                  متوسطة
                </option>

                <option value="large">
                  كبيرة
                </option>
              </select>
            </label>

            <label>
              <span>
                الترتيب
              </span>

              <input
                type="number"
                value={
                  categoryForm.sortOrder ??
                  0
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      sortOrder:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                الصورة JPG/JPEG
              </span>

              <input
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={(event) => {
                  const file =
                    event.target
                      .files?.[0];

                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      imageFile:
                        file || null,
                      imagePreview:
                        file
                          ? URL.createObjectURL(
                              file
                            )
                          : previous.image,
                    })
                  );
                }}
              />

              {(categoryForm.imagePreview ||
                categoryForm.image) && (
                <img
                  className="form-image-preview"
                  src={
                    categoryForm.imagePreview ||
                    categoryForm.image
                  }
                  alt=""
                />
              )}
            </label>

            <label className="form-group-full">
              <span>
                الوصف
              </span>

              <textarea
                rows="3"
                value={
                  categoryForm.description ||
                  ""
                }
                onChange={(event) =>
                  setCategoryForm(
                    (previous) => ({
                      ...previous,
                      description:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>
          </div>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={
                categoryForm.active !==
                false
              }
              onChange={(event) =>
                setCategoryForm(
                  (previous) => ({
                    ...previous,
                    active:
                      event.target
                        .checked,
                  })
                )
              }
            />

            <span>
              🟢 القسم مفعل
            </span>
          </label>

          <div className="form-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving
                ? "⏳ جاري الحفظ..."
                : "💾 حفظ القسم"}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                setCategoryForm(
                  null
                )
              }
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

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
                الحالة
              </th>
              <th>
                إجراءات
              </th>
            </tr>
          </thead>

          <tbody>
            {categories
              .slice()
              .sort(
                (a, b) =>
                  asNumber(
                    a.sortOrder
                  ) -
                  asNumber(
                    b.sortOrder
                  )
              )
              .map(
                (category) => (
                  <tr
                    key={
                      category.id
                    }
                  >
                    <td>
                      {category.image ? (
                        <img
                          className="table-img"
                          src={
                            category.image
                          }
                          alt=""
                        />
                      ) : (
                        "🗂️"
                      )}
                    </td>

                    <td>
                      <strong>
                        {category.name ||
                          category.title ||
                          "بدون اسم"}
                      </strong>
                    </td>

                    <td>
                      <span
                        className="color-dot"
                        style={{
                          background:
                            category.color ||
                            ACCENT,
                        }}
                      />

                      {category.color ||
                        ACCENT}
                    </td>

                    <td>
                      {category.cardSize ||
                        "medium"}
                    </td>

                    <td>
                      {asNumber(
                        category.sortOrder
                      )}
                    </td>

                    <td>
                      {category.active !==
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
                      <div className="table-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() =>
                            setCategoryForm({
                              ...category,
                            })
                          }
                        >
                          ✏️ تعديل
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            removeCategory(
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
              )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================
   ORDERS
   ============================================================ */

function OrdersSection({
  orders,
  search,
  setSearch,
  orderStatus,
  setOrderStatus,
  changeOrderStatus,
  removeOrder,
  setOrderDetails,
}) {
  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🛒 إدارة الطلبات
          </h2>

          <p>
            متابعة الطلبات وتغيير
            الحالة والتفاصيل.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="🔎 ابحث برقم الطلب أو العميل أو الهاتف..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />

        <select
          value={orderStatus}
          onChange={(event) =>
            setOrderStatus(
              event.target.value
            )
          }
        >
          <option value="all">
            كل الحالات
          </option>
          <option value="pending">
            معلق
          </option>
          <option value="confirmed">
            مؤكد
          </option>
          <option value="processing">
            قيد التجهيز
          </option>
          <option value="shipped">
            تم الشحن
          </option>
          <option value="delivered">
            تم التسليم
          </option>
          <option value="cancelled">
            ملغي
          </option>
        </select>
      </div>

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
                الإجمالي
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
            {orders.map(
              (order) => (
                <tr
                  key={
                    order.id
                  }
                >
                  <td>
                    <strong>
                      {order.orderNumber ||
                        order.id.slice(
                          0,
                          8
                        )}
                    </strong>
                  </td>

                  <td>
                    {order.customerName ||
                      order.name ||
                      order.email ||
                      "—"}
                  </td>

                  <td dir="ltr">
                    {order.phone ||
                      "—"}
                  </td>

                  <td>
                    {dateText(
                      order.createdAt
                    )}
                  </td>

                  <td>
                    {money(
                      order.total ??
                        order.finalTotal
                    )}
                  </td>

                  <td>
                    <select
                      className="status-select"
                      value={
                        order.status ||
                        "pending"
                      }
                      onChange={(
                        event
                      ) =>
                        changeOrderStatus(
                          order,
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="pending">
                        معلق
                      </option>

                      <option value="confirmed">
                        مؤكد
                      </option>

                      <option value="processing">
                        قيد التجهيز
                      </option>

                      <option value="shipped">
                        تم الشحن
                      </option>

                      <option value="delivered">
                        تم التسليم
                      </option>

                      <option value="cancelled">
                        ملغي
                      </option>
                    </select>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          setOrderDetails(
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
                          removeOrder(
                            order
                          )
                        }
                      >
                        🗑️ حذف
                      </button>

                      {order.phone && (
                        <a
                          className="whatsapp-btn"
                          href={`https://wa.me/${String(
                            order.phone
                          ).replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          واتساب
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================
   USERS
   ============================================================ */

function UsersSection({
  users,
  search,
  setSearch,
  setUserDetails,
  toggleUserBlock,
}) {
  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            👥 العملاء
          </h2>

          <p>
            إدارة الحسابات والحظر
            والمتابعة.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="🔎 ابحث بالاسم أو البريد أو الهاتف..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                العميل
              </th>
              <th>
                البريد
              </th>
              <th>
                الهاتف
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
            {users.map(
              (user) => (
                <tr
                  key={
                    user.id
                  }
                >
                  <td>
                    <strong>
                      {user.name ||
                        "عميل"}
                    </strong>
                  </td>

                  <td dir="ltr">
                    {user.email ||
                      "—"}
                  </td>

                  <td dir="ltr">
                    {user.phone ||
                      "—"}
                  </td>

                  <td>
                    {user.blocked ? (
                      <span className="status-inactive">
                        🔴 محظور
                      </span>
                    ) : (
                      <span className="status-active">
                        🟢 نشط
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          setUserDetails(
                            user
                          )
                        }
                      >
                        👁️ التفاصيل
                      </button>

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() =>
                          toggleUserBlock(
                            user
                          )
                        }
                      >
                        {user.blocked
                          ? "✅ إلغاء الحظر"
                          : "🚫 حظر"}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCT FLAGS
   ============================================================ */

function ProductFlagSection({
  title,
  flag,
  products,
  setTab,
}) {
  const items = products.filter(
    (product) =>
      product[flag] === true
  );

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            {title}
          </h2>

          <p>
            المنتجات المحددة:
            {" "}
            {items.length}
          </p>
        </div>

        <button
          type="button"
          className="ghost-btn"
          onClick={() =>
            setTab("products")
          }
        >
          إدارة المنتجات
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div>
            📦
          </div>

          <h3>
            لا توجد منتجات
          </h3>

          <p>
            فعّل التصنيف من داخل
            نموذج المنتج.
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {items.map(
            (product) => (
              <div
                className="mini-product"
                key={
                  product.id
                }
              >
                {product.image ? (
                  <img
                    src={
                      product.image
                    }
                    alt=""
                  />
                ) : (
                  <div>
                    📦
                  </div>
                )}

                <strong>
                  {product.title ||
                    product.name}
                </strong>

                <span>
                  {money(
                    product.price
                  )}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   BANNERS
   ============================================================ */

function BannerManager({
  banners,
  openGeneric,
  removeGeneric,
  genericForm,
  setGenericForm,
  showGeneric,
  genericId,
  saveGeneric,
  saving,
}) {
  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🖼️ إدارة البانرات
          </h2>

          <p>
            تحكم في الصور والنصوص
            والألوان والمواضع.
          </p>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={() =>
            openGeneric(
              "banners"
            )
          }
        >
          ＋ إضافة بانر
        </button>
      </div>

      {showGeneric &&
        genericForm &&
        genericTypeIsBanners(
          genericForm
        ) && (
          <form
            className="admin-form"
            onSubmit={saveGeneric}
          >
            <h3>
              {genericId
                ? "✏️ تعديل البانر"
                : "＋ إضافة بانر"}
            </h3>

            <div className="form-grid">
              <label>
                <span>
                  العنوان
                </span>

                <input
                  value={
                    genericForm.title ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        title:
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
                    genericForm.text ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        text:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  صورة البانر JPG/JPEG
                </span>

                <input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={(event) => {
                    const file =
                      event.target
                        .files?.[0];

                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        imageFile:
                          file ||
                          null,
                        imagePreview:
                          file
                            ? URL.createObjectURL(
                                file
                              )
                            : previous.image,
                      })
                    );
                  }}
                />

                {(genericForm.imagePreview ||
                  genericForm.image) && (
                  <img
                    className="form-image-preview"
                    src={
                      genericForm.imagePreview ||
                      genericForm.image
                    }
                    alt=""
                  />
                )}
              </label>

              <label>
                <span>
                  الرابط
                </span>

                <input
                  dir="ltr"
                  value={
                    genericForm.link ||
                    "/"
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        link:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  الشارة
                </span>

                <input
                  value={
                    genericForm.tag ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        tag:
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
                    genericForm.buttonText ||
                    "تسوق الآن"
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        buttonText:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  الترتيب
                </span>

                <input
                  type="number"
                  value={
                    genericForm.order ??
                    0
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        order:
                          asNumber(
                            event
                              .target
                              .value
                          ),
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  شفافية Overlay
                </span>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    genericForm.overlayOpacity ??
                    0.35
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        overlayOpacity:
                          asNumber(
                            event
                              .target
                              .value,
                            0.35
                          ),
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  موضع النص
                </span>

                <select
                  value={
                    genericForm.textPositionX ||
                    "right"
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        textPositionX:
                          event.target
                            .value,
                      })
                    )
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
                  محاذاة النص
                </span>

                <select
                  value={
                    genericForm.textAlign ||
                    "right"
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        textAlign:
                          event.target
                            .value,
                      })
                    )
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
                  حجم العنوان
                </span>

                <input
                  type="number"
                  min="16"
                  max="100"
                  value={
                    genericForm.titleFontSize ??
                    42
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        titleFontSize:
                          asNumber(
                            event
                              .target
                              .value,
                            42
                          ),
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  حجم الوصف
                </span>

                <input
                  type="number"
                  min="10"
                  max="60"
                  value={
                    genericForm.descriptionFontSize ??
                    20
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        descriptionFontSize:
                          asNumber(
                            event
                              .target
                              .value,
                            20
                          ),
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  لون العنوان
                </span>

                <input
                  type="color"
                  value={
                    genericForm.titleColor ||
                    "#FFFFFF"
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        titleColor:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  لون الوصف
                </span>

                <input
                  type="color"
                  value={
                    genericForm.descriptionColor ||
                    "#FFFFFF"
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        descriptionColor:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  لون الزر
                </span>

                <input
                  type="color"
                  value={
                    genericForm.buttonBackground ||
                    ACCENT
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        buttonBackground:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  لون نص الزر
                </span>

                <input
                  type="color"
                  value={
                    genericForm.buttonTextColor ||
                    PRIMARY
                  }
                  onChange={(
                    event
                  ) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        buttonTextColor:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>
            </div>

            <div className="admin-checkboxes">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={
                    genericForm.active !==
                    false
                  }
                  onChange={(event) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        active:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                <span>
                  البانر مفعل
                </span>
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={
                    genericForm.enabled !==
                    false
                  }
                  onChange={(event) =>
                    setGenericForm(
                      (previous) => ({
                        ...previous,
                        enabled:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                <span>
                  البانر ظاهر
                </span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving
                  ? "⏳ جاري الحفظ..."
                  : "💾 حفظ البانر"}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  setGenericForm(
                    {}
                  )
                }
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

      <div className="cards-grid">
        {safeArray(banners)
          .slice()
          .sort(
            (a, b) =>
              asNumber(
                a.order ??
                  a.sortOrder
              ) -
              asNumber(
                b.order ??
                  b.sortOrder
              )
          )
          .map((banner) => (
            <div
              className="banner-card"
              key={banner.id}
            >
              {banner.image ? (
                <img
                  src={
                    banner.image
                  }
                  alt=""
                />
              ) : (
                <div className="banner-placeholder">
                  🖼️
                </div>
              )}

              <div>
                <strong>
                  {banner.title ||
                    "بدون عنوان"}
                </strong>

                <small>
                  {banner.text ||
                    ""}
                </small>
              </div>

              <div className="table-actions">
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() =>
                    openGeneric(
                      "banners",
                      banner
                    )
                  }
                >
                  ✏️ تعديل
                </button>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    removeGeneric(
                      "banners",
                      banner
                    )
                  }
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function genericTypeIsBanners(
  form
) {
  return (
    form &&
    typeof form === "object"
  );
}

/* ============================================================
   GAMES PANEL
   ============================================================ */

function GamesPanel({
  gamesSettings,
  setGamesSettings,
  saveGames,
  saving,
  wheelSettings,
  setWheelSettings,
  saveWheel,
  addWheelPrize,
  updateWheelPrize,
  deleteWheelPrize,
}) {
  const gameDefinitions = [
    ["wheel", "🎡", "عجلة الحظ"],
    ["cards", "🃏", "الكروت المقلوبة"],
    ["scratch", "🪙", "اكشط واربح"],
    ["mystery", "🎁", "الصناديق الغامضة"],
    ["pick", "🎯", "اختار واربح"],
    ["dice", "🎲", "النرد الرابح"],
  ];

  const updateGame = (
    game,
    patch
  ) => {
    setGamesSettings(
      (previous) => ({
        ...previous,
        [game]: {
          ...(previous[game] ||
            {}),
          ...patch,
        },
      })
    );
  };

  const addGamePrize = (
    game
  ) => {
    setGamesSettings(
      (previous) => ({
        ...previous,
        [game]: {
          ...(previous[game] ||
            {}),
          prizes: [
            ...safeArray(
              previous[game]
                ?.prizes
            ),
            {
              id: `${Date.now()}-${game}`,
              title:
                "جائزة جديدة",
              type: "discount",
              value: 10,
              probability: 10,
              color: ACCENT,
              enabled: true,
            },
          ],
        },
      })
    );
  };

  const updateGamePrize = (
    game,
    index,
    patch
  ) => {
    setGamesSettings(
      (previous) => ({
        ...previous,
        [game]: {
          ...(previous[game] ||
            {}),
          prizes: safeArray(
            previous[game]
              ?.prizes
          ).map(
            (
              prize,
              prizeIndex
            ) =>
              prizeIndex ===
              index
                ? {
                    ...prize,
                    ...patch,
                  }
                : prize
          ),
        },
      })
    );
  };

  const deleteGamePrize = (
    game,
    index
  ) => {
    setGamesSettings(
      (previous) => ({
        ...previous,
        [game]: {
          ...(previous[game] ||
            {}),
          prizes: safeArray(
            previous[game]
              ?.prizes
          ).filter(
            (_, prizeIndex) =>
              prizeIndex !==
              index
          ),
        },
      })
    );
  };

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🎮 ألعاب الحظ
          </h2>

          <p>
            تحكم كامل في جميع ألعاب
            الحظ والمحاولات والجوائز
            والاحتمالات.
          </p>
        </div>

        <button
          type="button"
          className="save-btn"
          disabled={saving}
          onClick={saveGames}
        >
          {saving
            ? "⏳ جاري الحفظ..."
            : "💾 حفظ جميع الألعاب"}
        </button>
      </div>

      <div className="games-admin-grid">
        {gameDefinitions.map(
          ([
            game,
            icon,
            title,
          ]) => {
            const settings =
              gamesSettings[
                game
              ] ||
              defaultGamesSettings[
                game
              ];

            return (
              <div
                className="game-admin-card"
                key={game}
              >
                <div className="section-header">
                  <div>
                    <h3>
                      {icon}{" "}
                      {title}
                    </h3>
                  </div>

                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        settings.enabled ===
                        true
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            enabled:
                              event
                                .target
                                .checked,
                          }
                        )
                      }
                    />

                    <span>
                      تفعيل
                    </span>
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    <span>
                      العنوان
                    </span>

                    <input
                      value={
                        settings.title ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            title:
                              event
                                .target
                                .value,
                          }
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
                        settings.description ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            description:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      المحاولات اليومية
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        settings.attemptsPerUser ??
                        1
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            attemptsPerUser:
                              Math.max(
                                1,
                                asNumber(
                                  event
                                    .target
                                    .value,
                                  1
                                )
                              ),
                          }
                        )
                      }
                    />
                  </label>

                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        settings.requireLogin ===
                        true
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            requireLogin:
                              event
                                .target
                                .checked,
                          }
                        )
                      }
                    />

                    <span>
                      يتطلب تسجيل الدخول
                    </span>
                  </label>

                  <label>
                    <span>
                      تاريخ البداية
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        settings.startDate ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            startDate:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      تاريخ النهاية
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        settings.endDate ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            endDate:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      الحد الأقصى للفائزين
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        settings.winnerLimit ??
                        0
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            winnerLimit:
                              Math.max(
                                0,
                                asNumber(
                                  event
                                    .target
                                    .value
                                )
                              ),
                          }
                        )
                      }
                    />
                  </label>

                  <label className="form-group-full">
                    <span>
                      رسالة الفوز
                    </span>

                    <input
                      value={
                        settings.winnerMessage ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateGame(
                          game,
                          {
                            winnerMessage:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </label>
                </div>

                <div className="section-header nested">
                  <div>
                    <h4>
                      🎁 الجوائز
                    </h4>
                  </div>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() =>
                      addGamePrize(
                        game
                      )
                    }
                  >
                    ＋ إضافة جائزة
                  </button>
                </div>

                <div className="prizes-grid">
                  {safeArray(
                    settings.prizes
                  ).map(
                    (
                      prize,
                      index
                    ) => (
                      <div
                        className="prize-card"
                        key={
                          prize.id ||
                          index
                        }
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
                              updateGamePrize(
                                game,
                                index,
                                {
                                  title:
                                    event
                                      .target
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
                              updateGamePrize(
                                game,
                                index,
                                {
                                  type:
                                    event
                                      .target
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

                        {![
                          "nothing",
                          "free-shipping",
                        ].includes(
                          prize.type
                        ) && (
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
                                updateGamePrize(
                                  game,
                                  index,
                                  {
                                    value:
                                      asNumber(
                                        event
                                          .target
                                          .value
                                      ),
                                  }
                                )
                              }
                            />
                          </label>
                        )}

                        <label>
                          <span>
                            الاحتمال %
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              prize.probability ??
                              0
                            }
                            onChange={(
                              event
                            ) =>
                              updateGamePrize(
                                game,
                                index,
                                {
                                  probability:
                                    Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        asNumber(
                                          event
                                            .target
                                            .value
                                        )
                                      )
                                    ),
                                }
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>
                            اللون
                          </span>

                          <input
                            type="color"
                            value={
                              /^#[0-9a-f]{6}$/i.test(
                                prize.color ||
                                  ""
                              )
                                ? prize.color
                                : ACCENT
                            }
                            onChange={(
                              event
                            ) =>
                              updateGamePrize(
                                game,
                                index,
                                {
                                  color:
                                    event
                                      .target
                                      .value,
                                }
                              )
                            }
                          />
                        </label>

                        <label className="admin-checkbox">
                          <input
                            type="checkbox"
                            checked={
                              prize.enabled !==
                              false
                            }
                            onChange={(
                              event
                            ) =>
                              updateGamePrize(
                                game,
                                index,
                                {
                                  enabled:
                                    event
                                      .target
                                      .checked,
                                }
                              )
                            }
                          />

                          <span>
                            الجائزة متاحة
                          </span>
                        </label>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            deleteGamePrize(
                              game,
                              index
                            )
                          }
                        >
                          🗑️ حذف الجائزة
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="section-header nested">
        <div>
          <h3>
            🎡 إعدادات عجلة الحظ
          </h3>

          <p>
            إعدادات العجلة الحالية
            المتوافقة مع Home.jsx.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              wheelSettings.enabled ===
              true
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
                  ...previous,
                  enabled:
                    event.target
                      .checked,
                })
              )
            }
          />

          <span>
            تفعيل العجلة
          </span>
        </label>

        <label>
          <span>
            طريقة الظهور
          </span>

          <select
            value={
              wheelSettings.displayMode ||
              "store"
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
                  ...previous,
                  displayMode:
                    event.target
                      .value,
                })
              )
            }
          >
            <option value="store">
              داخل المتجر
            </option>

            <option value="popup">
              منبثق
            </option>

            <option value="both">
              الاثنين
            </option>
          </select>
        </label>

        <label>
          <span>
            العنوان
          </span>

          <input
            value={
              wheelSettings.title ||
              ""
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
                  ...previous,
                  title:
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
              wheelSettings.description ||
              ""
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
                  ...previous,
                  description:
                    event.target
                      .value,
                })
              )
            }
          />
        </label>

        <label>
          <span>
            المحاولات اليومية
          </span>

          <input
            type="number"
            min="1"
            value={
              wheelSettings.attemptsPerUser ??
              1
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
                  ...previous,
                  attemptsPerUser:
                    Math.max(
                      1,
                      asNumber(
                        event.target
                          .value,
                        1
                      )
                    ),
                })
              )
            }
          />
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              wheelSettings.popupEnabled ===
              true
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
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

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              wheelSettings.popupClosable !==
              false
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
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

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              wheelSettings.popupShowOncePerDay ===
              true
            }
            onChange={(event) =>
              setWheelSettings(
                (previous) => ({
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

      <div className="section-header nested">
        <div>
          <h3>
            🎁 جوائز العجلة
          </h3>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={
            addWheelPrize
          }
        >
          ＋ إضافة جائزة
        </button>
      </div>

      <div className="prizes-grid">
        {safeArray(
          wheelSettings.prizes
        ).map(
          (prize, index) => (
            <div
              className="prize-card"
              key={
                prize.id ||
                index
              }
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
                  onChange={(event) =>
                    updateWheelPrize(
                      index,
                      {
                        title:
                          event
                            .target
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
                  onChange={(event) =>
                    updateWheelPrize(
                      index,
                      {
                        type:
                          event
                            .target
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

              {![
                "nothing",
                "free-shipping",
              ].includes(
                prize.type
              ) && (
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
                            asNumber(
                              event
                                .target
                                .value
                            ),
                        }
                      )
                    }
                  />
                </label>
              )}

              <label>
                <span>
                  الاحتمال %
                </span>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    prize.probability ??
                    0
                  }
                  onChange={(event) =>
                    updateWheelPrize(
                      index,
                      {
                        probability:
                          Math.min(
                            100,
                            Math.max(
                              0,
                              asNumber(
                                event
                                  .target
                                  .value
                              )
                            )
                          ),
                      }
                    )
                  }
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={
                    prize.enabled !==
                    false
                  }
                  onChange={(event) =>
                    updateWheelPrize(
                      index,
                      {
                        enabled:
                          event
                            .target
                            .checked,
                      }
                    )
                  }
                />

                <span>
                  الجائزة متاحة
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
                🗑️ حذف الجائزة
              </button>
            </div>
          )
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          disabled={saving}
          onClick={saveWheel}
        >
          {saving
            ? "⏳ جاري الحفظ..."
            : "💾 حفظ العجلة"}
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   GENERIC SECTION
   ============================================================ */

function GenericSection({
  type,
  data,
  showGeneric,
  genericType,
  genericId,
  genericForm,
  genericConfig,
  openGeneric,
  genericChange,
  saveGeneric,
  removeGeneric,
  setShowGeneric,
  saving,
  categories,
}) {
  const config =
    genericConfig[type];

  if (!config) {
    return (
      <section className="admin-card">
        <div className="empty-state">
          <h3>
            القسم غير متاح
          </h3>
        </div>
      </section>
    );
  }

  const items = safeArray(data);

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            {config.icon}{" "}
            {config.title}
          </h2>

          <p>
            إجمالي العناصر:
            {" "}
            <strong>
              {items.length}
            </strong>
          </p>
        </div>

        {!config.readOnly && (
          <button
            type="button"
            className="add-btn"
            onClick={() =>
              openGeneric(
                type
              )
            }
          >
            ＋ إضافة جديد
          </button>
        )}
      </div>

      {showGeneric &&
        genericType === type &&
        !config.readOnly && (
          <form
            className="admin-form"
            onSubmit={
              saveGeneric
            }
          >
            <h3>
              {genericId
                ? "✏️ تعديل"
                : "＋ إضافة"}{" "}
              {config.title}
            </h3>

            <div className="form-grid">
              {config.fields.map(
                (spec) => (
                  <Field
                    key={
                      spec[0]
                    }
                    spec={
                      spec
                    }
                    value={
                      genericForm[
                        spec[0]
                      ]
                    }
                    onChange={
                      genericChange
                    }
                    categories={
                      categories
                    }
                  />
                )
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving
                  ? "⏳ جاري الحفظ..."
                  : "💾 حفظ"}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowGeneric(
                    false
                  );
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div>
            {config.icon}
          </div>

          <h3>
            لا توجد بيانات
          </h3>

          <p>
            لا توجد عناصر مسجلة
            حاليًا.
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  البيانات
                </th>
                <th>
                  الحالة
                </th>
                <th>
                  التاريخ
                </th>

                {!config.readOnly && (
                  <th>
                    إجراءات
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {items.map(
                (item) => (
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
                          item.email ||
                          item.id}
                      </strong>

                      {item.message &&
                        item.title && (
                          <small>
                            {
                              item.message
                            }
                          </small>
                        )}
                    </td>

                    <td>
                      {item.active !==
                        false &&
                      item.enabled !==
                        false &&
                      item.visible !==
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
                      {dateText(
                        item.createdAt
                      )}
                    </td>

                    {!config.readOnly && (
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              openGeneric(
                                type,
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
                              removeGeneric(
                                type,
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
    </section>
  );
}

/* ============================================================
   SETTINGS PANEL
   ============================================================ */

function SettingsPanel({
  storeSettings,
  setStoreSettings,
  saveSettings,
  saving,
}) {
  const theme =
    storeSettings.theme ||
    defaultTheme;

  const text =
    storeSettings.texts ||
    defaultStoreSettings.texts;

  const colors = [
    ["primary", "اللون الأساسي"],
    ["secondary", "اللون الثانوي"],
    ["accent", "اللون المميز"],
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
    ["border", "لون الحدود"],
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
      "خلفية الشريط الرئيسي",
    ],
    [
      "navbarText",
      "نص الشريط الرئيسي",
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
      "خلفية الشريط المتحرك",
    ],
    [
      "topStripText",
      "نص الشريط المتحرك",
    ],
    [
      "footerBackground",
      "خلفية الفوتر",
    ],
    [
      "footerText",
      "نص الفوتر",
    ],
    [
      "footerBrand",
      "لون اسم المتجر",
    ],
    [
      "headingColor",
      "العناوين",
    ],
    [
      "linkColor",
      "الروابط",
    ],
    [
      "priceColor",
      "الأسعار",
    ],
    [
      "saleColor",
      "لون الخصم",
    ],
    [
      "successColor",
      "لون النجاح",
    ],
    [
      "warningColor",
      "لون التنبيه",
    ],
    [
      "errorColor",
      "لون الخطأ",
    ],
    [
      "inputBackground",
      "خلفية الحقول",
    ],
  ];

  const setTheme = (
    key,
    value
  ) => {
    setStoreSettings(
      (previous) => ({
        ...previous,
        theme: {
          ...defaultTheme,
          ...(previous.theme ||
            {}),
          [key]: value,
        },
      })
    );
  };

  const setText = (
    key,
    value
  ) => {
    setStoreSettings(
      (previous) => ({
        ...previous,
        texts: {
          ...defaultStoreSettings.texts,
          ...(previous.texts ||
            {}),
          [key]: value,
        },
      })
    );
  };

  const updateTopStrip = (
    patch
  ) => {
    setStoreSettings(
      (previous) => ({
        ...previous,
        topStrip: {
          ...defaultStoreSettings.topStrip,
          ...(previous.topStrip ||
            {}),
          ...patch,
        },
      })
    );
  };

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🎨 مظهر المتجر
          </h2>

          <p>
            تحكم كامل في الهوية
            والألوان والنصوص.
          </p>
        </div>
      </div>

      <div className="settings-block">
        <h3>
          🏪 البيانات الأساسية
        </h3>

        <div className="form-grid">
          <label>
            <span>
              اسم المتجر
            </span>

            <input
              value={
                storeSettings.storeName ||
                ""
              }
              onChange={(event) =>
                setStoreSettings(
                  (previous) => ({
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
              اللوجو JPG/JPEG
            </span>

            <input
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={(event) => {
                const file =
                  event.target
                    .files?.[0];

                if (!file) return;

                uploadImage(file)
                  .then((url) => {
                    setStoreSettings(
                      (previous) => ({
                        ...previous,
                        logo: url,
                      })
                    );
                  })
                  .catch(
                    (error) => {
                      window.alert(
                        error?.message ||
                          "❌ فشل رفع اللوجو"
                      );
                    }
                  );
              }}
            />
          </label>

          {storeSettings.logo && (
            <label>
              <span>
                معاينة اللوجو
              </span>

              <img
                className="form-image-preview"
                src={
                  storeSettings.logo
                }
                alt=""
              />
            </label>
          )}

          <label className="form-group-full">
            <span>
              الإعلان الافتراضي
            </span>

            <textarea
              rows="3"
              value={
                storeSettings.announcement ||
                ""
              }
              onChange={(event) =>
                setStoreSettings(
                  (previous) => ({
                    ...previous,
                    announcement:
                      event.target
                        .value,
                  })
                )
              }
            />
          </label>
        </div>
      </div>

      <div className="settings-block">
        <h3>
          🎨 ألوان الموقع
        </h3>

        <div className="color-grid">
          {colors.map(
            ([key, label]) => {
              const color =
                /^#[0-9a-f]{6}$/i.test(
                  String(
                    theme[key] ||
                      ""
                  )
                )
                  ? theme[key]
                  : "#000000";

              return (
                <label
                  key={key}
                >
                  <span>
                    {label}
                  </span>

                  <div className="color-input">
                    <input
                      type="color"
                      value={
                        color
                      }
                      onChange={(
                        event
                      ) =>
                        setTheme(
                          key,
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <input
                      dir="ltr"
                      value={
                        theme[key] ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setTheme(
                          key,
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </div>
                </label>
              );
            }
          )}
        </div>
      </div>

      <div className="settings-block">
        <h3>
          📝 نصوص الموقع
        </h3>

        <div className="form-grid">
          {Object.entries(
            text
          ).map(
            ([key, value]) => (
              <label
                key={key}
              >
                <span>
                  {textLabel(
                    key
                  )}
                </span>

                <input
                  value={
                    value || ""
                  }
                  onChange={(
                    event
                  ) =>
                    setText(
                      key,
                      event
                        .target
                        .value
                    )
                  }
                />
              </label>
            )
          )}
        </div>
      </div>

      <div className="settings-block">
        <h3>
          📢 الشريط المتحرك
        </h3>

        <div className="form-grid">
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={
                storeSettings
                  .topStrip
                  ?.enabled !==
                false
              }
              onChange={(
                event
              ) =>
                updateTopStrip({
                  enabled:
                    event
                      .target
                      .checked,
                })
              }
            />

            <span>
              إظهار الشريط
            </span>
          </label>

          <label>
            <span>
              الاتجاه
            </span>

            <select
              value={
                storeSettings
                  .topStrip
                  ?.direction ||
                "rtl"
              }
              onChange={(
                event
              ) =>
                updateTopStrip({
                  direction:
                    event
                      .target
                      .value,
                })
              }
            >
              <option value="rtl">
                يمين ← يسار
              </option>

              <option value="ltr">
                يسار ← يمين
              </option>
            </select>
          </label>

          <label>
            <span>
              السرعة
            </span>

            <input
              type="number"
              min="1"
              value={
                storeSettings
                  .topStrip
                  ?.speed ??
                40
              }
              onChange={(
                event
              ) =>
                updateTopStrip({
                  speed:
                    asNumber(
                      event
                        .target
                        .value,
                      40
                    ),
                })
              }
            />
          </label>

          <label>
            <span>
              الارتفاع
            </span>

            <input
              type="number"
              min="20"
              value={
                storeSettings
                  .topStrip
                  ?.height ??
                42
              }
              onChange={(
                event
              ) =>
                updateTopStrip({
                  height:
                    asNumber(
                      event
                        .target
                        .value,
                      42
                    ),
                })
              }
            />
          </label>

          <label>
            <span>
              حجم الخط
            </span>

            <input
              type="number"
              min="8"
              value={
                storeSettings
                  .topStrip
                  ?.fontSize ??
                15
              }
              onChange={(
                event
              ) =>
                updateTopStrip({
                  fontSize:
                    asNumber(
                      event
                        .target
                        .value,
                      15
                    ),
                })
              }
            />
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          disabled={saving}
          onClick={
            saveSettings
          }
        >
          {saving
            ? "⏳ جاري الحفظ..."
            : "💾 حفظ كل إعدادات المتجر"}
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   CONTACT
   ============================================================ */

function ContactPanel({
  storeSettings,
  setStoreSettings,
  saveSettings,
  saving,
}) {
  const fields = [
    ["phone", "الهاتف"],
    ["whatsapp", "واتساب"],
    [
      "email",
      "البريد الإلكتروني",
    ],
    ["address", "العنوان"],
    ["facebook", "Facebook"],
    ["instagram", "Instagram"],
    ["telegram", "Telegram"],
    ["tiktok", "TikTok"],
    ["youtube", "YouTube"],
  ];

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            📱 بيانات التواصل
          </h2>

          <p>
            كل روابط وبيانات
            التواصل الخاصة بالمتجر.
          </p>
        </div>
      </div>

      <div className="form-grid">
        {fields.map(
          ([key, label]) => (
            <label key={key}>
              <span>
                {label}
              </span>

              <input
                dir="ltr"
                value={
                  storeSettings[
                    key
                  ] || ""
                }
                onChange={(
                  event
                ) =>
                  setStoreSettings(
                    (previous) => ({
                      ...previous,
                      [key]:
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

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          disabled={saving}
          onClick={
            saveSettings
          }
        >
          {saving
            ? "⏳ جاري الحفظ..."
            : "💾 حفظ بيانات التواصل"}
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   ADMIN PANEL
   ============================================================ */

function AdminPanel({
  admins,
  adminForm,
  setAdminForm,
  saving,
  setSaving,
  log,
}) {
  const save = async () => {
    if (
      !adminForm?.email?.trim()
    ) {
      window.alert(
        "اكتب البريد الإلكتروني"
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name:
          adminForm.name ||
          "مشرف",
        email:
          adminForm.email.trim(),
        role:
          adminForm.role ||
          "admin",
        active:
          adminForm.active !==
          false,
        permissions:
          safeArray(
            adminForm.permissions
          ),
        updatedAt:
          serverTimestamp(),
      };

      if (adminForm.id) {
        await updateDoc(
          doc(
            db,
            "admins",
            adminForm.id
          ),
          payload
        );
      } else {
        await addDoc(
          collection(
            db,
            "admins"
          ),
          {
            ...payload,
            createdAt:
              serverTimestamp(),
          }
        );
      }

      await log(
        adminForm.id
          ? "تعديل مشرف"
          : "إضافة مشرف",
        payload.email
      );

      setAdminForm(null);

      window.alert(
        "✅ تم حفظ بيانات المشرف"
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ المشرف"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🔐 المشرفون
          </h2>

          <p>
            إدارة بيانات المشرفين
            والصلاحيات.
          </p>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={() =>
            setAdminForm({
              name: "",
              email: "",
              role: "admin",
              active: true,
              permissions: [],
            })
          }
        >
          ＋ إضافة مشرف
        </button>
      </div>

      {adminForm && (
        <div className="admin-form">
          <div className="form-grid">
            <label>
              <span>
                الاسم
              </span>

              <input
                value={
                  adminForm.name ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setAdminForm(
                    (previous) => ({
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
                البريد
              </span>

              <input
                dir="ltr"
                type="email"
                value={
                  adminForm.email ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setAdminForm(
                    (previous) => ({
                      ...previous,
                      email:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label>
              <span>
                الدور
              </span>

              <select
                value={
                  adminForm.role ||
                  "admin"
                }
                onChange={(
                  event
                ) =>
                  setAdminForm(
                    (previous) => ({
                      ...previous,
                      role:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="admin">
                  مشرف
                </option>

                <option value="superadmin">
                  مدير رئيسي
                </option>
              </select>
            </label>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={
                  adminForm.active !==
                  false
                }
                onChange={(event) =>
                  setAdminForm(
                    (previous) => ({
                      ...previous,
                      active:
                        event
                          .target
                          .checked,
                    })
                  )
                }
              />

              <span>
                الحساب مفعل
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="save-btn"
              disabled={saving}
              onClick={save}
            >
              {saving
                ? "⏳ جاري الحفظ..."
                : "💾 حفظ المشرف"}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                setAdminForm(
                  null
                )
              }
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="table-scroll">
        <table className="admin-table">
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
                إجراءات
              </th>
            </tr>
          </thead>

          <tbody>
            {admins.map(
              (item) => (
                <tr
                  key={
                    item.id
                  }
                >
                  <td>
                    {item.name ||
                      "مشرف"}
                  </td>

                  <td dir="ltr">
                    {item.email ||
                      "—"}
                  </td>

                  <td>
                    {item.role ===
                    "superadmin"
                      ? "👑 مدير رئيسي"
                      : "🔐 مشرف"}
                  </td>

                  <td>
                    {item.active !==
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
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() =>
                        setAdminForm({
                          ...item,
                        })
                      }
                    >
                      ✏️ تعديل
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================
   SECURITY
   ============================================================ */

function SecurityPanel({
  security,
  setSecurity,
  saving,
  setSaving,
  log,
}) {
  const save = async () => {
    setSaving(true);

    try {
      await setDoc(
        doc(
          db,
          "settings",
          "security"
        ),
        {
          ...security,
          updatedAt:
            serverTimestamp(),
        },
        { merge: true }
      );

      await log(
        "تحديث الأمان",
        "إعدادات حماية لوحة الإدارة"
      );

      window.alert(
        "✅ تم حفظ إعدادات الأمان"
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "❌ تعذر حفظ إعدادات الأمان"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            🛡️ الأمان
          </h2>

          <p>
            إعدادات حماية لوحة
            الإدارة.
          </p>
        </div>
      </div>

      <div className="flags-grid">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              security.adminProtection ===
              true
            }
            onChange={(event) =>
              setSecurity(
                (previous) => ({
                  ...previous,
                  adminProtection:
                    event.target
                      .checked,
                })
              )
            }
          />

          <span>
            حماية لوحة الإدارة
          </span>
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              security.extraVerification ===
              true
            }
            onChange={(event) =>
              setSecurity(
                (previous) => ({
                  ...previous,
                  extraVerification:
                    event.target
                      .checked,
                })
              )
            }
          />

          <span>
            التحقق الإضافي
          </span>
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={
              security.loginLogging ===
              true
            }
            onChange={(event) =>
              setSecurity(
                (previous) => ({
                  ...previous,
                  loginLogging:
                    event.target
                      .checked,
                })
              )
            }
          />

          <span>
            تسجيل محاولات الدخول
          </span>
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          disabled={saving}
          onClick={save}
        >
          {saving
            ? "⏳ جاري الحفظ..."
            : "💾 حفظ إعدادات الأمان"}
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   REPORTS
   ============================================================ */

function Reports({
  orders,
  products,
  users,
  categories,
}) {
  const delivered =
    orders.filter(
      (order) =>
        order.status ===
        "delivered"
    );

  const cancelled =
    orders.filter(
      (order) =>
        order.status ===
        "cancelled"
    );

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            📊 التقارير
          </h2>

          <p>
            ملخص سريع لأداء
            المتجر.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="report-box">
          <span>
            إجمالي المنتجات
          </span>

          <strong>
            {products.length}
          </strong>
        </div>

        <div className="report-box">
          <span>
            إجمالي الأقسام
          </span>

          <strong>
            {categories.length}
          </strong>
        </div>

        <div className="report-box">
          <span>
            طلبات مكتملة
          </span>

          <strong>
            {delivered.length}
          </strong>
        </div>

        <div className="report-box">
          <span>
            طلبات ملغاة
          </span>

          <strong>
            {cancelled.length}
          </strong>
        </div>

        <div className="report-box">
          <span>
            العملاء
          </span>

          <strong>
            {users.length}
          </strong>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SALES
   ============================================================ */

function Sales({ orders }) {
  const valid =
    orders.filter(
      (order) =>
        String(
          order.status || ""
        ).toLowerCase() !==
        "cancelled"
    );

  const total =
    valid.reduce(
      (sum, order) =>
        sum +
        asNumber(
          order.total ??
            order.finalTotal
        ),
      0
    );

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <h2>
            💰 المبيعات
          </h2>

          <p>
            ملخص المبيعات
            والطلبات.
          </p>
        </div>
      </div>

      <div className="sales-highlight">
        <span>
          إجمالي المبيعات
        </span>

        <strong>
          {money(total)}
        </strong>

        <small>
          {valid.length.toLocaleString(
            "ar-EG"
          )}{" "}
          طلب
        </small>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                الطلب
              </th>
              <th>
                التاريخ
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
            </tr>
          </thead>

          <tbody>
            {valid.map(
              (order) => (
                <tr
                  key={
                    order.id
                  }
                >
                  <td>
                    {order.orderNumber ||
                      order.id.slice(
                        0,
                        8
                      )}
                  </td>

                  <td>
                    {dateText(
                      order.createdAt
                    )}
                  </td>

                  <td>
                    {order.customerName ||
                      order.name ||
                      order.email ||
                      "—"}
                  </td>

                  <td>
                    {money(
                      order.total ??
                        order.finalTotal
                    )}
                  </td>

                  <td>
                    {order.status ||
                      "—"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================
   MODAL
   ============================================================ */

function Info({
  label,
  value,
}) {
  return (
    <div className="info-box">
      <small>
        {label}
      </small>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="admin-modal">
        <div className="modal-header">
          <h2>
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEXT LABELS
   ============================================================ */

function textLabel(key) {
  const labels = {
    homeTitle:
      "عنوان الصفحة الرئيسية",
    homeSubtitle:
      "وصف الصفحة الرئيسية",
    productsTitle:
      "عنوان المنتجات",
    offersTitle:
      "عنوان العروض",
    bestSellersTitle:
      "عنوان الأكثر مبيعًا",
    newArrivalsTitle:
      "عنوان وصل حديثًا",
    recommendedTitle:
      "عنوان قد يعجبك",
    categoriesTitle:
      "عنوان الأقسام",
    emptyProducts:
      "رسالة عدم وجود المنتجات",
    emptyCategories:
      "رسالة عدم وجود الأقسام",
    cartTitle:
      "عنوان السلة",
    checkoutTitle:
      "عنوان إتمام الطلب",
    addToCart:
      "زر أضف للسلة",
    buyNow:
      "زر اشترِ الآن",
    viewAll:
      "زر عرض الكل",
    footerAbout:
      "وصف الفوتر",
    footerRights:
      "حقوق النشر",
  };

  return (
    labels[key] || key
  );
}

/* ============================================================
   GAMES MERGE
   ============================================================ */

function mergeGames(
  defaults,
  previous,
  incoming
) {
  const result = {};

  Object.keys(defaults).forEach(
    (game) => {
      result[game] = {
        ...defaults[game],
        ...(previous?.[game] ||
          {}),
        ...(incoming?.[game] ||
          {}),
        prizes: safeArray(
          incoming?.[game]
            ?.prizes ??
            previous?.[game]
              ?.prizes ??
            defaults[game]
              .prizes
        ),
      };
    }
  );

  return result;
}