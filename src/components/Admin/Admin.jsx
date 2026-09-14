
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
   ســــَــــــــــوا | لوحة الإدارة الاحترافية
   RTL / Arabic / Firebase / Responsive
   ============================================================ */

const PRIMARY = "#071A36";
const SECONDARY = "#0B1F3A";
const ACCENT = "#D4AF37";
const PAGE_BG = "#F0F4F8";

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
  contactLink: "",
  hotlineWhatsApp: "",
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
  wheel: { enabled: true, title: "🎡 عجلة الحظ", description: "لف واربح جائزتك", attemptsPerUser: 2, requireLogin: false, startDate: "", endDate: "", winnerLimit: 0, winnerMessage: "مبروك! كسبت جائزتك 🎉", prizes: [] },
  cards: { enabled: true, title: "🃏 الكروت المقلوبة", description: "اختار كارت واكتشف جائزتك", attemptsPerUser: 2, requireLogin: false, startDate: "", endDate: "", winnerLimit: 0, winnerMessage: "مبروك! 🎉", prizes: [] },
  scratch: { enabled: true, title: "🪙 اكشط واربح", description: "اكشط واكتشف الجائزة", attemptsPerUser: 2, requireLogin: false, startDate: "", endDate: "", winnerLimit: 0, winnerMessage: "مبروك! 🎉", prizes: [] },
  mystery: { enabled: true, title: "🎁 الصناديق الغامضة", description: "اختار صندوقك", attemptsPerUser: 2, requireLogin: false, startDate: "", endDate: "", winnerLimit: 0, winnerMessage: "مبروك! 🎉", prizes: [] },
  pick: { enabled: true, title: "🎯 اختار واربح", description: "اختار هدفك واربح", attemptsPerUser: 2, requireLogin: false, startDate: "", endDate: "", winnerLimit: 0, winnerMessage: "مبروك! 🎉", prizes: [] },
  dice: { enabled: true, title: "🎲 النرد الرابح", description: "ارمِ النرد واكسب", attemptsPerUser: 2, requireLogin: false, startDate: "", endDate: "", winnerLimit: 0, winnerMessage: "مبروك! 🎉", prizes: [] },
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

// Firestore لا يقبل undefined داخل البيانات، حتى لو كان الحقل اختياريًا.
const cleanFirestoreData = (value) => {
  if (Array.isArray(value)) return value.map(cleanFirestoreData).filter((v) => v !== undefined);
  if (value && typeof value === "object" && !(value instanceof File) && !(value instanceof Date)) {
    const out = {};
    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined) out[key] = cleanFirestoreData(val);
    });
    return out;
  }
  return value === undefined ? undefined : value;
};
const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const asBool = (value, fallback = false) =>
  typeof value === "boolean" ? value : fallback;
const dateText = (value) => {
  if (!value) return "—";
  try {
    const d = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG");
  } catch {
    return "—";
  }
};
const money = (value) => `${asNumber(value).toLocaleString("ar-EG")} جنيه`;
const normalize = (v) => String(v ?? "").trim().toLowerCase();


const PERMISSION_GROUPS = [
  { key: "dashboard", label: "لوحة التحكم", items: [["dashboard.view", "عرض لوحة التحكم"]] },
  { key: "reports", label: "التقارير والمبيعات", items: [["reports.view", "عرض التقارير"], ["sales.view", "عرض المبيعات"]] },
  { key: "products", label: "المنتجات", items: [["products.view", "عرض المنتجات"], ["products.add", "إضافة منتجات"], ["products.edit", "تعديل المنتجات"], ["products.delete", "حذف المنتجات"]] },
  { key: "categories", label: "الأقسام", items: [["categories.view", "عرض الأقسام"], ["categories.add", "إضافة أقسام"], ["categories.edit", "تعديل الأقسام"], ["categories.delete", "حذف الأقسام"]] },
  { key: "flags", label: "تصنيفات المنتجات", items: [["offers.view", "عروض اليوم"], ["bestsellers.view", "الأكثر مبيعًا"], ["new-arrivals.view", "وصل حديثًا"], ["recommended.view", "قد يعجبك"]] },
  { key: "orders", label: "الطلبات", items: [["orders.view", "عرض الطلبات"], ["orders.edit", "تعديل حالة الطلب"], ["orders.delete", "حذف الطلبات"]] },
  { key: "users", label: "العملاء", items: [["users.view", "عرض العملاء"], ["users.edit", "تعديل العملاء"], ["users.block", "حظر/إلغاء حظر العملاء"]] },
  { key: "marketing", label: "التسويق", items: [["banners.view", "عرض البانرات"], ["banners.add", "إضافة بانرات"], ["banners.edit", "تعديل البانرات"], ["banners.delete", "حذف البانرات"], ["coupons.view", "عرض الكوبونات"], ["coupons.add", "إضافة كوبونات"], ["coupons.edit", "تعديل الكوبونات"], ["coupons.delete", "حذف الكوبونات"], ["announcements.view", "الإعلانات"], ["announcement-bars.view", "أشرطة الإعلانات"], ["popup-ads.view", "الإعلانات المنبثقة"], ["notifications.view", "الإشعارات"]] },
  { key: "customer-tools", label: "خدمة العملاء", items: [["support.view", "الدعم"], ["support.reply", "الرد على الدعم"], ["favorites.view", "المفضلة"], ["blocked-users.view", "العملاء المحظورون"]] },
  { key: "store", label: "إعدادات المتجر", items: [["settings.view", "عرض إعدادات المتجر"], ["settings.edit", "تعديل إعدادات المتجر"], ["contact.view", "عرض بيانات التواصل"], ["contact.edit", "تعديل بيانات التواصل"], ["shipping.view", "الشحن"], ["payments.view", "طرق الدفع"], ["store-menu.view", "قائمة المتجر"], ["activity-log.view", "سجل النشاط"], ["security.view", "الأمان"], ["security.edit", "تعديل الأمان"], ["games.view", "الألعاب"], ["games.edit", "تعديل الألعاب"], ["wheel.view", "عجلة الحظ"], ["wheel.edit", "تعديل عجلة الحظ"]] },
  { key: "admins", label: "المشرفون", items: [["admins.view", "عرض المشرفين"], ["admins.add", "إضافة مشرفين"], ["admins.edit", "تعديل المشرفين"], ["admins.delete", "حذف المشرفين"]] },
];

const TAB_PERMISSIONS = {
  dashboard: ["dashboard.view"], reports: ["reports.view"], sales: ["sales.view"],
  products: ["products.view", "products.add", "products.edit", "products.delete"],
  categories: ["categories.view", "categories.add", "categories.edit", "categories.delete"],
  offers: ["offers.view"], bestsellers: ["bestsellers.view"], "new-arrivals": ["new-arrivals.view"], recommended: ["recommended.view"],
  banners: ["banners.view", "banners.add", "banners.edit", "banners.delete"], users: ["users.view", "users.edit", "users.block"],
  orders: ["orders.view", "orders.edit", "orders.delete"], favorites: ["favorites.view"], "blocked-users": ["blocked-users.view"], support: ["support.view", "support.reply"],
  coupons: ["coupons.view", "coupons.add", "coupons.edit", "coupons.delete"], announcements: ["announcements.view"], "announcement-bars": ["announcement-bars.view"],
  "popup-ads": ["popup-ads.view"], notifications: ["notifications.view"], games: ["games.view", "games.edit"], wheel: ["wheel.view", "wheel.edit"],
  settings: ["settings.view", "settings.edit"], contact: ["contact.view", "contact.edit"], shipping: ["shipping.view"], payments: ["payments.view"], "store-menu": ["store-menu.view"],
  admins: ["admins.view", "admins.add", "admins.edit", "admins.delete"], "activity-log": ["activity-log.view"], security: ["security.view", "security.edit"],
};

const isPermissionConfigured = (admin) => Array.isArray(admin?.permissions) || (admin?.categoryPermissions && typeof admin.categoryPermissions === "object");
const hasPermission = (admin, permission, categoryId = null) => {
  if (!admin) return false;
  if (admin.isSuperAdmin || admin.role === "superadmin") return true;
  // الحفاظ على المشرفين القدامى الذين لم يكن عندهم نظام صلاحيات أصلًا.
  if (!isPermissionConfigured(admin)) return true;
  if (safeArray(admin.permissions).includes(permission)) return true;
  if (!categoryId) return false;
  const scoped = admin.categoryPermissions && typeof admin.categoryPermissions === "object" ? admin.categoryPermissions : {};
  return safeArray(scoped[categoryId]).includes(permission);
};
const hasAnyPermission = (admin, permissions = []) => safeArray(permissions).some(p => hasPermission(admin, p));
const hasAnyCategoryPermission = (admin, permission) => {
  if (!admin) return false;
  if (admin.isSuperAdmin || admin.role === "superadmin") return true;
  if (hasPermission(admin, permission)) return true;
  const scoped = admin.categoryPermissions && typeof admin.categoryPermissions === "object" ? admin.categoryPermissions : {};
  return Object.values(scoped).some(list => safeArray(list).includes(permission));
};
const productCategoryId = (product) => String(product?.categoryId || product?.categoryID || product?.category || "").trim();
const orderItems = (order) => safeArray(order?.items || order?.products || order?.orderItems);
const itemCategoryIds = (item) => [item?.categoryId, item?.categoryID, item?.category, item?.category_id].map(v => String(v ?? "").trim()).filter(Boolean);
const orderCategoryIds = (order) => {
  const ids = new Set([order?.categoryId, order?.categoryID, order?.category].map(v => String(v ?? "").trim()).filter(Boolean));
  orderItems(order).forEach(item => itemCategoryIds(item).forEach(id => ids.add(id)));
  return [...ids];
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
  { group: "الرئيسية", items: [
    ["dashboard", "🏠", "لوحة التحكم"],
    ["reports", "📊", "التقارير"],
    ["sales", "💰", "المبيعات"],
  ]},
  { group: "المتجر", items: [
    ["products", "📦", "المنتجات"],
    ["categories", "🗂️", "الأقسام"],
    ["offers", "🔥", "عروض اليوم"],
    ["bestsellers", "⭐", "الأكثر مبيعًا"],
    ["new-arrivals", "🆕", "وصل حديثًا"],
    ["recommended", "❤️", "قد يعجبك"],
    ["banners", "🖼️", "البانرات"],
  ]},
  { group: "العملاء والطلبات", items: [
    ["users", "👥", "العملاء"],
    ["orders", "🛒", "الطلبات"],
    ["favorites", "❤️", "المفضلة"],
    ["blocked-users", "🚫", "العملاء المحظورون"],
    ["support", "💬", "خدمة العملاء"],
  ]},
  { group: "التسويق", items: [
    ["coupons", "🏷️", "الكوبونات"],
    ["announcements", "📢", "الإعلانات"],
    ["announcement-bars", "📜", "أشرطة الإعلانات"],
    ["popup-ads", "🔔", "الإعلانات المنبثقة"],
    ["notifications", "🔔", "الإشعارات"],
    ["games", "🎮", "الألعاب والمسابقات"],
    ["wheel", "🎡", "عجلة الحظ"],
  ]},
  { group: "الإعدادات", items: [
    ["settings", "🎨", "مظهر المتجر"],
    ["contact", "📱", "بيانات التواصل"],
    ["shipping", "🚚", "الشحن"],
    ["payments", "💳", "طرق الدفع"],
    ["store-menu", "📋", "قائمة المتجر"],
    ["admins", "🔐", "المشرفون"],
    ["activity-log", "🧾", "سجل النشاط"],
    ["security", "🛡️", "الأمان"],
  ]},
];

const genericConfig = {
  coupons: {
    title: "الكوبونات والخصومات", icon: "🏷️",
    fields: [
      ["code", "كود الخصم", "text"], ["type", "نوع الخصم", "select", [["percentage", "نسبة مئوية"], ["fixed", "قيمة ثابتة"]]],
      ["value", "قيمة الخصم", "number"], ["minOrder", "الحد الأدنى للطلب", "number"], ["active", "مفعل", "checkbox"],
    ],
  },
  announcements: {
    title: "الإعلانات", icon: "📢",
    fields: [["title", "العنوان", "text"], ["text", "نص الإعلان", "textarea"], ["link", "الرابط", "text"], ["active", "مفعل", "checkbox"]],
  },
  "announcement-bars": {
    title: "أشرطة الإعلانات المتحركة", icon: "📜",
    fields: [
      ["text", "نص الشريط", "textarea"],
      ["type", "نوع الشريط", "select", [["marquee", "متحرك"], ["text", "نص ثابت"], ["offer", "عرض"], ["alert", "تنبيه"], ["discount", "خصم"], ["shipping", "شحن"]]],
      ["backgroundColor", "لون الخلفية", "color"], ["textColor", "لون النص", "color"],
      ["fontFamily", "نوع الخط", "text"], ["fontSize", "حجم الخط", "number"],
      ["fontWeight", "وزن الخط", "number"], ["height", "ارتفاع الشريط", "number"],
      ["speed", "سرعة الحركة", "number"], ["direction", "الاتجاه", "select", [["rtl", "يمين ← يسار"], ["ltr", "يسار ← يمين"]]],
      ["link", "الرابط", "text"], ["active", "مفعل", "checkbox"], ["visible", "ظاهر", "checkbox"],
    ],
  },
  banners: {
    title: "البانرات", icon: "🖼️",
    fields: [
      ["title", "العنوان", "text"], ["text", "الوصف", "textarea"], ["imageFile", "صورة البانر JPG/JPEG", "file"],
      ["link", "الرابط", "text"], ["buttonText", "نص الزر", "text"], ["tag", "الشارة", "text"], ["order", "الترتيب", "number"],
      ["imageFit", "طريقة احتواء الصورة", "select", [["contain", "إظهار الصورة بالكامل"], ["cover", "ملء المساحة"]]],
      ["overlayOpacity", "شفافية Overlay", "number"], ["active", "مفعل", "checkbox"], ["enabled", "ظاهر", "checkbox"],
    ],
  },
  "popup-ads": {
    title: "الإعلانات المنبثقة", icon: "🔔",
    fields: [["title", "العنوان", "text"], ["text", "النص", "textarea"], ["imageFile", "صورة الإعلان JPG/JPEG", "file"], ["buttonText", "نص الزر", "text"], ["link", "الرابط", "text"], ["delay", "التأخير بالمللي ثانية", "number"], ["width", "عرض النافذة", "number"], ["maxWidth", "أقصى عرض", "number"], ["backgroundColor", "خلفية الإعلان", "color"], ["buttonColor", "لون الزر", "color"], ["active", "مفعل", "checkbox"], ["closable", "قابل للإغلاق", "checkbox"]],
  },
  notifications: {
    title: "الإشعارات", icon: "🔔",
    fields: [["title", "العنوان", "text"], ["message", "الرسالة", "textarea"], ["type", "النوع", "select", [["info", "معلومة"], ["success", "نجاح"], ["warning", "تنبيه"], ["error", "خطأ"]]], ["active", "مفعل", "checkbox"]],
  },
  support: {
    title: "رسائل خدمة العملاء", icon: "💬", readOnly: true,
    fields: [],
  },
  favorites: { title: "المفضلة", icon: "❤️", readOnly: true, fields: [] },
  "blocked-users": {
    title: "العملاء المحظورون", icon: "🚫",
    fields: [["reason", "سبب الحظر", "textarea"], ["active", "الحظر مفعل", "checkbox"]],
  },
  shipping: {
    title: "مناطق الشحن", icon: "🚚",
    fields: [["name", "اسم المنطقة", "text"], ["cost", "تكلفة الشحن", "number"], ["estimatedDays", "المدة المتوقعة", "text"], ["active", "مفعل", "checkbox"]],
  },
  payments: {
    title: "طرق الدفع", icon: "💳",
    fields: [["name", "اسم الطريقة", "text"], ["description", "الوصف", "textarea"], ["accountNumber", "رقم التحويل", "text"], ["active", "مفعل", "checkbox"]],
  },
  "activity-log": { title: "سجل النشاط", icon: "🧾", readOnly: true, fields: [] },
  "store-menu": {
    title: "قائمة المتجر", icon: "📋",
    fields: [["title", "اسم العنصر", "text"], ["link", "الرابط", "text"], ["icon", "الأيقونة", "text"], ["order", "الترتيب", "number"], ["active", "مفعل", "checkbox"]],
  },
};

function Field({ spec, value, onChange, categories }) {
  const [name, label, type, options] = spec;
  const v = value ?? (type === "checkbox" ? true : "");
  if (type === "checkbox") return <label className="admin-checkbox"><input type="checkbox" name={name} checked={v !== false} onChange={onChange} /><span>{label}</span></label>;
  if (type === "textarea") return <label><span>{label}</span><textarea name={name} rows="4" value={v} onChange={onChange} /></label>;
  if (type === "color") return <label><span>{label}</span><input type="color" name={name} value={/^#[0-9a-f]{6}$/i.test(String(v)) ? v : "#000000"} onChange={onChange} /></label>;
  if (type === "select") return <label><span>{label}</span><select name={name} value={v} onChange={onChange}>{safeArray(options).map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></label>;
  if (type === "select-category") return <label><span>{label}</span><select name={name} value={v} onChange={onChange}><option value="">اختر القسم</option>{safeArray(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>;
  if (type === "file") return <label><span>{label}</span><input type="file" name={name} accept=".jpg,.jpeg,image/jpeg" onChange={onChange} /></label>;
  return <label><span>{label}</span><input type={type || "text"} name={name} value={v} onChange={onChange} /></label>;
}


const productImageList = (product = {}) => {
  const raw = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
  ];
  return [...new Set(raw.filter((v) => typeof v === "string" && v.trim()))];
};

const normalizeVariant = (variant = {}, index = 0) => {
  const images = [
    ...(Array.isArray(variant.images) ? variant.images : []),
    variant.image,
  ].filter((v) => typeof v === "string" && v.trim());
  return {
    id: variant.id || variant._id || `variant-${index}`,
    name: variant.name || variant.title || "",
    sku: variant.sku || "",
    price: variant.price ?? 0,
    oldPrice: variant.oldPrice ?? 0,
    stock: variant.stock ?? 0,
    image: images[0] || "",
    images: [...new Set(images)],
    imageFiles: Array.isArray(variant.imageFiles) ? variant.imageFiles : [],
  };
};

const productVariantsList = (product = {}) =>
  Array.isArray(product.variants) ? product.variants.map((v, i) => normalizeVariant(v, i)) : [];

const Stat = ({ icon, label, value, onClick }) => <button type="button" className="admin-stat-card" onClick={onClick}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</strong></button>;

function GenericSection({
  type,
  data,
  categories,
  showGeneric,
  genericType,
  genericId,
  genericForm,
  saving,
  openGeneric,
  saveGeneric,
  setShowGeneric,
  genericChange,
  removeGeneric,
}) {
  const cfg = genericConfig[type];
  if (!cfg) return null;
  const items = safeArray(data);
  return <section className="admin-card">
    <div className="section-header"><div><h2>{cfg.icon} {cfg.title}</h2><p>إجمالي العناصر: <strong>{items.length}</strong></p></div>{!cfg.readOnly && <button type="button" className="add-btn" onClick={() => openGeneric(type)}>＋ إضافة جديد</button>}</div>
    {showGeneric && genericType === type && <form className="admin-form" onSubmit={saveGeneric}><h3>{genericId ? "✏️ تعديل" : "＋ إضافة"} {cfg.title}</h3><div className="form-grid">{cfg.fields.map(s => <Field key={s[0]} spec={s} value={genericForm[s[0]]} onChange={genericChange} categories={categories} />)}</div><div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving ? "⏳ جاري الحفظ..." : "💾 حفظ"}</button><button type="button" className="cancel-btn" onClick={() => setShowGeneric(false)}>إلغاء</button></div></form>}
    {items.length === 0 ? <div className="empty-state"><div>{cfg.icon}</div><h3>لا توجد بيانات</h3><p>لا توجد عناصر مسجلة حاليًا.</p></div> : <div className="table-scroll"><table className="admin-table"><thead><tr><th>البيانات</th><th>الحالة</th><th>التاريخ</th>{!cfg.readOnly && <th>إجراءات</th>}</tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.title || item.name || item.code || item.text || item.message || item.description || item.email || item.id}</strong>{item.message && item.title && <small>{item.message}</small>}</td><td>{item.active !== false && item.enabled !== false && item.visible !== false ? <span className="status-active">🟢 مفعل</span> : <span className="status-inactive">🔴 متوقف</span>}</td><td>{dateText(item.createdAt)}</td>{!cfg.readOnly && <td><div className="table-actions"><button type="button" className="edit-btn" onClick={() => openGeneric(type, item)}>✏️ تعديل</button><button type="button" className="delete-btn" onClick={() => removeGeneric(type, item)}>🗑️ حذف</button></div></td>}</tr>)}</tbody></table></div>}
  </section>;
}


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
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);
  const [wheelSettings, setWheelSettings] = useState(defaultWheelSettings);
  const [gamesSettings, setGamesSettings] = useState(defaultGamesSettings);
  const [security, setSecurity] = useState({ adminProtection: true, extraVerification: false, loginLogging: true });
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

  const changeTab = (next) => {
    setTab(next);
    setSearch("");
    setShowGeneric(false);
    setProductForm(null);
    setCategoryForm(null);
    setAdminForm(null);
    setOrderDetails(null);
    setUserDetails(null);
  };

  useEffect(() => {
    let alive = true;
    const un = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (alive) { setAdmin(null); setLoading(false); } return; }
      try {
        const a = await getDoc(doc(db, "admins", user.uid));
        if (a.exists()) {
          const data = a.data();
          if (data.active === false) { setAdmin(null); setLoading(false); return; }
          setAdmin({ id: user.uid, ...data });
        }
        else {
          const u = await getDoc(doc(db, "users", user.uid));
          const data = u.exists() ? u.data() : {};
          setAdmin({ id: user.uid, email: user.email || data.email || "", name: data.name || user.displayName || "مشرف", role: data.role || "admin", isSuperAdmin: data.role === "superadmin" });
        }
      } catch (e) { console.error("Admin auth error", e); setAdmin(null); }
      finally { if (alive) setLoading(false); }
    });
    return () => { alive = false; un(); };
  }, []);

  useEffect(() => {
    const listeners = [];
    const watch = (name, setter) => {
      try {
        const unsub = onSnapshot(collection(db, name), snap => setter(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        listeners.push(unsub);
      } catch (e) { console.error(`Firestore ${name}`, e); }
    };
    watch("products", setProducts); watch("categories", setCategories); watch("orders", setOrders); watch("users", setUsers);
    watch("banners", setBanners); watch("coupons", setCoupons); watch("announcements", setAnnouncements); watch("announcementBars", setAnnouncementBars);
    watch("popupAds", setPopupAds); watch("notifications", setNotifications); watch("supportMessages", setSupport); watch("favorites", setFavorites);
    watch("blockedUsers", setBlockedUsers); watch("shippingZones", setShipping); watch("paymentMethods", setPayments); watch("storeMenuItems", setStoreMenu);
    watch("activityLogs", setActivityLogs); watch("admins", setAdmins);
    const settingsUnsub = onSnapshot(doc(db, "settings", "store"), snap => { if (snap.exists()) setStoreSettings(p => ({ ...defaultStoreSettings, ...p, ...snap.data(), theme: { ...defaultTheme, ...(p.theme || {}), ...(snap.data().theme || {}) }, texts: { ...defaultStoreSettings.texts, ...(p.texts || {}), ...(snap.data().texts || {}) } })); }, e => console.warn("settings/store", e?.message));
    const wheelUnsub = onSnapshot(doc(db, "settings", "wheel"), snap => { if (snap.exists()) setWheelSettings({ ...defaultWheelSettings, ...snap.data(), prizes: safeArray(snap.data().prizes) }); }, e => console.warn("settings/wheel", e?.message));
    const gamesUnsub = onSnapshot(doc(db, "settings", "games"), snap => { if (snap.exists()) setGamesSettings(mergeGames(defaultGamesSettings, {}, snap.data())); }, e => console.warn("settings/games", e?.message));
    const secUnsub = onSnapshot(doc(db, "settings", "security"), snap => { if (snap.exists()) setSecurity(p => ({ ...p, ...snap.data() })); }, e => console.warn("settings/security", e?.message));
    listeners.push(settingsUnsub, wheelUnsub, gamesUnsub, secUnsub);
    return () => listeners.forEach(fn => { try { fn(); } catch {} });
  }, []);


  const isSuperAdmin = admin?.isSuperAdmin || admin?.role === "superadmin";
  const categoryPermissionMap = admin?.categoryPermissions && typeof admin.categoryPermissions === "object" ? admin.categoryPermissions : {};
  const hasCategoryScope = !isSuperAdmin && Object.keys(categoryPermissionMap).length > 0;
  const descendantCategoryIds = useMemo(() => {
    if (!hasCategoryScope) return categories.map(c => c.id);
    const roots = Object.keys(categoryPermissionMap);
    const allowed = new Set(roots);
    let changed = true;
    while (changed) {
      changed = false;
      categories.forEach(c => {
        if (c.parentId && allowed.has(c.parentId) && !allowed.has(c.id)) { allowed.add(c.id); changed = true; }
      });
    }
    return [...allowed];
  }, [categories, hasCategoryScope, admin]);
  const canTab = (id) => {
    if (hasAnyPermission(admin, TAB_PERMISSIONS[id] || [])) return true;
    const scopedTabs = {
      products: "products.view", categories: "categories.view", offers: "offers.view", bestsellers: "bestsellers.view", "new-arrivals": "new-arrivals.view", recommended: "recommended.view",
      orders: "orders.view", users: "users.view", favorites: "favorites.view", "blocked-users": "blocked-users.view", support: "support.view",
    };
    return scopedTabs[id] ? hasAnyCategoryPermission(admin, scopedTabs[id]) : false;
  };
  const canCategoryAction = (permission, categoryId) => hasPermission(admin, permission, categoryId);
  const scopedProducts = useMemo(() => products.filter(p => {
    const cid = productCategoryId(p);
    return hasPermission(admin, "products.view", cid) || hasPermission(admin, "products.edit", cid) || hasPermission(admin, "products.add", cid) || hasPermission(admin, "products.delete", cid);
  }), [products, admin, categoryPermissionMap]);
  const scopedCategories = useMemo(() => categories.filter(c => {
    if (hasPermission(admin, "categories.view")) return true;
    return descendantCategoryIds.includes(c.id) && (hasCategoryScope || hasAnyCategoryPermission(admin, "products.view"));
  }), [categories, admin, descendantCategoryIds, hasCategoryScope]);
  const orderIsAllowed = (o) => {
    if (!hasCategoryScope) return hasPermission(admin, "orders.view") || hasPermission(admin, "orders.edit") || hasPermission(admin, "orders.delete");
    if (!hasPermission(admin, "orders.view") && !hasPermission(admin, "orders.edit") && !hasPermission(admin, "orders.delete")) return false;
    const ids = orderCategoryIds(o);
    if (!ids.length) return false;
    return ids.some(cid => descendantCategoryIds.includes(cid) && (hasPermission(admin, "orders.view", cid) || hasPermission(admin, "orders.edit", cid) || hasPermission(admin, "products.view", cid)));
  };
  const scopedOrders = useMemo(() => orders.filter(orderIsAllowed), [orders, admin, descendantCategoryIds, hasCategoryScope]);
  const scopedUserIds = useMemo(() => {
    if (!hasCategoryScope) return new Set(users.map(u => u.id));
    const ids = new Set();
    scopedOrders.forEach(o => {
      const uid = String(o.userId || o.uid || o.customerId || o.userUid || "").trim();
      if (uid) ids.add(uid);
      const email = normalize(o.email || o.customerEmail || "");
      if (email) users.filter(u => normalize(u.email || "") === email).forEach(u => ids.add(u.id));
      const phone = normalize(o.phone || o.customerPhone || "");
      if (phone) users.filter(u => normalize(u.phone || "") === phone).forEach(u => ids.add(u.id));
    });
    return ids;
  }, [users, scopedOrders, hasCategoryScope]);
  const scopedUsers = useMemo(() => users.filter(u => !hasCategoryScope || scopedUserIds.has(u.id)), [users, hasCategoryScope, scopedUserIds]);
  const scopedFavorites = useMemo(() => favorites.filter(f => {
    if (!hasCategoryScope) return true;
    const cid = String(f.categoryId || f.productCategoryId || "").trim();
    if (cid) return descendantCategoryIds.includes(cid);
    const pid = String(f.productId || f.productID || "").trim();
    if (pid) return scopedProducts.some(p => p.id === pid);
    return scopedUserIds.has(String(f.userId || f.uid || f.customerId || ""));
  }), [favorites, hasCategoryScope, descendantCategoryIds, scopedProducts, scopedUserIds]);
  const scopedSupport = useMemo(() => support.filter(x => !hasCategoryScope || scopedUserIds.has(String(x.userId || x.uid || x.customerId || x.userUid || "")) || scopedOrders.some(o => String(o.id) === String(x.orderId || ""))), [support, hasCategoryScope, scopedUserIds, scopedOrders]);
  const scopedActivityLogs = useMemo(() => activityLogs.filter(x => !hasCategoryScope || scopedUserIds.has(String(x.userId || x.uid || x.customerId || x.userUid || "")) || String(x.adminId || "") === String(admin?.id || "")), [activityLogs, hasCategoryScope, scopedUserIds, admin]);

  const counts = useMemo(() => ({
    products: scopedProducts.length,
    categories: scopedCategories.length,
    orders: scopedOrders.length,
    users: scopedUsers.length,
    pending: scopedOrders.filter(o => ["pending", "new"].includes(o.status)).length,
    sales: scopedOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + asNumber(o.total ?? o.finalTotal), 0),
  }), [scopedProducts, scopedCategories, scopedOrders, scopedUsers]);

  const filteredProducts = useMemo(() => scopedProducts.filter(p => !search || normalize(`${p.title} ${p.category} ${p.categoryId} ${p.description}`).includes(normalize(search))), [scopedProducts, search]);
  const filteredUsers = useMemo(() => scopedUsers.filter(u => !search || normalize(`${u.name} ${u.email} ${u.phone}`).includes(normalize(search))), [scopedUsers, search]);
  const filteredOrders = useMemo(() => scopedOrders.filter(o => {
    const q = normalize(`${o.orderNumber} ${o.customerName} ${o.name} ${o.phone} ${o.email}`);
    return (!search || q.includes(normalize(search))) && (orderStatus === "all" || o.status === orderStatus);
  }), [scopedOrders, search, orderStatus]);

  // بيانات العميل الكاملة داخل لوحة الأدمن: الطلبات، المفضلة، الدعم،
  // الإشعارات، وسجل النشاط المرتبط بالعميل.
  const selectedUserOrders = useMemo(() => {
    if (!userDetails) return [];
    const uid = String(userDetails.id || userDetails.uid || "");
    const email = normalize(userDetails.email || "");
    const phone = normalize(userDetails.phone || "");
    return scopedOrders
      .filter(o => {
        const oid = String(o.userId || o.uid || o.customerId || o.userUid || "");
        const oe = normalize(o.email || o.customerEmail || "");
        const op = normalize(o.phone || o.customerPhone || "");
        return (uid && oid === uid) || (email && oe === email) || (phone && op === phone);
      })
      .sort((a,b) => asNumber(b.createdAt?.seconds) - asNumber(a.createdAt?.seconds));
  }, [scopedOrders, userDetails]);

  const selectedUserFavorites = useMemo(() => {
    if (!userDetails) return [];
    const uid = String(userDetails.id || userDetails.uid || "");
    const email = normalize(userDetails.email || "");
    return scopedFavorites.filter(f => {
      const fid = String(f.userId || f.uid || f.customerId || "");
      const fe = normalize(f.email || f.userEmail || "");
      return (uid && fid === uid) || (email && fe === email);
    });
  }, [scopedFavorites, userDetails]);

  const selectedUserSupport = useMemo(() => {
    if (!userDetails) return [];
    const uid = String(userDetails.id || userDetails.uid || "");
    const email = normalize(userDetails.email || "");
    const phone = normalize(userDetails.phone || "");
    return scopedSupport.filter(x => {
      const xid = String(x.userId || x.uid || x.customerId || x.userUid || "");
      const xe = normalize(x.email || x.customerEmail || "");
      const xp = normalize(x.phone || x.customerPhone || "");
      return (uid && xid === uid) || (email && xe === email) || (phone && xp === phone);
    }).sort((a,b) => asNumber(b.createdAt?.seconds) - asNumber(a.createdAt?.seconds));
  }, [scopedSupport, userDetails]);

  const selectedUserNotifications = useMemo(() => {
    if (!userDetails) return [];
    const uid = String(userDetails.id || userDetails.uid || "");
    const email = normalize(userDetails.email || "");
    return notifications.filter(x => {
      const xid = String(x.userId || x.uid || x.customerId || x.userUid || "");
      const xe = normalize(x.email || x.userEmail || "");
      return (uid && xid === uid) || (email && xe === email);
    }).sort((a,b) => asNumber(b.createdAt?.seconds) - asNumber(a.createdAt?.seconds));
  }, [notifications, userDetails]);

  const selectedUserActivity = useMemo(() => {
    if (!userDetails) return [];
    const uid = String(userDetails.id || userDetails.uid || "");
    const email = normalize(userDetails.email || "");
    const phone = normalize(userDetails.phone || "");
    const name = normalize(userDetails.name || "");
    return scopedActivityLogs.filter(x => {
      const xid = String(x.userId || x.uid || x.customerId || x.userUid || "");
      const xe = normalize(x.email || x.userEmail || x.customerEmail || "");
      const xp = normalize(x.phone || x.customerPhone || "");
      const xn = normalize(x.customerName || x.userName || "");
      return (uid && xid === uid) || (email && xe === email) || (phone && xp === phone) || (name && xn === name);
    }).sort((a,b) => asNumber(b.createdAt?.seconds) - asNumber(a.createdAt?.seconds));
  }, [scopedActivityLogs, userDetails]);

  const selectedUserVisits = useMemo(() => {
    if (!userDetails) return [];
    const raw = userDetails.visitHistory || userDetails.visits || userDetails.loginHistory || userDetails.sessions || [];
    return safeArray(raw).slice().sort((a,b) => {
      const ad = a?.createdAt || a?.visitedAt || a?.loginAt || a?.timestamp;
      const bd = b?.createdAt || b?.visitedAt || b?.loginAt || b?.timestamp;
      return asNumber(bd?.seconds || bd) - asNumber(ad?.seconds || ad);
    });
  }, [userDetails]);

  const selectedUserSpent = useMemo(() => selectedUserOrders.reduce((sum, o) => sum + asNumber(o.total ?? o.finalTotal), 0), [selectedUserOrders]);

  const log = async (action, details) => {
    try { await addDoc(collection(db, "activityLogs"), { action, details, adminId: admin?.id || null, adminName: admin?.name || "مشرف", createdAt: serverTimestamp() }); } catch (e) { console.warn("activity log", e); }
  };

  const saveSettings = async () => {
    if (!hasPermission(admin, "settings.edit")) { alert("⛔ ليس لديك صلاحية تعديل إعدادات المتجر"); return; }
    setSaving(true); try { await setDoc(doc(db, "settings", "store"), { ...storeSettings, updatedAt: serverTimestamp() }, { merge: true }); await log("تعديل إعدادات المتجر", "تم حفظ الألوان والنصوص والإعدادات العامة"); alert("✅ تم حفظ إعدادات المتجر"); } catch (e) { console.error(e); alert(e?.message || "❌ تعذر حفظ الإعدادات"); } finally { setSaving(false); }
  };
  const saveWheel = async () => {
    if (!hasPermission(admin, "wheel.edit")) { alert("⛔ ليس لديك صلاحية تعديل عجلة الحظ"); return; }
    setSaving(true); try { await setDoc(doc(db, "settings", "wheel"), { ...wheelSettings, prizes: safeArray(wheelSettings.prizes), updatedAt: serverTimestamp() }, { merge: true }); await log("تعديل عجلة الحظ", "تم حفظ إعدادات العجلة"); alert("✅ تم حفظ إعدادات عجلة الحظ"); } catch (e) { console.error(e); alert(e?.message || "❌ تعذر الحفظ"); } finally { setSaving(false); }
  };
  const saveGames = async () => {
    if (!hasPermission(admin, "games.edit")) { alert("⛔ ليس لديك صلاحية تعديل الألعاب"); return; }
    setSaving(true);
    try { await setDoc(doc(db, "settings", "games"), { ...gamesSettings, updatedAt: serverTimestamp() }, { merge: true }); await log("تحديث الألعاب", "تم حفظ إعدادات جميع الألعاب"); alert("✅ تم حفظ إعدادات الألعاب"); }
    catch (e) { console.error(e); alert(e?.message || "❌ تعذر حفظ الألعاب"); }
    finally { setSaving(false); }
  };

  const uploadImage = async (file) => {
    if (!file) return "";
    const isJpeg = ["image/jpeg", "image/jpg"].includes(file.type) || /\.(jpe?g)$/i.test(file.name || "");
    if (!isJpeg) throw new Error("الصورة لازم تكون JPG أو JPEG فقط");
    if (file.size > 5 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "elsafty_store");
    const response = await fetch("https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload", { method: "POST", body: data });
    if (!response.ok) throw new Error("فشل رفع الصورة إلى Cloudinary");
    const json = await response.json();
    return json.secure_url || json.url || "";
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    const categoryId = productCategoryId(productForm);
    const permission = productForm?.id ? "products.edit" : "products.add";
    if (!hasPermission(admin, permission, categoryId)) { alert("⛔ ليس لديك صلاحية تنفيذ هذا الإجراء على هذا القسم"); return; }
    setSaving(true);
    try {
      const form = { ...productForm };

      // توافق كامل مع المنتجات القديمة والجديدة: category + categoryId.
      const selectedCategoryId = String(form.categoryId || form.category || "").trim();
      form.categoryId = selectedCategoryId;
      form.category = selectedCategoryId;

      // الصور: غير محدودة، مع الحفاظ على image كصورة رئيسية للتوافق مع الواجهة القديمة.
      const currentImages = productImageList(form);
      const uploadedImages = [];
      for (const file of safeArray(form.imageFiles)) {
        if (file) uploadedImages.push(await uploadImage(file));
      }
      const images = [...new Set([...currentImages, ...uploadedImages].filter(Boolean))];
      form.images = images;
      form.image = images.includes(form.image) ? form.image : (images[0] || "");

      // المتغيرات: كل متغير يمكن أن يمتلك صورًا وأسعارًا ومخزونًا وSKU مستقلًا.
      const variants = [];
      for (let i = 0; i < safeArray(form.variants).length; i += 1) {
        const source = normalizeVariant(form.variants[i], i);
        const variantUploaded = [];
        for (const file of safeArray(source.imageFiles)) {
          if (file) variantUploaded.push(await uploadImage(file));
        }
        const variantImages = [...new Set([...source.images, ...variantUploaded].filter(Boolean))];
        variants.push({
          id: source.id,
          name: source.name,
          sku: source.sku,
          price: asNumber(source.price),
          oldPrice: asNumber(source.oldPrice),
          stock: asNumber(source.stock),
          image: variantImages[0] || "",
          images: variantImages,
        });
      }

      form.variants = variants;
      form.hasVariants = form.hasVariants === true || variants.length > 0;
      form.price = asNumber(form.price);
      form.oldPrice = asNumber(form.oldPrice);
      form.stock = asNumber(form.stock);
      form.offer = form.offer === true;
      form.bestSeller = form.bestSeller === true;
      form.newArrival = form.newArrival === true;
      form.recommended = form.recommended === true;
      form.active = form.active !== false;

      // الحقول المؤقتة لا تُرسل إلى Firestore.
      delete form.imageFile;
      delete form.imageFiles;
      delete form.imagePreview;

      if (productForm.id) {
        await updateDoc(doc(db, "products", productForm.id), { ...cleanFirestoreData(form), updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "products"), { ...cleanFirestoreData(form), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }

      await log(productForm.id ? "تعديل منتج" : "إضافة منتج", form.title || "منتج");
      setProductForm(null);
      alert("✅ تم حفظ المنتج");
    } catch (e2) {
      console.error(e2);
      alert(e2?.message || "❌ تعذر حفظ المنتج");
    } finally {
      setSaving(false);
    }
  };
  const removeProduct = async (p) => { if (!hasPermission(admin, "products.delete", productCategoryId(p))) { alert("⛔ ليس لديك صلاحية حذف منتجات هذا القسم"); return; } if (!window.confirm(`حذف المنتج «${p.title || "بدون اسم"}»؟`)) return; try { await deleteDoc(doc(db, "products", p.id)); await log("حذف منتج", p.title || p.id); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };

  const saveCategory = async (e) => {
    e.preventDefault();
    const permission = categoryForm?.id ? "categories.edit" : "categories.add";
    if (!hasPermission(admin, permission, categoryForm?.id || null)) { alert("⛔ ليس لديك صلاحية تعديل هذا القسم"); return; }
    setSaving(true); try {
      const form = { ...categoryForm }; if (form.imageFile) form.image = await uploadImage(form.imageFile); delete form.imageFile; delete form.imagePreview;
      form.sortOrder = asNumber(form.sortOrder); form.active = form.active !== false;
      if (categoryForm.id) await updateDoc(doc(db, "categories", categoryForm.id), { ...cleanFirestoreData(form), updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "categories"), { ...cleanFirestoreData(form), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await log(categoryForm.id ? "تعديل قسم" : "إضافة قسم", form.name || "قسم"); setCategoryForm(null); alert("✅ تم حفظ القسم");
    } catch (e2) { console.error(e2); alert(e2?.message || "❌ تعذر حفظ القسم"); } finally { setSaving(false); }
  };
  const removeCategory = async (c) => { if (!hasPermission(admin, "categories.delete", c.id)) { alert("⛔ ليس لديك صلاحية حذف هذا القسم"); return; } if (!window.confirm(`حذف القسم «${c.name || "بدون اسم"}»؟`)) return; try { await deleteDoc(doc(db, "categories", c.id)); await log("حذف قسم", c.name || c.id); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };

  const changeOrderStatus = async (o, status) => { if (!hasPermission(admin, "orders.edit") && !orderCategoryIds(o).some(cid => hasPermission(admin, "orders.edit", cid))) { alert("⛔ ليس لديك صلاحية تعديل هذا الطلب"); return; }
    if (!orderIsAllowed(o)) { alert("⛔ هذا الطلب خارج نطاق الأقسام المسموح بها"); return; } try { await updateDoc(doc(db, "orders", o.id), { status, updatedAt: serverTimestamp() }); await log("تحديث حالة طلب", `${o.orderNumber || o.id}: ${status}`); } catch (e) { alert(e?.message || "❌ تعذر تحديث الطلب"); } };
  const removeOrder = async (o) => { if (!hasPermission(admin, "orders.delete") && !orderCategoryIds(o).some(cid => hasPermission(admin, "orders.delete", cid))) { alert("⛔ ليس لديك صلاحية حذف هذا الطلب"); return; }
    if (!orderIsAllowed(o)) { alert("⛔ هذا الطلب خارج نطاق الأقسام المسموح بها"); return; } if (!window.confirm("هل تريد حذف الطلب نهائيًا؟")) return; try { await deleteDoc(doc(db, "orders", o.id)); await log("حذف طلب", o.orderNumber || o.id); setOrderDetails(null); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };
  const toggleUserBlock = async (u) => { if (!hasPermission(admin, "users.block") || (hasCategoryScope && !scopedUserIds.has(u.id))) { alert("⛔ ليس لديك صلاحية تعديل هذا العميل"); return; } try { await updateDoc(doc(db, "users", u.id), { blocked: !u.blocked, updatedAt: serverTimestamp() }); await log(u.blocked ? "إلغاء حظر عميل" : "حظر عميل", u.email || u.name || u.id); } catch (e) { alert(e?.message || "❌ تعذر تعديل حالة العميل"); } };

  const openGeneric = (type, item = null) => {
    setGenericType(type); setGenericId(item?.id || null);
    setGenericForm(item ? { ...item } : {
      active: true, enabled: true, visible: true, type: type === "announcement-bars" ? "marquee" : type === "banners" ? "banner" : type === "popup-ads" ? "image" : "item",
      backgroundColor: PRIMARY, background: PRIMARY, textColor: "#FFFFFF", fontFamily: "Cairo", fontSize: 15, fontWeight: 700,
      height: 42, speed: 40, direction: "rtl", order: 0, imageFit: "contain", overlayOpacity: 0.35, width: 90, maxWidth: 720, backgroundColor: PRIMARY, buttonColor: ACCENT,
    }); setShowGeneric(true);
  };
  const genericChange = (e) => { const { name, type, value, checked, files } = e.target; if (type === "file") { const file = files?.[0] || null; if (file && !(["image/jpeg","image/jpg"].includes(file.type) || /\.(jpe?g)$/i.test(file.name || ""))) { alert("الصورة لازم تكون JPG أو JPEG فقط"); e.target.value=""; return; } if (file && file.size > 5 * 1024 * 1024) { alert("حجم الصورة يجب ألا يتجاوز 5 ميجابايت"); e.target.value=""; return; } setGenericForm(p => ({ ...p, [name]: file, imageFile: file, imagePreview: file ? URL.createObjectURL(file) : p.imagePreview })); e.target.value=""; return; } setGenericForm(p => ({ ...p, [name]: type === "checkbox" ? checked : type === "number" ? asNumber(value) : value })); };
  const saveGeneric = async (e) => {
    e.preventDefault();
    const viewPermission = `${genericType}.view`;
    const editPermission = genericId ? `${genericType}.edit` : `${genericType}.add`;
    if (!hasPermission(admin, editPermission) && !hasPermission(admin, viewPermission)) { alert("⛔ ليس لديك صلاحية تنفيذ هذا الإجراء"); return; }
    setSaving(true); try {
      const name = collectionMap[genericType]; if (!name) throw new Error("القسم غير معروف");
      const payload = { ...genericForm };
      if (payload.imageFile) payload.image = await uploadImage(payload.imageFile);
      delete payload.id; delete payload.createdAt; delete payload.updatedAt; delete payload.imageFile; delete payload.imagePreview;
      const cleanPayload = cleanFirestoreData(payload) || {};
      // لا نسمح أبدًا بحفظ type بقيمة undefined في أي مستند.
      if (cleanPayload.type === undefined) {
        cleanPayload.type = genericType === "announcement-bars" ? "marquee" : genericType === "banners" ? "banner" : genericType === "popup-ads" ? "image" : "item";
      }
      if (genericId) {
        await updateDoc(doc(db, name, genericId), { ...cleanPayload, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, name), { ...cleanPayload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await log(genericId ? "تعديل عنصر" : "إضافة عنصر", genericConfig[genericType]?.title || genericType); setShowGeneric(false); alert("✅ تم الحفظ");
    } catch (e2) { console.error(e2); alert(e2?.message || "❌ تعذر الحفظ"); } finally { setSaving(false); }
  };
  const removeGeneric = async (type, item) => { const name = collectionMap[type]; if (!hasPermission(admin, `${type}.delete`) && !hasPermission(admin, `${type}.edit`)) { alert("⛔ ليس لديك صلاحية حذف هذا العنصر"); return; } if (!name || !window.confirm("هل تريد حذف هذا العنصر؟")) return; try { await deleteDoc(doc(db, name, item.id)); await log("حذف عنصر", `${genericConfig[type]?.title || type}: ${item.title || item.name || item.text || item.id}`); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };

  const addPrize = () => setWheelSettings(p => ({ ...p, prizes: [...safeArray(p.prizes), { id: `${Date.now()}`, title: "جائزة جديدة", type: "discount", value: 10, color: "#D4AF37", enabled: true }] }));
  const updatePrize = (index, patch) => setWheelSettings(p => ({ ...p, prizes: safeArray(p.prizes).map((x, i) => i === index ? { ...x, ...patch } : x) }));
  const deletePrize = (index) => setWheelSettings(p => ({ ...p, prizes: safeArray(p.prizes).filter((_, i) => i !== index) }));

  const title = menu.flatMap(g => g.items).find(x => x[0] === tab)?.[2] || "لوحة التحكم";
  if (loading) return <div className="admin-page" dir="rtl"><div className="admin-loading">⏳ جاري تحميل لوحة الإدارة...</div></div>;
  if (!admin) return <div className="admin-page" dir="rtl"><div className="admin-login-required"><div>🔐</div><h2>الدخول غير مصرح</h2><p>يجب تسجيل الدخول بحساب مشرف للوصول إلى لوحة الإدارة.</p><button type="button" className="save-btn" onClick={() => navigate("/login")}>تسجيل الدخول</button></div></div>;



  return <div className="admin-page" dir="rtl">
    <aside className="admin-sidebar">
      <div className="admin-brand"><div className="brand-mark">س</div><div><strong>ســــَــــــــــوا</strong><small>لوحة الإدارة</small></div></div>
      <div className="admin-profile"><div className="avatar">{String(admin.name || "م").slice(0, 1)}</div><div><strong>{admin.name || "مشرف"}</strong><small>{admin.isSuperAdmin || admin.role === "superadmin" ? "مدير رئيسي" : "مشرف"}</small></div></div>
      <nav>{menu.map(group => { const items = group.items.filter(([id]) => canTab(id)); return items.length ? <div className="menu-group" key={group.group}><h4>{group.group}</h4>{items.map(([id, icon, text]) => <button type="button" key={id} className={tab === id ? "admin-menu-item active" : "admin-menu-item"} onClick={() => changeTab(id)}><span>{icon}</span><span>{text}</span>{id === "orders" && counts.pending > 0 && <b>{counts.pending}</b>}</button>)}</div> : null; })}</nav>
      <button type="button" className="back-store" onClick={() => navigate("/")}>← العودة للمتجر</button>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><div><span className="eyebrow">لوحة التحكم</span><h1>{title}</h1></div><div className="top-actions"><button type="button" onClick={() => navigate("/")}>🏪 المتجر</button><div className="top-admin">👤 {admin.name || "مشرف"}</div></div></header>

      {tab === "dashboard" && <>
        <div className="admin-hero"><div><span>مرحبًا بك 👋</span><h2>إدارة ســــَــــــــــوا من مكان واحد</h2><p>تابع المبيعات والطلبات والعملاء وتحكم في كل تفاصيل المتجر.</p></div><button type="button" onClick={() => changeTab("settings")}>⚙️ إعدادات المتجر</button></div>
        <div className="stats-grid"><Stat icon="👥" label="العملاء" value={counts.users} onClick={() => changeTab("users")} /><Stat icon="📦" label="المنتجات" value={counts.products} onClick={() => changeTab("products")} /><Stat icon="🗂️" label="الأقسام" value={counts.categories} onClick={() => changeTab("categories")} /><Stat icon="🛒" label="الطلبات" value={counts.orders} onClick={() => changeTab("orders")} /><Stat icon="⏳" label="طلبات معلقة" value={counts.pending} onClick={() => { changeTab("orders"); setOrderStatus("pending"); }} /><Stat icon="💰" label="إجمالي المبيعات" value={money(counts.sales)} onClick={() => changeTab("sales")} /></div>
        <div className="dashboard-grid"><section className="admin-card"><div className="section-header"><div><h2>🛒 أحدث الطلبات</h2><p>آخر الطلبات المسجلة في المتجر</p></div><button type="button" className="ghost-btn" onClick={() => changeTab("orders")}>عرض الكل</button></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{scopedOrders.slice().sort((a,b) => asNumber(b.createdAt?.seconds) - asNumber(a.createdAt?.seconds)).slice(0,8).map(o => <tr key={o.id}><td><button type="button" className="table-link" onClick={() => setOrderDetails(o)}>{o.orderNumber || o.id.slice(0,8)}</button></td><td>{o.customerName || o.name || o.email || "—"}</td><td>{money(o.total ?? o.finalTotal)}</td><td><span className={`status-pill ${o.status || "pending"}`}>{o.status || "pending"}</span></td></tr>)}</tbody></table></div></section><section className="admin-card"><div className="section-header"><div><h2>👥 أحدث العملاء</h2><p>الحسابات المسجلة مؤخرًا</p></div><button type="button" className="ghost-btn" onClick={() => changeTab("users")}>عرض الكل</button></div>{scopedUsers.slice(0,8).map(u => <button type="button" className="user-row" key={u.id} onClick={() => setUserDetails(u)}><span className="avatar">{String(u.name || "ع").slice(0,1)}</span><span><strong>{u.name || "عميل"}</strong><small>{u.email || u.phone || "—"}</small></span><span>›</span></button>)}</section></div>
      </>}

      {tab === "products" && <section className="admin-card">
        <div className="section-header">
          <div><h2>📦 إدارة المنتجات</h2><p>إضافة وتعديل المنتجات والتحكم في الأقسام والصور والمتغيرات بدون حد لعدد الصور أو المتغيرات.</p></div>
          <button type="button" className="add-btn" disabled={!hasPermission(admin,"products.add") && !hasAnyCategoryPermission(admin,"products.add")} onClick={() => setProductForm({
            title: "", description: "", price: 0, oldPrice: 0, stock: 0,
            category: "", categoryId: "", image: "", images: [], imageFiles: [], imagePreview: "",
            hasVariants: false, variants: [], offer: false, bestSeller: false, newArrival: false, recommended: false, active: true,
          })}>＋ إضافة منتج</button>
        </div>

        {productForm && <form className="admin-form" onSubmit={saveProduct} style={{ overflowX: "auto", width: "100%" }}>
          <h3>{productForm.id ? "✏️ تعديل المنتج" : "＋ إضافة منتج جديد"}</h3>

          <div className="form-grid">
            <label><span>اسم المنتج</span><input required value={productForm.title || ""} onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))} /></label>
            <label><span>السعر الحالي</span><input type="number" min="0" value={productForm.price ?? 0} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} /></label>
            <label><span>السعر القديم</span><input type="number" min="0" value={productForm.oldPrice ?? 0} onChange={e => setProductForm(p => ({ ...p, oldPrice: e.target.value }))} /></label>
            <label><span>الكمية</span><input type="number" min="0" value={productForm.stock ?? 0} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} /></label>
            <label><span>القسم</span><select value={productForm.categoryId || productForm.category || ""} onChange={e => setProductForm(p => ({ ...p, category: e.target.value, categoryId: e.target.value }))}>
              <option value="">اختر القسم</option>
              {scopedCategories.slice().sort((a,b) => asNumber(a.sortOrder) - asNumber(b.sortOrder)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label className="form-group-full"><span>صور المنتج — يمكنك اختيار عدد غير محدود</span><input type="file" multiple accept=".jpg,.jpeg,image/jpeg" onChange={e => { const files = Array.from(e.target.files || []); const bad = files.find(f => !(["image/jpeg","image/jpg"].includes(f.type) || /\.(jpe?g)$/i.test(f.name || "")) || f.size > 5 * 1024 * 1024); if (bad) { alert("كل الصور لازم تكون JPG/JPEG فقط وحجم كل صورة لا يتجاوز 5 ميجابايت"); e.target.value=""; return; } setProductForm(p => ({ ...p, imageFiles: [...safeArray(p.imageFiles), ...files] })); e.target.value=""; }} /></label>
            <label className="form-group-full"><span>الوصف</span><textarea rows="4" value={productForm.description || ""} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} /></label>
          </div>

          {productImageList(productForm).length > 0 && <div className="admin-card" style={{ marginTop: 16, padding: 16 }}>
            <div className="section-header nested"><div><h3>🖼️ صور المنتج</h3><p>اضغط «رئيسية» لتحديد الصورة التي ستظهر في البطاقات القديمة.</p></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12 }}>
              {productImageList(productForm).map((src, index) => <div key={`${src}-${index}`} style={{ border: `1px solid ${src === productForm.image ? ACCENT : "#D9DFE8"}`, borderRadius: 12, padding: 8, background: "#fff" }}>
                <img src={src} alt="" style={{ width: "100%", height: 110, objectFit: "contain", borderRadius: 8, background: "#F8FAFC" }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <button type="button" className="edit-btn" onClick={() => setProductForm(p => ({ ...p, image: src }))}>{src === productForm.image ? "⭐ الرئيسية" : "اجعلها رئيسية"}</button>
                  <button type="button" className="delete-btn" onClick={() => setProductForm(p => {
                    const next = productImageList(p).filter((_, i) => i !== index);
                    return { ...p, images: next, image: p.image === src ? (next[0] || "") : p.image };
                  })}>🗑️ حذف</button>
                </div>
              </div>)}
            </div>
          </div>}

          {safeArray(productForm.imageFiles).length > 0 && <div className="admin-card" style={{ marginTop: 12, padding: 16 }}>
            <h3>📥 صور جديدة جاهزة للرفع ({productForm.imageFiles.length})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {productForm.imageFiles.map((file, index) => <span key={`${file.name}-${index}`} className="mini-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{file.name}<button type="button" onClick={() => setProductForm(p => ({ ...p, imageFiles: safeArray(p.imageFiles).filter((_, i) => i !== index) }))}>×</button></span>)}
            </div>
          </div>}

          <div className="admin-card" style={{ marginTop: 16, padding: 16 }}>
            <div className="section-header nested"><div><h3>🎨 المتغيرات</h3><p>أضف أي عدد من المتغيرات، مثل المقاس أو اللون أو الخامة، ولكل متغير سعر ومخزون وSKU وصور خاصة.</p></div><button type="button" className="add-btn" onClick={() => setProductForm(p => ({ ...p, hasVariants: true, variants: [...safeArray(p.variants), normalizeVariant({ name: "", sku: "", price: p.price || 0, oldPrice: p.oldPrice || 0, stock: p.stock || 0, images: [] }, safeArray(p.variants).length)] }))}>＋ إضافة متغير</button></div>
            <label className="admin-checkbox"><input type="checkbox" checked={productForm.hasVariants === true} onChange={e => setProductForm(p => ({ ...p, hasVariants: e.target.checked }))} /><span>تفعيل المتغيرات لهذا المنتج</span></label>

            {safeArray(productForm.variants).length === 0 && <div className="empty-state" style={{ marginTop: 12 }}>لا توجد متغيرات. يمكنك إضافتها من زر «إضافة متغير».</div>}

            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {safeArray(productForm.variants).map((variant, index) => {
                const v = normalizeVariant(variant, index);
                return <div key={v.id} style={{ border: "1px solid #D9DFE8", borderRadius: 14, padding: 14, background: "#FAFCFF" }}>
                  <div className="section-header nested"><div><h4 style={{ margin: 0 }}>متغير #{index + 1}</h4><small>{v.sku || "بدون SKU"}</small></div><button type="button" className="delete-btn" onClick={() => setProductForm(p => ({ ...p, variants: safeArray(p.variants).filter((_, i) => i !== index), hasVariants: safeArray(p.variants).length > 1 }))}>🗑️ حذف المتغير</button></div>
                  <div className="form-grid">
                    <label><span>اسم المتغير</span><input value={v.name} placeholder="مثال: أحمر - XL" onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), name:e.target.value } : x) }))} /></label>
                    <label><span>SKU</span><input value={v.sku} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), sku:e.target.value } : x) }))} /></label>
                    <label><span>السعر</span><input type="number" min="0" value={v.price} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), price:e.target.value } : x) }))} /></label>
                    <label><span>السعر القديم</span><input type="number" min="0" value={v.oldPrice} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), oldPrice:e.target.value } : x) }))} /></label>
                    <label><span>المخزون</span><input type="number" min="0" value={v.stock} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), stock:e.target.value } : x) }))} /></label>
                    <label className="form-group-full"><span>صور المتغير — بدون حد</span><input type="file" multiple accept=".jpg,.jpeg,image/jpeg" onChange={e => { const files = Array.from(e.target.files || []); const bad = files.find(f => !(["image/jpeg","image/jpg"].includes(f.type) || /\.(jpe?g)$/i.test(f.name || "")) || f.size > 5 * 1024 * 1024); if (bad) { alert("كل الصور لازم تكون JPG/JPEG فقط وحجم كل صورة لا يتجاوز 5 ميجابايت"); e.target.value=""; return; } setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), imageFiles: [...safeArray(x.imageFiles), ...files] } : x) })); e.target.value=""; }} /></label>
                  </div>
                  {v.images.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                    {v.images.map((src, imageIndex) => <div key={`${src}-${imageIndex}`} style={{ width: 110, border: `1px solid ${src === v.image ? ACCENT : "#D9DFE8"}`, borderRadius: 10, padding: 6 }}>
                      <img src={src} alt="" style={{ width: "100%", height: 80, objectFit: "contain", borderRadius: 7 }} />
                      <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                        <button type="button" className="edit-btn" onClick={() => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), image:src } : x) }))}>⭐</button>
                        <button type="button" className="delete-btn" onClick={() => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => { if(i!==index)return x; const nx=normalizeVariant(x,i).images.filter((_,j)=>j!==imageIndex); return { ...normalizeVariant(x,i), images:nx, image:normalizeVariant(x,i).image===src ? (nx[0]||"") : normalizeVariant(x,i).image }; }) }))}>🗑️</button>
                      </div>
                    </div>)}
                  </div>}
                  {safeArray(v.imageFiles).length > 0 && <div style={{ marginTop: 10 }}><small>📥 ملفات جديدة: {v.imageFiles.map(f=>f.name).join("، ")}</small></div>}
                </div>;
              })}
            </div>
          </div>

          <div className="flags-grid">{[["offer","🔥 عرض اليوم"],["bestSeller","⭐ الأكثر مبيعًا"],["newArrival","🆕 وصل حديثًا"],["recommended","❤️ قد يعجبك"],["active","🟢 المنتج مفعل"]].map(([k,l])=><label className="admin-checkbox" key={k}><input type="checkbox" checked={productForm[k]===true} onChange={e=>setProductForm(p=>({...p,[k]:e.target.checked}))}/><span>{l}</span></label>)}</div>
          <div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving?"⏳ جاري رفع الصور وحفظ المنتج...":"💾 حفظ المنتج"}</button><button type="button" className="cancel-btn" onClick={()=>setProductForm(null)}>إلغاء</button></div>
        </form>}

        <div className="toolbar"><input placeholder="🔎 ابحث باسم المنتج أو القسم..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="table-scroll"><table className="admin-table"><thead><tr><th>الصورة</th><th>المنتج</th><th>القسم</th><th>السعر</th><th>الكمية</th><th>التصنيفات</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredProducts.map(p=>{const imgs=productImageList(p);const category=categories.find(c=>c.id===(p.categoryId||p.category));return <tr key={p.id}><td>{(p.image||imgs[0])?<img className="table-img" src={p.image||imgs[0]} alt=""/>:<span>🖼️</span>}</td><td><strong>{p.title||"بدون اسم"}</strong>{imgs.length>1&&<small style={{display:"block"}}>🖼️ {imgs.length} صور</small>}{safeArray(p.variants).length>0&&<small style={{display:"block"}}>🎨 {p.variants.length} متغير</small>}</td><td>{category?.name||p.categoryName||"—"}</td><td><strong>{money(p.price)}</strong>{asNumber(p.oldPrice)>asNumber(p.price)&&<small className="old-price">{money(p.oldPrice)}</small>}</td><td>{asNumber(p.stock)}</td><td><div className="mini-tags">{p.offer&&<span>🔥</span>}{p.bestSeller&&<span>⭐</span>}{p.newArrival&&<span>🆕</span>}{p.recommended&&<span>❤️</span>}</div></td><td>{p.active!==false?<span className="status-active">🟢 مفعل</span>:<span className="status-inactive">🔴 متوقف</span>}</td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setProductForm({...p,categoryId:p.categoryId||p.category||"",category:p.categoryId||p.category||"",images:imgs,image: p.image||imgs[0]||"",imageFiles:[],variants:productVariantsList(p),hasVariants:p.hasVariants===true||safeArray(p.variants).length>0})}>✏️ تعديل</button><button type="button" className="delete-btn" onClick={()=>removeProduct(p)}>🗑️ حذف</button></div></td></tr>})}</tbody></table></div>
      </section>}

      {tab === "categories" && <section className="admin-card"><div className="section-header"><div><h2>🗂️ إدارة الأقسام</h2><p>تحكم في الاسم والصورة واللون والترتيب والأقسام الفرعية.</p></div><button type="button" className="add-btn" disabled={!hasPermission(admin,"categories.add")} onClick={()=>setCategoryForm({name:"",categoryNumber:"",parentId:"",image:"",color:ACCENT,cardSize:"medium",sortOrder:0,description:"",active:true})}>＋ إضافة قسم</button></div>{categoryForm&&<form className="admin-form" onSubmit={saveCategory} style={{overflowX:"auto",width:"100%"}}><h3>{categoryForm.id?"✏️ تعديل القسم":"＋ إضافة قسم"}</h3><div className="form-grid"><label><span>اسم القسم</span><input required value={categoryForm.name} onChange={e=>setCategoryForm(p=>({...p,name:e.target.value}))}/></label><label><span>رقم القسم</span><input value={categoryForm.categoryNumber} onChange={e=>setCategoryForm(p=>({...p,categoryNumber:e.target.value}))}/></label><label><span>القسم الرئيسي</span><select value={categoryForm.parentId} onChange={e=>setCategoryForm(p=>({...p,parentId:e.target.value}))}><option value="">قسم رئيسي</option>{scopedCategories.filter(c=>c.id!==categoryForm.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label><span>اللون</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(categoryForm.color)?categoryForm.color:ACCENT} onChange={e=>setCategoryForm(p=>({...p,color:e.target.value}))}/></label><label><span>حجم البطاقة</span><select value={categoryForm.cardSize} onChange={e=>setCategoryForm(p=>({...p,cardSize:e.target.value}))}><option value="small">صغيرة</option><option value="medium">متوسطة</option><option value="large">كبيرة</option></select></label><label><span>الترتيب</span><input type="number" value={categoryForm.sortOrder} onChange={e=>setCategoryForm(p=>({...p,sortOrder:e.target.value}))}/></label><label><span>الصورة</span><input type="file" accept=".jpg,.jpeg,image/jpeg" onChange={e=>{const f=e.target.files?.[0]; if(f && !(["image/jpeg","image/jpg"].includes(f.type) || /\.(jpe?g)$/i.test(f.name||""))){alert("الصورة لازم تكون JPG أو JPEG فقط");e.target.value="";return;} if(f && f.size>5*1024*1024){alert("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");e.target.value="";return;} setCategoryForm(p=>({...p,imageFile:f}));}}/></label><label className="form-group-full"><span>الوصف</span><textarea rows="3" value={categoryForm.description} onChange={e=>setCategoryForm(p=>({...p,description:e.target.value}))}/></label></div><label className="admin-checkbox"><input type="checkbox" checked={categoryForm.active!==false} onChange={e=>setCategoryForm(p=>({...p,active:e.target.checked}))}/><span>🟢 القسم مفعل</span></label><div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving?"⏳ جاري الحفظ...":"💾 حفظ القسم"}</button><button type="button" className="cancel-btn" onClick={()=>setCategoryForm(null)}>إلغاء</button></div></form>}<div className="table-scroll"><table className="admin-table"><thead><tr><th>الصورة</th><th>القسم</th><th>اللون</th><th>الحجم</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{scopedCategories.slice().sort((a,b)=>asNumber(a.sortOrder)-asNumber(b.sortOrder)).map(c=><tr key={c.id}><td>{c.image?<img className="table-img" src={c.image} alt=""/>:"🗂️"}</td><td><strong>{c.name}</strong></td><td><span className="color-dot" style={{background:c.color||ACCENT}}/>{c.color||ACCENT}</td><td>{c.cardSize||"medium"}</td><td>{asNumber(c.sortOrder)}</td><td>{c.active!==false?<span className="status-active">🟢 مفعل</span>:<span className="status-inactive">🔴 متوقف</span>}</td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setCategoryForm({...c})}>✏️ تعديل</button><button type="button" className="delete-btn" onClick={()=>removeCategory(c)}>🗑️ حذف</button></div></td></tr>)}</tbody></table></div></section>}

      {tab === "orders" && <section className="admin-card"><div className="section-header"><div><h2>🛒 إدارة الطلبات</h2><p>متابعة الطلبات وتغيير الحالة والتفاصيل.</p></div></div><div className="toolbar"><input placeholder="🔎 ابحث برقم الطلب أو العميل أو الهاتف..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={orderStatus} onChange={e=>setOrderStatus(e.target.value)}><option value="all">كل الحالات</option><option value="pending">معلق</option><option value="confirmed">مؤكد</option><option value="processing">قيد التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>الهاتف</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredOrders.map(o=><tr key={o.id}><td><strong>{o.orderNumber||o.id.slice(0,8)}</strong></td><td>{o.customerName||o.name||o.email||"—"}</td><td dir="ltr">{o.phone||"—"}</td><td>{dateText(o.createdAt)}</td><td>{money(o.total??o.finalTotal)}</td><td><select className="status-select" value={o.status||"pending"} onChange={e=>changeOrderStatus(o,e.target.value)}><option value="pending">معلق</option><option value="confirmed">مؤكد</option><option value="processing">قيد التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setOrderDetails(o)}>👁️ التفاصيل</button><button type="button" className="delete-btn" onClick={()=>removeOrder(o)}>🗑️ حذف</button>{o.phone&&<a className="whatsapp-btn" href={`https://wa.me/${String(o.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer">واتساب</a>}</div></td></tr>)}</tbody></table></div></section>}

      {tab === "users" && <section className="admin-card"><div className="section-header"><div><h2>👥 العملاء</h2><p>إدارة الحسابات والحظر والمتابعة.</p></div></div><div className="toolbar"><input placeholder="🔎 ابحث بالاسم أو البريد أو الهاتف..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>العميل</th><th>البريد</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}><td><strong>{u.name||"عميل"}</strong></td><td dir="ltr">{u.email||"—"}</td><td dir="ltr">{u.phone||"—"}</td><td>{u.blocked?<span className="status-inactive">🔴 محظور</span>:<span className="status-active">🟢 نشط</span>}</td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setUserDetails(u)}>👁️ التفاصيل</button><button type="button" className="cancel-btn" onClick={()=>toggleUserBlock(u)}>{u.blocked?"✅ إلغاء الحظر":"🚫 حظر"}</button></div></td></tr>)}</tbody></table></div></section>}

      {tab === "offers" && <ProductFlagSection title="🔥 عروض اليوم" flag="offer" products={scopedProducts} setTab={changeTab} />}
      {tab === "bestsellers" && <ProductFlagSection title="⭐ الأكثر مبيعًا" flag="bestSeller" products={scopedProducts} setTab={changeTab} />}
      {tab === "new-arrivals" && <ProductFlagSection title="🆕 وصل حديثًا" flag="newArrival" products={scopedProducts} setTab={changeTab} />}
      {tab === "recommended" && <ProductFlagSection title="❤️ قد يعجبك" flag="recommended" products={scopedProducts} setTab={changeTab} />}

      {tab === "banners" && <GenericSection type="banners" data={banners} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}

      {tab === "games" && <GamesPanel gamesSettings={gamesSettings} setGamesSettings={setGamesSettings} saveGames={saveGames} saving={saving} />}

      {tab === "wheel" && <section className="admin-card"><div className="section-header"><div><h2>🎡 عجلة الحظ</h2><p>تحكم كامل في الظهور والمحاولات والجوائز.</p></div></div><div className="form-grid"><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.enabled===true} onChange={e=>setWheelSettings(p=>({...p,enabled:e.target.checked}))}/><span>تفعيل عجلة الحظ</span></label><label><span>طريقة الظهور</span><select value={wheelSettings.displayMode} onChange={e=>setWheelSettings(p=>({...p,displayMode:e.target.value}))}><option value="store">داخل المتجر</option><option value="popup">منبثق</option><option value="both">الاثنين</option></select></label><label><span>العنوان</span><input value={wheelSettings.title||""} onChange={e=>setWheelSettings(p=>({...p,title:e.target.value}))}/></label><label><span>الوصف</span><input value={wheelSettings.description||""} onChange={e=>setWheelSettings(p=>({...p,description:e.target.value}))}/></label><label><span>المحاولات اليومية</span><input type="number" min="1" value={wheelSettings.attemptsPerUser} onChange={e=>setWheelSettings(p=>({...p,attemptsPerUser:Math.max(1,asNumber(e.target.value,1))}))}/></label><label><span>تأخير Popup</span><input type="number" min="0" value={wheelSettings.popupDelay} onChange={e=>setWheelSettings(p=>({...p,popupDelay:Math.max(0,asNumber(e.target.value))}))}/></label><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.popupEnabled===true} onChange={e=>setWheelSettings(p=>({...p,popupEnabled:e.target.checked}))}/><span>تفعيل Popup</span></label><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.popupClosable!==false} onChange={e=>setWheelSettings(p=>({...p,popupClosable:e.target.checked}))}/><span>السماح بالإغلاق</span></label><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.popupShowOncePerDay===true} onChange={e=>setWheelSettings(p=>({...p,popupShowOncePerDay:e.target.checked}))}/><span>مرة واحدة يوميًا</span></label></div><div className="section-header nested"><div><h3>🎁 الجوائز</h3><p>أضف وعدّل الجوائز مباشرة.</p></div><button type="button" className="add-btn" onClick={addPrize}>＋ إضافة جائزة</button></div><div className="prizes-grid">{safeArray(wheelSettings.prizes).map((p,i)=><div className="prize-card" key={p.id||i}><label><span>اسم الجائزة</span><input value={p.title||""} onChange={e=>updatePrize(i,{title:e.target.value})}/></label><label><span>النوع</span><select value={p.type||"discount"} onChange={e=>updatePrize(i,{type:e.target.value})}><option value="discount">نسبة خصم</option><option value="fixed">خصم مبلغ</option><option value="free-shipping">شحن مجاني</option><option value="gift">هدية</option><option value="nothing">حظ أوفر</option></select></label>{!["nothing","free-shipping"].includes(p.type)&&<label><span>القيمة</span><input type="number" min="0" value={p.value??0} onChange={e=>updatePrize(i,{value:asNumber(e.target.value)})}/></label>}<label><span>اللون</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(p.color)?p.color:"#D4AF37"} onChange={e=>updatePrize(i,{color:e.target.value})}/></label><label className="admin-checkbox"><input type="checkbox" checked={p.enabled!==false} onChange={e=>updatePrize(i,{enabled:e.target.checked})}/><span>الجائزة متاحة</span></label><button type="button" className="delete-btn" onClick={()=>deletePrize(i)}>🗑️ حذف الجائزة</button></div>)}</div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveWheel}>{saving?"⏳ جاري الحفظ...":"💾 حفظ إعدادات العجلة"}</button></div></section>}

      {tab === "settings" && <SettingsPanel storeSettings={storeSettings} setStoreSettings={setStoreSettings} saveSettings={saveSettings} saving={saving} uploadImage={uploadImage} />}
      {tab === "contact" && <ContactPanel storeSettings={storeSettings} setStoreSettings={setStoreSettings} saveSettings={saveSettings} saving={saving} />}
      {tab === "admins" && <AdminPanel admins={admins} adminForm={adminForm} setAdminForm={setAdminForm} saving={saving} setSaving={setSaving} log={log} categories={scopedCategories} currentAdmin={admin} />}
      {tab === "security" && <SecurityPanel security={security} setSecurity={setSecurity} saving={saving} setSaving={setSaving} log={log} />}
      {tab === "reports" && <Reports orders={scopedOrders} products={scopedProducts} users={scopedUsers} categories={scopedCategories} banners={banners} announcementBars={announcementBars} popupAds={popupAds} activityLogs={scopedActivityLogs} />}
      {tab === "sales" && <Sales orders={scopedOrders} />}
      {tab === "shipping" && <GenericSection type="shipping" data={shipping} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "payments" && <GenericSection type="payments" data={payments} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "store-menu" && <GenericSection type="store-menu" data={storeMenu} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "coupons" && <GenericSection type="coupons" data={coupons} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "announcements" && <GenericSection type="announcements" data={announcements} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "announcement-bars" && <GenericSection type="announcement-bars" data={announcementBars} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "popup-ads" && <GenericSection type="popup-ads" data={popupAds} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "notifications" && <GenericSection type="notifications" data={notifications} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "support" && <GenericSection type="support" data={scopedSupport} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "favorites" && <GenericSection type="favorites" data={scopedFavorites} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "blocked-users" && <GenericSection type="blocked-users" data={scopedUsers.filter(u => u.blocked)} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}
      {tab === "activity-log" && <GenericSection type="activity-log" data={scopedActivityLogs} categories={categories} showGeneric={showGeneric} genericType={genericType} genericId={genericId} genericForm={genericForm} saving={saving} openGeneric={openGeneric} saveGeneric={saveGeneric} setShowGeneric={setShowGeneric} genericChange={genericChange} removeGeneric={removeGeneric} />}

      {orderDetails && <Modal title={`تفاصيل الطلب ${orderDetails.orderNumber || orderDetails.id.slice(0,8)}`} onClose={()=>setOrderDetails(null)}><div className="details-grid"><Info label="العميل" value={orderDetails.customerName||orderDetails.name||"—"}/><Info label="الهاتف" value={orderDetails.phone||"—"}/><Info label="البريد" value={orderDetails.email||"—"}/><Info label="التاريخ" value={dateText(orderDetails.createdAt)}/><Info label="الدفع" value={orderDetails.paymentMethod||"—"}/><Info label="الإجمالي" value={money(orderDetails.total??orderDetails.finalTotal)}/></div><h3>🛍️ المنتجات</h3><div className="order-items">{safeArray(orderDetails.items||orderDetails.products).map((it,i)=><div key={i}><span>{it.title||it.name||"منتج"}</span><strong>{asNumber(it.quantity,1)} × {money(it.price)}</strong></div>)}</div><div className="form-actions"><button type="button" className="delete-btn" onClick={()=>removeOrder(orderDetails)}>🗑️ حذف الطلب</button></div></Modal>}
      {userDetails && <Modal title={`ملف العميل: ${userDetails.name || "عميل"}`} onClose={()=>setUserDetails(null)}>
        <div className="customer-profile-header">
          <div className="profile-detail">
            <div className="large-avatar">{String(userDetails.name||"ع").slice(0,1)}</div>
            <div>
              <h3>{userDetails.name||"عميل"}</h3>
              <p dir="ltr">{userDetails.email||"—"}</p>
              <p dir="ltr">{userDetails.phone||"—"}</p>
              <span className={userDetails.blocked?"status-inactive":"status-active"}>{userDetails.blocked?"🔴 محظور":"🟢 نشط"}</span>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={()=>toggleUserBlock(userDetails)}>{userDetails.blocked?"✅ إلغاء الحظر":"🚫 حظر العميل"}</button>
          </div>
        </div>

        <div className="customer-stats-grid">
          <div className="customer-stat"><span>🛒 الطلبات</span><strong>{selectedUserOrders.length}</strong></div>
          <div className="customer-stat"><span>💰 إجمالي الشراء</span><strong>{money(selectedUserSpent)}</strong></div>
          <div className="customer-stat"><span>❤️ المفضلة</span><strong>{selectedUserFavorites.length}</strong></div>
          <div className="customer-stat"><span>📝 النشاط</span><strong>{selectedUserActivity.length}</strong></div>
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>👤 جميع بيانات العميل</h3><p>كل البيانات المتاحة في حساب العميل.</p></div></div>
          <div className="details-grid">
            <Info label="الاسم" value={userDetails.name || "—"}/>
            <Info label="البريد الإلكتروني" value={userDetails.email || "—"}/>
            <Info label="الهاتف" value={userDetails.phone || "—"}/>
            <Info label="المحافظة" value={userDetails.governorate || userDetails.address?.governorate || "—"}/>
            <Info label="المدينة" value={userDetails.city || userDetails.address?.city || "—"}/>
            <Info label="القرية / المنطقة" value={userDetails.village || userDetails.area || userDetails.address?.village || userDetails.address?.area || "—"}/>
            <Info label="العنوان التفصيلي" value={typeof userDetails.address === "string" ? userDetails.address : (userDetails.address?.details || userDetails.address?.full || userDetails.fullAddress || "—")}/>
            <Info label="تاريخ التسجيل" value={dateText(userDetails.createdAt)}/>
            <Info label="آخر تحديث" value={dateText(userDetails.updatedAt)}/>
            <Info label="آخر دخول" value={dateText(userDetails.lastLoginAt || userDetails.lastLogin || userDetails.lastSeenAt)}/>
            <Info label="الحالة" value={userDetails.blocked ? "محظور" : "نشط"}/>
            <Info label="معرّف العميل" value={userDetails.id || userDetails.uid || "—"}/>
          </div>
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>🛒 طلبات العميل</h3><p>كل الطلبات المرتبطة بالحساب.</p></div></div>
          {selectedUserOrders.length ? <div className="customer-orders-list">{selectedUserOrders.map(o=><div className="customer-order-row" key={o.id}>
            <div><button type="button" className="table-link" onClick={()=>setOrderDetails(o)}>{o.orderNumber || o.id.slice(0,8)}</button><small>{dateText(o.createdAt)}</small></div>
            <span>{o.status || "pending"}</span><strong>{money(o.total ?? o.finalTotal)}</strong>
          </div>)}</div> : <div className="customer-empty">لا توجد طلبات مسجلة لهذا العميل.</div>}
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>👣 زيارات العميل</h3><p>الزيارات المسجلة فعليًا في بيانات الحساب.</p></div></div>
          {selectedUserVisits.length ? <div className="customer-visits-list">{selectedUserVisits.map((v,i)=><div className="customer-visit-row" key={v.id || i}>
            <span>👣</span><div><strong>{v.page || v.path || v.url || "زيارة للمتجر"}</strong><small>{dateText(v.visitedAt || v.createdAt || v.loginAt || v.timestamp)}{v.device ? ` • ${v.device}` : ""}{v.ip ? ` • ${v.ip}` : ""}</small></div>
          </div>)}</div> : <div className="customer-empty">لا يوجد سجل زيارات محفوظ حاليًا لهذا العميل. لو عايز نسجل كل زيارة من الموقع، لازم نضيف Tracker للواجهة الأمامية.</div>}
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>🧾 نشاط العميل</h3><p>كل النشاطات المرتبطة بمعرّف العميل أو بياناته.</p></div></div>
          {selectedUserActivity.length ? <div className="customer-activity-list">{selectedUserActivity.map((a,i)=><div className="customer-activity-row" key={a.id || i}>
            <span>•</span><div><strong>{a.action || a.type || "نشاط"}</strong><small>{a.details || a.description || "—"} • {dateText(a.createdAt)}</small></div>
          </div>)}</div> : <div className="customer-empty">لا يوجد نشاط عميل مرتبط حاليًا في سجل النشاط.</div>}
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>❤️ المفضلة</h3><p>المنتجات أو العناصر المحفوظة للعميل.</p></div></div>
          {selectedUserFavorites.length ? <div className="customer-mini-list">{selectedUserFavorites.map((f,i)=><div key={f.id || i}>{f.title || f.productName || f.name || f.productId || "عنصر مفضل"}</div>)}</div> : <div className="customer-empty">لا توجد عناصر مفضلة مسجلة.</div>}
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>💬 الدعم والمراسلات</h3><p>الرسائل أو طلبات الدعم المرتبطة بالعميل.</p></div></div>
          {selectedUserSupport.length ? <div className="customer-mini-list">{selectedUserSupport.map((x,i)=><div key={x.id || i}><strong>{x.subject || x.title || "رسالة دعم"}</strong><small>{x.message || x.content || "—"} • {dateText(x.createdAt)}</small></div>)}</div> : <div className="customer-empty">لا توجد رسائل دعم مسجلة.</div>}
        </div>

        <div className="customer-detail-section">
          <div className="section-header nested"><div><h3>🔔 الإشعارات</h3><p>الإشعارات المرتبطة بهذا العميل.</p></div></div>
          {selectedUserNotifications.length ? <div className="customer-mini-list">{selectedUserNotifications.map((x,i)=><div key={x.id || i}><strong>{x.title || "إشعار"}</strong><small>{x.message || x.body || "—"} • {dateText(x.createdAt)}</small></div>)}</div> : <div className="customer-empty">لا توجد إشعارات مرتبطة بالعميل.</div>}
        </div>
      </Modal>}
    </main>
  </div>;
}

function GamesPanel({gamesSettings,setGamesSettings,saveGames,saving}) {
  const defs=[["wheel","🎡","عجلة الحظ"],["cards","🃏","الكروت المقلوبة"],["scratch","🪙","اكشط واربح"],["mystery","🎁","الصناديق الغامضة"],["pick","🎯","اختار واربح"],["dice","🎲","النرد الرابح"]];
  const setGame=(key,patch)=>setGamesSettings(p=>({...p,[key]:{...p[key],...patch}}));
  const addPrize=(key)=>setGame(key,{prizes:[...safeArray(gamesSettings[key]?.prizes),{title:"جائزة جديدة",type:"discount",value:10,probability:10,color:ACCENT,enabled:true}]});
  const updatePrize=(key,i,patch)=>setGame(key,{prizes:safeArray(gamesSettings[key]?.prizes).map((x,n)=>n===i?{...x,...patch}:x)});
  const deletePrize=(key,i)=>setGame(key,{prizes:safeArray(gamesSettings[key]?.prizes).filter((_,n)=>n!==i)});
  return <section className="admin-card"><div className="section-header"><div><h2>🎮 الألعاب والمسابقات</h2><p>كل الألعاب مفعلة من نفس لوحة التحكم مع تحكم كامل في التصميم والجوائز والمحاولات والمواعيد.</p></div></div><div className="games-grid">{defs.map(([key,icon,label])=>{const g=gamesSettings[key]||defaultGamesSettings[key];return <div className="game-admin-card" key={key}><div className="game-admin-head"><h3>{icon} {label}</h3><label className="admin-checkbox"><input type="checkbox" checked={g.enabled!==false} onChange={e=>setGame(key,{enabled:e.target.checked})}/><span>مفعل</span></label></div><div className="form-grid"><label><span>اسم اللعبة</span><input value={g.title||""} onChange={e=>setGame(key,{title:e.target.value})}/></label><label><span>الوصف</span><input value={g.description||""} onChange={e=>setGame(key,{description:e.target.value})}/></label><label><span>المحاولات لكل مستخدم</span><input type="number" min="1" value={g.attemptsPerUser??2} onChange={e=>setGame(key,{attemptsPerUser:Math.max(1,asNumber(e.target.value,2))})}/></label><label className="admin-checkbox"><input type="checkbox" checked={g.requireLogin===true} onChange={e=>setGame(key,{requireLogin:e.target.checked})}/><span>يتطلب تسجيل الدخول</span></label><label><span>تاريخ البداية</span><input type="datetime-local" value={g.startDate||""} onChange={e=>setGame(key,{startDate:e.target.value})}/></label><label><span>تاريخ النهاية</span><input type="datetime-local" value={g.endDate||""} onChange={e=>setGame(key,{endDate:e.target.value})}/></label><label><span>حد الفائزين 0 = بدون حد</span><input type="number" min="0" value={g.winnerLimit??0} onChange={e=>setGame(key,{winnerLimit:asNumber(e.target.value)})}/></label><label className="form-group-full"><span>رسالة الفوز</span><textarea rows="2" value={g.winnerMessage||""} onChange={e=>setGame(key,{winnerMessage:e.target.value})}/></label></div><div className="section-header nested"><div><h4>🎁 الجوائز</h4></div><button type="button" className="add-btn" onClick={()=>addPrize(key)}>＋ إضافة جائزة</button></div><div className="prizes-grid">{safeArray(g.prizes).map((p,i)=><div className="prize-card" key={`${key}-${i}`}><label><span>اسم الجائزة</span><input value={p.title||""} onChange={e=>updatePrize(key,i,{title:e.target.value})}/></label><label><span>النوع</span><select value={p.type||"discount"} onChange={e=>updatePrize(key,i,{type:e.target.value})}><option value="discount">نسبة خصم</option><option value="fixed">خصم مبلغ</option><option value="free-shipping">شحن مجاني</option><option value="gift">هدية</option><option value="nothing">حظ أوفر</option></select></label><label><span>القيمة</span><input type="number" min="0" value={p.value??0} onChange={e=>updatePrize(key,i,{value:asNumber(e.target.value)})}/></label><label><span>احتمال الفوز %</span><input type="number" min="0" max="100" step="0.01" value={p.probability??10} onChange={e=>updatePrize(key,i,{probability:Math.min(100,Math.max(0,asNumber(e.target.value,10)))})}/></label><label><span>اللون</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(p.color)?p.color:ACCENT} onChange={e=>updatePrize(key,i,{color:e.target.value})}/></label><label className="admin-checkbox"><input type="checkbox" checked={p.enabled!==false} onChange={e=>updatePrize(key,i,{enabled:e.target.checked})}/><span>الجائزة متاحة</span></label><button type="button" className="delete-btn" onClick={()=>deletePrize(key,i)}>🗑️ حذف</button></div>)}</div></div>})}</div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveGames}>{saving?"⏳ جاري الحفظ...":"💾 حفظ جميع الألعاب"}</button></div></section>
}

function ProductFlagSection({ title, flag, products, setTab }) {
  const items = products.filter(p=>p[flag]===true);
  return <section className="admin-card"><div className="section-header"><div><h2>{title}</h2><p>المنتجات المحددة لهذا القسم: {items.length}</p></div><button type="button" className="ghost-btn" onClick={()=>setTab("products")}>إدارة المنتجات</button></div>{items.length===0?<div className="empty-state"><div>📦</div><h3>لا توجد منتجات</h3><p>فعّل هذا التصنيف من داخل نموذج المنتج.</p></div>:<div className="cards-grid">{items.map(p=><div className="mini-product" key={p.id}>{p.image?<img src={p.image} alt=""/>:<div>📦</div>}<strong>{p.title}</strong><span>{money(p.price)}</span></div>)}</div>}</section>;
}

function SettingsPanel({ storeSettings, setStoreSettings, saveSettings, saving, uploadImage }) {
  const theme = storeSettings.theme || defaultTheme;
  const setTheme = (key,value)=>setStoreSettings(p=>({...p,theme:{...defaultTheme,...p.theme,[key]:value}}));
  const text = storeSettings.texts || defaultStoreSettings.texts;
  const setText = (key,value)=>setStoreSettings(p=>({...p,texts:{...defaultStoreSettings.texts,...p.texts,[key]:value}}));
  const colors = [["primary","اللون الأساسي"],["secondary","اللون الثانوي"],["accent","اللون المميز"],["pageBackground","خلفية الموقع"],["cardBackground","خلفية البطاقات"],["textPrimary","لون النص الرئيسي"],["textSecondary","لون النص الثانوي"],["border","لون الحدود"],["buttonBackground","خلفية الأزرار"],["buttonText","نص الأزرار"],["navbarBackground","خلفية الشريط الرئيسي"],["navbarText","نص الشريط الرئيسي"],["categoryBarBackground","خلفية شريط الأقسام"],["categoryBarText","نص شريط الأقسام"],["topStripBackground","خلفية الشريط المتحرك"],["topStripText","نص الشريط المتحرك"],["footerBackground","خلفية الفوتر"],["footerText","نص الفوتر"],["footerBrand","لون اسم المتجر في الفوتر"],["footerButtonBackground","زر الفوتر"],["footerButtonText","نص زر الفوتر"],["headingColor","العناوين"],["linkColor","الروابط"],["priceColor","الأسعار"],["saleColor","لون الخصم"],["successColor","لون النجاح"],["warningColor","لون التنبيه"],["errorColor","لون الخطأ"],["inputBackground","خلفية الحقول"]];
  return <section className="admin-card"><div className="section-header"><div><h2>🎨 مظهر المتجر وإعداداته</h2><p>تحكم كامل في الهوية والألوان والنصوص والأشرطة.</p></div></div><div className="settings-tabs"><div className="settings-block"><h3>🏪 البيانات الأساسية</h3><div className="form-grid"><label><span>اسم المتجر</span><input value={storeSettings.storeName||""} onChange={e=>setStoreSettings(p=>({...p,storeName:e.target.value}))}/></label><label className="form-group-full"><span>لوجو المتجر — JPG/JPEG فقط</span><input type="file" accept=".jpg,.jpeg,image/jpeg" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const url=await uploadImage(file);if(url)setStoreSettings(p=>({...p,logo:url}));}catch(err){alert(err?.message||"❌ تعذر رفع اللوجو");}finally{e.target.value="";}}}/>{storeSettings.logo&&<div style={{display:"flex",alignItems:"center",gap:12,marginTop:10,flexWrap:"wrap"}}><img src={storeSettings.logo} alt="لوجو المتجر" style={{width:90,height:90,objectFit:"contain",borderRadius:12,border:"1px solid #ddd",background:"#fff",padding:6}}/><button type="button" className="delete-btn" onClick={()=>setStoreSettings(p=>({...p,logo:""}))}>🗑️ حذف اللوجو</button></div>}</label><label className="form-group-full"><span>الإعلان الافتراضي</span><textarea rows="3" value={storeSettings.announcement||""} onChange={e=>setStoreSettings(p=>({...p,announcement:e.target.value}))}/></label></div></div><div className="settings-block"><h3>🎨 جميع ألوان الموقع</h3><div className="color-grid">{colors.map(([k,l])=><label key={k}><span>{l}</span><div className="color-input"><input type="color" value={/^#[0-9a-f]{6}$/i.test(theme[k])?theme[k]:"#000000"} onChange={e=>setTheme(k,e.target.value)}/><input dir="ltr" value={theme[k]||""} onChange={e=>setTheme(k,e.target.value)}/></div></label>)}</div></div><div className="settings-block"><h3>📝 نصوص الموقع</h3><div className="form-grid">{Object.entries(text).map(([k,v])=><label key={k}><span>{textLabel(k)}</span><input value={v||""} onChange={e=>setText(k,e.target.value)}/></label>)}</div></div><div className="settings-block"><h3>📢 الشريط المتحرك الافتراضي</h3><div className="form-grid"><label className="admin-checkbox"><input type="checkbox" checked={storeSettings.topStrip?.enabled!==false} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,enabled:e.target.checked}}))}/><span>إظهار الشريط</span></label><label><span>الاتجاه</span><select value={storeSettings.topStrip?.direction||"rtl"} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,direction:e.target.value}}))}><option value="rtl">يمين ← يسار</option><option value="ltr">يسار ← يمين</option></select></label><label><span>السرعة</span><input type="number" min="1" value={storeSettings.topStrip?.speed??40} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,speed:asNumber(e.target.value,40)}}))}/></label><label><span>الارتفاع</span><input type="number" min="20" value={storeSettings.topStrip?.height??42} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,height:asNumber(e.target.value,42)}}))}/></label><label><span>حجم الخط</span><input type="number" min="8" value={storeSettings.topStrip?.fontSize??15} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,fontSize:asNumber(e.target.value,15)}}))}/></label></div></div><div className="settings-block"><h3>🖼️ استجابة البانرات</h3><div className="form-grid"><label><span>ارتفاع سطح المكتب</span><input type="number" min="160" value={storeSettings.bannerSettings?.heightDesktop??420} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,heightDesktop:asNumber(e.target.value,420)}}))}/></label><label><span>ارتفاع التابلت</span><input type="number" min="140" value={storeSettings.bannerSettings?.heightTablet??350} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,heightTablet:asNumber(e.target.value,350)}}))}/></label><label><span>ارتفاع الموبايل</span><input type="number" min="120" value={storeSettings.bannerSettings?.heightMobile??240} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,heightMobile:asNumber(e.target.value,240)}}))}/></label><label><span>انحناء الحواف</span><input type="number" min="0" value={storeSettings.bannerSettings?.borderRadius??16} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,borderRadius:asNumber(e.target.value,16)}}))}/></label><label><span>شفافية Overlay</span><input type="number" min="0" max="1" step="0.05" value={storeSettings.bannerSettings?.overlayOpacity??0.35} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,overlayOpacity:asNumber(e.target.value,0.35)}}))}/></label><label><span>تأخير السلايدر</span><input type="number" min="1000" value={storeSettings.bannerSettings?.autoplayDelay??5000} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,autoplayDelay:asNumber(e.target.value,5000)}}))}/></label><label className="admin-checkbox"><input type="checkbox" checked={storeSettings.bannerSettings?.autoplay!==false} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,autoplay:e.target.checked}}))}/><span>تشغيل تلقائي</span></label></div></div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveSettings}>{saving?"⏳ جاري الحفظ...":"💾 حفظ كل إعدادات المتجر"}</button></div></div></section>;
}

function mergeGames(defaults, previous, incoming) {
  const result = {};
  Object.keys(defaults).forEach((game) => {
    result[game] = { ...defaults[game], ...(previous?.[game] || {}), ...(incoming?.[game] || {}), prizes: safeArray(incoming?.[game]?.prizes ?? previous?.[game]?.prizes ?? defaults[game].prizes) };
  });
  return result;
}

function excelEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function downloadExcel(filename, title, columns, rows) {
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Arial}h2{color:#071A36}table{border-collapse:collapse;width:100%}th{background:#071A36;color:#fff;padding:10px;border:1px solid #ccc}td{padding:8px;border:1px solid #ddd}tr:nth-child(even){background:#f7f9fc}</style></head><body><h2>${excelEscape(title)}</h2><table><thead><tr>${columns.map(c=>`<th>${excelEscape(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${excelEscape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${filename}.xls`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function textLabel(k){const m={homeTitle:"عنوان الصفحة الرئيسية",homeSubtitle:"وصف الصفحة الرئيسية",productsTitle:"عنوان المنتجات",offersTitle:"عنوان العروض",bestSellersTitle:"عنوان الأكثر مبيعًا",newArrivalsTitle:"عنوان وصل حديثًا",recommendedTitle:"عنوان قد يعجبك",categoriesTitle:"عنوان الأقسام",emptyProducts:"رسالة عدم وجود المنتجات",emptyCategories:"رسالة عدم وجود الأقسام",cartTitle:"عنوان السلة",checkoutTitle:"عنوان إتمام الطلب",addToCart:"زر أضف للسلة",buyNow:"زر اشترِ الآن",viewAll:"زر عرض الكل",footerAbout:"وصف الفوتر",footerRights:"حقوق النشر",contactLink:"رابط تواصل معنا",hotlineWhatsApp:"رقم الخط الساخن واتساب"};return m[k]||k}
function ContactPanel({storeSettings,setStoreSettings,saveSettings,saving}){const fields=[["contactLink","رابط تواصل معنا"],["hotlineWhatsApp","الخط الساخن واتساب"],["phone","الهاتف"],["whatsapp","واتساب"],["email","البريد الإلكتروني"],["address","العنوان"],["facebook","Facebook"],["instagram","Instagram"],["telegram","Telegram"],["tiktok","TikTok"],["youtube","YouTube"]];return <section className="admin-card"><div className="section-header"><div><h2>📱 بيانات التواصل</h2><p>كل روابط وبيانات التواصل الخاصة بالمتجر.</p></div></div><div className="form-grid">{fields.map(([k,l])=><label key={k}><span>{l}</span><input dir="ltr" value={storeSettings[k]||""} onChange={e=>setStoreSettings(p=>({...p,[k]:e.target.value}))}/></label>)}</div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveSettings}>💾 حفظ بيانات التواصل</button></div></section>}
function AdminPanel({ admins, adminForm, setAdminForm, saving, setSaving, log, categories, currentAdmin }) {
  const allPermissions = PERMISSION_GROUPS.flatMap(g => g.items.map(x => x[0]));
  const isCurrentSuper = currentAdmin?.isSuperAdmin || currentAdmin?.role === "superadmin";
  const toggleGlobalPermission = (permission) => setAdminForm(p => ({ ...p, permissions: safeArray(p.permissions).includes(permission) ? safeArray(p.permissions).filter(x => x !== permission) : [...safeArray(p.permissions), permission] }));
  const toggleCategoryPermission = (categoryId, permission) => setAdminForm(p => {
    const current = p.categoryPermissions && typeof p.categoryPermissions === "object" ? p.categoryPermissions : {};
    const list = safeArray(current[categoryId]);
    const nextList = list.includes(permission) ? list.filter(x => x !== permission) : [...list, permission];
    const next = { ...current, [categoryId]: nextList };
    if (!nextList.length) delete next[categoryId];
    return { ...p, categoryPermissions: next };
  });
  const save = async () => {
    if (!adminForm?.email) return alert("اكتب البريد الإلكتروني");
    if (!hasPermission(currentAdmin, adminForm.id ? "admins.edit" : "admins.add")) return alert("⛔ ليس لديك صلاحية إدارة المشرفين");
    if (!isCurrentSuper && adminForm.role === "superadmin") return alert("⛔ لا يمكنك إنشاء مدير رئيسي");
    if (!isCurrentSuper && adminForm.id && adminForm.id === currentAdmin.id && adminForm.role === "superadmin") return alert("⛔ لا يمكن تغيير دورك بهذه الطريقة");
    const categoryPermissions = adminForm.categoryPermissions && typeof adminForm.categoryPermissions === "object" ? adminForm.categoryPermissions : {};
    const permissions = adminForm.role === "superadmin" ? allPermissions : safeArray(adminForm.permissions);
    setSaving(true);
    try {
      const payload = cleanFirestoreData({
        name: adminForm.name || "مشرف",
        email: String(adminForm.email).trim(),
        role: adminForm.role || "admin",
        active: adminForm.active !== false,
        permissions,
        categoryPermissions: adminForm.role === "superadmin" ? {} : categoryPermissions,
        updatedAt: serverTimestamp(),
      });
      if (adminForm.id) await updateDoc(doc(db, "admins", adminForm.id), payload);
      else await addDoc(collection(db, "admins"), { ...payload, createdAt: serverTimestamp() });
      await log("تعديل المشرفين", adminForm.email);
      setAdminForm(null);
      alert("✅ تم حفظ المشرف والصلاحيات");
    } catch (e) { alert(e?.message || "❌ تعذر الحفظ"); }
    finally { setSaving(false); }
  };
  return <section className="admin-card">
    <div className="section-header"><div><h2>🔐 المشرفون والصلاحيات</h2><p>تحكم كامل في صلاحيات كل مشرف وإمكانية تقييده على قسم محدد مثل «ملابس».</p></div><button type="button" className="add-btn" onClick={() => { if(!hasPermission(currentAdmin,"admins.add")){alert("⛔ ليس لديك صلاحية إضافة مشرف");return;} setAdminForm({name:"",email:"",role:"admin",active:true,permissions:["dashboard.view"],categoryPermissions:{}}); }}>＋ إضافة مشرف</button></div>
    {adminForm && <div className="admin-form">
      <div className="form-grid">
        <label><span>الاسم</span><input value={adminForm.name||""} onChange={e=>setAdminForm(p=>({...p,name:e.target.value}))}/></label>
        <label><span>البريد</span><input dir="ltr" type="email" value={adminForm.email||""} onChange={e=>setAdminForm(p=>({...p,email:e.target.value}))}/></label>
        <label><span>الدور</span><select value={adminForm.role||"admin"} disabled={!isCurrentSuper} onChange={e=>setAdminForm(p=>({...p,role:e.target.value}))}><option value="admin">مشرف</option><option value="superadmin">مدير رئيسي</option></select></label>
        <label className="admin-checkbox"><input type="checkbox" checked={adminForm.active!==false} onChange={e=>setAdminForm(p=>({...p,active:e.target.checked}))}/><span>الحساب مفعل</span></label>
      </div>
      {adminForm.role !== "superadmin" && <>
        <div className="settings-block" style={{marginTop:16}}><h3>🌐 الصلاحيات العامة</h3><p>الصلاحية العامة تعمل على كل الأقسام.</p><div className="flags-grid">{PERMISSION_GROUPS.map(group => group.items.map(([key,label]) => <label className="admin-checkbox" key={key}><input type="checkbox" checked={safeArray(adminForm.permissions).includes(key)} onChange={()=>toggleGlobalPermission(key)}/><span>{label}</span></label>))}</div></div>
        <div className="settings-block" style={{marginTop:16}}><h3>🗂️ صلاحيات حسب القسم</h3><p>فعّل صلاحيات قسم معين فقط. مثال: اختر «ملابس» ثم فعّل عرض/إضافة/تعديل منتجات القسم والطلبات المرتبطة به.</p>
          {safeArray(categories).slice().sort((a,b)=>asNumber(a.sortOrder)-asNumber(b.sortOrder)).map(c => <div key={c.id} style={{border:"1px solid #D9DFE8",borderRadius:12,padding:12,marginTop:10}}><strong>{c.name}</strong><div className="flags-grid" style={{marginTop:8}}>{PERMISSION_GROUPS.flatMap(g=>g.items).filter(([key])=>["products.view","products.add","products.edit","products.delete","offers.view","bestsellers.view","new-arrivals.view","recommended.view","orders.view","orders.edit","orders.delete"].includes(key)).map(([key,label])=><label className="admin-checkbox" key={`${c.id}-${key}`}><input type="checkbox" checked={safeArray(adminForm.categoryPermissions?.[c.id]).includes(key)} onChange={()=>toggleCategoryPermission(c.id,key)}/><span>{label}</span></label>)}</div></div>)}
        </div>
      </>}
      <div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={save}>💾 حفظ المشرف والصلاحيات</button><button type="button" className="cancel-btn" onClick={()=>setAdminForm(null)}>إلغاء</button></div>
    </div>}
    <div className="table-scroll"><table className="admin-table"><thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الصلاحيات</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{admins.map(a=>{const scoped=Object.keys(a.categoryPermissions||{});return <tr key={a.id}><td>{a.name||"مشرف"}</td><td dir="ltr">{a.email||"—"}</td><td>{a.role==="superadmin"?"👑 مدير رئيسي":"🔐 مشرف"}</td><td>{a.role==="superadmin"?"كل الصلاحيات":`${safeArray(a.permissions).length} عامة${scoped.length?` + ${scoped.length} قسم` : ""}`}</td><td>{a.active!==false?<span className="status-active">🟢 مفعل</span>:<span className="status-inactive">🔴 متوقف</span>}</td><td><button type="button" className="edit-btn" onClick={()=>{if(!hasPermission(currentAdmin,"admins.edit")){alert("⛔ ليس لديك صلاحية تعديل المشرفين");return;} setAdminForm({...a,permissions:safeArray(a.permissions),categoryPermissions:a.categoryPermissions||{}})}}>✏️ تعديل</button></td></tr>})}</tbody></table></div>
  </section>;
}
function SecurityPanel({security,setSecurity,saving,setSaving,log}){const save=async()=>{setSaving(true);try{await setDoc(doc(db,"settings","security"),{...security,updatedAt:serverTimestamp()},{merge:true});await log("تحديث الأمان","إعدادات حماية لوحة الإدارة");alert("✅ تم الحفظ")}catch(e){alert(e?.message||"❌ تعذر الحفظ")}finally{setSaving(false)}};return <section className="admin-card"><div className="section-header"><div><h2>🛡️ الأمان</h2><p>إعدادات حماية لوحة الإدارة.</p></div></div><div className="flags-grid"><label className="admin-checkbox"><input type="checkbox" checked={security.adminProtection===true} onChange={e=>setSecurity(p=>({...p,adminProtection:e.target.checked}))}/><span>حماية لوحة الإدارة</span></label><label className="admin-checkbox"><input type="checkbox" checked={security.extraVerification===true} onChange={e=>setSecurity(p=>({...p,extraVerification:e.target.checked}))}/><span>التحقق الإضافي</span></label><label className="admin-checkbox"><input type="checkbox" checked={security.loginLogging===true} onChange={e=>setSecurity(p=>({...p,loginLogging:e.target.checked}))}/><span>تسجيل محاولات الدخول</span></label></div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={save}>💾 حفظ إعدادات الأمان</button></div></section>}
function Reports({orders,products,users,categories,banners,announcementBars,popupAds,activityLogs}) {
  const delivered = orders.filter(o=>o.status==="delivered");
  const cancelled = orders.filter(o=>o.status==="cancelled");
  const sales = orders.filter(o=>o.status!=="cancelled");
  const exportProducts=()=>downloadExcel("products-report","تقرير المنتجات",["المنتج","السعر","السعر القديم","المخزون","القسم","الحالة"],products.map(p=>[p.title,p.price,p.oldPrice,p.stock,p.category,p.active!==false?"مفعل":"متوقف"]));
  const exportCategories=()=>downloadExcel("categories-report","تقرير الأقسام",["القسم","رقم القسم","القسم الرئيسي","الترتيب","الحالة"],categories.map(c=>[c.name,c.categoryNumber,c.parentId,c.sortOrder,c.active!==false?"مفعل":"متوقف"]));
  const exportOrders=()=>downloadExcel("orders-report","تقرير الطلبات",["رقم الطلب","العميل","الهاتف","التاريخ","الإجمالي","الحالة"],orders.map(o=>[o.orderNumber||o.id,o.customerName||o.name||o.email,o.phone,dateText(o.createdAt),o.total??o.finalTotal,o.status]));
  const exportUsers=()=>downloadExcel("users-report","تقرير العملاء",["الاسم","البريد","الهاتف","الحالة","التاريخ"],users.map(u=>[u.name,u.email,u.phone,u.blocked?"محظور":"نشط",dateText(u.createdAt)]));
  const exportSales=()=>downloadExcel("sales-report","تقرير المبيعات",["رقم الطلب","العميل","التاريخ","الإجمالي","الحالة"],sales.map(o=>[o.orderNumber||o.id,o.customerName||o.name||o.email,dateText(o.createdAt),o.total??o.finalTotal,o.status]));
  const exportBanners=()=>downloadExcel("banners-report","تقرير البانرات",["العنوان","الرابط","الترتيب","الحالة"],safeArray(banners).map(b=>[b.title,b.link,b.order,b.active!==false?"مفعل":"متوقف"]));
  const exportBars=()=>downloadExcel("announcement-bars-report","تقرير أشرطة الإعلانات",["النص","النوع","السرعة","الاتجاه","الحالة"],safeArray(announcementBars).map(b=>[b.text,b.type,b.speed,b.direction,b.active!==false?"مفعل":"متوقف"]));
  const exportPopups=()=>downloadExcel("popup-ads-report","تقرير الإعلانات المنبثقة",["العنوان","الرابط","التأخير","الحالة"],safeArray(popupAds).map(p=>[p.title,p.link,p.delay,p.active!==false?"مفعل":"متوقف"]));
  const exportActivity=()=>downloadExcel("activity-report","تقرير سجل النشاط",["العملية","التفاصيل","المشرف","التاريخ"],safeArray(activityLogs).map(a=>[a.action,a.details,a.adminName,dateText(a.createdAt)]));
  return <section className="admin-card"><div className="section-header"><div><h2>📊 التقارير</h2><p>تقارير أداء احترافية قابلة للتصدير إلى Excel لكل قسم.</p></div></div><div className="stats-grid"><div className="report-box"><span>إجمالي المنتجات</span><strong>{products.length}</strong></div><div className="report-box"><span>إجمالي الأقسام</span><strong>{categories.length}</strong></div><div className="report-box"><span>طلبات مكتملة</span><strong>{delivered.length}</strong></div><div className="report-box"><span>طلبات ملغاة</span><strong>{cancelled.length}</strong></div><div className="report-box"><span>العملاء</span><strong>{users.length}</strong></div><div className="report-box"><span>المبيعات</span><strong>{money(sales.reduce((s,o)=>s+asNumber(o.total??o.finalTotal),0))}</strong></div></div><div className="settings-block"><h3>📥 تصدير تقارير Excel</h3><div className="form-actions report-actions"><button type="button" className="save-btn" onClick={exportProducts}>📦 المنتجات</button><button type="button" className="save-btn" onClick={exportCategories}>🗂️ الأقسام</button><button type="button" className="save-btn" onClick={exportOrders}>🛒 الطلبات</button><button type="button" className="save-btn" onClick={exportUsers}>👥 العملاء</button><button type="button" className="save-btn" onClick={exportSales}>💰 المبيعات</button><button type="button" className="save-btn" onClick={exportBanners}>🖼️ البانرات</button><button type="button" className="save-btn" onClick={exportBars}>📜 أشرطة الإعلانات</button><button type="button" className="save-btn" onClick={exportPopups}>🔔 الإعلانات المنبثقة</button><button type="button" className="save-btn" onClick={exportActivity}>🧾 سجل النشاط</button></div></div></section>
}

function Sales({orders}){const valid=orders.filter(o=>o.status!=="cancelled");const total=valid.reduce((s,o)=>s+asNumber(o.total??o.finalTotal),0);return <section className="admin-card"><div className="section-header"><div><h2>💰 المبيعات</h2><p>ملخص المبيعات والطلبات.</p></div></div><div className="sales-highlight"><span>إجمالي المبيعات</span><strong>{money(total)}</strong><small>{valid.length.toLocaleString("ar-EG")} طلب</small></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>الطلب</th><th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{valid.map(o=><tr key={o.id}><td>{o.orderNumber||o.id.slice(0,8)}</td><td>{dateText(o.createdAt)}</td><td>{o.customerName||o.name||o.email||"—"}</td><td>{money(o.total??o.finalTotal)}</td><td>{o.status||"—"}</td></tr>)}</tbody></table></div></section>}
function Info({label,value}){return <div className="info-box"><small>{label}</small><strong>{value}</strong></div>}
function Modal({title,onClose,children}){return <div className="admin-modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="admin-modal"><div className="modal-header"><h2>{title}</h2><button type="button" onClick={onClose}>×</button></div><div className="modal-body">{children}</div></div></div>}
