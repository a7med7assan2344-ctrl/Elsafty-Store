import React, { useEffect, useMemo, useRef, useState } from "react";
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
  headerBackground: PRIMARY,
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
  logoFile: null,
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
  topHeaderAd: {
    enabled: false,
    desktopImage: "",
    mobileImage: "",
    link: "",
    clickable: true,
    heightDesktop: 150,
    heightMobile: 95,
    imageFit: "cover",
    alt: "إعلان المتجر",
    desktopImageFile: null,
    mobileImageFile: null,
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
  // مؤقت عروض اليوم
  todayOffersTimer: {
    enabled: false,
    title: "العرض ينتهي خلال",
    startAt: "",
    endAt: "",
    showDays: true,
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

const FONT_OPTIONS = [
  { value: 'Cairo, sans-serif', label: 'Cairo — عربي / English' },
  { value: 'Tajawal, sans-serif', label: 'Tajawal — عربي / English' },
  { value: 'Almarai, sans-serif', label: 'Almarai — عربي / English' },
  { value: 'Noto Kufi Arabic, sans-serif', label: 'Noto Kufi Arabic — عربي' },
  { value: 'Noto Sans Arabic, sans-serif', label: 'Noto Sans Arabic — عربي' },
  { value: 'IBM Plex Sans Arabic, sans-serif', label: 'IBM Plex Sans Arabic — عربي / English' },
  { value: 'Readex Pro, sans-serif', label: 'Readex Pro — عربي / English' },
  { value: 'Alexandria, sans-serif', label: 'Alexandria — عربي / English' },
  { value: 'Changa, sans-serif', label: 'Changa — عربي / English' },
  { value: 'El Messiri, sans-serif', label: 'El Messiri — عربي / English' },
  { value: 'Amiri, serif', label: 'Amiri — عربي' },
  { value: 'Lateef, serif', label: 'Lateef — عربي' },
  { value: 'Rubik, sans-serif', label: 'Rubik — عربي / English' },
  { value: 'Roboto, sans-serif', label: 'Roboto — English' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans — English' },
  { value: 'Inter, sans-serif', label: 'Inter — English' },
  { value: 'Poppins, sans-serif', label: 'Poppins — English' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat — English' },
  { value: 'Lato, sans-serif', label: 'Lato — English' },
  { value: 'Nunito, sans-serif', label: 'Nunito — English' },
  { value: 'Manrope, sans-serif', label: 'Manrope — English' },
  { value: 'DM Sans, sans-serif', label: 'DM Sans — English' },
  { value: 'Ubuntu, sans-serif', label: 'Ubuntu — English' },
  { value: 'Oswald, sans-serif', label: 'Oswald — English' },
  { value: 'Playfair Display, serif', label: 'Playfair Display — English' },
  { value: 'Merriweather, serif', label: 'Merriweather — English' },
];

const COLOR_PRESETS = [
  '#071A36','#0B1F3A','#D4AF37','#F4D06F','#FFFFFF','#000000',
  '#EF4444','#F97316','#F59E0B','#EAB308','#22C55E','#10B981',
  '#06B6D4','#3B82F6','#6366F1','#8B5CF6','#EC4899','#6B7280',
];

function normalizeHex(value, fallback = '#000000') {
  const v = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(ch => ch + ch).join('').toUpperCase();
  return fallback;
}

function ColorField({ name, label, value, onChange }) {
  const color = normalizeHex(value, '#000000');
  const setColor = (next) => onChange({ target: { name, value: normalizeHex(next, color) } });
  return (
    <label className="admin-color-field" onMouseDown={e => e.stopPropagation()}>
      <span>{label}</span>
      <div className="admin-color-control" onMouseDown={e => e.stopPropagation()}>
        <div className="admin-color-row">
          <input
            type="color"
            aria-label={label}
            value={color}
            onChange={e => setColor(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
          <input
            dir="ltr"
            className="admin-color-hex"
            value={color}
            onChange={e => onChange({ target: { name, value: e.target.value } })}
            onBlur={e => setColor(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setColor(e.currentTarget.value); } }}
            placeholder="#FFFFFF"
          />
          <span className="admin-color-preview" style={{ background: color }} />
        </div>
        <div className="admin-color-presets">
          {COLOR_PRESETS.map(c => (
            <button
              type="button"
              key={c}
              title={c}
              aria-label={`اختيار ${c}`}
              className="admin-color-swatch"
              style={{ background: c, outline: color === c ? '3px solid #071A36' : undefined }}
              onMouseDown={e => e.preventDefault()}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setColor(c); }}
            />
          ))}
        </div>
      </div>
    </label>
  );
}

function FontField({ name, label, value, onChange }) {
  const current = value || FONT_OPTIONS[0].value;
  const known = FONT_OPTIONS.some(f => f.value === current);
  return (
    <label className="admin-font-field">
      <span>{label}</span>
      <select name={name} value={known ? current : FONT_OPTIONS[0].value} onChange={onChange} style={{ fontFamily: current }}>
        <optgroup label="خطوط عربية + English">
          {FONT_OPTIONS.filter(f => /عربي/.test(f.label)).map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
        </optgroup>
        <optgroup label="خطوط English">
          {FONT_OPTIONS.filter(f => /English/.test(f.label) && !/عربي/.test(f.label)).map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
        </optgroup>
      </select>
      <small style={{ fontFamily: current }}>Aa أ ب ت — معاينة الخط</small>
    </label>
  );
}

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
      ["fontFamily", "نوع الخط", "font"], ["fontSize", "حجم الخط", "number"],
      ["fontWeight", "وزن الخط", "number"], ["height", "ارتفاع الشريط", "number"],
      ["speed", "سرعة الحركة", "number"], ["direction", "الاتجاه", "select", [["rtl", "يمين ← يسار"], ["ltr", "يسار ← يمين"]]],
      ["link", "الرابط", "text"], ["active", "مفعل", "checkbox"], ["visible", "ظاهر", "checkbox"],
    ],
  },
  banners: {
    title: "البانرات", icon: "🖼️",
    fields: [
      ["title", "عنوان البنر", "text"],
      ["text", "وصف البنر", "textarea"],
      ["imageFile", "صورة البنر القديمة / العامة JPG/JPEG", "file"],
      ["desktopImageFile", "🖥️ صورة الديسكتوب JPG/JPEG — 1920×600", "file"],
      ["mobileImageFile", "📱 صورة الموبايل JPG/JPEG — 1080×1350", "file"],
      ["link", "رابط البنر", "text"],
      ["clickableImage", "🖱️ فتح الرابط عند الضغط على البنر بالكامل", "checkbox"],
      ["buttonText", "نص الزر", "text"],
      ["tag", "الشارة / Badge", "text"],
      ["order", "الترتيب", "number"],
      ["imageFit", "طريقة احتواء الصورة", "select", [["contain", "إظهار الصورة بالكامل"], ["cover", "ملء المساحة"]]],
      ["overlayOpacity", "شفافية Overlay", "number"],
      ["active", "مفعل", "checkbox"],
      ["enabled", "ظاهر للزوار", "checkbox"],
      ["showTitle", "إظهار العنوان", "checkbox"],
      ["showDescription", "إظهار الوصف", "checkbox"],
      ["showButton", "إظهار الزر", "checkbox"],
      ["textDirection", "اتجاه النص", "select", [["rtl", "عربي RTL"], ["ltr", "إنجليزي LTR"]]],
      ["textAlign", "محاذاة النص", "select", [["right", "يمين"], ["center", "منتصف"], ["left", "يسار"]]],
      ["contentPosition", "مكان المحتوى", "select", [["right", "يمين"], ["center", "منتصف"], ["left", "يسار"]]],
      ["contentWidth", "عرض منطقة النص px", "number"],
      ["contentTop", "إزاحة المحتوى من أعلى px", "number"],
      ["contentSide", "إزاحة المحتوى الجانبية px", "number"],
      ["titleFontFamily", "خط العنوان", "font"],
      ["titleFontSizeDesktop", "حجم العنوان Desktop px", "number"],
      ["titleFontSizeTablet", "حجم العنوان Tablet px", "number"],
      ["titleFontSizeMobile", "حجم العنوان Mobile px", "number"],
      ["titleFontWeight", "وزن العنوان", "number"],
      ["titleColor", "لون العنوان", "color"],
      ["titleLineHeight", "ارتفاع سطر العنوان", "number"],
      ["titleLetterSpacing", "تباعد حروف العنوان px", "number"],
      ["titleShadow", "ظل العنوان", "checkbox"],
      ["descriptionFontFamily", "خط الوصف", "font"],
      ["descriptionFontSizeDesktop", "حجم الوصف Desktop px", "number"],
      ["descriptionFontSizeTablet", "حجم الوصف Tablet px", "number"],
      ["descriptionFontSizeMobile", "حجم الوصف Mobile px", "number"],
      ["descriptionFontWeight", "وزن الوصف", "number"],
      ["descriptionColor", "لون الوصف", "color"],
      ["descriptionLineHeight", "ارتفاع سطر الوصف", "number"],
      ["descriptionLetterSpacing", "تباعد حروف الوصف px", "number"],
      ["descriptionShadow", "ظل الوصف", "checkbox"],
      ["buttonFontFamily", "خط الزر", "font"],
      ["buttonFontSizeDesktop", "حجم الزر Desktop px", "number"],
      ["buttonFontSizeTablet", "حجم الزر Tablet px", "number"],
      ["buttonFontSizeMobile", "حجم الزر Mobile px", "number"],
      ["buttonFontWeight", "وزن الزر", "number"],
      ["buttonTextColor", "لون نص الزر", "color"],
      ["buttonBackground", "خلفية الزر", "color"],
      ["buttonHoverBackground", "خلفية الزر عند المرور", "color"],
      ["buttonBorderColor", "لون إطار الزر", "color"],
      ["buttonBorderWidth", "سمك إطار الزر px", "number"],
      ["buttonBorderRadius", "استدارة الزر px", "number"],
      ["buttonPaddingX", "حشو الزر أفقيًا px", "number"],
      ["buttonPaddingY", "حشو الزر رأسيًا px", "number"],
      ["buttonShadow", "ظل الزر", "checkbox"],
      ["titleMarginBottom", "المسافة بعد العنوان px", "number"],
      ["descriptionMarginBottom", "المسافة بعد الوصف px", "number"],
      ["contentOpacity", "شفافية محتوى النص", "number"],
    ],
  },
  "popup-ads": {
    title: "الإعلانات المنبثقة", icon: "🔔",
    fields: [["title", "العنوان", "text"], ["text", "النص", "textarea"], ["imageFile", "صورة الإعلان JPG/JPEG", "file"], ["buttonText", "نص الزر", "text"], ["link", "الرابط", "text"], ["delay", "التأخير بالمللي ثانية", "number"], ["width", "عرض النافذة", "number"], ["maxWidth", "أقصى عرض", "number"], ["backgroundColor", "خلفية الإعلان", "color"], ["buttonColor", "لون الزر", "color"], ["active", "مفعل افتراضيًا", "checkbox"], ["closable", "قابل للإغلاق", "checkbox"]],
  },
  notifications: {
    title: "الإشعارات", icon: "🔔",
    fields: [["title", "العنوان", "text"], ["message", "الرسالة", "textarea"], ["type", "النوع", "select", [["info", "معلومة"], ["success", "نجاح"], ["warning", "تنبيه"], ["error", "خطأ"]]], ["active", "مفعل", "checkbox"], ["enabled", "ظاهر للعملاء", "checkbox"], ["closable", "قابل للإغلاق", "checkbox"]],
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
  if (type === "color") return <ColorField name={name} label={label} value={v} onChange={onChange} />;
  if (type === "font") return <FontField name={name} label={label} value={v} onChange={onChange} />;
  if (type === "select") return <label><span>{label}</span><select name={name} value={v} onChange={onChange}>{safeArray(options).map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></label>;
  if (type === "select-category") return <label><span>{label}</span><select name={name} value={v} onChange={onChange}><option value="">اختر القسم</option>{safeArray(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>;
  if (type === "file") return <label><span>{label}</span><input type="file" name={name} accept="image/jpeg,image/jpg" onChange={onChange} /></label>;
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

  const attributes =
    variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes)
      ? variant.attributes
      : variant.options && typeof variant.options === "object" && !Array.isArray(variant.options)
        ? variant.options
        : variant.specifications && typeof variant.specifications === "object" && !Array.isArray(variant.specifications)
          ? variant.specifications
          : {};

  return {
    id: variant.id || variant._id || `variant-${index}`,
    name: variant.name || variant.title || "",
    sku: variant.sku || variant.SKU || "",
    price: variant.price ?? variant.salePrice ?? variant.finalPrice ?? 0,
    oldPrice: variant.oldPrice ?? variant.compareAtPrice ?? variant.originalPrice ?? 0,
    stock: variant.stock ?? 0,
    image: images[0] || "",
    images: [...new Set(images)],
    imageFiles: Array.isArray(variant.imageFiles) ? variant.imageFiles : [],
    attributes: { ...attributes },
    options: variant.options && typeof variant.options === "object" && !Array.isArray(variant.options) ? { ...variant.options } : undefined,
    specifications: variant.specifications && typeof variant.specifications === "object" && !Array.isArray(variant.specifications) ? { ...variant.specifications } : undefined,
  };
};

const normalizeVariantGroup = (group = {}, index = 0) => {
  const id = String(group.id || group.key || group.attribute || `group-${index}`).trim() || `group-${index}`;
  // مهم جدًا: أثناء التحرير لا نحذف اسم المجموعة الفارغ، لأن الأدمن ممكن يضيف
  // مجموعة جديدة ثم يكتب الاسم بعدين. نفس الفكرة تنطبق على العنصر الجديد.
  const rawName = group.name ?? group.title ?? group.label ?? group.displayName;
  const name = rawName == null ? "" : String(rawName).trim();
  const rawOptions = Array.isArray(group.options) ? group.options : [];
  const options = rawOptions.map((option, optionIndex) => {
    if (option && typeof option === "object") {
      const value = String(option.value ?? option.name ?? option.label ?? option.title ?? "").trim();
      const label = String(option.label ?? option.name ?? option.value ?? option.title ?? "").trim();
      const rawPrice = option.price ?? option.optionPrice ?? option.amount ?? "";
      const numericPrice = rawPrice === "" || rawPrice === null || rawPrice === undefined
        ? ""
        : Number(rawPrice);
      return {
        id: String(option.id || `${id}-option-${optionIndex}`).trim(),
        value,
        label,
        price: Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : "",
      };
    }
    const value = String(option ?? "").trim();
    return { id: `${id}-option-${optionIndex}`, value, label: value, price: "" };
  });
  return { id, name, options };
};

const productVariantGroups = (product = {}) => {
  const raw = Array.isArray(product.variantGroups)
    ? product.variantGroups
    : Array.isArray(product.variantSettings?.groups)
      ? product.variantSettings.groups
      : Array.isArray(product.optionGroups)
        ? product.optionGroups
        : [];
  // لا نفلتر هنا. دي بيانات نموذج التحرير، ولازم المجموعة/العنصر الفارغ
  // يفضل موجودًا عشان زر «إضافة عنصر» يظهر نتيجته فورًا. التنظيف يحصل وقت الحفظ.
  return raw.map(normalizeVariantGroup);
};

const productVariantsList = (product = {}) =>
  Array.isArray(product.variants) ? product.variants.map((v, i) => normalizeVariant(v, i)) : [];

const DEFAULT_BANNER_TEXT_SETTINGS = {
  showTitle: true, showDescription: true, showButton: true,
  textDirection: "rtl", textAlign: "right", contentPosition: "right",
  contentWidth: 620, contentTop: 50, contentSide: 7, contentOpacity: 1,
  titleFontFamily: "Cairo, sans-serif", titleFontSizeDesktop: 52, titleFontSizeTablet: 42, titleFontSizeMobile: 28,
  titleFontWeight: 800, titleColor: "#FFFFFF", titleLineHeight: 1.15, titleLetterSpacing: 0, titleShadow: true, titleMarginBottom: 14,
  descriptionFontFamily: "Cairo, sans-serif", descriptionFontSizeDesktop: 20, descriptionFontSizeTablet: 18, descriptionFontSizeMobile: 14,
  descriptionFontWeight: 500, descriptionColor: "#FFFFFF", descriptionLineHeight: 1.6, descriptionLetterSpacing: 0, descriptionShadow: true, descriptionMarginBottom: 22,
  buttonFontFamily: "Cairo, sans-serif", buttonFontSizeDesktop: 17, buttonFontSizeTablet: 16, buttonFontSizeMobile: 14,
  buttonFontWeight: 700, buttonTextColor: "#071A36", buttonBackground: "#D4AF37", buttonHoverBackground: "#F4D06F",
  buttonBorderColor: "#D4AF37", buttonBorderWidth: 1, buttonBorderRadius: 10, buttonPaddingX: 28, buttonPaddingY: 13, buttonShadow: true,
};

const bannerTextSettingsFromItem = (item = {}) => ({
  ...DEFAULT_BANNER_TEXT_SETTINGS,
  ...(item.textSettings || {}),
  ...Object.fromEntries(Object.keys(DEFAULT_BANNER_TEXT_SETTINGS).filter(k => item[k] !== undefined).map(k => [k, item[k]])),
});

const flattenBannerForm = (item = {}) => ({
  ...item,
  ...bannerTextSettingsFromItem(item),
  showTitle: item.showTitle ?? item.textSettings?.showTitle ?? true,
  showDescription: item.showDescription ?? item.textSettings?.showDescription ?? true,
  showButton: item.showButton ?? item.textSettings?.showButton ?? true,
});

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

  useEffect(() => {
    const id = "sawa-admin-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Almarai:wght@300;400;700;800&family=Amiri:wght@400;700&family=Cairo:wght@300;400;500;600;700;800;900&family=Changa:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=El+Messiri:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Lato:wght@300;400;700;900&family=Lateef:wght@400;700&family=Manrope:wght@300;400;500;600;700;800&family=Merriweather:wght@400;700;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Readex+Pro:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700;900&family=Rubik:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&family=Ubuntu:wght@300;400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);

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
        if (a.exists()) setAdmin({ id: user.uid, ...a.data() });
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
    const settingsUnsub = onSnapshot(doc(db, "settings", "store"), snap => { if (snap.exists()) setStoreSettings(p => ({ ...defaultStoreSettings, ...p, ...snap.data(), theme: { ...defaultTheme, ...(p.theme || {}), ...(snap.data().theme || {}) }, todayOffersTimer: { ...defaultStoreSettings.todayOffersTimer, ...(p.todayOffersTimer || {}), ...(snap.data().todayOffersTimer || {}) }, topHeaderAd: { ...defaultStoreSettings.topHeaderAd, ...(p.topHeaderAd || {}), ...(snap.data().topHeaderAd || {}) }, texts: { ...defaultStoreSettings.texts, ...(p.texts || {}), ...(snap.data().texts || {}) } })); }, e => console.warn("settings/store", e?.message));
    const wheelUnsub = onSnapshot(doc(db, "settings", "wheel"), snap => { if (snap.exists()) setWheelSettings({ ...defaultWheelSettings, ...snap.data(), prizes: safeArray(snap.data().prizes) }); }, e => console.warn("settings/wheel", e?.message));
    const gamesUnsub = onSnapshot(doc(db, "settings", "games"), snap => { if (snap.exists()) setGamesSettings(mergeGames(defaultGamesSettings, {}, snap.data())); }, e => console.warn("settings/games", e?.message));
    const secUnsub = onSnapshot(doc(db, "settings", "security"), snap => { if (snap.exists()) setSecurity(p => ({ ...p, ...snap.data() })); }, e => console.warn("settings/security", e?.message));
    listeners.push(settingsUnsub, wheelUnsub, gamesUnsub, secUnsub);
    return () => listeners.forEach(fn => { try { fn(); } catch {} });
  }, []);

  const counts = useMemo(() => ({
    products: products.length,
    categories: categories.length,
    orders: orders.length,
    users: users.length,
    pending: orders.filter(o => ["pending", "new"].includes(o.status)).length,
    supportUnread: support.filter((message) =>
      (message.sender === "customer" || message.senderRole === "customer") &&
      message.readByAdmin !== true &&
      message.deletedByAdmin !== true
    ).length,
    sales: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + asNumber(o.total ?? o.finalTotal), 0),
  }), [products, categories, orders, users, support]);

  const filteredProducts = useMemo(() => products.filter(p => !search || normalize(`${p.title} ${p.category} ${p.categoryId} ${p.description}`).includes(normalize(search))), [products, search]);
  const filteredUsers = useMemo(() => users.filter(u => !search || normalize(`${u.name} ${u.email} ${u.phone}`).includes(normalize(search))), [users, search]);
  const filteredOrders = useMemo(() => orders.filter(o => {
    const q = normalize(`${o.orderNumber} ${o.customerName} ${o.name} ${o.phone} ${o.email}`);
    return (!search || q.includes(normalize(search))) && (orderStatus === "all" || o.status === orderStatus);
  }), [orders, search, orderStatus]);

  const log = async (action, details) => {
    try { await addDoc(collection(db, "activityLogs"), { action, details, adminId: admin?.id || null, adminName: admin?.name || "مشرف", createdAt: serverTimestamp() }); } catch (e) { console.warn("activity log", e); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = { ...storeSettings };
      if (payload.logoFile) {
        const file = payload.logoFile;
        if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type || "")) {
          throw new Error("اللوجو لازم يكون JPG أو JPEG أو PNG أو WEBP");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("حجم اللوجو يجب ألا يتجاوز 5 ميجابايت");
        }
        payload.logo = await uploadImage(file);
      }
      delete payload.logoFile;

      const topHeaderAd = {
        ...defaultStoreSettings.topHeaderAd,
        ...(payload.topHeaderAd || {}),
      };

      for (const key of ["desktopImageFile", "mobileImageFile"]) {
        const file = topHeaderAd[key];
        if (!file) continue;
        if (!/^image\/(jpeg|jpg)$/i.test(file.type || "")) {
          throw new Error("صورة الإعلان العلوي لازم تكون JPG أو JPEG");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("حجم صورة الإعلان العلوي يجب ألا يتجاوز 5 ميجابايت");
        }
        const uploaded = await uploadImage(file);
        const imageKey = key === "desktopImageFile" ? "desktopImage" : "mobileImage";
        topHeaderAd[imageKey] = uploaded;
        delete topHeaderAd[key];
      }

      delete topHeaderAd.desktopImageFile;
      delete topHeaderAd.mobileImageFile;
      payload.topHeaderAd = topHeaderAd;

      await setDoc(doc(db, "settings", "store"), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
      setStoreSettings((prev) => ({ ...prev, ...payload, logoFile: null }));
      await log("تعديل إعدادات المتجر", "تم حفظ الألوان والنصوص والإعدادات العامة واللوجو");
      alert("✅ تم حفظ إعدادات المتجر");
    } catch (e) {
      console.error(e);
      alert(e?.message || "❌ تعذر حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };
  const saveWheel = async () => {
    setSaving(true); try { await setDoc(doc(db, "settings", "wheel"), { ...wheelSettings, prizes: safeArray(wheelSettings.prizes), updatedAt: serverTimestamp() }, { merge: true }); await log("تعديل عجلة الحظ", "تم حفظ إعدادات العجلة"); alert("✅ تم حفظ إعدادات عجلة الحظ"); } catch (e) { console.error(e); alert(e?.message || "❌ تعذر الحفظ"); } finally { setSaving(false); }
  };
  const saveGames = async () => {
    setSaving(true);
    try { await setDoc(doc(db, "settings", "games"), { ...gamesSettings, updatedAt: serverTimestamp() }, { merge: true }); await log("تحديث الألعاب", "تم حفظ إعدادات جميع الألعاب"); alert("✅ تم حفظ إعدادات الألعاب"); }
    catch (e) { console.error(e); alert(e?.message || "❌ تعذر حفظ الألعاب"); }
    finally { setSaving(false); }
  };

  const uploadImage = async (file) => {
    if (!file) return "";
    if (!file.type.startsWith("image/")) throw new Error("اختر ملف صورة صحيح");
    if (file.size > 10 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 10 ميجابايت");
    const data = new FormData(); data.append("file", file); data.append("upload_preset", "elsafty_store");
    const response = await fetch("https://api.cloudinary.com/v1_1/wkcpvsqi/image/upload", { method: "POST", body: data });
    if (!response.ok) throw new Error("فشل رفع الصورة");
    const json = await response.json(); return json.secure_url || json.url || "";
  };

  const saveProduct = async (e) => {
    e.preventDefault();
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

      // مجموعات المتغيرات: أسماء الأزرار وعناصرها يتحكم فيها الأدمن بالكامل.
      const variantGroups = productVariantGroups(form)
        .map(group => ({
          id: group.id,
          name: String(group.name || "").trim(),
          options: safeArray(group.options)
            .map(option => ({
              id: option.id,
              value: String(option.value || "").trim(),
              label: String(option.label || option.value || "").trim(),
              price: option.price === "" || option.price === null || option.price === undefined
                ? ""
                : Math.max(0, Number(option.price) || 0),
            }))
            .filter(option => option.value),
        }))
        .filter(group => group.name || group.options.length > 0);

      // المتغيرات: كل تركيبة يمكن أن تمتلك صورًا وأسعارًا ومخزونًا وSKU مستقلًا.
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
          attributes: { ...source.attributes },
          ...(source.options ? { options: { ...source.options } } : {}),
          ...(source.specifications ? { specifications: { ...source.specifications } } : {}),
        });
      }

      form.variantGroups = variantGroups;
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
        await updateDoc(doc(db, "products", productForm.id), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "products"), { ...form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
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
  const removeProduct = async (p) => { if (!window.confirm(`حذف المنتج «${p.title || "بدون اسم"}»؟`)) return; try { await deleteDoc(doc(db, "products", p.id)); await log("حذف منتج", p.title || p.id); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };

  const saveCategory = async (e) => {
    e.preventDefault(); setSaving(true); try {
      const form = { ...categoryForm }; if (form.imageFile) form.image = await uploadImage(form.imageFile); delete form.imageFile; delete form.imagePreview;
      form.sortOrder = asNumber(form.sortOrder); form.active = form.active !== false;
      if (categoryForm.id) await updateDoc(doc(db, "categories", categoryForm.id), { ...form, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "categories"), { ...form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await log(categoryForm.id ? "تعديل قسم" : "إضافة قسم", form.name || "قسم"); setCategoryForm(null); alert("✅ تم حفظ القسم");
    } catch (e2) { console.error(e2); alert(e2?.message || "❌ تعذر حفظ القسم"); } finally { setSaving(false); }
  };
  const removeCategory = async (c) => { if (!window.confirm(`حذف القسم «${c.name || "بدون اسم"}»؟`)) return; try { await deleteDoc(doc(db, "categories", c.id)); await log("حذف قسم", c.name || c.id); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };

  const changeOrderStatus = async (o, status) => { try { await updateDoc(doc(db, "orders", o.id), { status, updatedAt: serverTimestamp() }); await log("تحديث حالة طلب", `${o.orderNumber || o.id}: ${status}`); } catch (e) { alert(e?.message || "❌ تعذر تحديث الطلب"); } };
  const removeOrder = async (o) => { if (!window.confirm("هل تريد حذف الطلب نهائيًا؟")) return; try { await deleteDoc(doc(db, "orders", o.id)); await log("حذف طلب", o.orderNumber || o.id); setOrderDetails(null); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };
  const toggleUserBlock = async (u) => { try { await updateDoc(doc(db, "users", u.id), { blocked: !u.blocked, updatedAt: serverTimestamp() }); await log(u.blocked ? "إلغاء حظر عميل" : "حظر عميل", u.email || u.name || u.id); } catch (e) { alert(e?.message || "❌ تعذر تعديل حالة العميل"); } };

  const openGeneric = (type, item = null) => {
    setGenericType(type); setGenericId(item?.id || null);
    if (type === "banners") {
      const t = bannerTextSettingsFromItem(item || {});
      setGenericForm(item ? flattenBannerForm(item) : {
        title: "", text: "", imageFile: null, desktopImageFile: null, mobileImageFile: null, link: "/products", clickableImage: true, buttonText: "تسوق الآن", tag: "", order: 0,
        imageFit: "contain", overlayOpacity: 0.35, active: true, enabled: true, ...t,
      });
    } else {
      setGenericForm(item ? { ...item } : {
        active: true,
        enabled: true,
        visible: true,
        // مهم: ممنوع نحط undefined في Firestore.
        // الإعلانات المنبثقة محتاجة type واضح، وأشرطة الإعلانات نوعها marquee.
        type: type === "announcement-bars" ? "marquee" : type === "popup-ads" ? "popup" : "general",
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
        imageFit: "contain",
        overlayOpacity: 0.35,
        width: 90,
        maxWidth: 720,
        buttonColor: ACCENT,
      });
    }
    setShowGeneric(true);
  };
  const genericChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    const file = files?.[0] || null;
    setGenericForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : type === "number" ? asNumber(value) : type === "file" ? file : value,
      ...(type === "file"
        ? {
            [`${name.replace(/File$/, "")}Preview`]: file ? URL.createObjectURL(file) : "",
            ...(name === "imageFile" ? { imageFile: file, imagePreview: file ? URL.createObjectURL(file) : p.imagePreview } : {}),
          }
        : {}),
    }));
  };
  const saveGeneric = async (e) => {
    e.preventDefault(); setSaving(true); try {
      const name = collectionMap[genericType]; if (!name) throw new Error("القسم غير معروف");
      const payload = { ...genericForm };
      if (genericType === "banners") {
        const bannerFiles = [
          ["imageFile", "الصورة العامة"],
          ["desktopImageFile", "صورة الديسكتوب"],
          ["mobileImageFile", "صورة الموبايل"],
        ];
        for (const [key, label] of bannerFiles) {
          const file = payload[key];
          if (!file) continue;
          if (!/image\/(jpeg|jpg)/i.test(file.type || "")) {
            throw new Error(`${label}: صورة البنر يجب أن تكون JPG أو JPEG فقط`);
          }
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`${label}: حجم الصورة يجب ألا يتجاوز 5 ميجابايت`);
          }
        }
      }
      if (payload.imageFile) payload.image = await uploadImage(payload.imageFile);
      if (payload.desktopImageFile) payload.desktopImage = await uploadImage(payload.desktopImageFile);
      if (payload.mobileImageFile) payload.mobileImage = await uploadImage(payload.mobileImageFile);
      if (genericType === "banners") {
        const textSettings = {};
        Object.keys(DEFAULT_BANNER_TEXT_SETTINGS).forEach(key => {
          if (payload[key] !== undefined) textSettings[key] = payload[key];
        });
        payload.textSettings = { ...DEFAULT_BANNER_TEXT_SETTINGS, ...(payload.textSettings || {}), ...textSettings };
        // الاحتفاظ بالحقول الأساسية القديمة للتوافق مع Hero الحالي.
        payload.description = payload.description || payload.text || "";
        delete payload.textSettings.imageFile;
        Object.keys(DEFAULT_BANNER_TEXT_SETTINGS).forEach(key => delete payload[key]);
      }
      delete payload.id; delete payload.createdAt; delete payload.updatedAt;
      delete payload.imageFile; delete payload.imagePreview;
      delete payload.desktopImageFile; delete payload.desktopImagePreview;
      delete payload.mobileImageFile; delete payload.mobileImagePreview;

      // Firestore بيرفض أي field قيمته undefined.
      // ننظف الـ payload بالكامل قبل الحفظ، وده يمنع نفس الخطأ في أي عنصر مستقبلاً.
      const cleanFirestoreData = (value) => {
        if (Array.isArray(value)) return value.map(cleanFirestoreData).filter((v) => v !== undefined);
        if (value && typeof value === "object" && !(value instanceof Date)) {
          const result = {};
          Object.entries(value).forEach(([key, val]) => {
            if (val !== undefined) result[key] = cleanFirestoreData(val);
          });
          return result;
        }
        return value;
      };

      const safePayload = cleanFirestoreData(payload);
      if (genericType === "popup-ads" && !safePayload.type) safePayload.type = "popup";
      if (genericId) await updateDoc(doc(db, name, genericId), { ...safePayload, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, name), { ...safePayload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await log(genericId ? "تعديل عنصر" : "إضافة عنصر", genericConfig[genericType]?.title || genericType); setShowGeneric(false); alert("✅ تم الحفظ");
    } catch (e2) { console.error(e2); alert(e2?.message || "❌ تعذر الحفظ"); } finally { setSaving(false); }
  };
  const removeGeneric = async (type, item) => { const name = collectionMap[type]; if (!name || !window.confirm("هل تريد حذف هذا العنصر؟")) return; try { await deleteDoc(doc(db, name, item.id)); await log("حذف عنصر", `${genericConfig[type]?.title || type}: ${item.title || item.name || item.text || item.id}`); } catch (e) { alert(e?.message || "❌ تعذر الحذف"); } };

  const addPrize = () => setWheelSettings(p => ({ ...p, prizes: [...safeArray(p.prizes), { id: `${Date.now()}`, title: "جائزة جديدة", type: "discount", value: 10, color: "#D4AF37", enabled: true }] }));
  const updatePrize = (index, patch) => setWheelSettings(p => ({ ...p, prizes: safeArray(p.prizes).map((x, i) => i === index ? { ...x, ...patch } : x) }));
  const deletePrize = (index) => setWheelSettings(p => ({ ...p, prizes: safeArray(p.prizes).filter((_, i) => i !== index) }));

  const title = menu.flatMap(g => g.items).find(x => x[0] === tab)?.[2] || "لوحة التحكم";
  if (loading) return <div className="admin-page" dir="rtl"><div className="admin-loading">⏳ جاري تحميل لوحة الإدارة...</div></div>;
  if (!admin) return <div className="admin-page" dir="rtl"><div className="admin-login-required"><div>🔐</div><h2>الدخول غير مصرح</h2><p>يجب تسجيل الدخول بحساب مشرف للوصول إلى لوحة الإدارة.</p><button type="button" className="save-btn" onClick={() => navigate("/login")}>تسجيل الدخول</button></div></div>;

  const Stat = ({ icon, label, value, onClick }) => <button type="button" className="admin-stat-card" onClick={onClick}><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</strong></button>;
  const GenericSection = ({ type, data }) => {
    const cfg = genericConfig[type]; if (!cfg) return null;
    const items = safeArray(data);
    return <section className="admin-card">
      <div className="section-header"><div><h2>{cfg.icon} {cfg.title}</h2><p>إجمالي العناصر: <strong>{items.length}</strong></p></div>{!cfg.readOnly && <button type="button" className="add-btn" onClick={() => openGeneric(type)}>＋ إضافة جديد</button>}</div>
      {showGeneric && genericType === type && <form className="admin-form" onSubmit={saveGeneric}><h3>{genericId ? "✏️ تعديل" : "＋ إضافة"} {cfg.title}</h3>{type === "banners" && <><div style={{padding:14,marginBottom:16,borderRadius:12,background:"#F8FAFC",border:`1px solid ${ACCENT}55`}}><strong>🎛️ تحكم كامل في محتوى وتصميم البنر</strong><p style={{margin:"6px 0 0",color:"#64748B"}}>عدّل النصوص والخطوط والأحجام والألوان والمكان، وشوف النتيجة مباشرة قبل الحفظ.</p></div><BannerPreview form={genericForm} /></>}<div className="form-grid">{cfg.fields.map(s => <Field key={s[0]} spec={s} value={genericForm[s[0]]} onChange={genericChange} categories={categories} />)}</div><div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving ? "⏳ جاري الحفظ..." : "💾 حفظ"}</button><button type="button" className="cancel-btn" onClick={() => setShowGeneric(false)}>إلغاء</button></div></form>}
      {items.length === 0 ? <div className="empty-state"><div>{cfg.icon}</div><h3>لا توجد بيانات</h3><p>لا توجد عناصر مسجلة حاليًا.</p></div> : <div className="table-scroll"><table className="admin-table"><thead><tr><th>البيانات</th><th>الحالة</th><th>التاريخ</th>{!cfg.readOnly && <th>إجراءات</th>}</tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.title || item.name || item.code || item.text || item.message || item.description || item.email || item.id}</strong>{item.message && item.title && <small>{item.message}</small>}</td><td>{item.active !== false && item.enabled !== false && item.visible !== false ? <span className="status-active">🟢 مفعل</span> : <span className="status-inactive">🔴 متوقف</span>}</td><td>{dateText(item.createdAt)}</td>{!cfg.readOnly && <td><div className="table-actions"><button type="button" className="edit-btn" onClick={() => openGeneric(type, item)}>✏️ تعديل</button><button type="button" className="delete-btn" onClick={() => removeGeneric(type, item)}>🗑️ حذف</button></div></td>}</tr>)}</tbody></table></div>}
    </section>;
  };

  return <div className="admin-page" dir="rtl">
    <aside className="admin-sidebar">
      <div className="admin-brand"><div className="brand-mark">س</div><div><strong>ســــَــــــــــوا</strong><small>لوحة الإدارة</small></div></div>
      <div className="admin-profile"><div className="avatar">{String(admin.name || "م").slice(0, 1)}</div><div><strong>{admin.name || "مشرف"}</strong><small>{admin.isSuperAdmin || admin.role === "superadmin" ? "مدير رئيسي" : "مشرف"}</small></div></div>
      <nav>{menu.map(group => <div className="menu-group" key={group.group}><h4>{group.group}</h4>{group.items.map(([id, icon, text]) => <button type="button" key={id} className={tab === id ? "admin-menu-item active" : "admin-menu-item"} onClick={() => changeTab(id)}><span>{icon}</span><span>{text}</span>{id === "orders" && counts.pending > 0 && <b>{counts.pending}</b>}
                {id === "support" && counts.supportUnread > 0 && <b>{counts.supportUnread}</b>}</button>)}</div>)}</nav>
      <button type="button" className="back-store" onClick={() => navigate("/")}>← العودة للمتجر</button>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><div><span className="eyebrow">لوحة التحكم</span><h1>{title}</h1></div><div className="top-actions"><button type="button" onClick={() => navigate("/")}>🏪 المتجر</button><div className="top-admin">👤 {admin.name || "مشرف"}</div></div></header>

      {tab === "dashboard" && <>
        <div className="admin-hero"><div><span>مرحبًا بك 👋</span><h2>إدارة ســــَــــــــــوا من مكان واحد</h2><p>تابع المبيعات والطلبات والعملاء وتحكم في كل تفاصيل المتجر.</p></div><button type="button" onClick={() => changeTab("settings")}>⚙️ إعدادات المتجر</button></div>
        <div className="stats-grid"><Stat icon="👥" label="العملاء" value={counts.users} onClick={() => changeTab("users")} /><Stat icon="📦" label="المنتجات" value={counts.products} onClick={() => changeTab("products")} /><Stat icon="🗂️" label="الأقسام" value={counts.categories} onClick={() => changeTab("categories")} /><Stat icon="🛒" label="الطلبات" value={counts.orders} onClick={() => changeTab("orders")} /><Stat icon="⏳" label="طلبات معلقة" value={counts.pending} onClick={() => { changeTab("orders"); setOrderStatus("pending"); }} /><Stat icon="💰" label="إجمالي المبيعات" value={money(counts.sales)} onClick={() => changeTab("sales")} /></div>
        <div className="dashboard-grid"><section className="admin-card"><div className="section-header"><div><h2>🛒 أحدث الطلبات</h2><p>آخر الطلبات المسجلة في المتجر</p></div><button type="button" className="ghost-btn" onClick={() => changeTab("orders")}>عرض الكل</button></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{orders.slice().sort((a,b) => asNumber(b.createdAt?.seconds) - asNumber(a.createdAt?.seconds)).slice(0,8).map(o => <tr key={o.id}><td><button type="button" className="table-link" onClick={() => setOrderDetails(o)}>{o.orderNumber || o.id.slice(0,8)}</button></td><td>{o.customerName || o.name || o.email || "—"}</td><td>{money(o.total ?? o.finalTotal)}</td><td><span className={`status-pill ${o.status || "pending"}`}>{o.status || "pending"}</span></td></tr>)}</tbody></table></div></section><section className="admin-card"><div className="section-header"><div><h2>👥 أحدث العملاء</h2><p>الحسابات المسجلة مؤخرًا</p></div><button type="button" className="ghost-btn" onClick={() => changeTab("users")}>عرض الكل</button></div>{users.slice(0,8).map(u => <button type="button" className="user-row" key={u.id} onClick={() => setUserDetails(u)}><span className="avatar">{String(u.name || "ع").slice(0,1)}</span><span><strong>{u.name || "عميل"}</strong><small>{u.email || u.phone || "—"}</small></span><span>›</span></button>)}</section></div>
      </>}

      {tab === "products" && <section className="admin-card">
        <div className="section-header">
          <div><h2>📦 إدارة المنتجات</h2><p>إضافة وتعديل المنتجات والتحكم في الأقسام والصور والمتغيرات بدون حد لعدد الصور أو المتغيرات.</p></div>
          <button type="button" className="add-btn" onClick={() => setProductForm({
            title: "", description: "", price: 0, oldPrice: 0, stock: 0,
            category: "", categoryId: "", image: "", images: [], imageFiles: [], imagePreview: "",
            hasVariants: false, variantGroups: [], variants: [], offer: false, bestSeller: false, newArrival: false, recommended: false, active: true,
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
              {categories.slice().sort((a,b) => asNumber(a.sortOrder) - asNumber(b.sortOrder)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label className="form-group-full"><span>صور المنتج — يمكنك اختيار عدد غير محدود</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e => setProductForm(p => ({ ...p, imageFiles: [...safeArray(p.imageFiles), ...Array.from(e.target.files || [])] }))} /></label>
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
            <div className="section-header nested">
              <div>
                <h3>🎛️ مجموعات خيارات المنتج</h3>
                <p>أنشئ أي عدد من الأزرار مثل «اللون» و«المقاس» و«الخامة»، وحدد اسم كل زر والعناصر داخله من هنا.</p>
              </div>
              <button type="button" className="add-btn" onClick={() => setProductForm(p => ({
                ...p,
                hasVariants: true,
                variantGroups: [
                  ...productVariantGroups(p),
                  {
                    id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    name: "",
                    options: [],
                  },
                ]
              }))}>＋ إضافة زر خيارات</button>
            </div>

            {productVariantGroups(productForm).length === 0 && (
              <div className="empty-state" style={{ marginTop: 12 }}>
                لا توجد مجموعات خيارات. أضف زرًا جديدًا ثم اكتب اسمه والعناصر الموجودة بداخله.
              </div>
            )}

            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {productVariantGroups(productForm).map((group, groupIndex) => (
                <div key={group.id} style={{ border: `1px solid ${ACCENT}55`, borderRadius: 16, padding: 16, background: "#FBFCFF" }}>
                  <div className="section-header nested">
                    <div>
                      <h4 style={{ margin: 0 }}>زر الخيارات #{groupIndex + 1}</h4>
                      <small>{group.options.length} عناصر داخل الزر</small>
                    </div>
                    <button type="button" className="delete-btn" onClick={() => setProductForm(p => ({
                      ...p,
                      variantGroups: productVariantGroups(p).filter((_, i) => i !== groupIndex)
                    }))}>🗑️ حذف الزر</button>
                  </div>

                  <div className="form-grid">
                    <label>
                      <span>اسم الزر / المجموعة</span>
                      <input
                        value={group.name}
                        placeholder="مثال: اللون أو المقاس أو الخامة"
                        onChange={e => setProductForm(p => ({
                          ...p,
                          variantGroups: productVariantGroups(p).map((x, i) => i === groupIndex ? { ...x, name: e.target.value } : x)
                        }))}
                      />
                    </label>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong>عناصر الزر</strong>
                      <button type="button" className="ghost-btn" onClick={() => setProductForm(p => ({
                        ...p,
                        variantGroups: productVariantGroups(p).map((x, i) => i === groupIndex ? { ...x, options: [
                            ...safeArray(x.options),
                            {
                              id: `${x.id}-option-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                              value: "",
                              label: "",
                              price: "",
                            },
                          ] } : x)
                      }))}>＋ إضافة عنصر</button>
                    </div>

                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {group.options.map((option, optionIndex) => (
                        <div key={option.id || `${group.id}-${optionIndex}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px auto", gap: 8, alignItems: "end" }}>
                          <label>
                            <span>القيمة</span>
                            <input value={option.value} placeholder="مثال: أسود" onChange={e => setProductForm(p => ({
                              ...p,
                              variantGroups: productVariantGroups(p).map((x, i) => i === groupIndex ? { ...x, options: x.options.map((o, j) => j === optionIndex ? { ...o, value: e.target.value, label: o.label || e.target.value } : o) } : x)
                            }))} />
                          </label>
                          <label>
                            <span>الاسم الظاهر للعميل</span>
                            <input value={option.label} placeholder="مثال: أسود" onChange={e => setProductForm(p => ({
                              ...p,
                              variantGroups: productVariantGroups(p).map((x, i) => i === groupIndex ? { ...x, options: x.options.map((o, j) => j === optionIndex ? { ...o, label: e.target.value } : o) } : x)
                            }))} />
                          </label>
                          <label>
                            <span>السعر (اختياري)</span>
                            <input type="number" min="0" step="0.01" value={option.price ?? ""} placeholder="بدون سعر" onChange={e => setProductForm(p => ({
                              ...p,
                              variantGroups: productVariantGroups(p).map((x, i) => i === groupIndex ? { ...x, options: x.options.map((o, j) => j === optionIndex ? { ...o, price: e.target.value } : o) } : x)
                            }))} />
                            <small style={{display:"block",marginTop:4,color:"#64748B"}}>سيظهر للعميل فقط لو تم إدخاله</small>
                          </label>
                          <button type="button" className="delete-btn" onClick={() => setProductForm(p => ({
                            ...p,
                            variantGroups: productVariantGroups(p).map((x, i) => i === groupIndex ? { ...x, options: x.options.filter((_, j) => j !== optionIndex) } : x)
                          }))}>حذف</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16, padding: 16 }}>
            <div className="section-header nested">
              <div><h3>🎨 تركيبات المتغيرات</h3><p>كل تركيبة تربط اختيار الأزرار بالسعر والمخزون وSKU والصور.</p></div>
              <button type="button" className="add-btn" onClick={() => setProductForm(p => ({
                ...p,
                hasVariants: true,
                variants: [...safeArray(p.variants), normalizeVariant({ name: "", sku: "", price: p.price || 0, oldPrice: p.oldPrice || 0, stock: p.stock || 0, images: [], attributes: {} }, safeArray(p.variants).length)]
              }))}>＋ إضافة تركيبة</button>
            </div>

            {safeArray(productForm.variants).length === 0 && <div className="empty-state" style={{ marginTop: 12 }}>لا توجد تركيبات. أضف تركيبة لكل مجموعة اختيارات تريد ربطها بسعر ومخزون مستقل.</div>}

            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {safeArray(productForm.variants).map((variant, index) => {
                const v = normalizeVariant(variant, index);
                const groups = productVariantGroups(productForm);
                return <div key={v.id} style={{ border: "1px solid #D9DFE8", borderRadius: 14, padding: 14, background: "#FAFCFF" }}>
                  <div className="section-header nested">
                    <div><h4 style={{ margin: 0 }}>تركيبة #{index + 1}</h4><small>{v.sku || "بدون SKU"}</small></div>
                    <button type="button" className="delete-btn" onClick={() => setProductForm(p => ({ ...p, variants: safeArray(p.variants).filter((_, i) => i !== index), hasVariants: safeArray(p.variants).length > 1 || productVariantGroups(p).length > 0 }))}>🗑️ حذف التركيبة</button>
                  </div>

                  <div className="form-grid">
                    <label><span>اسم التركيبة</span><input value={v.name} placeholder="مثال: أسود - XL" onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), name:e.target.value } : x) }))} /></label>
                    <label><span>SKU</span><input value={v.sku} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), sku:e.target.value } : x) }))} /></label>
                    <label><span>السعر</span><input type="number" min="0" value={v.price} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), price:e.target.value } : x) }))} /></label>
                    <label><span>السعر القديم</span><input type="number" min="0" value={v.oldPrice} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), oldPrice:e.target.value } : x) }))} /></label>
                    <label><span>المخزون</span><input type="number" min="0" value={v.stock} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), stock:e.target.value } : x) }))} /></label>
                    {groups.map(group => {
                      const current = v.attributes?.[group.id] ?? v.attributes?.[group.name] ?? "";
                      return <label key={group.id}><span>{group.name}</span><select value={current} onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), attributes: { ...normalizeVariant(x,i).attributes, [group.id]: e.target.value } } : x) }))}>
                        <option value="">اختر {group.name}</option>
                        {group.options.map(option => <option key={option.id} value={option.value}>{option.label || option.value}</option>)}
                      </select></label>;
                    })}
                    <label className="form-group-full"><span>صور التركيبة — بدون حد</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e => setProductForm(p => ({ ...p, variants: safeArray(p.variants).map((x,i) => i===index ? { ...normalizeVariant(x,i), imageFiles: [...safeArray(normalizeVariant(x,i).imageFiles), ...Array.from(e.target.files || [])] } : x) }))} /></label>
                  </div>

                  {Object.keys(v.attributes || {}).filter(key => v.attributes[key]).length > 0 && (
                    <div className="mini-tags" style={{ marginTop: 10 }}>
                      {Object.entries(v.attributes).filter(([, value]) => value).map(([key, value]) => {
                        const group = groups.find(g => g.id === key);
                        return <span key={key}>{group?.name || key}: {value}</span>;
                      })}
                    </div>
                  )}

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
        <div className="table-scroll"><table className="admin-table"><thead><tr><th>الصورة</th><th>المنتج</th><th>القسم</th><th>السعر</th><th>الكمية</th><th>التصنيفات</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredProducts.map(p=>{const imgs=productImageList(p);const category=categories.find(c=>c.id===(p.categoryId||p.category));return <tr key={p.id}><td>{(p.image||imgs[0])?<img className="table-img" src={p.image||imgs[0]} alt=""/>:<span>🖼️</span>}</td><td><strong>{p.title||"بدون اسم"}</strong>{imgs.length>1&&<small style={{display:"block"}}>🖼️ {imgs.length} صور</small>}{safeArray(p.variants).length>0&&<small style={{display:"block"}}>🎨 {p.variants.length} متغير</small>}</td><td>{category?.name||p.categoryName||"—"}</td><td><strong>{money(p.price)}</strong>{asNumber(p.oldPrice)>asNumber(p.price)&&<small className="old-price">{money(p.oldPrice)}</small>}</td><td>{asNumber(p.stock)}</td><td><div className="mini-tags">{p.offer&&<span>🔥</span>}{p.bestSeller&&<span>⭐</span>}{p.newArrival&&<span>🆕</span>}{p.recommended&&<span>❤️</span>}</div></td><td>{p.active!==false?<span className="status-active">🟢 مفعل</span>:<span className="status-inactive">🔴 متوقف</span>}</td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setProductForm({...p,categoryId:p.categoryId||p.category||"",category:p.categoryId||p.category||"",images:imgs,image: p.image||imgs[0]||"",imageFiles:[],variantGroups:productVariantGroups(p),variants:productVariantsList(p),hasVariants:p.hasVariants===true||safeArray(p.variants).length>0||productVariantGroups(p).length>0})}>✏️ تعديل</button><button type="button" className="delete-btn" onClick={()=>removeProduct(p)}>🗑️ حذف</button></div></td></tr>})}</tbody></table></div>
      </section>}

      {tab === "categories" && <section className="admin-card"><div className="section-header"><div><h2>🗂️ إدارة الأقسام</h2><p>تحكم في الاسم والصورة واللون والترتيب والأقسام الفرعية.</p></div><button type="button" className="add-btn" onClick={()=>setCategoryForm({name:"",categoryNumber:"",parentId:"",image:"",color:ACCENT,cardSize:"medium",sortOrder:0,description:"",active:true})}>＋ إضافة قسم</button></div>{categoryForm&&<form className="admin-form" onSubmit={saveCategory} style={{overflowX:"auto",width:"100%"}}><h3>{categoryForm.id?"✏️ تعديل القسم":"＋ إضافة قسم"}</h3><div className="form-grid"><label><span>اسم القسم</span><input required value={categoryForm.name} onChange={e=>setCategoryForm(p=>({...p,name:e.target.value}))}/></label><label><span>رقم القسم</span><input value={categoryForm.categoryNumber} onChange={e=>setCategoryForm(p=>({...p,categoryNumber:e.target.value}))}/></label><label><span>القسم الرئيسي</span><select value={categoryForm.parentId} onChange={e=>setCategoryForm(p=>({...p,parentId:e.target.value}))}><option value="">قسم رئيسي</option>{categories.filter(c=>c.id!==categoryForm.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><ColorField name="categoryColor" label="اللون" value={categoryForm.color || ACCENT} onChange={e=>setCategoryForm(p=>({...p,color:e.target.value}))}/><label><span>حجم البطاقة</span><select value={categoryForm.cardSize} onChange={e=>setCategoryForm(p=>({...p,cardSize:e.target.value}))}><option value="small">صغيرة</option><option value="medium">متوسطة</option><option value="large">كبيرة</option></select></label><label><span>الترتيب</span><input type="number" value={categoryForm.sortOrder} onChange={e=>setCategoryForm(p=>({...p,sortOrder:e.target.value}))}/></label><label><span>الصورة</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];setCategoryForm(p=>({...p,imageFile:f}))}}/></label><label className="form-group-full"><span>الوصف</span><textarea rows="3" value={categoryForm.description} onChange={e=>setCategoryForm(p=>({...p,description:e.target.value}))}/></label></div><label className="admin-checkbox"><input type="checkbox" checked={categoryForm.active!==false} onChange={e=>setCategoryForm(p=>({...p,active:e.target.checked}))}/><span>🟢 القسم مفعل</span></label><div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving?"⏳ جاري الحفظ...":"💾 حفظ القسم"}</button><button type="button" className="cancel-btn" onClick={()=>setCategoryForm(null)}>إلغاء</button></div></form>}<div className="table-scroll"><table className="admin-table"><thead><tr><th>الصورة</th><th>القسم</th><th>اللون</th><th>الحجم</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{categories.slice().sort((a,b)=>asNumber(a.sortOrder)-asNumber(b.sortOrder)).map(c=><tr key={c.id}><td>{c.image?<img className="table-img" src={c.image} alt=""/>:"🗂️"}</td><td><strong>{c.name}</strong></td><td><span className="color-dot" style={{background:c.color||ACCENT}}/>{c.color||ACCENT}</td><td>{c.cardSize||"medium"}</td><td>{asNumber(c.sortOrder)}</td><td>{c.active!==false?<span className="status-active">🟢 مفعل</span>:<span className="status-inactive">🔴 متوقف</span>}</td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setCategoryForm({...c})}>✏️ تعديل</button><button type="button" className="delete-btn" onClick={()=>removeCategory(c)}>🗑️ حذف</button></div></td></tr>)}</tbody></table></div></section>}

      {tab === "orders" && <section className="admin-card"><div className="section-header"><div><h2>🛒 إدارة الطلبات</h2><p>متابعة الطلبات وتغيير الحالة والتفاصيل.</p></div></div><div className="toolbar"><input placeholder="🔎 ابحث برقم الطلب أو العميل أو الهاتف..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={orderStatus} onChange={e=>setOrderStatus(e.target.value)}><option value="all">كل الحالات</option><option value="pending">معلق</option><option value="confirmed">مؤكد</option><option value="processing">قيد التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>الهاتف</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredOrders.map(o=><tr key={o.id}><td><strong>{o.orderNumber||o.id.slice(0,8)}</strong></td><td>{o.customerName||o.name||o.email||"—"}</td><td dir="ltr">{o.phone||"—"}</td><td>{dateText(o.createdAt)}</td><td>{money(o.total??o.finalTotal)}</td><td><select className="status-select" value={o.status||"pending"} onChange={e=>changeOrderStatus(o,e.target.value)}><option value="pending">معلق</option><option value="confirmed">مؤكد</option><option value="processing">قيد التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setOrderDetails(o)}>👁️ التفاصيل</button><button type="button" className="delete-btn" onClick={()=>removeOrder(o)}>🗑️ حذف</button>{o.phone&&<a className="whatsapp-btn" href={`https://wa.me/${String(o.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer">واتساب</a>}</div></td></tr>)}</tbody></table></div></section>}

      {tab === "users" && <section className="admin-card"><div className="section-header"><div><h2>👥 العملاء</h2><p>إدارة الحسابات والحظر والمتابعة.</p></div></div><div className="toolbar"><input placeholder="🔎 ابحث بالاسم أو البريد أو الهاتف..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>العميل</th><th>البريد</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}><td><strong>{u.name||"عميل"}</strong></td><td dir="ltr">{u.email||"—"}</td><td dir="ltr">{u.phone||"—"}</td><td>{u.blocked?<span className="status-inactive">🔴 محظور</span>:<span className="status-active">🟢 نشط</span>}</td><td><div className="table-actions"><button type="button" className="edit-btn" onClick={()=>setUserDetails(u)}>👁️ التفاصيل</button><button type="button" className="cancel-btn" onClick={()=>toggleUserBlock(u)}>{u.blocked?"✅ إلغاء الحظر":"🚫 حظر"}</button></div></td></tr>)}</tbody></table></div></section>}

      {tab === "offers" && <ProductFlagSection title="🔥 عروض اليوم" flag="offer" products={products} setTab={changeTab} />}
      {tab === "bestsellers" && <ProductFlagSection title="⭐ الأكثر مبيعًا" flag="bestSeller" products={products} setTab={changeTab} />}
      {tab === "new-arrivals" && <ProductFlagSection title="🆕 وصل حديثًا" flag="newArrival" products={products} setTab={changeTab} />}
      {tab === "recommended" && <ProductFlagSection title="❤️ قد يعجبك" flag="recommended" products={products} setTab={changeTab} />}

      {tab === "banners" && GenericSection({ type: "banners", data: banners })}

      {tab === "games" && <GamesPanel gamesSettings={gamesSettings} setGamesSettings={setGamesSettings} saveGames={saveGames} saving={saving} />}

      {tab === "wheel" && <section className="admin-card"><div className="section-header"><div><h2>🎡 عجلة الحظ</h2><p>تحكم كامل في الظهور والمحاولات والجوائز.</p></div></div><div className="form-grid"><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.enabled===true} onChange={e=>setWheelSettings(p=>({...p,enabled:e.target.checked}))}/><span>تفعيل عجلة الحظ</span></label><label><span>طريقة الظهور</span><select value={wheelSettings.displayMode} onChange={e=>setWheelSettings(p=>({...p,displayMode:e.target.value}))}><option value="store">داخل المتجر</option><option value="popup">منبثق</option><option value="both">الاثنين</option></select></label><label><span>العنوان</span><input value={wheelSettings.title||""} onChange={e=>setWheelSettings(p=>({...p,title:e.target.value}))}/></label><label><span>الوصف</span><input value={wheelSettings.description||""} onChange={e=>setWheelSettings(p=>({...p,description:e.target.value}))}/></label><label><span>المحاولات اليومية</span><input type="number" min="1" value={wheelSettings.attemptsPerUser} onChange={e=>setWheelSettings(p=>({...p,attemptsPerUser:Math.max(1,asNumber(e.target.value,1))}))}/></label><label><span>تأخير Popup</span><input type="number" min="0" value={wheelSettings.popupDelay} onChange={e=>setWheelSettings(p=>({...p,popupDelay:Math.max(0,asNumber(e.target.value))}))}/></label><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.popupEnabled===true} onChange={e=>setWheelSettings(p=>({...p,popupEnabled:e.target.checked}))}/><span>تفعيل Popup</span></label><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.popupClosable!==false} onChange={e=>setWheelSettings(p=>({...p,popupClosable:e.target.checked}))}/><span>السماح بالإغلاق</span></label><label className="admin-checkbox"><input type="checkbox" checked={wheelSettings.popupShowOncePerDay===true} onChange={e=>setWheelSettings(p=>({...p,popupShowOncePerDay:e.target.checked}))}/><span>مرة واحدة يوميًا</span></label></div><div className="section-header nested"><div><h3>🎁 الجوائز</h3><p>أضف وعدّل الجوائز مباشرة.</p></div><button type="button" className="add-btn" onClick={addPrize}>＋ إضافة جائزة</button></div><div className="prizes-grid">{safeArray(wheelSettings.prizes).map((p,i)=><div className="prize-card" key={p.id||i}><label><span>اسم الجائزة</span><input value={p.title||""} onChange={e=>updatePrize(i,{title:e.target.value})}/></label><label><span>النوع</span><select value={p.type||"discount"} onChange={e=>updatePrize(i,{type:e.target.value})}><option value="discount">نسبة خصم</option><option value="fixed">خصم مبلغ</option><option value="free-shipping">شحن مجاني</option><option value="gift">هدية</option><option value="nothing">حظ أوفر</option></select></label>{!["nothing","free-shipping"].includes(p.type)&&<label><span>القيمة</span><input type="number" min="0" value={p.value??0} onChange={e=>updatePrize(i,{value:asNumber(e.target.value)})}/></label>}<ColorField name={`prizeColor-${i}`} label="اللون" value={p.color || ACCENT} onChange={e=>updatePrize(i,{color:e.target.value})}/><label className="admin-checkbox"><input type="checkbox" checked={p.enabled!==false} onChange={e=>updatePrize(i,{enabled:e.target.checked})}/><span>الجائزة متاحة</span></label><button type="button" className="delete-btn" onClick={()=>deletePrize(i)}>🗑️ حذف الجائزة</button></div>)}</div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveWheel}>{saving?"⏳ جاري الحفظ...":"💾 حفظ إعدادات العجلة"}</button></div></section>}

      {tab === "settings" && <SettingsPanel storeSettings={storeSettings} setStoreSettings={setStoreSettings} saveSettings={saveSettings} saving={saving} />}
      {tab === "contact" && <ContactPanel storeSettings={storeSettings} setStoreSettings={setStoreSettings} saveSettings={saveSettings} saving={saving} />}
      {tab === "admins" && <AdminPanel admins={admins} adminForm={adminForm} setAdminForm={setAdminForm} saving={saving} setSaving={setSaving} log={log} />}
      {tab === "security" && <SecurityPanel security={security} setSecurity={setSecurity} saving={saving} setSaving={setSaving} log={log} />}
      {tab === "reports" && <Reports orders={orders} products={products} users={users} categories={categories} banners={banners} announcementBars={announcementBars} popupAds={popupAds} activityLogs={activityLogs} />}
      {tab === "sales" && <Sales orders={orders} />}
      {tab === "shipping" && GenericSection({ type: "shipping", data: shipping })}
      {tab === "payments" && GenericSection({ type: "payments", data: payments })}
      {tab === "store-menu" && GenericSection({ type: "store-menu", data: storeMenu })}
      {tab === "coupons" && GenericSection({ type: "coupons", data: coupons })}
      {tab === "announcements" && GenericSection({ type: "announcements", data: announcements })}
      {tab === "announcement-bars" && GenericSection({ type: "announcement-bars", data: announcementBars })}
      {tab === "popup-ads" && GenericSection({ type: "popup-ads", data: popupAds })}
      {tab === "notifications" && GenericSection({ type: "notifications", data: notifications })}
      {tab === "support" && <SupportPanel support={support} admin={admin} users={users} orders={orders} favorites={favorites} activityLogs={activityLogs} notifications={notifications} onOpenCustomer={setUserDetails} />}
      {tab === "favorites" && GenericSection({ type: "favorites", data: favorites })}
      {tab === "blocked-users" && GenericSection({ type: "blocked-users", data: blockedUsers })}
      {tab === "activity-log" && GenericSection({ type: "activity-log", data: activityLogs })}

      {orderDetails && <Modal title={`تفاصيل الطلب ${orderDetails.orderNumber || orderDetails.id.slice(0,8)}`} onClose={()=>setOrderDetails(null)}><div className="details-grid"><Info label="العميل" value={orderDetails.customerName||orderDetails.name||"—"}/><Info label="الهاتف" value={orderDetails.phone||"—"}/><Info label="البريد" value={orderDetails.email||"—"}/><Info label="التاريخ" value={dateText(orderDetails.createdAt)}/><Info label="الدفع" value={orderDetails.paymentMethod||"—"}/><Info label="الإجمالي" value={money(orderDetails.total??orderDetails.finalTotal)}/></div><h3>🛍️ المنتجات</h3><div className="order-items">{safeArray(orderDetails.items||orderDetails.products).map((it,i)=><div key={i}><span>{it.title||it.name||"منتج"}</span><strong>{asNumber(it.quantity,1)} × {money(it.price)}</strong></div>)}</div><div className="form-actions"><button type="button" className="delete-btn" onClick={()=>removeOrder(orderDetails)}>🗑️ حذف الطلب</button></div></Modal>}
      {userDetails && <CustomerDetailsModal user={userDetails} orders={orders} favorites={favorites} support={support} activityLogs={activityLogs} notifications={notifications} onClose={()=>setUserDetails(null)} onToggleBlock={toggleUserBlock} />}
    </main>
  </div>;
}


function BannerPreview({ form = {} }) {
  const image = form.imagePreview || form.image || "";
  const desktopImage = form.desktopImagePreview || form.desktopImage || image;
  const mobileImage = form.mobileImagePreview || form.mobileImage || image;
  const title = form.title || "عنوان البنر التجريبي";
  const description = form.text || form.description || "اكتب وصف البنر هنا وشوف شكله مباشرة قبل الحفظ.";
  const buttonText = form.buttonText || "تسوق الآن";
  const tag = form.tag || "عرض مميز";
  const position = form.contentPosition || "right";
  const align = form.textAlign || "right";
  const direction = form.textDirection || "rtl";
  const width = Math.max(260, asNumber(form.contentWidth, 620));
  const top = Math.max(0, asNumber(form.contentTop, 50));
  const side = Math.max(0, asNumber(form.contentSide, 7));
  const opacity = Math.min(1, Math.max(0, asNumber(form.contentOpacity, 1)));
  const overlay = Math.min(1, Math.max(0, asNumber(form.overlayOpacity, 0.35)));
  const titleShadow = form.titleShadow !== false ? "0 4px 18px rgba(0,0,0,.35)" : "none";
  const descShadow = form.descriptionShadow !== false ? "0 2px 12px rgba(0,0,0,.28)" : "none";
  const buttonShadow = form.buttonShadow !== false ? "0 10px 24px rgba(0,0,0,.22)" : "none";
  const contentStyle = {
    position: "absolute", top: `${top}%`, transform: "translateY(-0%)", width: `min(${width}px, 82%)`, opacity,
    textAlign: align, direction, zIndex: 2,
    ...(position === "left" ? { left: `${side}%` } : position === "center" ? { left: "50%", transform: "translate(-50%, -0%)" } : { right: `${side}%` }),
  };
  const imageStyle = { width: "100%", height: "100%", objectFit: form.imageFit === "cover" ? "cover" : "contain", objectPosition: "center", display: "block" };
  return <div style={{margin:"0 0 20px",border:`1px solid ${ACCENT}55`,borderRadius:18,overflow:"hidden",background:"#0B1F3A",boxShadow:"0 12px 35px rgba(7,26,54,.16)"}}>
    <div style={{padding:"12px 14px",background:"linear-gradient(135deg,#071A36,#0B1F3A)",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <strong>👁️ معاينة مباشرة للبنر</strong><span style={{fontSize:12,opacity:.75}}>المعاينة بتتحدث مع كل تعديل</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.6fr) minmax(280px,0.8fr)",gap:12,padding:12,background:"#F8FAFC"}}>
      {[
        { label: "🖥️ Desktop — 1920×600", src: desktopImage, ratio: "3.2 / 1" },
        { label: "📱 Mobile — 1080×1350", src: mobileImage, ratio: "4 / 5" },
      ].map((preview) => (
        <div key={preview.label} style={{border:"1px solid #D9DFE8",borderRadius:14,overflow:"hidden",background:"#0B1F3A"}}>
          <div style={{padding:"8px 10px",background:"#071A36",color:"#fff",fontSize:12,fontWeight:800}}>{preview.label}</div>
          <div style={{position:"relative",aspectRatio:preview.ratio,background:"linear-gradient(135deg,#152A47,#314B6B)"}}>
            {preview.src ? <img src={preview.src} alt="معاينة البنر" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} /> : <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#fff",fontSize:14,padding:20,textAlign:"center"}}>🖼️ ارفع صورة {preview.label.includes("Mobile") ? "الموبايل" : "الديسكتوب"}</div>}
          </div>
        </div>
      ))}
    </div>
    <div style={{position:"relative",minHeight:300,background:"linear-gradient(135deg,#152A47,#314B6B)",display:"none"}}>
      {image ? <img src={image} alt="معاينة البنر" style={imageStyle} /> : null}
      <div style={{position:"absolute",inset:0,background:`rgba(0,0,0,${overlay})`,zIndex:1,pointerEvents:"none"}} />
      <div style={contentStyle}>
        {tag && <span style={{display:"inline-flex",padding:"6px 12px",borderRadius:999,background:form.buttonBackground || ACCENT,color:form.buttonTextColor || PRIMARY,fontFamily:form.titleFontFamily || "Cairo, sans-serif",fontSize:13,fontWeight:700,marginBottom:12}}>{tag}</span>}
        {form.showTitle !== false && <h2 style={{margin:`0 0 ${asNumber(form.titleMarginBottom,14)}px`,fontFamily:form.titleFontFamily || "Cairo, sans-serif",fontSize:`${asNumber(form.titleFontSizeDesktop,52)}px`,fontWeight:asNumber(form.titleFontWeight,800),color:form.titleColor || "#fff",lineHeight:asNumber(form.titleLineHeight,1.15),letterSpacing:`${asNumber(form.titleLetterSpacing,0)}px`,textShadow:titleShadow}}>{title}</h2>}
        {form.showDescription !== false && <p style={{margin:`0 0 ${asNumber(form.descriptionMarginBottom,22)}px`,fontFamily:form.descriptionFontFamily || "Cairo, sans-serif",fontSize:`${asNumber(form.descriptionFontSizeDesktop,20)}px`,fontWeight:asNumber(form.descriptionFontWeight,500),color:form.descriptionColor || "#fff",lineHeight:asNumber(form.descriptionLineHeight,1.6),letterSpacing:`${asNumber(form.descriptionLetterSpacing,0)}px`,textShadow:descShadow}}>{description}</p>}
        {form.showButton !== false && <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:form.buttonFontFamily || "Cairo, sans-serif",fontSize:`${asNumber(form.buttonFontSizeDesktop,17)}px`,fontWeight:asNumber(form.buttonFontWeight,700),color:form.buttonTextColor || PRIMARY,background:form.buttonBackground || ACCENT,border:`${asNumber(form.buttonBorderWidth,1)}px solid ${form.buttonBorderColor || ACCENT}`,borderRadius:`${asNumber(form.buttonBorderRadius,10)}px`,padding:`${asNumber(form.buttonPaddingY,13)}px ${asNumber(form.buttonPaddingX,28)}px`,boxShadow:buttonShadow}}>{buttonText}</span>}
      </div>
    </div>
  </div>;
}


function SupportPanel({
  support,
  admin,
  users = [],
  orders = [],
  favorites = [],
  activityLogs = [],
  notifications = [],
  onOpenCustomer,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [attachment, setAttachment] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [pinned, setPinned] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sawa_support_pinned") || "[]");
    } catch {
      return [];
    }
  });
  const [closedIds, setClosedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sawa_support_closed") || "[]");
    } catch {
      return [];
    }
  });

  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getConversationId = (item = {}) =>
    String(
      item.conversationId ||
        item.userId ||
        item.uid ||
        item.customerId ||
        item.email ||
        item.phone ||
        item.id ||
        "unknown"
    );

  const toMillis = (value) => {
    if (!value) return 0;
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    return new Date(value || 0).getTime() || 0;
  };

  const getPersonName = (item = {}) =>
    item.accountName ||
    item.displayName ||
    item.name ||
    item.customerName ||
    item.customerEmail ||
    item.email ||
    item.customerPhone ||
    item.phone ||
    "عميل";

  const isCustomerMessage = (message = {}) =>
    message.sender === "customer" ||
    message.senderRole === "customer";

  const isAdminMessage = (message = {}) =>
    message.sender === "admin" ||
    message.senderRole === "admin";

  const getMediaUrl = (message = {}) =>
    String(
      message.attachmentUrl ||
        message.imageUrl ||
        message.mediaUrl ||
        message.fileUrl ||
        message.url ||
        message.attachment?.url ||
        ""
    ).trim();

  const isImage = (message = {}) => {
    const url = getMediaUrl(message);
    const mime = String(
      message.attachmentMime ||
        message.mimeType ||
        message.fileType ||
        ""
    ).toLowerCase();
    const type = String(
      message.messageType || message.type || ""
    ).toLowerCase();
    const resource = String(
      message.attachmentResourceType ||
        message.resourceType ||
        ""
    ).toLowerCase();
    const name = String(
      message.attachmentName ||
        message.fileName ||
        message.name ||
        ""
    ).toLowerCase();

    return (
      !!url &&
      (
        type === "image" ||
        resource === "image" ||
        mime.startsWith("image/") ||
        /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)(?:[?#].*)?$/i.test(
          name
        ) ||
        /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)(?:[?#].*)?$/i.test(
          url
        )
      )
    );
  };

  const isAudio = (message = {}) => {
    const url = getMediaUrl(message);
    const mime = String(
      message.attachmentMime ||
        message.mimeType ||
        message.fileType ||
        ""
    ).toLowerCase();
    const type = String(
      message.messageType || message.type || ""
    ).toLowerCase();
    const resource = String(
      message.attachmentResourceType ||
        message.resourceType ||
        ""
    ).toLowerCase();

    return (
      !!url &&
      (
        type === "audio" ||
        resource === "audio" ||
        mime.startsWith("audio/") ||
        /\.(webm|ogg|mp3|wav|m4a|aac)(?:[?#].*)?$/i.test(url)
      )
    );
  };

  const isLocation = (message = {}) =>
    String(
      message.messageType || message.type || ""
    ).toLowerCase() === "location" ||
    !!message.locationUrl;

  const conversations = useMemo(() => {
    const map = new Map();

    safeArray(support).forEach((message) => {
      const id = getConversationId(message);

      if (!map.has(id)) {
        map.set(id, []);
      }

      map.get(id).push(message);
    });

    return Array.from(map.entries())
      .map(([id, messages]) => {
        const sorted = messages
          .slice()
          .sort(
            (a, b) =>
              toMillis(a.createdAt) -
              toMillis(b.createdAt)
          );

        const last =
          sorted[sorted.length - 1] || {};

        const first =
          sorted.find(isCustomerMessage) ||
          sorted[0] ||
          {};

        const unread = sorted.filter(
          (message) =>
            isCustomerMessage(message) &&
            message.readByAdmin !== true &&
            message.deletedByAdmin !== true
        ).length;

        const lastCustomer =
          [...sorted]
            .reverse()
            .find(isCustomerMessage) || null;

        const lastCustomerTime =
          toMillis(lastCustomer?.createdAt);

        const active =
          lastCustomerTime >
          Date.now() - 5 * 60 * 1000;

        const account = safeArray(users).find(
          (user) => {
            const uid = String(
              first.userId ||
                first.uid ||
                first.customerId ||
                ""
            ).trim();

            const email = String(
              first.customerEmail ||
                first.email ||
                ""
            )
              .trim()
              .toLowerCase();

            const phone = String(
              first.customerPhone ||
                first.phone ||
                ""
            ).replace(/\D/g, "");

            const userIds = String(
              user.uid ||
                user.userId ||
                user.id ||
                ""
            ).trim();

            const userEmail = String(
              user.email || ""
            )
              .trim()
              .toLowerCase();

            const userPhone = String(
              user.phone || ""
            ).replace(/\D/g, "");

            return (
              (uid &&
                userIds &&
                uid === userIds) ||
              (email &&
                userEmail &&
                email === userEmail) ||
              (phone &&
                userPhone &&
                phone === userPhone)
            );
          }
        ) || null;

        const accountName =
          account?.displayName ||
          account?.name ||
          account?.username ||
          account?.fullName ||
          "";

        return {
          id,
          messages: sorted,
          last,
          first,
          unread,
          hasUnread: unread > 0,
          lastCustomer,
          lastCustomerTime,
          active,
          pinned: pinned.includes(id),
          closed: closedIds.includes(id),
          account,
          accountName,
        };
      })
      .sort(
        (a, b) =>
          Number(b.pinned) -
            Number(a.pinned) ||
          Number(b.closed) -
            Number(a.closed) ||
          toMillis(b.last?.createdAt) -
            toMillis(a.last?.createdAt)
      );
  }, [support, users, pinned, closedIds]);

  const totalUnread = conversations.reduce(
    (sum, conversation) =>
      sum + conversation.unread,
    0
  );

  const totalUnreadConversations =
    conversations.filter(
      (conversation) =>
        conversation.hasUnread
    ).length;

  const openConversations =
    conversations.filter(
      (conversation) =>
        !conversation.closed
    ).length;

  const closedConversations =
    conversations.filter(
      (conversation) =>
        conversation.closed
    ).length;

  const markConversationRead = async (
    conversation
  ) => {
    if (!conversation?.messages?.length) {
      return;
    }

    const unreadMessages =
      conversation.messages.filter(
        (message) =>
          isCustomerMessage(message) &&
          message.readByAdmin !== true
      );

    if (!unreadMessages.length) {
      return;
    }

    await Promise.all(
      unreadMessages
        .filter((message) => message.id)
        .map((message) =>
          updateDoc(
            doc(
              db,
              "supportMessages",
              message.id
            ),
            {
              readByAdmin: true,
              adminReadAt:
                serverTimestamp(),
            }
          ).catch((error) =>
            console.error(
              "Mark support conversation as read error:",
              error
            )
          )
        )
    );
  };

  useEffect(() => {
    if (!selectedId) return;

    const conversation =
      conversations.find(
        (item) =>
          item.id === selectedId
      );

    if (conversation?.hasUnread) {
      markConversationRead(conversation);
    }
  }, [selectedId, conversations]);

  useEffect(() => {
    if (!conversations.length) {
      setSelectedId(null);
      return;
    }

    if (
      selectedId &&
      conversations.some(
        (conversation) =>
          conversation.id === selectedId
      )
    ) {
      return;
    }

    const firstVisible =
      conversations.find(
        (conversation) =>
          !conversation.closed
      ) || conversations[0];

    setSelectedId(firstVisible.id);
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [
    selectedId,
    conversations.length,
  ]);

  const filteredConversations =
    useMemo(() => {
      const query =
        conversationSearch
          .trim()
          .toLowerCase();

      return conversations.filter(
        (conversation) => {
          if (
            filterMode === "unread" &&
            conversation.unread <= 0
          ) {
            return false;
          }

          if (
            filterMode === "open" &&
            conversation.closed
          ) {
            return false;
          }

          if (
            filterMode === "closed" &&
            !conversation.closed
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const person =
            conversation.account ||
            conversation.first ||
            conversation.last ||
            {};

          const name =
            conversation.accountName ||
            getPersonName(person);

          const contact =
            person.customerPhone ||
            person.phone ||
            person.customerEmail ||
            person.email ||
            "";

          const last =
            conversation.last?.message ||
            conversation.last?.text ||
            conversation.last?.content ||
            "";

          return `${name} ${contact} ${last}`
            .toLowerCase()
            .includes(query);
        }
      );
    }, [
      conversations,
      conversationSearch,
      filterMode,
    ]);

  const selected =
    conversations.find(
      (conversation) =>
        conversation.id === selectedId
    ) || null;

  const customer =
    selected?.first ||
    selected?.last ||
    {};

  const customerAccount =
    selected?.account || null;

  const findCustomerAccount = (
    conversationCustomer = {}
  ) => {
    const uid = String(
      conversationCustomer.userId ||
        conversationCustomer.uid ||
        conversationCustomer.customerId ||
        ""
    ).trim();

    const email = String(
      conversationCustomer.customerEmail ||
        conversationCustomer.email ||
        ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      conversationCustomer.customerPhone ||
        conversationCustomer.phone ||
        ""
    ).replace(/\D/g, "");

    return (
      safeArray(users).find((user) => {
        const ids = String(
          user.uid ||
            user.userId ||
            user.id ||
            ""
        ).trim();

        const userEmail = String(
          user.email || ""
        )
          .trim()
          .toLowerCase();

        const userPhone = String(
          user.phone || ""
        ).replace(/\D/g, "");

        return (
          (uid &&
            ids &&
            uid === ids) ||
          (email &&
            userEmail &&
            email === userEmail) ||
          (phone &&
            userPhone &&
            phone === userPhone)
        );
      }) || null
    );
  };

  const openCustomerAccount = () => {
    if (!customer || !onOpenCustomer) {
      return;
    }

    const account =
      customerAccount ||
      findCustomerAccount(customer);

    if (account) {
      onOpenCustomer(account);
      return;
    }

    onOpenCustomer({
      id:
        customer.userId ||
        customer.uid ||
        customer.customerId ||
        selected?.id ||
        `guest-${selected?.id || Date.now()}`,
      uid:
        customer.uid ||
        customer.userId ||
        "",
      guestId:
        customer.guestId || "",
      name:
        customer.customerName ||
        customer.name ||
        customer.displayName ||
        "عميل زائر",
      displayName:
        customer.displayName ||
        customer.customerName ||
        customer.name ||
        "عميل زائر",
      email:
        customer.customerEmail ||
        customer.email ||
        "",
      phone:
        customer.customerPhone ||
        customer.phone ||
        "",
      role: "guest",
      createdAt:
        customer.createdAt || null,
      lastLoginAt:
        customer.lastLoginAt || null,
      address:
        customer.address || null,
      governorate:
        customer.governorate || "",
      city:
        customer.city || "",
      village:
        customer.village ||
        customer.area ||
        "",
      detailedAddress:
        customer.detailedAddress ||
        customer.fullAddress ||
        "",
      blocked: false,
    });
  };

  const togglePin = (id) => {
    setPinned((previous) => {
      const next = previous.includes(id)
        ? previous.filter(
            (value) => value !== id
          )
        : [id, ...previous];

      try {
        localStorage.setItem(
          "sawa_support_pinned",
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  };

  const toggleClosed = (id) => {
    if (!id) return;

    setClosedIds((previous) => {
      const next = previous.includes(id)
        ? previous.filter(
            (value) => value !== id
          )
        : [id, ...previous];

      try {
        localStorage.setItem(
          "sawa_support_closed",
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  };

  const closeChatView = () => {
    setSelectedId(null);
    setDraft("");
    setAttachment(null);
  };

  const getLastSeenText = () => {
    if (!selected?.lastCustomerTime) {
      return "لم يرسل العميل رسالة بعد";
    }

    if (selected.active) {
      return "متصل الآن";
    }

    return `آخر ظهور ${dateText(
      selected.lastCustomer?.createdAt
    )}`;
  };

  const uploadSupportMedia = async (
    file
  ) => {
    if (!file) return null;

    if (
      file.size >
      20 * 1024 * 1024
    ) {
      throw new Error(
        "الحد الأقصى للملف 20MB"
      );
    }

    const form = new FormData();

    form.append("file", file);
    form.append(
      "upload_preset",
      "elsafty_store"
    );
    form.append(
      "folder",
      "sawa-support"
    );

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/wkcpvsqi/auto/upload",
      {
        method: "POST",
        body: form,
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.secure_url
    ) {
      throw new Error(
        data?.error?.message ||
          "فشل رفع الملف"
      );
    }

    return {
      url: data.secure_url,
      name:
        file.name ||
        "support-file",
      mime:
        file.type || "",
      bytes:
        file.size || 0,
      resourceType:
        data.resource_type ||
        "auto",
      duration:
        data.duration || null,
    };
  };

  const basePayload = () => ({
    conversationId:
      selected.id,
    userId:
      customer.userId ||
      customer.uid ||
      customer.customerId ||
      null,
    uid:
      customer.uid ||
      customer.userId ||
      null,
    guestId:
      customer.guestId || null,
    customerName:
      getPersonName(customer),
    customerEmail:
      customer.customerEmail ||
      customer.email ||
      "",
    customerPhone:
      customer.customerPhone ||
      customer.phone ||
      "",
    sender: "admin",
    senderRole: "admin",
    adminId:
      admin?.id || null,
    adminName:
      admin?.name ||
      "خدمة العملاء",
    readByAdmin: true,
    readByCustomer: false,
    deliveredToCustomer: false,
    createdAt:
      serverTimestamp(),
  });

  const sendReply = async (
    extra = {}
  ) => {
    const text =
      draft.trim();

    if (
      (!text &&
        !attachment &&
        !extra.locationUrl) ||
      !selected
    ) {
      return;
    }

    setSending(true);

    try {
      const media =
        attachment
          ? await uploadSupportMedia(
              attachment.file
            )
          : null;

      const messageType =
        extra.locationUrl
          ? "location"
          : media
          ? media.mime?.startsWith(
              "image/"
            )
            ? "image"
            : media.mime?.startsWith(
                "audio/"
              )
            ? "audio"
            : "file"
          : "text";

      await addDoc(
        collection(
          db,
          "supportMessages"
        ),
        {
          ...basePayload(),
          ...extra,
          message: text || "",
          text: text || "",
          messageType,
          attachmentUrl:
            media?.url || null,
          attachmentName:
            media?.name || null,
          attachmentMime:
            media?.mime || null,
          attachmentBytes:
            media?.bytes || null,
          attachmentResourceType:
            media?.resourceType ||
            null,
          attachmentDuration:
            media?.duration ||
            null,
        }
      );

      setDraft("");
      setAttachment(null);
    } catch (error) {
      console.error(
        "support reply",
        error
      );

      alert(
        error?.message ||
          "❌ تعذر إرسال الرد"
      );
    } finally {
      setSending(false);
    }
  };

  const handleFile = (event) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      file.size >
      20 * 1024 * 1024
    ) {
      alert(
        "الحد الأقصى للملف 20MB"
      );
      return;
    }

    setAttachment({
      file,
      isVoice: false,
    });
  };

  const sendLocation = () => {
    if (!selected || sending) {
      return;
    }

    if (!navigator.geolocation) {
      alert(
        "المتصفح لا يدعم تحديد الموقع."
      );
      return;
    }

    setSending(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setSending(false);

        await sendReply({
          location: {
            latitude,
            longitude,
          },
          latitude,
          longitude,
          locationUrl:
            `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
      },
      () => {
        setSending(false);

        alert(
          "مقدرناش نحدد موقع الجهاز. اسمح للموقع باستخدام Location وجرب تاني."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      alert(
        "المتصفح لا يدعم تسجيل الصوت."
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          { audio: true }
        );

      const mime = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ].find((type) =>
        MediaRecorder.isTypeSupported(
          type
        )
      ) || "";

      const recorder =
        new MediaRecorder(
          stream,
          mime
            ? { mimeType: mime }
            : undefined
        );

      chunksRef.current = [];
      recorderRef.current =
        recorder;

      setRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current =
        setInterval(
          () =>
            setRecordSeconds(
              (value) =>
                value + 1
            ),
          1000
        );

      recorder.ondataavailable =
        (event) => {
          if (event.data.size) {
            chunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onstop = () => {
        clearInterval(
          recordTimerRef.current
        );

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        setRecording(false);

        const blob = new Blob(
          chunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        const extension =
          (
            recorder.mimeType ||
            ""
          ).includes("ogg")
            ? "ogg"
            : "webm";

        setAttachment({
          file: new File(
            [blob],
            `voice-${Date.now()}.${extension}`,
            {
              type: blob.type,
            }
          ),
          isVoice: true,
        });
      };

      recorder.start();
    } catch (error) {
      console.error(error);

      alert(
        "اسمح للموقع باستخدام الميكروفون وجرب تاني."
      );
    }
  };

  useEffect(() => {
    return () => {
      try {
        clearInterval(
          recordTimerRef.current
        );
      } catch {}

      try {
        recorderRef.current?.stream
          ?.getTracks?.()
          .forEach((track) =>
            track.stop()
          );
      } catch {}
    };
  }, []);

  const handleComposerKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !sending &&
        (draft.trim() ||
          attachment)
      ) {
        sendReply();
      }
    }
  };

  const customerInitial =
    String(
      getPersonName(customer)
    )
      .trim()
      .slice(0, 1) || "ع";

  const previewFor = (
    conversation
  ) => {
    const last =
      conversation.last || {};

    if (
      last.deletedByCustomer ===
      true
    ) {
      return "🗑️ رسالة محذوفة";
    }

    if (isImage(last)) {
      return "🖼️ صورة";
    }

    if (isAudio(last)) {
      return "🎙️ رسالة صوتية";
    }

    if (isLocation(last)) {
      return "📍 موقع";
    }

    return (
      last.message ||
      last.text ||
      last.content ||
      "رسالة جديدة"
    );
  };

  const statusColor =
    selected?.active
      ? "#16A34A"
      : "#94A3B8";

  return (
    <section
      className="admin-card"
      style={{
        padding: 0,
        overflow: "hidden",
        border:
          "1px solid #DCE4EE",
        background: "#F4F7FA",
        borderRadius: 24,
        boxShadow:
          "0 18px 60px rgba(7,26,54,.08)",
      }}
    >
      <style>
        {`
          .sawa-support-root * {
            box-sizing: border-box;
          }

          .sawa-support-layout {
            display: grid;
            grid-template-columns: 340px minmax(0, 1fr);
            gap: 14px;
            padding: 14px;
          }

          .sawa-support-list {
            min-height: 680px;
          }

          .sawa-support-chat {
            min-height: 680px;
          }

          .sawa-support-message-list {
            min-height: 390px;
            max-height: 510px;
          }

          @media (max-width: 980px) {
            .sawa-support-layout {
              grid-template-columns: 1fr;
            }

            .sawa-support-list {
              min-height: 300px;
              max-height: 360px;
            }

            .sawa-support-chat {
              min-height: 620px;
            }

            .sawa-support-message-list {
              max-height: none;
            }
          }

          @media (max-width: 640px) {
            .sawa-support-layout {
              padding: 8px;
              gap: 8px;
            }

            .sawa-support-list {
              min-height: 280px;
              max-height: 330px;
            }

            .sawa-support-chat {
              min-height: 600px;
            }
          }

          .sawa-support-scroll {
            scrollbar-width: thin;
            scrollbar-color: #CBD5E1 transparent;
          }

          .sawa-support-scroll::-webkit-scrollbar {
            width: 7px;
          }

          .sawa-support-scroll::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 999px;
          }

          .sawa-support-chip {
            border: 1px solid #E2E8F0;
            background: #F8FAFC;
            color: #475569;
            border-radius: 999px;
            padding: 7px 10px;
            cursor: pointer;
            font: inherit;
            font-size: 10px;
            font-weight: 800;
            transition: .18s ease;
          }

          .sawa-support-chip:hover {
            border-color: #CBD5E1;
            transform: translateY(-1px);
          }

          .sawa-support-chip.active {
            background: #FFF8E6;
            border-color: #D4AF37;
            color: #806000;
          }

          .sawa-support-send {
            width: 46px;
            height: 46px;
            border: 0;
            border-radius: 14px;
            background: #071A36;
            color: #fff;
            cursor: pointer;
            font-size: 18px;
            box-shadow: 0 8px 20px rgba(7,26,54,.18);
            transition: .18s ease;
          }

          .sawa-support-send:hover {
            transform: translateY(-1px);
            background: #0B2548;
          }

          .sawa-support-send:disabled {
            opacity: .45;
            cursor: not-allowed;
            transform: none;
          }
        `}
      </style>

      <div
        className="sawa-support-root"
        dir="rtl"
      >
        <div
          style={{
            padding:
              "20px 22px",
            background:
              "linear-gradient(135deg,#06162F,#0B2548 58%,#153E69)",
            color: "#fff",
            position:
              "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width: 280,
              height: 280,
              borderRadius:
                "50%",
              background:
                "rgba(212,175,55,.10)",
              left: -110,
              top: -175,
            }}
          />

          <div
            style={{
              position:
                "relative",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 18,
              flexWrap:
                "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  display: "grid",
                  placeItems:
                    "center",
                  background:
                    "rgba(255,255,255,.10)",
                  border:
                    "1px solid rgba(255,255,255,.13)",
                  fontSize: 22,
                }}
              >
                💬
              </div>

              <div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 950,
                  }}
                >
                  خدمة العملاء
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color:
                      "rgba(255,255,255,.68)",
                    fontSize: 11,
                  }}
                >
                  Inbox بسيط وسريع — ترتيب واتساب
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 7,
                flexWrap:
                  "wrap",
              }}
            >
              <span
                style={{
                  padding:
                    "7px 10px",
                  borderRadius: 10,
                  background:
                    "rgba(255,255,255,.09)",
                  border:
                    "1px solid rgba(255,255,255,.10)",
                  fontSize: 10,
                  fontWeight: 850,
                }}
              >
                💬 {conversations.length} محادثة
              </span>

              <span
                style={{
                  padding:
                    "7px 10px",
                  borderRadius: 10,
                  background:
                    totalUnreadConversations
                      ? "rgba(212,175,55,.18)"
                      : "rgba(255,255,255,.09)",
                  border:
                    "1px solid rgba(212,175,55,.18)",
                  color:
                    totalUnreadConversations
                      ? "#F4D06F"
                      : "#fff",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                🔔 {totalUnread}
                رسالة غير مقروءة
              </span>

              <span
                style={{
                  padding:
                    "7px 10px",
                  borderRadius: 10,
                  background:
                    "rgba(255,255,255,.09)",
                  border:
                    "1px solid rgba(255,255,255,.10)",
                  fontSize: 10,
                  fontWeight: 850,
                }}
              >
                🟢 {openConversations}
                مفتوحة
              </span>

              <span
                style={{
                  padding:
                    "7px 10px",
                  borderRadius: 10,
                  background:
                    "rgba(255,255,255,.09)",
                  border:
                    "1px solid rgba(255,255,255,.10)",
                  fontSize: 10,
                  fontWeight: 850,
                }}
              >
                📦 {closedConversations}
                مغلقة
              </span>
            </div>
          </div>
        </div>

        <div className="sawa-support-layout">
          <aside
            className="sawa-support-list sawa-support-scroll"
            style={{
              border:
                "1px solid #E0E6EF",
              borderRadius: 19,
              background: "#fff",
              overflow:
                "hidden",
              display: "flex",
              flexDirection:
                "column",
            }}
          >
            <div
              style={{
                padding: 13,
                borderBottom:
                  "1px solid #EDF1F6",
              }}
            >
              <div
                style={{
                  position:
                    "relative",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    position:
                      "absolute",
                    right: 11,
                    top: 10,
                    color:
                      "#94A3B8",
                  }}
                >
                  ⌕
                </span>

                <input
                  value={
                    conversationSearch
                  }
                  onChange={(event) =>
                    setConversationSearch(
                      event.target.value
                    )
                  }
                  placeholder="ابحث عن عميل أو رسالة..."
                  style={{
                    width:
                      "100%",
                    height: 39,
                    boxSizing:
                      "border-box",
                    border:
                      "1px solid #E1E7EF",
                    borderRadius: 11,
                    padding:
                      "0 32px 0 10px",
                    outline:
                      "none",
                    background:
                      "#F8FAFC",
                    fontSize: 12,
                    fontFamily:
                      "inherit",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap:
                    "wrap",
                }}
              >
                {[
                  [
                    "all",
                    "الكل",
                    conversations.length,
                  ],
                  [
                    "unread",
                    "غير مقروء",
                    totalUnreadConversations,
                  ],
                  [
                    "open",
                    "مفتوحة",
                    openConversations,
                  ],
                  [
                    "closed",
                    "مغلقة",
                    closedConversations,
                  ],
                ].map(
                  (item) => (
                    <button
                      key={item[0]}
                      type="button"
                      className={`sawa-support-chip ${
                        filterMode === item[0]
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setFilterMode(
                          item[0]
                        )
                      }
                    >
                      {item[1]}
                      <span
                        style={{
                          opacity:
                            .55,
                          marginRight: 4,
                        }}
                      >
                        {item[2]}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              className="sawa-support-scroll"
              style={{
                flex: 1,
                overflowY:
                  "auto",
              }}
            >
              {filteredConversations.length ? (
                filteredConversations.map(
                  (conversation) => {
                    const person =
                      conversation.account ||
                      conversation.first ||
                      conversation.last ||
                      {};

                    const name =
                      conversation.accountName ||
                      getPersonName(
                        person
                      );

                    const active =
                      selectedId ===
                      conversation.id;

                    return (
                      <button
                        key={
                          conversation.id
                        }
                        type="button"
                        onClick={() => {
                          setSelectedId(
                            conversation.id
                          );

                          if (
                            conversation.hasUnread
                          ) {
                            markConversationRead(
                              conversation
                            );
                          }
                        }}
                        style={{
                          width:
                            "100%",
                          border: 0,
                          borderBottom:
                            "1px solid #F0F3F7",
                          background:
                            active
                              ? "linear-gradient(90deg,#F1F5F9,#FFFFFF)"
                              : "#fff",
                          padding:
                            "11px 12px",
                          textAlign:
                            "right",
                          cursor:
                            "pointer",
                          borderRight:
                            active
                              ? `3px solid ${ACCENT}`
                              : "3px solid transparent",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap: 10,
                            alignItems:
                              "center",
                          }}
                        >
                          <span
                            style={{
                              position:
                                "relative",
                              width: 43,
                              height: 43,
                              minWidth: 43,
                              borderRadius: 13,
                              display:
                                "grid",
                              placeItems:
                                "center",
                              background:
                                active
                                  ? "linear-gradient(135deg,#071A36,#153E69)"
                                  : "#EEF3F8",
                              color:
                                active
                                  ? "#fff"
                                  : PRIMARY,
                              fontWeight:
                                950,
                            }}
                          >
                            {String(
                              name
                            ).slice(
                              0,
                              1
                            )}

                            {conversation.active && (
                              <i
                                style={{
                                  position:
                                    "absolute",
                                  left: -2,
                                  bottom: -1,
                                  width: 10,
                                  height: 10,
                                  borderRadius:
                                    99,
                                  background:
                                    "#22C55E",
                                  border:
                                    "2px solid #fff",
                                }}
                              />
                            )}
                          </span>

                          <span
                            style={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 6,
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: 13,
                                  color:
                                    PRIMARY,
                                  whiteSpace:
                                    "nowrap",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                }}
                              >
                                {name}
                              </strong>

                              {conversation.pinned && (
                                <span
                                  title="محادثة مثبتة"
                                  style={{
                                    fontSize: 11,
                                  }}
                                >
                                  📌
                                </span>
                              )}

                              {conversation.closed && (
                                <span
                                  title="محادثة مغلقة"
                                  style={{
                                    fontSize: 10,
                                    color:
                                      "#94A3B8",
                                  }}
                                >
                                  • مغلقة
                                </span>
                              )}

                              {conversation.unread >
                                0 && (
                                <b
                                  style={{
                                    marginRight:
                                      "auto",
                                    minWidth: 20,
                                    height: 20,
                                    borderRadius: 7,
                                    display:
                                      "grid",
                                    placeItems:
                                      "center",
                                    background:
                                      ACCENT,
                                    color:
                                      PRIMARY,
                                    fontSize: 10,
                                  }}
                                >
                                  {
                                    conversation.unread
                                  }
                                </b>
                              )}
                            </span>

                            <small
                              style={{
                                display:
                                  "block",
                                color:
                                  conversation.unread
                                    ? "#334155"
                                    : "#94A3B8",
                                fontWeight:
                                  conversation.unread
                                    ? 750
                                    : 500,
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                marginTop: 5,
                              }}
                            >
                              {previewFor(
                                conversation
                              )}
                            </small>

                            <small
                              style={{
                                display:
                                  "block",
                                color:
                                  "#B0B8C5",
                                fontSize: 9,
                                marginTop: 4,
                              }}
                            >
                              {conversation.active
                                ? "متصل الآن"
                                : conversation.lastCustomer
                                ? `آخر ظهور: ${dateText(
                                    conversation
                                      .lastCustomer
                                      .createdAt
                                  )}`
                                : "—"}
                            </small>
                          </span>
                        </div>
                      </button>
                    );
                  }
                )
              ) : (
                <div
                  style={{
                    padding: 42,
                    textAlign:
                      "center",
                    color:
                      "#94A3B8",
                  }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      marginBottom: 10,
                    }}
                  >
                    💬
                  </div>

                  <strong
                    style={{
                      color:
                        PRIMARY,
                    }}
                  >
                    مفيش محادثات
                  </strong>

                  <p
                    style={{
                      fontSize: 11,
                      lineHeight: 1.7,
                    }}
                  >
                    جرّب تغيير البحث أو الفلتر.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main
            className="sawa-support-chat"
            style={{
              border:
                "1px solid #E0E6EF",
              borderRadius: 19,
              overflow:
                "hidden",
              display: "flex",
              flexDirection:
                "column",
              minWidth: 0,
              background:
                "#fff",
              boxShadow:
                "0 10px 35px rgba(15,23,42,.05)",
            }}
          >
            {selected ? (
              <>
                <div
                  style={{
                    padding:
                      "12px 15px",
                    borderBottom:
                      "1px solid #E9EEF4",
                    background:
                      "rgba(255,255,255,.98)",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        openCustomerAccount
                      }
                      title="فتح حساب العميل"
                      style={{
                        position:
                          "relative",
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        border: 0,
                        borderRadius: 13,
                        display:
                          "grid",
                        placeItems:
                          "center",
                        background:
                          "linear-gradient(135deg,#071A36,#153E69)",
                        color:
                          "#fff",
                        fontWeight:
                          950,
                        fontSize: 17,
                        cursor:
                          "pointer",
                      }}
                    >
                      {customerInitial}

                      {selected.active && (
                        <i
                          style={{
                            position:
                              "absolute",
                            left: -1,
                            bottom: -1,
                            width: 11,
                            height: 11,
                            borderRadius:
                              99,
                            background:
                              "#22C55E",
                            border:
                              "2px solid #fff",
                          }}
                        />
                      )}
                    </button>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={
                          openCustomerAccount
                        }
                        title="فتح حساب العميل بالكامل"
                        style={{
                          display:
                            "block",
                          maxWidth: 330,
                          border: 0,
                          padding: 0,
                          background:
                            "transparent",
                          color:
                            PRIMARY,
                          fontSize: 15,
                          fontWeight:
                            950,
                          whiteSpace:
                            "nowrap",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          cursor:
                            "pointer",
                          textAlign:
                            "right",
                        }}
                      >
                        {getPersonName(
                          customer
                        )}

                        <span
                          style={{
                            fontSize: 10,
                            color:
                              "#94A3B8",
                            fontWeight:
                              700,
                            marginRight: 5,
                          }}
                        >
                          ↗ الملف
                        </span>
                      </button>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 7,
                          color:
                            statusColor,
                          fontSize: 10,
                          marginTop: 4,
                        }}
                      >
                        <span>
                          {selected.active
                            ? "● متصل"
                            : "○ غير متصل"}
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          {getLastSeenText()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: 6,
                      alignItems:
                        "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        togglePin(
                          selected.id
                        )
                      }
                      title={
                        selected.pinned
                          ? "إلغاء التثبيت"
                          : "تثبيت المحادثة"
                      }
                      style={{
                        width: 36,
                        height: 35,
                        borderRadius: 10,
                        border:
                          selected.pinned
                            ? `1px solid ${ACCENT}`
                            : "1px solid #E1E7EF",
                        background:
                          selected.pinned
                            ? "#FFF8E6"
                            : "#F8FAFC",
                        cursor:
                          "pointer",
                      }}
                    >
                      {selected.pinned
                        ? "📌"
                        : "📍"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleClosed(
                          selected.id
                        )
                      }
                      title={
                        selected.closed
                          ? "إعادة فتح المحادثة"
                          : "إغلاق المحادثة"
                      }
                      style={{
                        width: 36,
                        height: 35,
                        borderRadius: 10,
                        border:
                          selected.closed
                            ? "1px solid #86EFAC"
                            : "1px solid #E1E7EF",
                        background:
                          selected.closed
                            ? "#F0FDF4"
                            : "#F8FAFC",
                        color:
                          selected.closed
                            ? "#15803D"
                            : PRIMARY,
                        cursor:
                          "pointer",
                        fontSize: 15,
                      }}
                    >
                      {selected.closed
                        ? "↗"
                        : "✓"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        closeChatView
                      }
                      title="إخفاء المحادثة"
                      aria-label="إخفاء المحادثة"
                      style={{
                        width: 36,
                        height: 35,
                        borderRadius: 10,
                        border:
                          "1px solid #E1E7EF",
                        background:
                          "#F8FAFC",
                        color:
                          "#64748B",
                        cursor:
                          "pointer",
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  className="sawa-support-message-list sawa-support-scroll"
                  style={{
                    flex: 1,
                    overflowY:
                      "auto",
                    padding:
                      "20px 17px",
                    background:
                      "radial-gradient(circle at 12% 8%,rgba(212,175,55,.07),transparent 24%),linear-gradient(180deg,#F8FAFC,#F2F5F9)",
                  }}
                >
                  <div
                    style={{
                      textAlign:
                        "center",
                      marginBottom:
                        17,
                    }}
                  >
                    <span
                      style={{
                        display:
                          "inline-block",
                        padding:
                          "6px 11px",
                        borderRadius:
                          999,
                        background:
                          "rgba(255,255,255,.9)",
                        border:
                          "1px solid #E5EAF0",
                        color:
                          "#94A3B8",
                        fontSize: 10,
                        fontWeight:
                          800,
                      }}
                    >
                      بداية المحادثة
                    </span>
                  </div>

                  {(selected.messages ||
                    []).map(
                    (
                      message,
                      index
                    ) => {
                      const adminMessage =
                        isAdminMessage(
                          message
                        );

                      const deletedByCustomer =
                        message.deletedByCustomer ===
                          true &&
                        !adminMessage;

                      const url =
                        getMediaUrl(
                          message
                        );

                      return (
                        <div
                          key={
                            message.id ||
                            index
                          }
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              adminMessage
                                ? "flex-start"
                                : "flex-end",
                            marginBottom:
                              10,
                          }}
                        >
                          <div
                            style={{
                              maxWidth:
                                "min(76%, 540px)",
                              minWidth: 90,
                            }}
                          >
                            <div
                              style={{
                                padding:
                                  "9px 11px",
                                borderRadius:
                                  adminMessage
                                    ? "17px 17px 17px 5px"
                                    : "17px 17px 5px 17px",
                                background:
                                  adminMessage
                                    ? "linear-gradient(135deg,#071A36,#123C69)"
                                    : "#fff",
                                color:
                                  adminMessage
                                    ? "#fff"
                                    : PRIMARY,
                                boxShadow:
                                  adminMessage
                                    ? "0 7px 20px rgba(7,26,54,.14)"
                                    : "0 5px 18px rgba(15,23,42,.07)",
                                border:
                                  adminMessage
                                    ? "1px solid rgba(255,255,255,.05)"
                                    : "1px solid #E5EAF0",
                              }}
                            >
                              {isImage(
                                message
                              ) && (
                                <a
                                  href={
                                    url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display:
                                      "block",
                                    marginBottom:
                                      message.message
                                        ? 8
                                        : 0,
                                  }}
                                >
                                  <img
                                    src={
                                      url
                                    }
                                    alt={
                                      message.attachmentName ||
                                      "صورة"
                                    }
                                    loading="lazy"
                                    style={{
                                      display:
                                        "block",
                                      width:
                                        "100%",
                                      maxWidth:
                                        370,
                                      maxHeight:
                                        290,
                                      objectFit:
                                        "cover",
                                      borderRadius:
                                        13,
                                      background:
                                        "#EEF2F7",
                                    }}
                                  />
                                </a>
                              )}

                              {isAudio(
                                message
                              ) && (
                                <div
                                  style={{
                                    padding:
                                      7,
                                    borderRadius:
                                      12,
                                    background:
                                      adminMessage
                                        ? "rgba(255,255,255,.08)"
                                        : "#F7F9FC",
                                    marginBottom:
                                      message.message
                                        ? 8
                                        : 0,
                                  }}
                                >
                                  <audio
                                    controls
                                    src={
                                      url
                                    }
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        38,
                                    }}
                                  />
                                </div>
                              )}

                              {isLocation(
                                message
                              ) && (
                                <a
                                  href={
                                    message.locationUrl ||
                                    url ||
                                    `https://www.google.com/maps?q=${message.latitude},${message.longitude}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap: 10,
                                    padding:
                                      "10px 11px",
                                    marginBottom:
                                      message.message
                                        ? 8
                                        : 0,
                                    borderRadius:
                                      13,
                                    textDecoration:
                                      "none",
                                    background:
                                      adminMessage
                                        ? "rgba(255,255,255,.10)"
                                        : "#F7FAFC",
                                    color:
                                      adminMessage
                                        ? "#fff"
                                        : PRIMARY,
                                    border:
                                      adminMessage
                                        ? "1px solid rgba(255,255,255,.12)"
                                        : "1px solid #E3EAF2",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize:
                                        24,
                                    }}
                                  >
                                    📍
                                  </span>

                                  <span>
                                    <strong
                                      style={{
                                        display:
                                          "block",
                                        fontSize:
                                          12,
                                      }}
                                    >
                                      موقع جغرافي
                                    </strong>

                                    <small
                                      style={{
                                        opacity:
                                          .65,
                                        fontSize:
                                          9,
                                      }}
                                    >
                                      فتح الموقع على Google Maps
                                    </small>
                                  </span>
                                </a>
                              )}

                              {!isImage(
                                message
                              ) &&
                                !isAudio(
                                  message
                                ) &&
                                !isLocation(
                                  message
                                ) &&
                                message.attachmentUrl && (
                                  <a
                                    href={
                                      url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap: 9,
                                      padding:
                                        10,
                                      marginBottom:
                                        message.message
                                          ? 8
                                          : 0,
                                      borderRadius:
                                        12,
                                      background:
                                        adminMessage
                                          ? "rgba(255,255,255,.08)"
                                          : "#F7F9FC",
                                      color:
                                        adminMessage
                                          ? "#fff"
                                          : PRIMARY,
                                      textDecoration:
                                        "none",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize:
                                          20,
                                      }}
                                    >
                                      📎
                                    </span>

                                    <span
                                      style={{
                                        minWidth:
                                          0,
                                      }}
                                    >
                                      <strong
                                        style={{
                                          display:
                                            "block",
                                          fontSize:
                                            11,
                                          overflow:
                                            "hidden",
                                          textOverflow:
                                            "ellipsis",
                                          whiteSpace:
                                            "nowrap",
                                        }}
                                      >
                                        {message.attachmentName ||
                                          "ملف مرفق"}
                                      </strong>

                                      <small
                                        style={{
                                          opacity:
                                            .65,
                                          fontSize:
                                            9,
                                        }}
                                      >
                                        فتح / معاينة الملف
                                      </small>
                                    </span>
                                  </a>
                                )}

                              {message.message && (
                                <div
                                  style={{
                                    whiteSpace:
                                      "pre-wrap",
                                    lineHeight:
                                      1.7,
                                    fontSize:
                                      13,
                                  }}
                                >
                                  {
                                    message.message
                                  }
                                </div>
                              )}

                              {deletedByCustomer && (
                                <div
                                  style={{
                                    marginTop:
                                      message.message
                                        ? 8
                                        : 0,
                                    padding:
                                      "8px 10px",
                                    borderRadius:
                                      10,
                                    background:
                                      "#FFF7E6",
                                    color:
                                      "#946200",
                                    fontSize:
                                      11,
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  🗑️ تم حذف الرسالة بواسطة العميل — المحتوى محفوظ
                                </div>
                              )}

                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "flex-end",
                                  alignItems:
                                    "center",
                                  gap: 5,
                                  marginTop:
                                    6,
                                  fontSize:
                                    9,
                                  opacity:
                                    .58,
                                }}
                              >
                                {adminMessage && (
                                  <span>
                                    أنت
                                  </span>
                                )}

                                <span>
                                  {dateText(
                                    message.createdAt
                                  )}
                                </span>

                                {adminMessage && (
                                  <span
                                    title={
                                      message.readByCustomer ===
                                      true
                                        ? "تمت مشاهدة الرسالة"
                                        : message.deliveredToCustomer ===
                                          true
                                        ? "وصلت للعميل"
                                        : "تم إرسال الرسالة"
                                    }
                                    style={{
                                      color:
                                        message.readByCustomer ===
                                        true
                                          ? "#60A5FA"
                                          : "#94A3B8",
                                      fontWeight:
                                        950,
                                      letterSpacing:
                                        -2,
                                    }}
                                  >
                                    ✓
                                    {message.deliveredToCustomer ===
                                      true ||
                                    message.readByCustomer ===
                                      true
                                      ? "✓"
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                  <div
                    ref={
                      messagesEndRef
                    }
                  />
                </div>

                <div
                  style={{
                    padding: 12,
                    borderTop:
                      "1px solid #E8EDF4",
                    background:
                      "#fff",
                  }}
                >
                  {selected.closed && (
                    <div
                      style={{
                        marginBottom:
                          9,
                        padding:
                          "9px 11px",
                        borderRadius:
                          11,
                        background:
                          "#F8FAFC",
                        border:
                          "1px solid #E2E8F0",
                        color:
                          "#64748B",
                        fontSize: 11,
                        fontWeight:
                          800,
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: 10,
                      }}
                    >
                      <span>
                        🔒 المحادثة مغلقة
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleClosed(
                            selected.id
                          )
                        }
                        style={{
                          border: 0,
                          background:
                            "transparent",
                          color:
                            "#806000",
                          fontWeight:
                            900,
                          cursor:
                            "pointer",
                        }}
                      >
                        إعادة فتح
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    onChange={
                      handleFile
                    }
                  />

                  {attachment && (
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 9,
                        marginBottom:
                          8,
                        padding:
                          "8px 10px",
                        borderRadius:
                          12,
                        background:
                          "#F7F9FC",
                        border:
                          "1px solid #E4EAF2",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          background:
                            "#EAF1FA",
                        }}
                      >
                        {attachment.isVoice
                          ? "🎙️"
                          : "📎"}
                      </span>

                      <span
                        style={{
                          flex: 1,
                          fontSize: 12,
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                          color:
                            "#475569",
                        }}
                      >
                        {
                          attachment
                            .file
                            ?.name
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setAttachment(
                            null
                          )
                        }
                        style={{
                          border: 0,
                          background:
                            "#E5EAF0",
                          color:
                            "#64748B",
                          borderRadius: 8,
                          width: 28,
                          height: 28,
                          cursor:
                            "pointer",
                          fontSize:
                            17,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      display:
                        "flex",
                      gap: 7,
                      alignItems:
                        "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        fileRef.current?.click()
                      }
                      disabled={
                        sending ||
                        recording ||
                        selected.closed
                      }
                      title="إرسال صورة أو ملف"
                      style={{
                        width: 42,
                        height: 46,
                        border:
                          "1px solid #E2E8F0",
                        borderRadius: 12,
                        background:
                          "#F8FAFC",
                        color:
                          PRIMARY,
                        cursor:
                          "pointer",
                        fontSize: 18,
                        opacity:
                          selected.closed
                            ? .45
                            : 1,
                      }}
                    >
                      📎
                    </button>

                    <button
                      type="button"
                      onClick={
                        sendLocation
                      }
                      disabled={
                        sending ||
                        recording ||
                        selected.closed
                      }
                      title="إرسال الموقع"
                      style={{
                        width: 42,
                        height: 46,
                        border:
                          "1px solid #E2E8F0",
                        borderRadius: 12,
                        background:
                          "#F8FAFC",
                        color:
                          PRIMARY,
                        cursor:
                          "pointer",
                        fontSize: 18,
                        opacity:
                          selected.closed
                            ? .45
                            : 1,
                      }}
                    >
                      📍
                    </button>

                    <button
                      type="button"
                      onClick={
                        toggleRecording
                      }
                      disabled={
                        sending ||
                        selected.closed
                      }
                      title={
                        recording
                          ? "إيقاف التسجيل"
                          : "رسالة صوتية"
                      }
                      style={{
                        width: 42,
                        height: 46,
                        border:
                          recording
                            ? "1px solid #EF4444"
                            : "1px solid #E2E8F0",
                        borderRadius: 12,
                        background:
                          recording
                            ? "#FEF2F2"
                            : "#F8FAFC",
                        color:
                          recording
                            ? "#DC2626"
                            : PRIMARY,
                        cursor:
                          "pointer",
                        fontSize: 18,
                      }}
                    >
                      {recording
                        ? `⏹ ${recordSeconds}s`
                        : "🎙️"}
                    </button>

                    <textarea
                      value={draft}
                      onChange={(event) =>
                        setDraft(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleComposerKeyDown
                      }
                      disabled={
                        sending ||
                        selected.closed
                      }
                      placeholder={
                        selected.closed
                          ? "المحادثة مغلقة — أعد فتحها للرد"
                          : "اكتب رسالة..."
                      }
                      rows={1}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 46,
                        maxHeight: 120,
                        resize:
                          "vertical",
                        border:
                          "1px solid #E2E8F0",
                        borderRadius:
                          14,
                        outline:
                          "none",
                        padding:
                          "12px 13px",
                        background:
                          selected.closed
                            ? "#F1F5F9"
                            : "#fff",
                        color:
                          PRIMARY,
                        fontFamily:
                          "inherit",
                        fontSize:
                          13,
                        lineHeight:
                          1.6,
                      }}
                    />

                    <button
                      type="button"
                      className="sawa-support-send"
                      onClick={() =>
                        sendReply()
                      }
                      disabled={
                        sending ||
                        selected.closed ||
                        (!draft.trim() &&
                          !attachment)
                      }
                      title="إرسال"
                    >
                      {sending
                        ? "…"
                        : "➤"}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: 10,
                      color:
                        "#A0AABD",
                      fontSize: 9,
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <span>
                      📎 ملفات وصور حتى 20MB • 📍 موقع • 🎙️ صوت
                    </span>

                    <span>
                      Enter إرسال • Shift + Enter سطر جديد
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: 680,
                  display:
                    "grid",
                  placeItems:
                    "center",
                  padding: 30,
                  textAlign:
                    "center",
                  background:
                    "linear-gradient(180deg,#FBFCFE,#F5F7FA)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: 78,
                      height: 78,
                      borderRadius: 26,
                      margin:
                        "0 auto 14px",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      background:
                        "#EEF3F8",
                      fontSize: 34,
                    }}
                  >
                    💬
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      color:
                        PRIMARY,
                    }}
                  >
                    اختار محادثة
                  </h3>

                  <p
                    style={{
                      color:
                        "#94A3B8",
                      fontSize: 12,
                      marginTop: 7,
                    }}
                  >
                    اختار عميل من القائمة عشان تفتح الشات.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}

function CustomerDetailsModal({ user, orders, favorites, support, activityLogs, notifications, onClose, onToggleBlock }) {
  const [view, setView] = useState("overview");
  const uid = user?.id;
  const email = normalize(user?.email);
  const phone = normalize(user?.phone);
  const matchesUser = (item = {}) => {
    const ids = [item.userId, item.uid, item.customerId, item.customerUid, item.user?.id, item.user?.uid].filter(Boolean).map(String);
    const emails = [item.email, item.customerEmail, item.user?.email].filter(Boolean).map(normalize);
    const phones = [item.phone, item.customerPhone, item.user?.phone].filter(Boolean).map(normalize);
    return ids.includes(String(uid)) || (email && emails.includes(email)) || (phone && phones.includes(phone));
  };
  const userOrders = safeArray(orders).filter(o => matchesUser(o) || (email && normalize(o.email) === email) || (phone && normalize(o.phone) === phone) || String(o.userId || "") === String(uid));
  const userFavorites = safeArray(favorites).filter(matchesUser);
  const userSupport = safeArray(support).filter(matchesUser);
  const userNotifications = safeArray(notifications).filter(matchesUser);
  const userActivity = safeArray(activityLogs).filter(a => matchesUser(a) || normalize(a.userEmail) === email || String(a.userId || "") === String(uid));
  const totalSpent = userOrders.filter(o => o.status !== "cancelled").reduce((sum,o)=>sum+asNumber(o.total ?? o.finalTotal),0);
  const addresses = [...new Map(userOrders.map(o => {
    const raw = o.address || o.shippingAddress || o.deliveryAddress || [o.governorate,o.city,o.village,o.detailedAddress].filter(Boolean).join(" - ");
    const a = raw && typeof raw === "object" ? [raw.governorate, raw.city, raw.village, raw.area, raw.details, raw.address].filter(Boolean).join(" - ") : raw;
    return [String(a||""),a];
  }).filter(([k])=>k)).values()];
  const lastOrder = userOrders.slice().sort((a,b)=>new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0)-new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0))[0];
  const info = [
    ["الاسم", user.name || user.displayName || "—"], ["البريد الإلكتروني", user.email || "—"], ["الهاتف", user.phone || "—"],
    ["المحافظة", user.governorate || user.address?.governorate || "—"], ["المدينة", user.city || user.address?.city || "—"],
    ["القرية / المنطقة", user.village || user.area || user.address?.village || "—"], ["العنوان التفصيلي", user.detailedAddress || user.fullAddress || user.address?.details || user.address || "—"],
    ["تاريخ التسجيل", dateText(user.createdAt || user.registeredAt)], ["آخر تحديث", dateText(user.updatedAt)], ["آخر دخول", dateText(user.lastLoginAt || user.lastLogin || user.loginAt)],
    ["الحالة", user.blocked ? "🔴 محظور" : "🟢 نشط"], ["الدور", user.role || "عميل"],
  ];
  const tabs = [["overview","نظرة عامة"],["orders","الطلبات"],["activity","النشاط"],["favorites","المفضلة"],["support","خدمة العملاء"],["notifications","الإشعارات"]];
  return <Modal title={`ملف العميل: ${user.name || user.email || "عميل"}`} onClose={onClose}>
    <div style={{display:"flex",gap:14,alignItems:"center",padding:16,borderRadius:18,background:"linear-gradient(135deg,#071A36,#0B1F3A)",color:"#fff",marginBottom:16}}>
      <div className="large-avatar" style={{margin:0}}>{String(user.name||"ع").slice(0,1)}</div><div style={{flex:1}}><h3 style={{margin:"0 0 4px"}}>{user.name||"عميل"}</h3><div style={{opacity:.8}}>{user.email||user.phone||"بدون بيانات اتصال"}</div></div><span className={user.blocked?"status-inactive":"status-active"}>{user.blocked?"🔴 محظور":"🟢 نشط"}</span>
    </div>
    <div className="table-actions" style={{marginBottom:16,flexWrap:"wrap"}}>{tabs.map(([id,label])=><button type="button" key={id} className={view===id?"edit-btn":"ghost-btn"} onClick={()=>setView(id)}>{label}</button>)}</div>
    {view === "overview" && <><div className="dashboard-grid"><div className="admin-stat-card"><span className="stat-label">إجمالي الطلبات</span><strong>{userOrders.length}</strong></div><div className="admin-stat-card"><span className="stat-label">إجمالي المشتريات</span><strong>{money(totalSpent)}</strong></div><div className="admin-stat-card"><span className="stat-label">المفضلة</span><strong>{userFavorites.length}</strong></div><div className="admin-stat-card"><span className="stat-label">رسائل الدعم</span><strong>{userSupport.length}</strong></div></div><div className="details-grid">{info.map(([label,value])=><Info key={label} label={label} value={value}/>)}</div>{addresses.length>0&&<><h3>📍 العناوين المستخدمة</h3><div className="order-items">{addresses.map((a,i)=><div key={i}><span>{a}</span></div>)}</div></>}{lastOrder&&<><h3>🛒 آخر طلب</h3><div className="order-items"><div><span>{lastOrder.orderNumber||lastOrder.id}</span><strong>{money(lastOrder.total??lastOrder.finalTotal)}</strong></div><div><span>{dateText(lastOrder.createdAt)}</span><strong>{lastOrder.status||"pending"}</strong></div></div></>}</>}
    {view === "orders" && <div className="table-scroll"><table className="admin-table"><thead><tr><th>الطلب</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{userOrders.length?userOrders.map(o=><tr key={o.id}><td>{o.orderNumber||o.id.slice(0,8)}</td><td>{dateText(o.createdAt)}</td><td>{money(o.total??o.finalTotal)}</td><td>{o.status||"pending"}</td></tr>):<tr><td colSpan="4">لا توجد طلبات مرتبطة بالعميل.</td></tr>}</tbody></table></div>}
    {view === "activity" && <div className="table-scroll"><table className="admin-table"><thead><tr><th>النشاط</th><th>التفاصيل</th><th>التاريخ</th></tr></thead><tbody>{userActivity.length?userActivity.slice().sort((a,b)=>dateText(b.createdAt).localeCompare(dateText(a.createdAt))).map((a,i)=><tr key={a.id||i}><td>{a.action||a.type||"نشاط"}</td><td>{a.details||a.message||a.description||"—"}</td><td>{dateText(a.createdAt)}</td></tr>):<tr><td colSpan="3">لا يوجد سجل نشاط مرتبط بهذا العميل.</td></tr>}</tbody></table></div>}
    {view === "favorites" && <div className="order-items">{userFavorites.length?userFavorites.map((f,i)=><div key={f.id||i}><span>{f.title||f.productName||f.productId||f.name||"منتج"}</span><strong>{money(f.price)}</strong></div>):<div><span>لا توجد منتجات في المفضلة.</span></div>}</div>}
    {view === "support" && <div className="order-items">{userSupport.length?userSupport.map((m,i)=><div key={m.id||i} style={{display:"block"}}><strong>{m.subject||m.title||"رسالة دعم"}</strong><p style={{margin:"6px 0"}}>{m.message||m.text||m.content||"—"}</p><small>{dateText(m.createdAt)}</small></div>):<div><span>لا توجد رسائل خدمة عملاء.</span></div>}</div>}
    {view === "notifications" && <div className="order-items">{userNotifications.length?userNotifications.map((n,i)=><div key={n.id||i}><span>{n.title||n.message||n.text||"إشعار"}</span><small>{dateText(n.createdAt)}</small></div>):<div><span>لا توجد إشعارات مرتبطة بالعميل.</span></div>}</div>}
    <div className="form-actions"><button type="button" className="cancel-btn" onClick={()=>onToggleBlock(user)}>{user.blocked?"✅ إلغاء الحظر":"🚫 حظر العميل"}</button>{user.phone&&<a className="whatsapp-btn" href={`https://wa.me/${String(user.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer">واتساب العميل</a>}<button type="button" className="ghost-btn" onClick={onClose}>إغلاق</button></div>
  </Modal>;
}

function GamesPanel({gamesSettings,setGamesSettings,saveGames,saving}) {
  const defs=[["wheel","🎡","عجلة الحظ"],["cards","🃏","الكروت المقلوبة"],["scratch","🪙","اكشط واربح"],["mystery","🎁","الصناديق الغامضة"],["pick","🎯","اختار واربح"],["dice","🎲","النرد الرابح"]];
  const setGame=(key,patch)=>setGamesSettings(p=>({...p,[key]:{...p[key],...patch}}));
  const addPrize=(key)=>setGame(key,{prizes:[...safeArray(gamesSettings[key]?.prizes),{title:"جائزة جديدة",type:"discount",value:10,probability:10,color:ACCENT,enabled:true}]});
  const updatePrize=(key,i,patch)=>setGame(key,{prizes:safeArray(gamesSettings[key]?.prizes).map((x,n)=>n===i?{...x,...patch}:x)});
  const deletePrize=(key,i)=>setGame(key,{prizes:safeArray(gamesSettings[key]?.prizes).filter((_,n)=>n!==i)});
  return <section className="admin-card"><div className="section-header"><div><h2>🎮 الألعاب والمسابقات</h2><p>كل الألعاب مفعلة من نفس لوحة التحكم مع تحكم كامل في التصميم والجوائز والمحاولات والمواعيد.</p></div></div><div className="games-grid">{defs.map(([key,icon,label])=>{const g=gamesSettings[key]||defaultGamesSettings[key];return <div className="game-admin-card" key={key}><div className="game-admin-head"><h3>{icon} {label}</h3><label className="admin-checkbox"><input type="checkbox" checked={g.enabled!==false} onChange={e=>setGame(key,{enabled:e.target.checked})}/><span>مفعل</span></label></div><div className="form-grid"><label><span>اسم اللعبة</span><input value={g.title||""} onChange={e=>setGame(key,{title:e.target.value})}/></label><label><span>الوصف</span><input value={g.description||""} onChange={e=>setGame(key,{description:e.target.value})}/></label><label><span>المحاولات لكل مستخدم</span><input type="number" min="1" value={g.attemptsPerUser??2} onChange={e=>setGame(key,{attemptsPerUser:Math.max(1,asNumber(e.target.value,2))})}/></label><label className="admin-checkbox"><input type="checkbox" checked={g.requireLogin===true} onChange={e=>setGame(key,{requireLogin:e.target.checked})}/><span>يتطلب تسجيل الدخول</span></label><label><span>تاريخ البداية</span><input type="datetime-local" value={g.startDate||""} onChange={e=>setGame(key,{startDate:e.target.value})}/></label><label><span>تاريخ النهاية</span><input type="datetime-local" value={g.endDate||""} onChange={e=>setGame(key,{endDate:e.target.value})}/></label><label><span>حد الفائزين 0 = بدون حد</span><input type="number" min="0" value={g.winnerLimit??0} onChange={e=>setGame(key,{winnerLimit:asNumber(e.target.value)})}/></label><label className="form-group-full"><span>رسالة الفوز</span><textarea rows="2" value={g.winnerMessage||""} onChange={e=>setGame(key,{winnerMessage:e.target.value})}/></label></div><div className="section-header nested"><div><h4>🎁 الجوائز</h4></div><button type="button" className="add-btn" onClick={()=>addPrize(key)}>＋ إضافة جائزة</button></div><div className="prizes-grid">{safeArray(g.prizes).map((p,i)=><div className="prize-card" key={`${key}-${i}`}><label><span>اسم الجائزة</span><input value={p.title||""} onChange={e=>updatePrize(key,i,{title:e.target.value})}/></label><label><span>النوع</span><select value={p.type||"discount"} onChange={e=>updatePrize(key,i,{type:e.target.value})}><option value="discount">نسبة خصم</option><option value="fixed">خصم مبلغ</option><option value="free-shipping">شحن مجاني</option><option value="gift">هدية</option><option value="nothing">حظ أوفر</option></select></label><label><span>القيمة</span><input type="number" min="0" value={p.value??0} onChange={e=>updatePrize(key,i,{value:asNumber(e.target.value)})}/></label><label><span>احتمال الفوز %</span><input type="number" min="0" max="100" step="0.01" value={p.probability??10} onChange={e=>updatePrize(key,i,{probability:Math.min(100,Math.max(0,asNumber(e.target.value,10)))})}/></label><ColorField name={`gamePrizeColor-${key}-${i}`} label="اللون" value={p.color || ACCENT} onChange={e=>updatePrize(key,i,{color:e.target.value})}/><label className="admin-checkbox"><input type="checkbox" checked={p.enabled!==false} onChange={e=>updatePrize(key,i,{enabled:e.target.checked})}/><span>الجائزة متاحة</span></label><button type="button" className="delete-btn" onClick={()=>deletePrize(key,i)}>🗑️ حذف</button></div>)}</div></div>})}</div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveGames}>{saving?"⏳ جاري الحفظ...":"💾 حفظ جميع الألعاب"}</button></div></section>
}

function ProductFlagSection({ title, flag, products, setTab }) {
  const items = products.filter(p=>p[flag]===true);
  return <section className="admin-card"><div className="section-header"><div><h2>{title}</h2><p>المنتجات المحددة لهذا القسم: {items.length}</p></div><button type="button" className="ghost-btn" onClick={()=>setTab("products")}>إدارة المنتجات</button></div>{items.length===0?<div className="empty-state"><div>📦</div><h3>لا توجد منتجات</h3><p>فعّل هذا التصنيف من داخل نموذج المنتج.</p></div>:<div className="cards-grid">{items.map(p=><div className="mini-product" key={p.id}>{p.image?<img src={p.image} alt=""/>:<div>📦</div>}<strong>{p.title}</strong><span>{money(p.price)}</span></div>)}</div>}</section>;
}

function SettingsPanel({ storeSettings, setStoreSettings, saveSettings, saving }) {
  const theme = storeSettings.theme || defaultTheme;
  const setTheme = (key,value)=>setStoreSettings(p=>({...p,theme:{...defaultTheme,...p.theme,[key]:value}}));
  const text = storeSettings.texts || defaultStoreSettings.texts;
  const setText = (key,value)=>setStoreSettings(p=>({...p,texts:{...defaultStoreSettings.texts,...p.texts,[key]:value}}));
  const colors = [["primary","اللون الأساسي"],["secondary","اللون الثانوي"],["accent","اللون المميز"],["pageBackground","خلفية الموقع"],["cardBackground","خلفية البطاقات"],["textPrimary","لون النص الرئيسي"],["textSecondary","لون النص الثانوي"],["border","لون الحدود"],["buttonBackground","خلفية الأزرار"],["buttonText","نص الأزرار"],["navbarBackground","خلفية الشريط الرئيسي"],["headerBackground","لون الهيدر"],["navbarText","نص الشريط الرئيسي"],["categoryBarBackground","خلفية شريط الأقسام"],["categoryBarText","نص شريط الأقسام"],["topStripBackground","خلفية الشريط المتحرك"],["topStripText","نص الشريط المتحرك"],["footerBackground","خلفية الفوتر"],["footerText","نص الفوتر"],["footerBrand","لون اسم المتجر في الفوتر"],["footerButtonBackground","زر الفوتر"],["footerButtonText","نص زر الفوتر"],["headingColor","العناوين"],["linkColor","الروابط"],["priceColor","الأسعار"],["saleColor","لون الخصم"],["successColor","لون النجاح"],["warningColor","لون التنبيه"],["errorColor","لون الخطأ"],["inputBackground","خلفية الحقول"]];
  return <section className="admin-card"><div className="section-header"><div><h2>🎨 مظهر المتجر وإعداداته</h2><p>تحكم كامل في الهوية والألوان والنصوص والأشرطة.</p></div></div><div className="settings-tabs"><div className="settings-block"><h3>🏪 البيانات الأساسية</h3><div className="form-grid"><label><span>اسم المتجر</span><input value={storeSettings.storeName||""} onChange={e=>setStoreSettings(p=>({...p,storeName:e.target.value}))}/></label><label><span>لوجو المتجر — رفع ملف</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0]||null;setStoreSettings(p=>({...p,logoFile:file}));}}/><small style={{display:"block",marginTop:6,color:"#64748B"}}>JPG / JPEG / PNG / WEBP — بحد أقصى 5MB</small>{storeSettings.logoFile ? <small style={{display:"block",marginTop:4,color:"#16803C"}}>📥 {storeSettings.logoFile.name} جاهز للرفع</small> : null}{storeSettings.logo ? <img src={storeSettings.logo} alt="Logo preview" style={{display:"block",marginTop:10,maxWidth:180,maxHeight:80,objectFit:"contain",borderRadius:10,border:"1px solid #D9DFE8",padding:6,background:"#fff"}} /> : null}</label><label className="form-group-full"><span>الإعلان الافتراضي</span><textarea rows="3" value={storeSettings.announcement||""} onChange={e=>setStoreSettings(p=>({...p,announcement:e.target.value}))}/></label></div></div><div className="settings-block"><h3>🎨 جميع ألوان الموقع</h3><div className="color-grid">{colors.map(([k,l])=><ColorField key={k} name={k} label={l} value={theme[k]} onChange={e=>setTheme(k,e.target.value)} />)}</div></div><div className="settings-block"><h3>📝 نصوص الموقع</h3><div className="form-grid">{Object.entries(text).map(([k,v])=><label key={k}><span>{textLabel(k)}</span><input value={v||""} onChange={e=>setText(k,e.target.value)}/></label>)}</div></div><div className="settings-block"><h3>📢 الشريط المتحرك الافتراضي</h3><div className="form-grid"><label className="admin-checkbox"><input type="checkbox" checked={storeSettings.topStrip?.enabled!==false} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,enabled:e.target.checked}}))}/><span>إظهار الشريط</span></label><label><span>الاتجاه</span><select value={storeSettings.topStrip?.direction||"rtl"} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,direction:e.target.value}}))}><option value="rtl">يمين ← يسار</option><option value="ltr">يسار ← يمين</option></select></label><label><span>السرعة</span><input type="number" min="1" value={storeSettings.topStrip?.speed??40} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,speed:asNumber(e.target.value,40)}}))}/></label><label><span>الارتفاع</span><input type="number" min="20" value={storeSettings.topStrip?.height??42} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,height:asNumber(e.target.value,42)}}))}/></label><label><span>حجم الخط</span><input type="number" min="8" value={storeSettings.topStrip?.fontSize??15} onChange={e=>setStoreSettings(p=>({...p,topStrip:{...p.topStrip,fontSize:asNumber(e.target.value,15)}}))}/></label></div></div><div className="settings-block">
<h3>📌 الإعلان الثابت فوق الهيدر</h3>
<p style={{marginTop:0,color:"#64748B"}}>الإعلان يظهر فوق الهيدر في بداية الصفحة، ومع الـ Scroll يختفي لأعلى بينما الهيدر يفضل ثابت فوق الشاشة.</p>
<div className="form-grid">
  <label className="admin-checkbox"><input type="checkbox" checked={storeSettings.topHeaderAd?.enabled===true} onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),enabled:e.target.checked}}))}/><span>تفعيل الإعلان الثابت</span></label>
  <label className="admin-checkbox"><input type="checkbox" checked={storeSettings.topHeaderAd?.clickable!==false} onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),clickable:e.target.checked}}))}/><span>الصورة تفتح الرابط عند الضغط</span></label>
  <label>
    <span>صورة Desktop — يُفضل 1920 × 150 px — JPG/JPEG</span>
    <input type="file" accept="image/jpeg,image/jpg" onChange={e=>{const file=e.target.files?.[0]||null;setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),desktopImageFile:file}}));}}/>
    <small style={{display:"block",marginTop:6,color:"#64748B"}}>أقصى حجم 5MB</small>
    {storeSettings.topHeaderAd?.desktopImageFile ? <small style={{display:"block",marginTop:4,color:"#16803C"}}>📥 {storeSettings.topHeaderAd.desktopImageFile.name} جاهز للرفع</small> : null}
    {storeSettings.topHeaderAd?.desktopImage ? <img src={storeSettings.topHeaderAd.desktopImage} alt="Top ad desktop" style={{display:"block",marginTop:10,width:"100%",maxWidth:620,height:70,objectFit:"cover",borderRadius:12,border:"1px solid #D9DFE8"}} /> : null}
  </label>
  <label>
    <span>صورة Mobile — يُفضل 1080 × 220 px — JPG/JPEG</span>
    <input type="file" accept="image/jpeg,image/jpg" onChange={e=>{const file=e.target.files?.[0]||null;setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),mobileImageFile:file}}));}}/>
    <small style={{display:"block",marginTop:6,color:"#64748B"}}>اختيارية — لو مش مرفوعة هيستخدم صورة Desktop تلقائيًا</small>
    {storeSettings.topHeaderAd?.mobileImageFile ? <small style={{display:"block",marginTop:4,color:"#16803C"}}>📱 {storeSettings.topHeaderAd.mobileImageFile.name} جاهزة للرفع</small> : null}
    {storeSettings.topHeaderAd?.mobileImage ? <img src={storeSettings.topHeaderAd.mobileImage} alt="Top ad mobile" style={{display:"block",marginTop:10,width:"100%",maxWidth:360,height:90,objectFit:"cover",borderRadius:12,border:"1px solid #D9DFE8"}} /> : null}
  </label>
  <label><span>رابط الإعلان</span><input dir="ltr" value={storeSettings.topHeaderAd?.link||""} placeholder="/offers أو https://..." onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),link:e.target.value}}))}/></label>
  <label><span>ارتفاع Desktop px</span><input type="number" min="40" max="400" value={storeSettings.topHeaderAd?.heightDesktop??150} onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),heightDesktop:asNumber(e.target.value,150)}}))}/></label>
  <label><span>ارتفاع Mobile px</span><input type="number" min="40" max="300" value={storeSettings.topHeaderAd?.heightMobile??95} onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),heightMobile:asNumber(e.target.value,95)}}))}/></label>
  <label><span>طريقة احتواء الصورة</span><select value={storeSettings.topHeaderAd?.imageFit||"cover"} onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),imageFit:e.target.value}}))}><option value="cover">ملء المساحة — Cover</option><option value="contain">إظهار الصورة بالكامل — Contain</option></select></label>
  <label><span>النص البديل للصورة</span><input value={storeSettings.topHeaderAd?.alt||"إعلان المتجر"} onChange={e=>setStoreSettings(p=>({...p,topHeaderAd:{...defaultStoreSettings.topHeaderAd,...(p.topHeaderAd||{}),alt:e.target.value}}))}/></label>
</div>
<div className="info-box" style={{marginTop:12}}>💡 المقاس المقترح: <strong>Desktop 1920×150</strong> و<strong>Mobile 1080×220</strong>. الإعلان يختفي مع النزول والهيدر يثبت أعلى الشاشة.</div>
</div><div className="settings-block"><h3>🖼️ استجابة البانرات</h3><div className="form-grid"><label><span>ارتفاع سطح المكتب</span><input type="number" min="160" value={storeSettings.bannerSettings?.heightDesktop??420} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,heightDesktop:asNumber(e.target.value,420)}}))}/></label><label><span>ارتفاع التابلت</span><input type="number" min="140" value={storeSettings.bannerSettings?.heightTablet??350} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,heightTablet:asNumber(e.target.value,350)}}))}/></label><label><span>ارتفاع الموبايل</span><input type="number" min="120" value={storeSettings.bannerSettings?.heightMobile??240} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,heightMobile:asNumber(e.target.value,240)}}))}/></label><label><span>انحناء الحواف</span><input type="number" min="0" value={storeSettings.bannerSettings?.borderRadius??16} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,borderRadius:asNumber(e.target.value,16)}}))}/></label><label><span>شفافية Overlay</span><input type="number" min="0" max="1" step="0.05" value={storeSettings.bannerSettings?.overlayOpacity??0.35} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,overlayOpacity:asNumber(e.target.value,0.35)}}))}/></label><label><span>تأخير السلايدر</span><input type="number" min="1000" value={storeSettings.bannerSettings?.autoplayDelay??5000} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,autoplayDelay:asNumber(e.target.value,5000)}}))}/></label><label className="admin-checkbox"><input type="checkbox" checked={storeSettings.bannerSettings?.autoplay!==false} onChange={e=>setStoreSettings(p=>({...p,bannerSettings:{...p.bannerSettings,autoplay:e.target.checked}}))}/><span>تشغيل تلقائي</span></label></div></div><div className="settings-block"><h3>⏳ مؤقت عروض اليوم</h3><p style={{marginTop:0,color:"#64748B"}}>العرض يفضل ظاهرًا بعد انتهاء الوقت، لكن يتحول لحالة منتهية وبهتان ولا يمكن التفاعل معه.</p><div className="form-grid"><label className="admin-checkbox"><input type="checkbox" checked={storeSettings.todayOffersTimer?.enabled===true} onChange={e=>setStoreSettings(p=>({...p,todayOffersTimer:{...defaultStoreSettings.todayOffersTimer,...(p.todayOffersTimer||{}),enabled:e.target.checked}}))}/><span>تفعيل مؤقت عروض اليوم</span></label><label><span>عنوان المؤقت</span><input value={storeSettings.todayOffersTimer?.title||""} onChange={e=>setStoreSettings(p=>({...p,todayOffersTimer:{...defaultStoreSettings.todayOffersTimer,...(p.todayOffersTimer||{}),title:e.target.value}}))}/></label><label><span>بداية العرض</span><input type="datetime-local" value={storeSettings.todayOffersTimer?.startAt||""} onChange={e=>setStoreSettings(p=>({...p,todayOffersTimer:{...defaultStoreSettings.todayOffersTimer,...(p.todayOffersTimer||{}),startAt:e.target.value}}))}/></label><label><span>نهاية العرض</span><input type="datetime-local" value={storeSettings.todayOffersTimer?.endAt||""} onChange={e=>setStoreSettings(p=>({...p,todayOffersTimer:{...defaultStoreSettings.todayOffersTimer,...(p.todayOffersTimer||{}),endAt:e.target.value}}))}/></label><label className="admin-checkbox"><input type="checkbox" checked={storeSettings.todayOffersTimer?.showDays!==false} onChange={e=>setStoreSettings(p=>({...p,todayOffersTimer:{...defaultStoreSettings.todayOffersTimer,...(p.todayOffersTimer||{}),showDays:e.target.checked}}))}/><span>إظهار خانة الأيام</span></label></div><div className="info-box" style={{marginTop:12}}>💡 عند وصول العداد للصفر لن يختفي قسم العروض: سيظل موجودًا لكن ببهتان وطبقة تعطيل، مع ظهور «انتهى العرض».</div></div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveSettings}>{saving?"⏳ جاري الحفظ...":"💾 حفظ كل إعدادات المتجر"}</button></div></div></section>;
}

function mergeGames(defaults, previous, incoming) {
  const result = {};
  Object.keys(defaults).forEach((game) => {
    result[game] = { ...defaults[game], ...(previous?.[game] || {}), ...(incoming?.[game] || {}), prizes: safeArray(incoming?.[game]?.prizes ?? previous?.[game]?.prizes ?? defaults[game].prizes) };
  });
  return result;
}

function excelEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}
function downloadExcel(filename, title, columns, rows) {
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Arial}h2{color:#071A36}table{border-collapse:collapse;width:100%}th{background:#071A36;color:#fff;padding:10px;border:1px solid #ccc}td{padding:8px;border:1px solid #ddd}tr:nth-child(even){background:#f7f9fc}</style></head><body><h2>${excelEscape(title)}</h2><table><thead><tr>${columns.map(c=>`<th>${excelEscape(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${excelEscape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${filename}.xls`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function textLabel(k){const m={homeTitle:"عنوان الصفحة الرئيسية",homeSubtitle:"وصف الصفحة الرئيسية",productsTitle:"عنوان المنتجات",offersTitle:"عنوان العروض",bestSellersTitle:"عنوان الأكثر مبيعًا",newArrivalsTitle:"عنوان وصل حديثًا",recommendedTitle:"عنوان قد يعجبك",categoriesTitle:"عنوان الأقسام",emptyProducts:"رسالة عدم وجود المنتجات",emptyCategories:"رسالة عدم وجود الأقسام",cartTitle:"عنوان السلة",checkoutTitle:"عنوان إتمام الطلب",addToCart:"زر أضف للسلة",buyNow:"زر اشترِ الآن",viewAll:"زر عرض الكل",footerAbout:"وصف الفوتر",footerRights:"حقوق النشر",contactLink:"رابط تواصل معنا",hotlineWhatsApp:"رقم الخط الساخن واتساب"};return m[k]||k}
function ContactPanel({storeSettings,setStoreSettings,saveSettings,saving}){const fields=[["contactLink","رابط تواصل معنا"],["hotlineWhatsApp","الخط الساخن واتساب"],["phone","الهاتف"],["whatsapp","واتساب"],["email","البريد الإلكتروني"],["address","العنوان"],["facebook","Facebook"],["instagram","Instagram"],["telegram","Telegram"],["tiktok","TikTok"],["youtube","YouTube"]];return <section className="admin-card"><div className="section-header"><div><h2>📱 بيانات التواصل</h2><p>كل روابط وبيانات التواصل الخاصة بالمتجر.</p></div></div><div className="form-grid">{fields.map(([k,l])=><label key={k}><span>{l}</span><input dir="ltr" value={storeSettings[k]||""} onChange={e=>setStoreSettings(p=>({...p,[k]:e.target.value}))}/></label>)}</div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={saveSettings}>💾 حفظ بيانات التواصل</button></div></section>}
function AdminPanel({admins,adminForm,setAdminForm,saving,setSaving,log}){const save=async()=>{if(!adminForm?.email)return alert("اكتب البريد الإلكتروني");setSaving(true);try{const payload={name:adminForm.name||"مشرف",email:adminForm.email,role:adminForm.role||"admin",active:adminForm.active!==false,permissions:safeArray(adminForm.permissions),updatedAt:serverTimestamp()};if(adminForm.id)await updateDoc(doc(db,"admins",adminForm.id),payload);else await addDoc(collection(db,"admins"),{...payload,createdAt:serverTimestamp()});await log("تعديل المشرفين",adminForm.email);setAdminForm(null);alert("✅ تم الحفظ")}catch(e){alert(e?.message||"❌ تعذر الحفظ")}finally{setSaving(false)}};return <section className="admin-card"><div className="section-header"><div><h2>🔐 المشرفون والصلاحيات</h2><p>إدارة حسابات المشرفين.</p></div><button type="button" className="add-btn" onClick={()=>setAdminForm({name:"",email:"",role:"admin",active:true,permissions:[]})}>＋ إضافة مشرف</button></div>{adminForm&&<div className="admin-form"><div className="form-grid"><label><span>الاسم</span><input value={adminForm.name||""} onChange={e=>setAdminForm(p=>({...p,name:e.target.value}))}/></label><label><span>البريد</span><input dir="ltr" value={adminForm.email||""} onChange={e=>setAdminForm(p=>({...p,email:e.target.value}))}/></label><label><span>الدور</span><select value={adminForm.role||"admin"} onChange={e=>setAdminForm(p=>({...p,role:e.target.value}))}><option value="admin">مشرف</option><option value="superadmin">مدير رئيسي</option></select></label><label className="admin-checkbox"><input type="checkbox" checked={adminForm.active!==false} onChange={e=>setAdminForm(p=>({...p,active:e.target.checked}))}/><span>الحساب مفعل</span></label></div><div className="form-actions"><button type="button" className="save-btn" disabled={saving} onClick={save}>💾 حفظ المشرف</button><button type="button" className="cancel-btn" onClick={()=>setAdminForm(null)}>إلغاء</button></div></div>}<div className="table-scroll"><table className="admin-table"><thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{admins.map(a=><tr key={a.id}><td>{a.name||"مشرف"}</td><td dir="ltr">{a.email||"—"}</td><td>{a.role==="superadmin"?"👑 مدير رئيسي":"🔐 مشرف"}</td><td>{a.active!==false?<span className="status-active">🟢 مفعل</span>:<span className="status-inactive">🔴 متوقف</span>}</td><td><button type="button" className="edit-btn" onClick={()=>setAdminForm({...a})}>✏️ تعديل</button></td></tr>)}</tbody></table></div></section>}
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
