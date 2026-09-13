import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  runTransaction,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { db } from "../firebase";

const auth = getAuth();

import "./Home.css";
import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";
import HeroSlider from "../components/HeroSlider";
import ProductsSlider from "../components/ProductsSlider";
import Footer from "../components/Footer/Footer";

import { CartContext } from "../context/CartContext";

// =====================================================
// DEFAULT STORE SETTINGS
// =====================================================

const defaultStoreSettings = {
  storeName: "ســــَــــــــــوا", logo: "", phone: "", whatsapp: "", email: "", address: "",
  facebook: "", instagram: "", telegram: "", tiktok: "", youtube: "", contactLink: "", hotlineWhatsApp: "", announcement: "",
  theme: {
    primary:"#071A36", secondary:"#0B1F3A", accent:"#D4AF37", pageBackground:"#F0F4F8",
    cardBackground:"#FFFFFF", textPrimary:"#071A36", textSecondary:"#64748B", border:"#D9DFE8",
    buttonBackground:"#0B1F3A", buttonText:"#FFFFFF", navbarBackground:"#071A36", navbarText:"#FFFFFF",
    categoryBarBackground:"#FFFFFF", categoryBarText:"#071A36", topStripBackground:"#071A36",
    topStripText:"#FFFFFF", footerBackground:"#071A36", footerText:"#FFFFFF", footerBrand:"#D4AF37",
    footerButtonBackground:"#D4AF37", footerButtonText:"#071A36", footerButtonHover:"#B8941F",
    headingColor:"#071A36", linkColor:"#071A36", priceColor:"#071A36", saleColor:"#C62828",
    successColor:"#16803C", warningColor:"#B7791F", errorColor:"#C62828",
    inputBackground:"#FFFFFF", sectionBackground:"#FFFFFF",
    fontFamily:"Cairo, sans-serif", bodyFontFamily:"Cairo, sans-serif", headingFontFamily:"Cairo, sans-serif",
    baseFontSize:16, headingFontSize:28, bodyFontSize:16, borderRadius:14,
  },
  bannerSettings:{heightDesktop:420,heightTablet:350,heightMobile:240,borderRadius:16,overlayOpacity:.35,autoplay:true,autoplayDelay:5000},
  topStrip:{enabled:true,direction:"rtl",speed:40,height:42,fontSize:15,fontWeight:700,items:[]},
  featuresBar:{enabled:true,background:"#FFFFFF",color:"#071A36",accentColor:"#D4AF37",height:80,fontSize:16,items:[]},
  texts:{
    homeTitle:"أهلاً بك في ســــَــــــــــوا",homeSubtitle:"اختيارات مميزة وأسعار تناسبك",
    productsTitle:"منتجات مميزة",offersTitle:"عروض اليوم",bestSellersTitle:"الأكثر مبيعًا",
    newArrivalsTitle:"وصل حديثًا",recommendedTitle:"قد يعجبك",categoriesTitle:"تسوق حسب القسم",
    emptyProducts:"لا توجد منتجات متاحة حاليًا",emptyCategories:"لا توجد أقسام متاحة حاليًا",
    cartTitle:"سلة المشتريات",checkoutTitle:"إتمام الطلب",addToCart:"أضف للسلة",
    buyNow:"اشترِ الآن",viewAll:"عرض الكل",footerAbout:"متجر ســــَــــــــــوا للتسوق الإلكتروني",
    footerRights:"جميع الحقوق محفوظة",
    contactLink:"/support",
    hotlineWhatsApp:"",
    categoryEmptyTitle:"لا توجد أقسام حاليًا", categoryEmptyText:"أضف الأقسام من لوحة الأدمن",
    gamesTitle:"ألعاب الجوائز", gamesSubtitle:"اختار لعبتك وجرب حظك واربح جائزتك",
    attemptsLabel:"محاولات", playNow:"العب الآن", playingNow:"جاري اللعب...",
    chooseCard:"اختار كارت", startScratch:"ابدأ الكشط", chooseBox:"اختار صندوق", chooseTarget:"اختار هدف", rollDice:"ارمِ النرد",
    scratchHere:"اكشط هنا", yourPrize:"🎁 جائزتك", diceRolling:"النرد بيلف...", pressDice:"اضغط على النرد",
    determiningPrize:"جاري تحديد جائزتك...", gameResult:"نتيجة اللعب", noLuck:"حظ أوفر",
    discountLabel:"خصم", freeShippingLabel:"شحن مجاني", giftLabel:"هدية من المتجر", resultClose:"تمام، مبروك لي 🎊",
  },
};

// =====================================================
// DEFAULT WHEEL SETTINGS
// =====================================================

const defaultWheelSettings = {
  enabled: false,

  // =================================================
  // DISPLAY MODE
  // store = داخل المتجر
  // popup = منبثق فقط
  // both = داخل المتجر + منبثق
  // =================================================
  displayMode: "store",

  // =================================================
  // POPUP SETTINGS
  // =================================================
  popupEnabled: false,
  popupDelay: 1500,
  popupClosable: true,
  popupShowOncePerDay: false,

  title: "🎡 جرب حظك!",
  description: "لف العجلة واكسب عرضك",

  attemptsPerUser: 2,

  prizes: [],
};

// =====================================================
// CUSTOMER GAMES - SYNCED WITH ADMIN
// =====================================================
const defaultGamesSettings = {
  wheel: { enabled: true, title: "🎡 عجلة الحظ", description: "لف واربح جائزتك", attemptsPerUser: 2, requireLogin: false, winnerMessage: "مبروك! كسبت جائزتك 🎉", prizes: [] },
  cards: { enabled: true, title: "🃏 الكروت المقلوبة", description: "اختار كارت واكتشف جائزتك", attemptsPerUser: 2, requireLogin: false, winnerMessage: "مبروك! 🎉", prizes: [] },
  scratch: { enabled: true, title: "🪙 اكشط واربح", description: "اكشط واكتشف الجائزة", attemptsPerUser: 2, requireLogin: false, winnerMessage: "مبروك! 🎉", prizes: [] },
  mystery: { enabled: true, title: "🎁 الصناديق الغامضة", description: "اختار صندوقك", attemptsPerUser: 2, requireLogin: false, winnerMessage: "مبروك! 🎉", prizes: [] },
  pick: { enabled: true, title: "🎯 اختار واربح", description: "اختار هدفك واربح", attemptsPerUser: 2, requireLogin: false, winnerMessage: "مبروك! 🎉", prizes: [] },
  dice: { enabled: true, title: "🎲 النرد الرابح", description: "ارمِ النرد واكسب", attemptsPerUser: 2, requireLogin: false, winnerMessage: "مبروك! 🎉", prizes: [] },
};

const mergeGamesSettings = (incoming = {}) => {
  const result = {};
  Object.keys(defaultGamesSettings).forEach((key) => {
    result[key] = {
      ...defaultGamesSettings[key],
      ...(incoming?.[key] || {}),
      prizes: Array.isArray(incoming?.[key]?.prizes) ? incoming[key].prizes : [],
    };
  });
  return result;
};

// =====================================================
// LOCAL DATE HELPER
// =====================================================

const getLocalDateKey = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// COLOR HELPERS
// =====================================================

const normalizeHexColor = (color) => {
  if (!color) {
    return "#D4AF37";
  }

  let value = String(color).trim();

  if (!value.startsWith("#")) {
    return "#D4AF37";
  }

  value = value.replace("#", "");

  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return "#D4AF37";
  }

  return `#${value}`;
};

const getContrastTextColor = (color) => {
  const hex = normalizeHexColor(color).replace(
    "#",
    ""
  );

  const r = parseInt(
    hex.substring(0, 2),
    16
  );

  const g = parseInt(
    hex.substring(2, 4),
    16
  );

  const b = parseInt(
    hex.substring(4, 6),
    16
  );

  const luminance =
    (0.299 * r +
      0.587 * g +
      0.114 * b) /
    255;

  return luminance > 0.62
    ? "#171717"
    : "#FFFFFF";
};

// =====================================================
// HOME
// =====================================================

function Home({
  products = [],
  admin,
  searchTerm = "",
  setSearchTerm,
  setCurrentView,
}) {
  const navigate = useNavigate();

  const productsRef = useRef(null);

  const spinTimerRef = useRef(null);

  const { cart = [], addToCart } =
    useContext(CartContext);

  // ===================================================
  // STATES
  // ===================================================

  const [categories, setCategories] =
    useState([]);

  const [selectedCategory, setSelectedCategory] =
    useState("الكل");

  const [sortBy, setSortBy] =
    useState("default");

  const [showOffersOnly, setShowOffersOnly] =
    useState(false);

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [storeSettings, setStoreSettings] =
    useState(defaultStoreSettings);

  // ===================================================
  // THEME
  // IMPORTANT:
  // يجب تعريف theme قبل أي كود يستخدمه
  // ===================================================

  const theme =
    storeSettings?.theme ||
    defaultStoreSettings.theme;

  const homeFontFamily =
    theme?.fontFamily || theme?.bodyFontFamily || "Cairo, sans-serif";
  const headingFontFamily =
    theme?.headingFontFamily || homeFontFamily;

  // ===================================================
  // ANNOUNCEMENT BARS
  // ===================================================

  const [announcementBars, setAnnouncementBars] =
    useState([]);
  const [liveProducts, setLiveProducts] =
    useState(products);
  const [banners, setBanners] =
    useState([]);
  const [popupAds, setPopupAds] =
    useState([]);
  const [storeMenuItems, setStoreMenuItems] =
    useState([]);
  const [adminAnnouncements, setAdminAnnouncements] =
    useState([]);
  const [showAdminPopup, setShowAdminPopup] =
    useState(false);

  // ===================================================
  // WHEEL STATES
  // ===================================================

  const [wheelSettings, setWheelSettings] = useState({
    enabled: false,
    displayMode: "store",
    popupEnabled: false,
    popupDelay: 1500,
    popupClosable: true,
    popupShowOncePerDay: false,
    title: "🎡 جرب حظك!",
    description: "لف العجلة واكسب عرضك",
    attemptsPerUser: 1,
    prizes: [],
  });

  const [showWheelPopup, setShowWheelPopup] =
    useState(false);

  const [popupReady, setPopupReady] =
    useState(false);

  const [isSpinning, setIsSpinning] =
    useState(false);

  const [wheelRotation, setWheelRotation] =
    useState(0);

  const [wheelResult, setWheelResult] =
    useState(null);

  const [wheelAttempts, setWheelAttempts] =
    useState(0);

  const [spinCountdown, setSpinCountdown] =
    useState(0);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [timeUntilReset, setTimeUntilReset] =
    useState("");

  // ===================================================
  // FLASH SALES TIMER
  // ===================================================

  const [flashTimeLeft, setFlashTimeLeft] =
    useState({
      hours: "00",
      minutes: "00",
      seconds: "00",
    });

  // ===================================================
  // CUSTOMER GAMES
  // ===================================================
  const [gamesSettings, setGamesSettings] = useState(defaultGamesSettings);
  const [activeGame, setActiveGame] = useState(null);
  const [gameBusy, setGameBusy] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [gameVisual, setGameVisual] = useState(null);

  // ===================================================
  // FLOATING WHATSAPP
  // ===================================================
  const [whatsappPosition, setWhatsappPosition] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("elsafty_hotline_position") || "null");
      return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
        ? saved
        : { x: null, y: null };
    } catch {
      return { x: null, y: null };
    }
  });
  const [draggingWhatsapp, setDraggingWhatsapp] = useState(false);
  const whatsappDragRef = useRef({ offsetX: 0, offsetY: 0 });


  const DAILY_WHEEL_ATTEMPTS =
    Math.max(
      1,
      Number(
        wheelSettings?.attemptsPerUser ??
          defaultWheelSettings.attemptsPerUser ??
          1
      )
    );

  const SPIN_DURATION = 5;

  // ===================================================
  // CURRENT USER
  // ===================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user || null);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // LOAD STORE SETTINGS
  // ===================================================

  useEffect(() => {
    const settingsRef = doc(
      db,
      "settings",
      "store"
    );

    const unsubscribe =
      onSnapshot(
        settingsRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setStoreSettings(
              defaultStoreSettings
            );

            return;
          }

          const data =
            snapshot.data() || {};

          setStoreSettings((previous) => ({
            ...defaultStoreSettings,
            ...previous,
            ...data,
            theme: {
              ...defaultStoreSettings.theme,
              ...(previous.theme || {}),
              ...(data.theme || {}),
            },
            bannerSettings: {
              ...defaultStoreSettings.bannerSettings,
              ...(previous.bannerSettings || {}),
              ...(data.bannerSettings || {}),
            },
            topStrip: {
              ...defaultStoreSettings.topStrip,
              ...(previous.topStrip || {}),
              ...(data.topStrip || {}),
            },
            featuresBar: {
              ...defaultStoreSettings.featuresBar,
              ...(previous.featuresBar || {}),
              ...(data.featuresBar || {}),
            },
            texts: {
              ...defaultStoreSettings.texts,
              ...(previous.texts || {}),
              ...(data.texts || {}),
            },
          }));
        },
        (error) => {
          console.error(
            "Store Settings Error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // LOAD CUSTOMER-FACING CONTENT FROM ADMIN
  // ===================================================

  useEffect(() => {
    const unsubs = [];

    const watch = (name, setter) => {
      const unsubscribe = onSnapshot(
        collection(db, name),
        (snapshot) => {
          setter(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() || {}),
            }))
          );
        },
        (error) => {
          console.error(`Home ${name} Error:`, error);
        }
      );

      unsubs.push(unsubscribe);
    };

    watch("products", setLiveProducts);
    watch("banners", setBanners);
    watch("popupAds", setPopupAds);
    watch("storeMenuItems", setStoreMenuItems);
    watch("announcements", setAdminAnnouncements);

    const gamesRef = doc(db, "settings", "games");
    const gamesUnsubscribe = onSnapshot(gamesRef, (snapshot) => {
      setGamesSettings(snapshot.exists() ? mergeGamesSettings(snapshot.data() || {}) : defaultGamesSettings);
    }, (error) => {
      console.error("Home games settings error:", error);
      setGamesSettings(defaultGamesSettings);
    });
    unsubs.push(gamesUnsubscribe);

    return () => {
      unsubs.forEach((unsubscribe) => {
        try { unsubscribe(); } catch {}
      });
    };
  }, []);

  // ===================================================
  // LOAD ANNOUNCEMENT BARS
  // SUPPORT:
  // text / title / message / content
  // active / enabled / visible
  // ===================================================

  useEffect(() => {
    const announcementsRef = collection(
      db,
      "announcementBars"
    );

    const unsubscribe =
      onSnapshot(
        announcementsRef,
        (snapshot) => {
          const bars =
            snapshot.docs
              .map((item) => {
                const data =
                  item.data() || {};

                // ---------------------------------------
                // TEXT
                // ---------------------------------------

                const text =
                  String(
                    data.text ??
                      data.title ??
                      data.message ??
                      data.content ??
                      ""
                  ).trim();

                // ---------------------------------------
                // ACTIVE STATUS
                // يدعم:
                // active
                // enabled
                // visible
                // ---------------------------------------

                const isActive =
                  data.active === true ||
                  data.enabled === true ||
                  data.visible === true ||
                  String(
                    data.active ?? ""
                  ).toLowerCase() ===
                    "true" ||
                  String(
                    data.enabled ?? ""
                  ).toLowerCase() ===
                    "true" ||
                  String(
                    data.visible ?? ""
                  ).toLowerCase() ===
                    "true";

                return {
                  id: item.id,

                  ...data,

                  text,

                  active:
                    isActive,

                  sortOrder:
                    Number(
                      data.sortOrder ??
                        data.order ??
                        0
                    ),

                  speed:
                    Number(
                      data.speed ??
                        40
                    ),

                  height:
                    Number(
                      data.height ??
                        42
                    ),

                  fontSize:
                    Number(
                      data.fontSize ??
                        15
                    ),

                  backgroundColor:
                    data.backgroundColor ??
                    data.background ??
                    null,

                  textColor:
                    data.textColor ??
                    data.color ??
                    null,

                  direction:
                    data.direction ||
                    "rtl",

                  type:
                    String(
                      data.type ||
                        "marquee"
                    ).toLowerCase(),

                  link:
                    data.link ||
                    data.url ||
                    "",
                };
              })

              .filter(
                (item) =>
                  item.active === true &&
                  String(
                    item.text || ""
                  ).trim()
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

          setAnnouncementBars(
            bars
          );
        },
        (error) => {
          console.error(
            "Announcement Bars Error:",
            error
          );

          setAnnouncementBars([]);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // VISIBLE ANNOUNCEMENT BARS
  // ===================================================

  const visibleAnnouncementBars =
    useMemo(() => {
      return (
        announcementBars || []
      ).filter(
        (bar) =>
          bar?.active === true &&
          String(
            bar?.text || ""
          ).trim()
      );
    }, [
      announcementBars,
    ]);

  const activeAnnouncements = useMemo(() => {
    const items = (adminAnnouncements || []).filter(
      (item) =>
        item?.active !== false &&
        item?.enabled !== false &&
        item?.visible !== false &&
        String(
          item?.text ||
            item?.title ||
            item?.message ||
            ""
        ).trim()
    );

    if (items.length) return items;

    const fallback = String(
      storeSettings?.announcement || ""
    ).trim();

    return fallback
      ? [{ id: "store-announcement", text: fallback }]
      : [];
  }, [
    adminAnnouncements,
    storeSettings?.announcement,
  ]);

  const activePopupAd = useMemo(
    () =>
      (popupAds || [])
        .filter(
          (item) =>
            item?.active !== false &&
            item?.enabled !== false &&
            item?.visible !== false &&
            (item?.image ||
              item?.title ||
              item?.text)
        )
        .sort(
          (a, b) =>
            Number(
              a?.order ??
                a?.sortOrder ??
                0
            ) -
            Number(
              b?.order ??
                b?.sortOrder ??
                0
            )
        )[0] || null,
    [popupAds]
  );

  useEffect(() => {
    if (!activePopupAd) {
      setShowAdminPopup(false);
      return undefined;
    }

    const timer = setTimeout(
      () => setShowAdminPopup(true),
      Math.max(
        0,
        Number(activePopupAd.delay ?? 0)
      )
    );

    return () => clearTimeout(timer);
  }, [
    activePopupAd?.id,
    activePopupAd?.delay,
  ]);

  // ===================================================
  // LOAD WHEEL SETTINGS
  // ===================================================

  useEffect(() => {
    const wheelRef = doc(
      db,
      "settings",
      "wheel"
    );

    const unsubscribe =
      onSnapshot(
        wheelRef,
        (snapshot) => {
          try {
            if (!snapshot.exists()) {
              setWheelSettings({
                ...defaultWheelSettings,
                enabled:
                  defaultWheelSettings?.enabled ??
                  false,
                displayMode:
                  defaultWheelSettings?.displayMode ||
                  "store",
                popupEnabled:
                  defaultWheelSettings?.popupEnabled ??
                  false,
                popupDelay:
                  Math.max(
                    0,
                    Number(
                      defaultWheelSettings?.popupDelay ??
                        1500
                    )
                  ),
                popupClosable:
                  defaultWheelSettings?.popupClosable ??
                  true,
                popupShowOncePerDay:
                  defaultWheelSettings?.popupShowOncePerDay ??
                  false,
                attemptsPerUser:
                  Math.max(
                    1,
                    Number(
                      defaultWheelSettings?.attemptsPerUser ??
                        1
                    )
                  ),
                prizes: Array.isArray(
                  defaultWheelSettings?.prizes
                )
                  ? defaultWheelSettings.prizes
                  : [],
              });

              return;
            }

            const data =
              snapshot.data() || {};

            setWheelSettings({
              ...defaultWheelSettings,
              ...data,

              enabled:
                data.enabled === true,

              displayMode:
                ["store", "popup", "both"].includes(
                  data.displayMode
                )
                  ? data.displayMode
                  : "store",

              popupEnabled:
                data.popupEnabled === true,

              popupDelay:
                Math.max(
                  0,
                  Number(
                    data.popupDelay ?? 1500
                  )
                ),

              popupClosable:
                data.popupClosable !== false,

              popupShowOncePerDay:
                data.popupShowOncePerDay === true,

              attemptsPerUser:
                Math.max(
                  1,
                  Number(
                    data.attemptsPerUser ??
                      defaultWheelSettings?.attemptsPerUser ??
                      1
                  )
                ),

              prizes: Array.isArray(
                data.prizes
              )
                ? data.prizes
                : [],
            });
          } catch (error) {
            console.error(
              "Wheel Settings Parse Error:",
              error
            );

            setWheelSettings({
              ...defaultWheelSettings,
              enabled: false,
              displayMode: "store",
              popupEnabled: false,
              popupClosable: true,
              popupShowOncePerDay: false,
              popupDelay: 1500,
              prizes: [],
            });
          }
        },
        (error) => {
          console.error(
            "Wheel Settings Error:",
            error
          );

          setWheelSettings({
            ...defaultWheelSettings,
            enabled: false,
            displayMode: "store",
            popupEnabled: false,
            popupClosable: true,
            popupShowOncePerDay: false,
            popupDelay: 1500,
            prizes: [],
          });
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // WHEEL DISPLAY MODES
  // ===================================================

  const shouldShowWheelInStore =
    wheelSettings?.enabled === true &&
    (
      wheelSettings?.displayMode === "store" ||
      wheelSettings?.displayMode === "both"
    );

  const shouldShowWheelAsPopup =
    wheelSettings?.enabled === true &&
    wheelSettings?.popupEnabled === true &&
    (
      wheelSettings?.displayMode === "popup" ||
      wheelSettings?.displayMode === "both"
    );

  // ===================================================
  // POPUP STORAGE KEY
  // ===================================================

  const getWheelPopupStorageKey = () => {
    const today = getLocalDateKey();
    return `elsafty_wheel_popup_${today}`;
  };

  // ===================================================
  // OPEN WHEEL POPUP
  // ===================================================

  useEffect(() => {
    let timer = null;

    if (!shouldShowWheelAsPopup) {
      setShowWheelPopup(false);
      setPopupReady(false);
      return undefined;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    if (wheelSettings?.popupShowOncePerDay === true) {
      const storageKey =
        getWheelPopupStorageKey();

      const alreadyShown =
        localStorage.getItem(storageKey);

      if (alreadyShown === "1") {
        setShowWheelPopup(false);
        setPopupReady(false);
        return undefined;
      }
    }

    const delay = Math.max(
      0,
      Number(
        wheelSettings?.popupDelay ??
          1500
      )
    );

    setPopupReady(false);

    timer = setTimeout(() => {
      setPopupReady(true);
      setShowWheelPopup(true);

      if (
        wheelSettings?.popupShowOncePerDay ===
        true
      ) {
        try {
          localStorage.setItem(
            getWheelPopupStorageKey(),
            "1"
          );
        } catch (error) {
          console.warn(
            "Wheel Popup localStorage Error:",
            error
          );
        }
      }
    }, delay);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    wheelSettings?.enabled,
    wheelSettings?.displayMode,
    wheelSettings?.popupEnabled,
    wheelSettings?.popupDelay,
    wheelSettings?.popupShowOncePerDay,
    shouldShowWheelAsPopup,
  ]);

  // ===================================================
  // CLOSE WHEEL POPUP
  // ===================================================

  const closeWheelPopup = () => {
    setShowWheelPopup(false);
    setPopupReady(false);
  };

  // ===================================================
  // LOAD DAILY WHEEL ATTEMPTS
  // ===================================================

  useEffect(() => {
    const loadWheelAttempts =
      async () => {
        if (!currentUser?.uid) {
          setWheelAttempts(0);
          return;
        }

        try {
          const today =
            getLocalDateKey();

          const attemptRef =
            doc(
              db,
              "wheelAttempts",
              `${currentUser.uid}_${today}`
            );

          const snapshot =
            await getDoc(
              attemptRef
            );

          if (!snapshot.exists()) {
            setWheelAttempts(0);
            return;
          }

          const data =
            snapshot.data() || {};

          setWheelAttempts(
            Math.min(
              Number(
                data.attempts || 0
              ),
              DAILY_WHEEL_ATTEMPTS
            )
          );
        } catch (error) {
          console.error(
            "Wheel Attempts Load Error:",
            error
          );

          setWheelAttempts(0);
        }
      };

    loadWheelAttempts();
  }, [
    currentUser,
    DAILY_WHEEL_ATTEMPTS,
  ]);

  // ===================================================
  // DAILY RESET TIMER
  // ===================================================

  useEffect(() => {
    const updateResetTimer =
      () => {
        const now = new Date();

        const tomorrow =
          new Date(now);

        tomorrow.setHours(
          24,
          0,
          0,
          0
        );

        const difference =
          tomorrow.getTime() -
          now.getTime();

        if (difference <= 0) {
          setTimeUntilReset(
            "00:00:00"
          );

          return;
        }

        const hours = Math.floor(
          difference /
            (1000 * 60 * 60)
        );

        const minutes =
          Math.floor(
            (difference %
              (1000 *
                60 *
                60)) /
              (1000 * 60)
          );

        const seconds =
          Math.floor(
            (difference %
              (1000 * 60)) /
              1000
          );

        const formatted =
          [
            String(hours).padStart(
              2,
              "0"
            ),

            String(minutes).padStart(
              2,
              "0"
            ),

            String(seconds).padStart(
              2,
              "0"
            ),
          ].join(":");

        setTimeUntilReset(
          formatted
        );

        setFlashTimeLeft({
          hours: String(
            hours
          ).padStart(2, "0"),

          minutes: String(
            minutes
          ).padStart(2, "0"),

          seconds: String(
            seconds
          ).padStart(2, "0"),
        });
      };

    updateResetTimer();

    const interval =
      setInterval(
        updateResetTimer,
        1000
      );

    return () =>
      clearInterval(interval);
  }, []);

  // ===================================================
  // SPIN COUNTDOWN
  // ===================================================

  useEffect(() => {
    if (!isSpinning) {
      return;
    }

    setSpinCountdown(
      SPIN_DURATION
    );

    const interval =
      setInterval(() => {
        setSpinCountdown(
          (previous) => {
            if (previous <= 1) {
              clearInterval(
                interval
              );

              return 0;
            }

            return previous - 1;
          }
        );
      }, 1000);

    return () =>
      clearInterval(interval);
  }, [isSpinning]);

  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(
          spinTimerRef.current
        );
      }
    };
  }, []);

  // ===================================================
  // CART COUNT
  // ===================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item?.quantity || 0),
    0
  );

  // ===================================================
  // ROOT CATEGORIES
  // ===================================================

  const rootCategories =
    useMemo(() => {
      return (categories || [])
        .filter(
          (category) =>
            !category?.parentId ||
            category.parentId ===
              null ||
            category.parentId === ""
        )
        .slice()
        .sort(
          (a, b) =>
            Number(
              a?.sortOrder ?? 0
            ) -
            Number(
              b?.sortOrder ?? 0
            )
        );
    }, [categories]);

  // ===================================================
  // LOAD CATEGORIES FROM ADMIN / FIRESTORE
  // ===================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setCategories(
          snapshot.docs
            .map((item) => ({
              id: item.id,
              ...(item.data() || {}),
            }))
            .filter(
              (category) =>
                category?.active !== false
            )
            .sort(
              (x, y) =>
                Number(x?.sortOrder ?? 0) -
                Number(y?.sortOrder ?? 0)
            )
        );
      },
      (error) => {
        console.error(
          "Home Categories Error:",
          error
        );
        setCategories([]);
      }
    );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // CHILD CATEGORIES
  // ===================================================

  const getChildCategories =
    (parentId) => {
      if (!parentId) {
        return [];
      }

      return (categories || [])
        .filter(
          (category) =>
            String(
              category?.parentId ||
                ""
            ) ===
            String(parentId)
        )
        .slice()
        .sort(
          (a, b) =>
            Number(
              a?.sortOrder ?? 0
            ) -
            Number(
              b?.sortOrder ?? 0
            )
        );
    };

  // ===================================================
  // CATEGORY PRODUCTS
  // ===================================================

  const getCategoryProducts =
    (category) => {
      if (!category) {
        return [];
      }

      const categoryId =
        String(
          category?.id || ""
        );

      const categoryName =
        String(
          category?.name || ""
        )
          .trim()
          .toLowerCase();

      return (visibleProducts || []).filter(
        (product) => {
          const productCategoryId =
            String(
              product?.categoryId ||
                ""
            );

          const productCategory =
            String(
              product?.category ||
                ""
            )
              .trim()
              .toLowerCase();

          return (
            (categoryId &&
              productCategoryId ===
                categoryId) ||
            (categoryName &&
              productCategory ===
                categoryName)
          );
        }
      );
    };

  // ===================================================
  // OPEN CATEGORY
  // ===================================================

  const openCategory =
    (category) => {
      if (!category) {
        return;
      }

      const categoryId =
        category?.id;

      const categoryName =
        category?.name;

      if (categoryId) {
        navigate(
          `/category/${encodeURIComponent(
            categoryId
          )}`
        );

        return;
      }

      if (categoryName) {
        navigate(
          `/category/${encodeURIComponent(
            categoryName
          )}`
        );
      }
    };

  // ===================================================
  // NAVBAR CATEGORY EVENT
  // ===================================================

  useEffect(() => {
    const filterListener =
      (event) => {
        const categoryValue =
          event?.detail;

        if (
          !categoryValue ||
          categoryValue === "الكل"
        ) {
          setSelectedCategory(
            "الكل"
          );

          return;
        }

        const value =
          String(
            categoryValue
          );

        const foundCategory =
          (categories || []).find(
            (item) =>
              String(
                item?.id || ""
              ) === value ||
              String(
                item?.name || ""
              )
                .trim() ===
                value.trim()
          );

        if (foundCategory) {
          openCategory(
            foundCategory
          );

          return;
        }

        navigate(
          `/category/${encodeURIComponent(
            value
          )}`
        );
      };

    window.addEventListener(
      "filterCategory",
      filterListener
    );

    return () => {
      window.removeEventListener(
        "filterCategory",
        filterListener
      );
    };
  }, [
    categories,
    navigate,
  ]);

  // ===================================================
  // SCROLL
  // ===================================================

  const scrollToSection =
    (selector) => {
      const element =
        document.querySelector(
          selector
        );

      if (!element) {
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

  const texts = {
    ...defaultStoreSettings.texts,
    ...(storeSettings?.texts || {}),
  };

  const visibleProducts = useMemo(
    () =>
      (Array.isArray(liveProducts)
        ? liveProducts
        : Array.isArray(products)
          ? products
          : []
      ).filter(
        (product) =>
          product?.active !== false
      ),
    [liveProducts, products]
  );

  // ===================================================
  // SPECIAL PRODUCTS
  // ===================================================

  const offers = useMemo(
    () =>
      (visibleProducts || []).filter(
        (product) =>
          product?.offer === true
      ),
    [visibleProducts]
  );

  const bestSellers = useMemo(
    () =>
      (visibleProducts || []).filter(
        (product) =>
          product?.bestSeller === true
      ),
    [visibleProducts]
  );

  const newArrivals = useMemo(
    () =>
      (visibleProducts || []).filter(
        (product) =>
          product?.newArrival === true
      ),
    [visibleProducts]
  );

  const recommended = useMemo(
    () =>
      (visibleProducts || []).filter(
        (product) =>
          product?.recommended ===
          true
      ),
    [visibleProducts]
  );

  // ===================================================
  // FILTER PRODUCTS
  // ===================================================

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        String(
          searchTerm || ""
        )
          .toLowerCase()
          .trim();

      const normalizedCategory =
        String(
          selectedCategory || ""
        ).trim();

      return [...(visibleProducts || [])]
        .filter((product) => {
          const title =
            String(
              product?.title ||
                product?.name ||
                product?.productName ||
                ""
            ).toLowerCase();

          const description =
            String(
              product?.description ||
                ""
            ).toLowerCase();

          const categoryName =
            String(
              product?.category ||
                ""
            ).toLowerCase();

          const productCategoryId =
            String(
              product?.categoryId ||
                ""
            );

          const matchSearch =
            normalizedSearch === "" ||
            title.includes(
              normalizedSearch
            ) ||
            description.includes(
              normalizedSearch
            ) ||
            categoryName.includes(
              normalizedSearch
            );

          if (!matchSearch) {
            return false;
          }

          let matchCategory =
            normalizedCategory ===
              "" ||
            normalizedCategory ===
              "الكل";

          if (!matchCategory) {
            const selectedCategoryObject =
              (categories || []).find(
                (category) =>
                  String(
                    category?.id || ""
                  ) ===
                    normalizedCategory ||
                  String(
                    category?.name ||
                      ""
                  ).trim() ===
                    normalizedCategory
              );

            if (
              selectedCategoryObject
            ) {
              const selectedId =
                String(
                  selectedCategoryObject?.id ||
                    ""
                );

              const selectedName =
                String(
                  selectedCategoryObject?.name ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              matchCategory =
                (selectedId &&
                  productCategoryId ===
                    selectedId) ||
                (selectedName &&
                  categoryName ===
                    selectedName);
            } else {
              matchCategory =
                categoryName ===
                normalizedCategory.toLowerCase();
            }
          }

          if (!matchCategory) {
            return false;
          }

          if (
            showOffersOnly &&
            product?.offer !== true
          ) {
            return false;
          }

          if (
            minPrice !== "" &&
            Number(
              product?.price || 0
            ) <
              Number(minPrice)
          ) {
            return false;
          }

          if (
            maxPrice !== "" &&
            Number(
              product?.price || 0
            ) >
              Number(maxPrice)
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "low":
              return (
                Number(
                  a?.price || 0
                ) -
                Number(
                  b?.price || 0
                )
              );

            case "high":
              return (
                Number(
                  b?.price || 0
                ) -
                Number(
                  a?.price || 0
                )
              );

            case "rating":
              return (
                Number(
                  b?.rating || 0
                ) -
                Number(
                  a?.rating || 0
                )
              );

            case "new":
              return (
                Number(
                  Boolean(
                    b?.newArrival
                  )
                ) -
                Number(
                  Boolean(
                    a?.newArrival
                  )
                )
              );

            case "best":
              return (
                Number(
                  Boolean(
                    b?.bestSeller
                  )
                ) -
                Number(
                  Boolean(
                    a?.bestSeller
                  )
                )
              );

            default:
              return 0;
          }
        });
    }, [
      visibleProducts,
      categories,
      searchTerm,
      selectedCategory,
      showOffersOnly,
      minPrice,
      maxPrice,
      sortBy,
    ]);

  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters =
    () => {
      setSelectedCategory(
        "الكل"
      );

      if (
        typeof setSearchTerm ===
        "function"
      ) {
        setSearchTerm("");
      }

      setSortBy("default");
      setShowOffersOnly(false);
      setMinPrice("");
      setMaxPrice("");
    };

  // ===================================================
  // OPEN PRODUCT
  // ===================================================

  const openProduct =
    (id) => {
      if (!id) {
        return;
      }

      navigate(
        `/product/${encodeURIComponent(
          id
        )}`
      );
    };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const handleAddToCart =
    (event, product) => {
      event.stopPropagation();

      if (
        typeof addToCart !==
        "function"
      ) {
        return;
      }

      addToCart({
        ...product,
        quantity: 1,
      });
    };

  // ===================================================
  // CUSTOMER GAMES HELPERS
  // ===================================================
  const activeGames = useMemo(() => (
    Object.entries(gamesSettings || {}).filter(([key, game]) => key !== "wheel" && game?.enabled !== false)
  ), [gamesSettings]);

  const getGamePrizes = (key) => (gamesSettings?.[key]?.prizes || []).filter((p) => p?.enabled !== false);

  const pickWeightedPrize = (prizes) => {
    if (!prizes.length) return { title: "حظ أوفر المرة الجاية 🍀", type: "nothing", value: 0 };
    const weights = prizes.map((p) => Math.max(0, Number(p?.probability ?? 0)));
    const total = weights.reduce((a, b) => a + b, 0);
    if (!total) return prizes[Math.floor(Math.random() * prizes.length)];
    let r = Math.random() * total;
    for (let i = 0; i < prizes.length; i += 1) {
      r -= weights[i];
      if (r <= 0) return prizes[i];
    }
    return prizes[prizes.length - 1];
  };

  const openCustomerGame = (gameKey) => {
    const game = gamesSettings?.[gameKey];
    if (!game || game.enabled === false) return;
    setGameResult(null);
    setGameVisual(null);
    setActiveGame(gameKey);
  };

  const playCustomerGame = async (gameKey, visual) => {
    if (gameBusy) return;
    const game = gamesSettings?.[gameKey];
    if (!game || game.enabled === false) return;

    if (game.requireLogin === true && !currentUser?.uid) {
      alert("من فضلك سجل الدخول أولاً للمشاركة في اللعبة.");
      navigate("/login");
      return;
    }

    const prizes = getGamePrizes(gameKey);
    if (!prizes.length) {
      alert("اللعبة متاحة، لكن الأدمن لم يضف جوائز لها بعد.");
      return;
    }

    const attemptLimit = Math.max(1, Number(game.attemptsPerUser ?? 2));
    const today = getLocalDateKey();
    const uid = currentUser?.uid || "guest";
    const attemptRef = doc(db, "gameAttempts", `${uid}_${gameKey}_${today}`);

    setGameBusy(true);
    setActiveGame(gameKey);
    setGameVisual(visual);

    try {
      let attempts = 0;
      if (currentUser?.uid) {
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(attemptRef);
          const current = snap.exists() ? Number(snap.data()?.attempts || 0) : 0;
          if (current >= attemptLimit) throw new Error("GAME_LIMIT_REACHED");
          attempts = current + 1;
          transaction.set(attemptRef, { uid: currentUser.uid, gameKey, date: today, attempts, updatedAt: new Date() }, { merge: true });
        });
      } else {
        const guestKey = `elsafty_guest_game_${gameKey}_${today}`;
        const current = Number(localStorage.getItem(guestKey) || 0);
        if (current >= attemptLimit) throw new Error("GAME_LIMIT_REACHED");
        attempts = current + 1;
        localStorage.setItem(guestKey, String(attempts));
      }

      const prize = pickWeightedPrize(prizes);
      const delay = gameKey === "dice" ? 1250 : gameKey === "scratch" ? 1100 : 900;
      await new Promise((resolve) => setTimeout(resolve, delay));
      setGameResult({ gameKey, prize, attempts, limit: attemptLimit, message: game.winnerMessage || "مبروك! 🎉" });
    } catch (error) {
      if (error?.message === "GAME_LIMIT_REACHED") {
        alert(`خلصت محاولاتك النهارده في لعبة ${game.title || "اللعبة"}.`);
      } else {
        console.error("Customer game error:", error);
        alert("حصل خطأ بسيط، جرّب تاني.");
      }
    } finally {
      setGameBusy(false);
      setGameVisual(null);
    }
  };

  const closeGameResult = () => {
    setGameResult(null);
    setActiveGame(null);
  };

  // ===================================================
  // FLOATING WHATSAPP DRAG
  // ===================================================
  const hotlineWhatsApp = String(storeSettings?.hotlineWhatsApp || storeSettings?.whatsapp || "").trim();
  const normalizeWhatsApp = (value) => String(value || "").replace(/[^0-9]/g, "");
  const whatsappHref = hotlineWhatsApp ? `https://wa.me/${normalizeWhatsApp(hotlineWhatsApp)}` : "";

  useEffect(() => {
    try {
      if (whatsappPosition?.x !== null && whatsappPosition?.y !== null) {
        localStorage.setItem("elsafty_hotline_position", JSON.stringify(whatsappPosition));
      }
    } catch {}
  }, [whatsappPosition]);

  const startWhatsappDrag = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    whatsappDragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    setDraggingWhatsapp(true);
    event.preventDefault();
  };

  useEffect(() => {
    if (!draggingWhatsapp) return undefined;
    const move = (event) => {
      const size = 54;
      const x = Math.max(8, Math.min(window.innerWidth - size - 8, event.clientX - whatsappDragRef.current.offsetX));
      const y = Math.max(72, Math.min(window.innerHeight - size - 8, event.clientY - whatsappDragRef.current.offsetY));
      setWhatsappPosition({ x, y });
    };
    const up = () => setDraggingWhatsapp(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [draggingWhatsapp]);

  // ===================================================
  // CATEGORY CARD STYLE
  // ===================================================

  const getCategoryCardStyle =
    (category) => {
      const color =
        category?.color ||
        theme?.accent ||
        defaultStoreSettings.theme.accent;

      return {
        "--category-color":
          color,

        "--category-color-light":
          `${color}18`,

        "--category-color-medium":
          `${color}30`,
      };
    };

  // ===================================================
  // ACTIVE WHEEL PRIZES
  // ===================================================

  const activeWheelPrizes =
    useMemo(() => {
      return (
        wheelSettings?.prizes ||
        []
      ).filter(
        (prize) =>
          prize?.enabled !== false
      );
    }, [
      wheelSettings?.prizes,
    ]);

  // ===================================================
  // WHEEL COLORS
  // ===================================================

  const defaultWheelColors = [
    theme?.accent || "#D4AF37",
    theme?.primary || "#071A36",
    theme?.secondary || "#0B1F3A",
    "#B8941F",
    "#F4D06F",
    theme?.saleColor || "#C62828",
    theme?.successColor || "#16803C",
    theme?.warningColor || "#B7791F",
  ];

  // ===================================================
  // WHEEL GRADIENT
  // ===================================================

  const wheelGradient =
    useMemo(() => {
      if (
        activeWheelPrizes.length ===
        0
      ) {
        return "#D4AF37";
      }

      const segment =
        360 /
        activeWheelPrizes.length;

      const parts =
        activeWheelPrizes.map(
          (prize, index) => {
            const color =
              prize?.color ||
              defaultWheelColors[
                index %
                  defaultWheelColors.length
              ];

            const start =
              index * segment;

            const end =
              (index + 1) * segment;

            return `${color} ${start}deg ${end}deg`;
          }
        );

      return `conic-gradient(from -90deg, ${parts.join(
        ", "
      )})`;
    }, [
      activeWheelPrizes,
      theme?.accent,
      theme?.primary,
      theme?.secondary,
      theme?.saleColor,
      theme?.successColor,
      theme?.warningColor,
    ]);

  // ===================================================
  // WHEEL PRIZE COLOR
  // ===================================================

  const getWheelPrizeColor =
    (prize, index) => {
      return normalizeHexColor(
        prize?.color ||
          defaultWheelColors[
            index %
              defaultWheelColors.length
          ]
      );
    };

  // ===================================================
  // WHEEL LABEL STYLE
  // ===================================================

  const getWheelLabelStyle =
    (prize, index) => {
      const count =
        activeWheelPrizes.length;

      if (!count) {
        return {};
      }

      const segment =
        360 / count;

      const angle =
        index * segment +
        segment / 2;

      const radius =
        count <= 4
          ? 103
          : count <= 6
            ? 101
            : count <= 8
              ? 96
              : 89;

      const readableAngle =
        angle > 90 &&
        angle < 270
          ? 180
          : 0;

      const backgroundColor =
        getWheelPrizeColor(
          prize,
          index
        );

      const textColor =
        getContrastTextColor(
          backgroundColor
        );

      return {
        transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(${readableAngle}deg)`,

        color:
          textColor,

        textShadow:
          textColor === "#FFFFFF"
            ? "0 1px 2px rgba(0,0,0,.55)"
            : "0 1px 1px rgba(255,255,255,.65)",

        "--wheel-prize-color":
          backgroundColor,
      };
    };

  // ===================================================
  // SPIN WHEEL
  // ===================================================

  const spinWheel = async () => {
    if (
      isSpinning ||
      activeWheelPrizes.length === 0
    ) {
      return;
    }

    if (!currentUser?.uid) {
      alert(
        "من فضلك سجل الدخول أولاً حتى تتمكن من لف العجلة."
      );

      navigate("/login");
      return;
    }

    const today = getLocalDateKey();

    const attemptRef = doc(
      db,
      "wheelAttempts",
      `${currentUser.uid}_${today}`
    );

    let newAttempts = 0;

    // ===================================================
    // REGISTER ATTEMPT
    // ===================================================

    try {
      await runTransaction(
        db,
        async (transaction) => {
          const snapshot =
            await transaction.get(
              attemptRef
            );

          const currentAttempts =
            snapshot.exists()
              ? Number(
                  snapshot.data()?.attempts || 0
                )
              : 0;

          if (
            currentAttempts >=
            DAILY_WHEEL_ATTEMPTS
          ) {
            throw new Error(
              "DAILY_LIMIT_REACHED"
            );
          }

          newAttempts =
            currentAttempts + 1;

          transaction.set(
            attemptRef,
            {
              uid: currentUser.uid,
              attempts: newAttempts,
              date: today,
              updatedAt:
                new Date().toISOString(),
            },
            {
              merge: true,
            }
          );
        }
      );

      setWheelAttempts(newAttempts);
    } catch (error) {
      if (
        error?.message ===
        "DAILY_LIMIT_REACHED"
      ) {
        setWheelAttempts(
          DAILY_WHEEL_ATTEMPTS
        );

        alert(
          `لقد استخدمت ${DAILY_WHEEL_ATTEMPTS} محاولاتك المسموح بها اليوم. ارجع بكرة وجرب حظك من جديد ❤️`
        );

        return;
      }

      console.error(
        "Wheel Spin Error:",
        error
      );

      alert(
        "حصل خطأ أثناء تشغيل العجلة، حاول مرة أخرى."
      );

      return;
    }

    // ===================================================
    // SELECT PRIZE
    // ===================================================

    const randomIndex =
      Math.floor(
        Math.random() *
          activeWheelPrizes.length
      );

    const selectedPrize =
      activeWheelPrizes[randomIndex];

    // ===================================================
    // CALCULATE ROTATION
    // ===================================================

    const segmentAngle =
      360 / activeWheelPrizes.length;

    const prizeCenterAngle =
      randomIndex * segmentAngle +
      segmentAngle / 2;

    const targetAngle =
      360 - prizeCenterAngle;

    const extraRotation =
      360 * 6;

    const normalizedCurrentRotation =
      ((wheelRotation % 360) + 360) % 360;

    const normalizedTargetAngle =
      ((targetAngle % 360) + 360) % 360;

    let additionalRotation =
      normalizedTargetAngle -
      normalizedCurrentRotation;

    if (additionalRotation < 0) {
      additionalRotation += 360;
    }

    const finalRotation =
      wheelRotation +
      extraRotation +
      additionalRotation;

    // ===================================================
    // START SPIN
    // ===================================================

    setIsSpinning(true);

    setWheelResult(null);

    setSpinCountdown(SPIN_DURATION);

    if (spinTimerRef.current) {
      clearTimeout(
        spinTimerRef.current
      );
    }

    setWheelRotation(
      finalRotation
    );

    // ===================================================
    // FINISH
    // ===================================================

    spinTimerRef.current =
      setTimeout(() => {
        setIsSpinning(false);

        setSpinCountdown(0);

        setWheelResult(
          selectedPrize
        );

        setWheelRotation(
          finalRotation
        );
      }, SPIN_DURATION * 1000);
  };

  // ===================================================
  // DYNAMIC CSS
  // ===================================================

  const homeStyle = {
    fontFamily: homeFontFamily,
    fontSize: `${Number(theme?.baseFontSize ?? theme?.bodyFontSize ?? 16)}px`,
    "--store-font-family": homeFontFamily,
    "--store-heading-font-family": headingFontFamily,
    "--store-body-font-size": `${Number(theme?.bodyFontSize ?? theme?.baseFontSize ?? 16)}px`,
    "--store-heading-font-size": `${Number(theme?.headingFontSize ?? 28)}px`,
    "--store-primary":
      theme?.primary ||
      "#D4AF37",

    "--store-secondary":
      theme?.secondary ||
      "#0B1F3A",

    "--store-accent":
      theme?.accent ||
      "#D4AF37",

    "--store-page-background":
      theme?.pageBackground ||
      "#F5F5F5",

    "--store-card-background":
      theme?.cardBackground ||
      "#FFFFFF",

    "--store-text-primary":
      theme?.textPrimary ||
      "#313133",

    "--store-text-secondary":
      theme?.textSecondary ||
      "#75757A",

    "--store-border":
      theme?.border ||
      "#E5E5E5",

    "--store-button-background":
      theme?.buttonBackground ||
      "#D4AF37",

    "--store-button-text":
      theme?.buttonText ||
      "#FFFFFF",

    "--store-navbar-background":
      theme?.navbarBackground ||
      "#FFFFFF",

    "--store-navbar-text":
      theme?.navbarText ||
      "#313133",

    "--store-category-background":
      theme?.categoryBarBackground ||
      "#FFFFFF",

    "--store-category-text":
      theme?.categoryBarText ||
      "#313133",

    "--store-top-strip-background":
      theme?.topStripBackground ||
      "#D4AF37",

    "--store-top-strip-text":
      theme?.topStripText ||
      "#FFFFFF",

    "--store-footer-background":
      theme?.footerBackground ||
      "#313133",

    "--store-footer-text":
      theme?.footerText ||
      "#FFFFFF",

    "--store-footer-brand":
      theme?.footerBrand ||
      theme?.accent ||
      "#D4AF37",

    "--store-footer-button-background":
      theme?.footerButtonBackground ||
      theme?.accent ||
      "#D4AF37",

    "--store-footer-button-text":
      theme?.footerButtonText ||
      theme?.primary ||
      "#071A36",

    "--store-footer-button-hover":
      theme?.footerButtonHover ||
      "#B8941F",

    "--store-heading-color":
      theme?.headingColor ||
      theme?.primary ||
      "#071A36",

    "--store-link-color":
      theme?.linkColor ||
      theme?.primary ||
      "#071A36",

    "--store-price-color":
      theme?.priceColor ||
      theme?.primary ||
      "#071A36",

    "--store-sale-color":
      theme?.saleColor ||
      "#C62828",

    "--store-success-color":
      theme?.successColor ||
      "#16803C",

    "--store-warning-color":
      theme?.warningColor ||
      "#B7791F",

    "--store-error-color":
      theme?.errorColor ||
      "#C62828",

    "--store-section-background":
      theme?.sectionBackground ||
      theme?.cardBackground ||
      "#FFFFFF",

    "--store-input-background":
      theme?.inputBackground ||
      "#FFFFFF",
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="home-page jumia-home"
      style={homeStyle}
      dir="rtl"
    >
      {/* =================================================
          ACTIVE ANNOUNCEMENT BARS
      ================================================= */}

      {storeSettings?.topStrip?.enabled !== false && visibleAnnouncementBars.length > 0 && (
        <div
          className="home-announcement-bars"
          style={{
            width: "100%",
            overflow: "hidden",
            position: "relative",
            zIndex: 1000,
          }}
        >
          {visibleAnnouncementBars.map(
            (bar, index) => {
              const text =
                String(
                  bar?.text || ""
                ).trim();

              const background =
                bar?.backgroundColor ||
                theme?.topStripBackground ||
                "#D4AF37";

              const textColor =
                bar?.textColor ||
                theme?.topStripText ||
                "#FFFFFF";

              const speed =
                Math.max(
                  5,
                  Number(
                    bar?.speed ||
                      storeSettings?.topStrip
                        ?.speed ||
                      40
                  )
                );

              const type =
                String(
                  bar?.type ||
                    "marquee"
                ).toLowerCase();

              const content =
                bar?.link ? (
                  <button
                    type="button"
                    onClick={() => {
                      const link =
                        String(
                          bar.link
                        ).trim();

                      if (!link) {
                        return;
                      }

                      if (
                        /^https?:\/\//i.test(
                          link
                        )
                      ) {
                        window.location.href =
                          link;
                      } else {
                        navigate(
                          link
                        );
                      }
                    }}
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "inherit",
                      font: "inherit",
                      fontWeight:
                        800,
                      cursor:
                        "pointer",
                      padding:
                        0,
                    }}
                  >
                    {text}
                  </button>
                ) : (
                  text
                );

              return (
                <div
                  key={
                    bar?.id ||
                    `${text}-${index}`
                  }
                  className={`home-announcement-bar ${
                    type === "marquee"
                      ? "is-marquee"
                      : ""
                  }`}
                  style={{
                    minHeight: `${Number(
                      bar?.height ||
                        storeSettings?.topStrip
                          ?.height ||
                        42
                    )}px`,

                    background,

                    color:
                      textColor,

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      type ===
                      "marquee"
                        ? "flex-start"
                        : "center",

                    overflow:
                      "hidden",

                    fontSize: `${Number(
                      bar?.fontSize ??
                        storeSettings?.topStrip
                          ?.fontSize ??
                        15
                    )}px`,

                    fontWeight:
                      Number(
                        bar?.fontWeight ??
                          storeSettings?.topStrip
                            ?.fontWeight ??
                          700
                      ),

                    fontFamily:
                      bar?.fontFamily ||
                      "Cairo, sans-serif",

                    direction:
                      bar?.direction ||
                      storeSettings?.topStrip
                        ?.direction ||
                      "rtl",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {type ===
                  "marquee" ? (
                    <div
                      style={{
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        gap:
                          "70px",
                        minWidth:
                          "max-content",
                        paddingInline:
                          "40px",
                        animation: `homeAnnouncementMarquee-${index} ${speed}s linear infinite`,
                      }}
                    >
                      <span>
                        {content}
                      </span>

                      <span
                        aria-hidden="true"
                      >
                        {text}
                      </span>

                      <span
                        aria-hidden="true"
                      >
                        {text}
                      </span>

                      <span
                        aria-hidden="true"
                      >
                        {text}
                      </span>
                    </div>
                  ) : (
                    <span>
                      {content}
                    </span>
                  )}

                  <style>{`
                    @keyframes homeAnnouncementMarquee-${index} {
                      from {
                        transform: translateX(0);
                      }

                      to {
                        transform: translateX(-25%);
                      }
                    }
                  `}</style>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar
        setCurrentView={
          setCurrentView
        }
        cartCount={cartCount}
        searchTerm={searchTerm}
        setSearchTerm={
          setSearchTerm
        }
        admin={admin}
        products={visibleProducts}
        storeSettings={storeSettings}
        storeMenuItems={storeMenuItems}
        theme={theme}
        setSelectedCategory={
          setSelectedCategory
        }
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="jumia-main">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="jumia-hero">
          <HeroSlider
            banners={banners}
            bannerSettings={
              storeSettings?.bannerSettings
            }
            settings={storeSettings}
          />
        </section>

        {storeSettings?.featuresBar?.enabled !== false &&
          Array.isArray(
            storeSettings?.featuresBar?.items
          ) &&
          storeSettings.featuresBar.items.filter(
            (item) =>
              item?.active !== false &&
              item?.enabled !== false &&
              item?.visible !== false
          ).length > 0 && (
            <section
              className="home-features-bar"
              style={{
                background:
                  storeSettings.featuresBar.background ||
                  theme?.sectionBackground ||
                  "#FFFFFF",
                color:
                  storeSettings.featuresBar.color ||
                  theme?.textPrimary ||
                  "#071A36",
                minHeight: `${Number(
                  storeSettings.featuresBar.height ?? 80
                )}px`,
                fontSize: `${Number(
                  storeSettings.featuresBar.fontSize ?? 16
                )}px`,
              }}
            >
              <div className="home-features-bar-inner">
                {storeSettings.featuresBar.items
                  .filter(
                    (item) =>
                      item?.active !== false &&
                      item?.enabled !== false &&
                      item?.visible !== false
                  )
                  .map((item, index) => (
                    <button
                      key={
                        item?.id ||
                        `${item?.title || item?.name}-${index}`
                      }
                      type="button"
                      disabled={!item?.link && !item?.url}
                      onClick={() => {
                        const link = String(
                          item?.link || item?.url || ""
                        ).trim();
                        if (!link) return;
                        if (/^https?:\/\//i.test(link)) {
                          window.location.href = link;
                        } else {
                          navigate(link);
                        }
                      }}
                    >
                      <span className="home-feature-icon">
                        {item?.icon || item?.emoji || "✓"}
                      </span>
                      <span>
                        <strong>
                          {item?.title ||
                            item?.name ||
                            "ميزة"}
                        </strong>
                        {(item?.description ||
                          item?.text) && (
                          <small>
                            {item.description ||
                              item.text}
                          </small>
                        )}
                      </span>
                    </button>
                  ))}
              </div>
            </section>
          )}

        {showAdminPopup && activePopupAd && (
          <div
            className="home-admin-popup-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={
              activePopupAd.title || "إعلان"
            }
          >
            <div className="home-admin-popup">
              {activePopupAd.closable !== false && (
                <button
                  type="button"
                  className="home-admin-popup-close"
                  onClick={() =>
                    setShowAdminPopup(false)
                  }
                  aria-label="إغلاق"
                >
                  ×
                </button>
              )}

              {activePopupAd.image && (
                <img
                  src={activePopupAd.image}
                  alt={
                    activePopupAd.title || "إعلان"
                  }
                />
              )}

              {activePopupAd.title && (
                <h2>{activePopupAd.title}</h2>
              )}

              {activePopupAd.text && (
                <p>{activePopupAd.text}</p>
              )}

              {(activePopupAd.link ||
                activePopupAd.buttonText) && (
                <button
                  type="button"
                  className="home-admin-popup-action"
                  onClick={() => {
                    const link = String(
                      activePopupAd.link || ""
                    ).trim();
                    if (!link) return;
                    if (
                      /^https?:\/\//i.test(link)
                    ) {
                      window.location.href = link;
                    } else {
                      navigate(link);
                    }
                  }}
                >
                  {activePopupAd.buttonText ||
                    texts.viewAll}
                </button>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            WHEEL OF FORTUNE
        ================================================= */}

        {shouldShowWheelInStore &&
          activeWheelPrizes.length >
            0 && (
            <section
              className="jumia-section wheel-section"
              style={{
                padding:
                  "24px 12px",
              }}
            >
              <div
                className="wheel-inline-card"
                style={{
                  position:
                    "relative",
                  overflow:
                    "hidden",
                  maxWidth:
                    "1050px",
                  margin:
                    "0 auto",
                  padding:
                    "26px 20px 30px",
                  borderRadius:
                    "18px",
                  background:
                    "linear-gradient(145deg, #fff8e8 0%, #ffffff 45%, #fff3d2 100%)",
                  border:
                    `1px solid ${theme?.accent || "#D4AF37"}`,
                  boxShadow:
                    "0 10px 35px rgba(0,0,0,.12)",
                }}
              >

                {/* TOP GOLD STRIP */}

                <div
                  style={{
                    position:
                      "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height:
                      "7px",
                    background:
                      `linear-gradient(90deg, ${theme?.accent || "#D4AF37"}, ${theme?.primary || "#071A36"}, ${theme?.accent || "#D4AF37"})`,
                  }}
                />

                {/* HEADER */}

                <div
                  className="wheel-header"
                  style={{
                    textAlign:
                      "center",
                    marginBottom:
                      "18px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: "8px",
                      background:
                        "#313133",
                      color:
                        "#fff",
                      borderRadius:
                        "999px",
                      padding:
                        "6px 16px",
                      fontSize:
                        "13px",
                      fontWeight:
                        "800",
                      marginBottom:
                        "8px",
                    }}
                  >
                    🎁 SPIN & WIN
                  </div>

                  <h2
                    style={{
                      margin:
                        "4px 0",
                      fontSize:
                        "28px",
                      fontWeight:
                        "900",
                      color:
                        "#313133",
                    }}
                  >
                    {wheelSettings?.title ||
                      "🎡 جرب حظك!"}
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#75757A",
                      fontSize:
                        "15px",
                    }}
                  >
                    {wheelSettings?.description ||
                      "لف العجلة واكسب عرضك"}
                  </p>
                </div>

                {/* =================================================
                    WHEEL AREA
                ================================================= */}

                <div
                  className="wheel-game-area"
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    position:
                      "relative",
                  }}
                >

                  {/* POINTER */}

                  <div
                    className="wheel-pointer"
                    style={{
                      position:
                        "absolute",
                      top:
                        "-2px",
                      left:
                        "50%",
                      transform:
                        "translateX(-50%)",
                      zIndex: 30,
                      width:
                        "0",
                      height:
                        "0",
                      borderLeft:
                        "17px solid transparent",
                      borderRight:
                        "17px solid transparent",
                      borderTop:
                        "34px solid #313133",
                      filter:
                        "drop-shadow(0 3px 3px rgba(0,0,0,.25))",
                    }}
                  />

                  {/* GOLD POINTER TIP */}

                  <div
                    style={{
                      position:
                        "absolute",
                      top:
                        "0px",
                      left:
                        "50%",
                      transform:
                        "translateX(-50%)",
                      zIndex: 31,
                      width:
                        "0",
                      height:
                        "0",
                      borderLeft:
                        "7px solid transparent",
                      borderRight:
                        "7px solid transparent",
                      borderTop:
                        `15px solid ${theme?.accent || "#D4AF37"}`,
                    }}
                  />

                  {/* WHEEL STAND AREA */}

                  <div
                    className="wheel-stand-area"
                    style={{
                      position:
                        "relative",
                      width:
                        "300px",
                      maxWidth:
                        "88vw",
                      paddingBottom:
                        "58px",
                      display:
                        "flex",
                      justifyContent:
                        "center",
                    }}
                  >

                    {/* OUTER BLACK RIM */}

                    <div
                      className="wheel-outer-rim"
                      style={{
                        width:
                          "300px",
                        height:
                          "300px",
                        maxWidth:
                          "88vw",
                        maxHeight:
                          "88vw",
                        borderRadius:
                          "50%",
                        padding:
                          "13px",
                        background:
                          "linear-gradient(145deg, #111 0%, #343434 48%, #090909 100%)",
                        boxShadow:
                          "0 12px 25px rgba(0,0,0,.35)",
                        position:
                          "relative",
                      }}
                    >

                      {/* GOLD RING */}

                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
                          borderRadius:
                            "50%",
                          padding:
                            "6px",
                          background:
                            "linear-gradient(145deg, #FFD86A, #B87900, #FFE39A, #B87900)",
                          position:
                            "relative",
                        }}
                      >

                        {/* BULBS */}

                        {Array.from({
                          length: 24,
                        }).map(
                          (_, index) => {
                            const angle =
                              (360 / 24) *
                              index;

                            return (
                              <span
                                key={
                                  index
                                }
                                className="wheel-bulb"
                                style={{
                                  position:
                                    "absolute",
                                  left:
                                    "50%",
                                  top:
                                    "50%",
                                  width:
                                    "9px",
                                  height:
                                    "9px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    isSpinning
                                      ? "#ffffff"
                                      : "#FFE7A0",
                                  boxShadow:
                                    isSpinning
                                      ? "0 0 12px rgba(255,255,255,1), 0 0 20px rgba(255,220,100,.95)"
                                      : "0 0 8px rgba(255,220,100,.95)",
                                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-137px)`,
                                  zIndex:
                                    20,
                                  transition:
                                    "background .2s ease, box-shadow .2s ease",
                                }}
                              />
                            );
                          }
                        )}

                        {/* ROTATING WHEEL */}

                        <div
                          className="wheel-circle"
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            borderRadius:
                              "50%",
                            background:
                              wheelGradient,
                            position:
                              "relative",
                            overflow:
                              "hidden",
                            transform: `rotate(${wheelRotation}deg)`,

                            transition:
                              isSpinning
                                ? `transform ${SPIN_DURATION}s cubic-bezier(.17,.67,.12,.99)`
                                : "none",

                            boxShadow:
                              "inset 0 0 0 3px rgba(255,255,255,.35), inset 0 0 25px rgba(0,0,0,.35)",
                          }}
                        >

                          {/* SEGMENT SEPARATORS */}

                          {activeWheelPrizes.map(
                            (
                              prize,
                              index
                            ) => {
                              const angle =
                                (360 /
                                  activeWheelPrizes.length) *
                                index;

                              return (
                                <div
                                  key={
                                    `line-${prize?.id || index}`
                                  }
                                  style={{
                                    position:
                                      "absolute",
                                    width:
                                      "2px",
                                    height:
                                      "50%",
                                    background:
                                      "rgba(255,255,255,.82)",
                                    left:
                                      "50%",
                                    top:
                                      "0",
                                    transformOrigin:
                                      "bottom center",
                                    transform: `translateX(-50%) rotate(${angle}deg)`,
                                    zIndex:
                                      2,
                                    boxShadow:
                                      "0 0 2px rgba(0,0,0,.25)",
                                  }}
                                />
                              );
                            }
                          )}

                          {/* PRIZE LABELS */}

                          {activeWheelPrizes.map(
                            (
                              prize,
                              index
                            ) => {
                              const count =
                                activeWheelPrizes.length;

                              const prizeColor =
                                getWheelPrizeColor(
                                  prize,
                                  index
                                );

                              const textColor =
                                getContrastTextColor(
                                  prizeColor
                                );

                              return (
                                <div
                                  key={
                                    prize?.id ||
                                    index
                                  }
                                  style={{
                                    position:
                                      "absolute",
                                    left:
                                      "50%",
                                    top:
                                      "50%",
                                    width:
                                      count <= 6
                                        ? "105px"
                                        : "92px",
                                    marginLeft:
                                      count <= 6
                                        ? "-52.5px"
                                        : "-46px",
                                    marginTop:
                                      count <= 6
                                        ? "-14px"
                                        : "-12px",
                                    textAlign:
                                      "center",
                                    color:
                                      textColor,
                                    fontSize:
                                      count >
                                      10
                                        ? "9px"
                                        : count >
                                            8
                                          ? "10px"
                                          : count >
                                              6
                                            ? "11px"
                                            : "12px",
                                    fontWeight:
                                      "900",
                                    lineHeight:
                                      "1.12",
                                    letterSpacing:
                                      "-0.1px",
                                    whiteSpace:
                                      "normal",
                                    wordBreak:
                                      "break-word",
                                    zIndex:
                                      5,
                                    pointerEvents:
                                      "none",
                                    transformOrigin:
                                      "center center",
                                    transition:
                                      "none",
                                    ...getWheelLabelStyle(
                                      prize,
                                      index
                                    ),
                                  }}
                                >
                                  {prize?.title ||
                                    "جائزة"}
                                </div>
                              );
                            }
                          )}

                          {/* CENTER DISC */}

                          <div
                            style={{
                              position:
                                "absolute",
                              left:
                                "50%",
                              top:
                                "50%",
                              transform:
                                "translate(-50%, -50%)",
                              width:
                                "76px",
                              height:
                                "76px",
                              borderRadius:
                                "50%",
                              background:
                                "radial-gradient(circle at 35% 30%, #555, #171717 60%, #050505)",
                              border:
                                `5px solid ${theme?.accent || "#D4AF37"}`,
                              boxShadow:
                                "0 3px 12px rgba(0,0,0,.5), inset 0 0 10px rgba(255,255,255,.08)",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexDirection:
                                "column",
                              color:
                                "#fff",
                              zIndex:
                                15,
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  "17px",
                                lineHeight:
                                  "17px",
                                letterSpacing:
                                  ".5px",
                              }}
                            >
                              SPIN
                            </strong>

                            <span
                              style={{
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "900",
                                color:
                                  "#D4AF37",
                              }}
                            >
                              & WIN
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STAND */}

                    <div
                      style={{
                        position:
                          "absolute",
                        bottom:
                          "0",
                        left:
                          "50%",
                        transform:
                          "translateX(-50%)",
                        width:
                          "125px",
                        height:
                          "55px",
                        background:
                          "linear-gradient(180deg, #333, #111)",
                        clipPath:
                          "polygon(28% 0, 72% 0, 100% 100%, 0 100%)",
                        zIndex:
                          2,
                        filter:
                          "drop-shadow(0 6px 5px rgba(0,0,0,.25))",
                      }}
                    />

                    <div
                      style={{
                        position:
                          "absolute",
                        bottom:
                          "-2px",
                        left:
                          "50%",
                        transform:
                          "translateX(-50%)",
                        width:
                          "180px",
                        height:
                          "14px",
                        borderRadius:
                          "7px",
                        background:
                          "#151515",
                        boxShadow:
                          "0 5px 12px rgba(0,0,0,.3)",
                        zIndex:
                          3,
                      }}
                    />
                  </div>

                  {/* SPIN BUTTON */}

                  {!wheelResult && (
                    <>
                      <button
                        type="button"
                        className="wheel-spin-btn"
                        onClick={
                          spinWheel
                        }
                        disabled={
                          isSpinning ||
                          wheelAttempts >=
                            DAILY_WHEEL_ATTEMPTS
                        }
                        style={{
                          marginTop:
                            "8px",
                          minWidth:
                            "210px",
                          padding:
                            "13px 25px",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          background:
                            isSpinning ||
                            wheelAttempts >=
                              DAILY_WHEEL_ATTEMPTS
                              ? "#999"
                              : "#D4AF37",
                          color:
                            "#fff",
                          fontSize:
                            "17px",
                          fontWeight:
                            "900",
                          cursor:
                            isSpinning ||
                            wheelAttempts >=
                              DAILY_WHEEL_ATTEMPTS
                              ? "not-allowed"
                              : "pointer",
                          boxShadow:
                            isSpinning ||
                            wheelAttempts >=
                              DAILY_WHEEL_ATTEMPTS
                              ? "none"
                              : "0 5px 14px rgba(246,139,30,.35)",
                          transition:
                            "all .2s ease",
                        }}
                      >
                        {isSpinning
                          ? `🎡 جاري الدوران... ${spinCountdown}`
                          : wheelAttempts >=
                              DAILY_WHEEL_ATTEMPTS
                            ? "⏳ انتهت محاولات اليوم"
                            : "🎯 لف العجلة"}
                      </button>

                      {/* ATTEMPTS */}

                      <div
                        className="wheel-attempts"
                        style={{
                          marginTop:
                            "12px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          gap:
                            "8px",
                          flexWrap:
                            "wrap",
                          fontSize:
                            "14px",
                          fontWeight:
                            "800",
                          color:
                            "#313133",
                        }}
                      >
                        <span>
                          🎯 المحاولات:
                        </span>

                        <strong
                          style={{
                            color:
                              "#D4AF37",
                          }}
                        >
                          {
                            wheelAttempts
                          }
                        </strong>

                        <span>
                          /
                        </span>

                        <strong>
                          {
                            DAILY_WHEEL_ATTEMPTS
                          }
                        </strong>
                      </div>

                      {/* RESET TIMER */}

                      <div
                        style={{
                          marginTop:
                            "7px",
                          fontSize:
                            "12px",
                          color:
                            "#75757A",
                          textAlign:
                            "center",
                        }}
                      >
                        {wheelAttempts >=
                        DAILY_WHEEL_ATTEMPTS ? (
                          <>
                            ⏰ المحاولات
                            هتتجدد بعد{" "}

                            <strong
                              style={{
                                color:
                                  "#D4AF37",
                                direction:
                                  "ltr",
                                display:
                                  "inline-block",
                              }}
                            >
                              {
                                timeUntilReset
                              }
                            </strong>
                          </>
                        ) : (
                          <>
                            ⏰ تجدد المحاولات
                            يوميًا بعد منتصف
                            الليل
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* RESULT */}

                  {wheelResult && (
                    <div
                      className="wheel-result"
                      style={{
                        marginTop:
                          "18px",
                        width:
                          "min(420px, 92%)",
                        textAlign:
                          "center",
                        background:
                          "#fff",
                        border:
                          `2px solid ${theme?.accent || "#D4AF37"}`,
                        borderRadius:
                          "14px",
                        padding:
                          "20px",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,.12)",
                        animation:
                          "wheelResultPop .45s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "45px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        🎉
                      </div>

                      <h3
                        style={{
                          margin:
                            "0 0 6px",
                          color:
                            "#313133",
                          fontSize:
                            "24px",
                          fontWeight:
                            "900",
                        }}
                      >
                        مبروك!
                      </h3>

                      <p
                        style={{
                          margin:
                            "0 0 5px",
                          color:
                            "#75757A",
                        }}
                      >
                        لقد فزت بـ
                      </p>

                      <strong
                        style={{
                          display:
                            "block",
                          fontSize:
                            "21px",
                          color:
                            "#D4AF37",
                          marginBottom:
                            "8px",
                        }}
                      >
                        {wheelResult?.title ||
                          "جائزة"}
                      </strong>

                      {wheelResult?.type ===
                        "discount" && (
                        <small
                          style={{
                            display:
                              "block",
                            fontWeight:
                              "800",
                          }}
                        >
                          خصم{" "}
                          {
                            wheelResult?.value ||
                            0
                          }
                          %
                        </small>
                      )}

                      {wheelResult?.type ===
                        "fixed" && (
                        <small
                          style={{
                            display:
                              "block",
                            fontWeight:
                              "800",
                          }}
                        >
                          خصم{" "}
                          {
                            wheelResult?.value ||
                            0
                          }{" "}
                          ج.م
                        </small>
                      )}

                      {wheelResult?.type ===
                        "free-shipping" && (
                        <small
                          style={{
                            display:
                              "block",
                            fontWeight:
                              "800",
                          }}
                        >
                          شحن مجاني 🚚
                        </small>
                      )}

                      {wheelResult?.type ===
                        "gift" && (
                        <small
                          style={{
                            display:
                              "block",
                            fontWeight:
                              "800",
                          }}
                        >
                          هدية 🎁
                        </small>
                      )}

                      {wheelResult?.type ===
                        "nothing" && (
                        <small
                          style={{
                            display:
                              "block",
                            fontWeight:
                              "800",
                          }}
                        >
                          حظ أوفر المرة
                          القادمة ❤️
                        </small>
                      )}

                      <button
                        type="button"
                        className="wheel-result-close"
                        onClick={() =>
                          setWheelResult(
                            null
                          )
                        }
                        style={{
                          marginTop:
                            "15px",
                          border:
                            "none",
                          borderRadius:
                            "7px",
                          padding:
                            "10px 35px",
                          background:
                            "#313133",
                          color:
                            "#fff",
                          fontWeight:
                            "800",
                          cursor:
                            "pointer",
                        }}
                      >
                        تمام
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

        {/* =================================================
            CUSTOMER GAMES - CONTROLLED BY ADMIN
        ================================================= */}
        {activeGames.length > 0 && (
          <section className="customer-games-section">
            <div className="customer-games-heading">
              <div>
                <span className="customer-games-kicker">🎮 PLAY & WIN</span>
                <h2>العاب الجوائز</h2>
                <p>اختار لعبتك وجرب حظك في تجربة تفاعلية حقيقية.</p>
              </div>
              <div className="customer-games-live"><span /> متاحة الآن</div>
            </div>

            <div className="customer-games-grid">
              {activeGames.map(([key, game]) => {
                const gameMeta = {
                  cards: { icon: "🃏", className: "cards", action: texts.chooseCard },
                  scratch: { icon: "🪙", className: "scratch", action: texts.startScratch },
                  mystery: { icon: "🎁", className: "mystery", action: texts.chooseBox },
                  pick: { icon: "🎯", className: "pick", action: texts.chooseTarget },
                  dice: { icon: "🎲", className: "dice", action: texts.rollDice },
                }[key] || { icon: "🎮", className: "default", action: texts.playNow };
                return (
                  <article className={`customer-game-card ${gameMeta.className}`} key={key}>
                    <div className="customer-game-glow" />
                    <div className="customer-game-top">
                      <span className="customer-game-icon">{gameMeta.icon}</span>
                      <span className="customer-game-pill">{Math.max(1, Number(game.attemptsPerUser ?? 2))} {texts.attemptsLabel}</span>
                    </div>
                    <div className="customer-game-art">
                      {key === "cards" && <div className="game-cards-art"><i>?</i><i>?</i><i>?</i></div>}
                      {key === "scratch" && <div className="game-scratch-art"><span>🎁</span><b>اكشط</b></div>}
                      {key === "mystery" && <div className="game-boxes-art"><i>🎁</i><i>🎁</i><i>🎁</i></div>}
                      {key === "pick" && <div className="game-target-art"><b>🎯</b><span>+</span></div>}
                      {key === "dice" && <div className="game-dice-art">🎲</div>}
                    </div>
                    <h3>{game.title || gameMeta.icon}</h3>
                    <p>{game.description || "اختار واربح"}</p>
                    <button
                      type="button"
                      className="customer-game-play"
                      disabled={gameBusy}
                      onClick={() => openCustomerGame(key)}
                    >
                      {gameBusy && activeGame === key ? texts.playingNow : `${gameMeta.action}  ←`}
                    </button>
                  </article>
                );
              })}
            </div>

            {activeGame && !gameResult && (
              <div className={`game-stage-overlay game-stage-${activeGame}`} role="dialog" aria-modal="true">
                <div className="game-stage-card">
                  <button type="button" className="game-stage-close" onClick={() => { if (!gameBusy) setActiveGame(null); }}>×</button>
                  <div className="game-stage-head">
                    <span>{activeGame === "cards" ? "🃏" : activeGame === "scratch" ? "🪙" : activeGame === "mystery" ? "🎁" : activeGame === "pick" ? "🎯" : "🎲"}</span>
                    <h3>{gamesSettings?.[activeGame]?.title}</h3>
                    <p>{gamesSettings?.[activeGame]?.description}</p>
                  </div>

                  {activeGame === "cards" && (
                    <div className="cards-stage">
                      {[0,1,2].map((i) => <button key={i} type="button" className={`flip-card ${gameBusy ? "flipping" : ""}`} onClick={() => !gameBusy && playCustomerGame("cards", i)}><span>★</span><b>؟</b></button>)}
                    </div>
                  )}
                  {activeGame === "scratch" && (
                    <button type="button" className={`scratch-stage ${gameBusy ? "scratching" : ""}`} onClick={() => !gameBusy && playCustomerGame("scratch", null)}><span className="scratch-cover">{texts.scratchHere}</span><span className="scratch-prize">{texts.yourPrize}</span></button>
                  )}
                  {activeGame === "mystery" && (
                    <div className="mystery-stage">{[0,1,2].map((i) => <button key={i} type="button" className={`mystery-box box-${i} ${gameBusy ? "opening" : ""}`} onClick={() => !gameBusy && playCustomerGame("mystery", i)}><span>🎁</span><b>صندوق {i+1}</b></button>)}</div>
                  )}
                  {activeGame === "pick" && (
                    <div className="pick-stage">{[0,1,2,3,4].map((i) => <button key={i} type="button" className="target-pick" onClick={() => !gameBusy && playCustomerGame("pick", i)}><span>{i % 2 ? "✦" : "●"}</span></button>)}</div>
                  )}
                  {activeGame === "dice" && (
                    <div className={`dice-stage ${gameBusy ? "rolling" : ""}`}><button type="button" className="big-dice" onClick={() => !gameBusy && playCustomerGame("dice", null)}><span>🎲</span></button><small>{gameBusy ? texts.diceRolling : texts.pressDice}</small></div>
                  )}
                  {gameBusy && <div className="game-loading"><span /> {texts.determiningPrize}</div>}
                </div>
              </div>
            )}

            {gameResult && (
              <div className="game-stage-overlay game-result-overlay" role="dialog" aria-modal="true">
                <div className="game-result-card">
                  <div className="game-result-burst">🎉</div>
                  <span className="game-result-label">{texts.gameResult}</span>
                  <h3>{gameResult.message}</h3>
                  <div className="game-result-prize">
                    <span>🏆</span>
                    <strong>{gameResult.prize?.title || texts.noLuck}</strong>
                    {gameResult.prize?.type === "discount" && <small>{texts.discountLabel} {gameResult.prize?.value ?? 0}%</small>}
                    {gameResult.prize?.type === "fixed" && <small>{texts.discountLabel} {gameResult.prize?.value ?? 0} جنيه</small>}
                    {gameResult.prize?.type === "free-shipping" && <small>{texts.freeShippingLabel}</small>}
                    {gameResult.prize?.type === "gift" && <small>{texts.giftLabel}</small>}
                  </div>
                  <p>استخدم الجائزة حسب شروط المتجر المعروضة في صفحة إتمام الطلب.</p>
                  <button type="button" onClick={closeGameResult}>{texts.resultClose}</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            QUICK CATEGORIES
        ================================================= */}

        <section className="jumia-section quick-shop-section">
          <div className="jumia-section-title">
            <h2>
              {texts.categoriesTitle}
            </h2>

          </div>

          <div className="jumia-categories">
            {rootCategories.length >
            0 ? (
                rootCategories.map((category) => {
                  const children =
                    getChildCategories(
                      category?.id
                    );

                  const categoryProducts =
                    getCategoryProducts(
                      category
                    );

                  return (
                    <button
                      type="button"
                      key={
                        category?.id ||
                        category?.name
                      }
                      className="store-choice-card"
                      style={getCategoryCardStyle(
                        category
                      )}
                      onClick={() =>
                        openCategory(
                          category
                        )
                      }
                    >
                      <div className="store-choice-image">
                        {category?.image ? (
                          <img
                            src={
                              category.image
                            }
                            alt={
                              category?.name ||
                              texts.categoryEmptyTitle
                            }
                            loading="lazy"
                          />
                        ) : (
                          <span>
                            {category?.icon ||
                              "📦"}
                          </span>
                        )}
                      </div>

                      <strong>
                        {category?.name ||
                          texts.categoryEmptyTitle}
                      </strong>

                      <small>
                        {children.length >
                        0
                          ? `${children.length} قسم فرعي`
                          : categoryProducts.length >
                              0
                            ? `${categoryProducts.length} منتج`
                            : texts.viewAll}
                      </small>
                    </button>
                  );
                })
            ) : (
              <div className="store-empty-choice">
                <div>📂</div>

                <h3>{texts.categoryEmptyTitle}</h3>

                <p>{texts.categoryEmptyText}</p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            TODAY OFFERS
        ================================================= */}

        {offers.length > 0 && (
          <section
            className="jumia-section"
            id="today-offers"
          >
            <ProductsSlider
              title={texts.offersTitle}
              badge="خصم"
              badgeClass="offer"
              products={offers}
              addToCart={
                addToCart
              }
              onTitleClick={() =>
                scrollToSection(
                  "#today-offers"
                )
              }
            />
          </section>
        )}

        {/* =================================================
            BEST SELLERS
        ================================================= */}

        {bestSellers.length >
          0 && (
          <section
            className="jumia-section"
            id="best-sellers"
          >
            <ProductsSlider
              title={texts.bestSellersTitle}
              badge="الأكثر مبيعاً"
              badgeClass="best"
              products={
                bestSellers
              }
              addToCart={
                addToCart
              }
              onTitleClick={() =>
                scrollToSection(
                  "#best-sellers"
                )
              }
            />
          </section>
        )}

        {/* =================================================
            ADMIN ANNOUNCEMENTS
        ================================================= */}

        {activeAnnouncements.length > 0 && (
          <section className="jumia-promo-strip">
            <div className="promo-content">
              <span className="promo-icon">🏷️</span>
              <div>
                <h2>
                  {activeAnnouncements[0]?.title ||
                    texts.offersTitle}
                </h2>
                <p>
                  {activeAnnouncements[0]?.text ||
                    storeSettings?.announcement ||
                    ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const link = String(
                  activeAnnouncements[0]?.link ||
                    ""
                ).trim();

                if (/^https?:\/\//i.test(link)) {
                  window.location.href = link;
                } else if (link) {
                  navigate(link);
                } else {
                  scrollToSection("#today-offers");
                }
              }}
            >
              {texts.viewAll}
            </button>
          </section>
        )}

        {/* =================================================
            NEW ARRIVALS
        ================================================= */}

        {newArrivals.length >
          0 && (
          <section
            className="jumia-section"
            id="new-arrivals"
          >
            <ProductsSlider
              title={texts.newArrivalsTitle}
              badge="جديد"
              badgeClass="new"
              products={
                newArrivals
              }
              addToCart={
                addToCart
              }
              onTitleClick={() =>
                scrollToSection(
                  "#new-arrivals"
                )
              }
            />
          </section>
        )}

        {/* =================================================
            RECOMMENDED
        ================================================= */}

        {recommended.length >
          0 && (
          <section
            className="jumia-section"
            id="recommended"
          >
            <ProductsSlider
              title={texts.recommendedTitle}
              badge="مميز"
              badgeClass="recommended"
              products={
                recommended
              }
              addToCart={
                addToCart
              }
              onTitleClick={() =>
                scrollToSection(
                  "#recommended"
                )
              }
            />
          </section>
        )}

        {/* =================================================
            CATEGORY PRODUCT SECTIONS
        ================================================= */}

        {rootCategories.map(
          (category) => {
            const categoryProducts =
              getCategoryProducts(
                category
              );

            if (
              categoryProducts.length ===
              0
            ) {
              return null;
            }

            return (
              <section
                key={
                  `products-${category?.id}`
                }
                className="jumia-section category-products-section"
              >
                <div className="jumia-section-title">
                  <div>
                    <h2>
                      {category?.name ||
                        "منتجات"}
                    </h2>

                    <p>
                      {texts.productsTitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openCategory(
                        category
                      )
                    }
                  >
                    عرض الكل
                  </button>
                </div>

                <ProductsSlider
                  title=""
                  products={
                    categoryProducts
                  }
                  addToCart={
                    addToCart
                  }
                  onTitleClick={() =>
                    openCategory(
                      category
                    )
                  }
                />
              </section>
            );
          }
        )}

        {/* =================================================
            FILTERED PRODUCTS
        ================================================= */}

        <section
          className="products-section"
          ref={productsRef}
          style={{
            display: "none",
          }}
        >
          <div className="section-header">
            <div>
              <h2>
                جميع المنتجات
              </h2>

              {selectedCategory !==
                "الكل" && (
                <p>
                  القسم:{" "}
                  <strong>
                    {
                      selectedCategory
                    }
                  </strong>
                </p>
              )}
            </div>

            <span>
              {
                filteredProducts.length
              }{" "}
              منتج
            </span>
          </div>

          <div className="products-filters">
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >
              <option value="default">
                ترتيب افتراضي
              </option>

              <option value="low">
                الأقل سعرًا
              </option>

              <option value="high">
                الأعلى سعرًا
              </option>

              <option value="rating">
                الأعلى تقييمًا
              </option>

              <option value="new">
                الأحدث
              </option>

              <option value="best">
                الأكثر مبيعًا
              </option>
            </select>

            <input
              type="number"
              min="0"
              placeholder="من سعر"
              value={minPrice}
              onChange={(event) =>
                setMinPrice(
                  event.target.value
                )
              }
            />

            <input
              type="number"
              min="0"
              placeholder="إلى سعر"
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(
                  event.target.value
                )
              }
            />

            <label>
              <input
                type="checkbox"
                checked={
                  showOffersOnly
                }
                onChange={(event) =>
                  setShowOffersOnly(
                    event.target.checked
                  )
                }
              />

              <span>
                العروض فقط
              </span>
            </label>

            <button
              type="button"
              onClick={
                resetFilters
              }
            >
              إعادة ضبط
            </button>
          </div>
        </section>
      </main>

      {/* =================================================
          FLOATING CUSTOMER SERVICE WHATSAPP
      ================================================= */}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`home-floating-whatsapp ${draggingWhatsapp ? "is-dragging" : ""}`}
          style={whatsappPosition?.x !== null && whatsappPosition?.y !== null ? { left: whatsappPosition.x, top: whatsappPosition.y, right: "auto", bottom: "auto" } : undefined}
          onPointerDown={startWhatsappDrag}
          onClick={(event) => {
            if (draggingWhatsapp) event.preventDefault();
          }}
          aria-label="خدمة العملاء واتساب"
          title="خدمة العملاء - واتساب"
        >
          <span className="home-whatsapp-ring" />
          <span className="home-whatsapp-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="31" height="31" fill="none">
              <path d="M16 3.5C9.1 3.5 3.5 8.8 3.5 15.3c0 2.3.7 4.5 2 6.3L4 27.9l6.5-2.1c1.7.9 3.6 1.3 5.5 1.3 6.9 0 12.5-5.3 12.5-11.8S22.9 3.5 16 3.5Z" fill="white"/>
              <path d="M21.9 18.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.9-.9-3.2-1.6-4.5-3.6-.3-.5.3-.4.9-1.4.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6 0 1.5 1.1 2.9 1.3 3.1.2.2 2.2 3.4 5.4 4.7 2.7 1.1 3.2.9 3.8.8.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4Z" fill="#20d66b"/>
            </svg>
          </span>
          <span className="home-whatsapp-label">خدمة العملاء</span>
        </a>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer
        storeName={
          storeSettings?.storeName ||
          "ســـــَــــــــوا"
        }
        logo={
          storeSettings?.logo || ""
        }
        phone={
          storeSettings?.phone || ""
        }
        whatsapp={
          storeSettings?.whatsapp || ""
        }
        email={
          storeSettings?.email || ""
        }
        address={
          storeSettings?.address || ""
        }
        facebook={
          storeSettings?.facebook || ""
        }
        instagram={
          storeSettings?.instagram || ""
        }
        telegram={
          storeSettings?.telegram || ""
        }
        tiktok={
          storeSettings?.tiktok || ""
        }
        youtube={
          storeSettings?.youtube || ""
        }
        contactLink={
          storeSettings?.contactLink ||
          storeSettings?.contactUrl ||
          "/support"
        }
        hotlineWhatsApp={
          storeSettings?.hotlineWhatsApp ||
          storeSettings?.whatsapp ||
          ""
        }
        texts={texts}
        menuItems={storeMenuItems}
        theme={theme}
      />

      {/* =================================================
          WHEEL POPUP
      ================================================= */}

      {showWheelPopup &&
        popupReady &&
        shouldShowWheelAsPopup &&
        activeWheelPrizes.length > 0 && (
          <div
            className="wheel-popup-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="عجلة الحظ"
          >
            <div className="wheel-popup-container">
              {wheelSettings?.popupClosable !== false && (
                <button
                  type="button"
                  className="wheel-popup-close"
                  onClick={closeWheelPopup}
                  aria-label="إغلاق"
                >
                  ×
                </button>
              )}

              <div className="wheel-header wheel-popup-header">
                <div className="wheel-popup-badge">
                  🎁 SPIN & WIN
                </div>

                <h2>
                  {wheelSettings?.title ||
                    "🎡 جرب حظك!"}
                </h2>

                <p>
                  {wheelSettings?.description ||
                    "لف العجلة واكسب عرضك"}
                </p>
              </div>

              <div className="wheel-game-area wheel-popup-game-area">
                <div className="wheel-popup-wheel-wrap">
                  <div className="wheel-pointer wheel-popup-pointer" />

                  <div className="wheel-popup-outer-rim">
                    <div
                      className="wheel-circle wheel-popup-circle"
                      style={{
                        background:
                          wheelGradient,

                        transform: `rotate(${wheelRotation}deg)`,

                        transition:
                          isSpinning
                            ? `transform ${SPIN_DURATION}s cubic-bezier(.17,.67,.12,.99)`
                            : "none",
                      }}
                    >
                      {activeWheelPrizes.map(
                        (
                          prize,
                          index
                        ) => {
                          const angle =
                            (360 /
                              activeWheelPrizes.length) *
                            index;

                          return (
                            <div
                              key={`popup-line-${prize?.id || index}`}
                              className="wheel-popup-separator"
                              style={{
                                transform: `translateX(-50%) rotate(${angle}deg)`,
                              }}
                            />
                          );
                        }
                      )}

                      {activeWheelPrizes.map(
                        (
                          prize,
                          index
                        ) => {
                          const count =
                            activeWheelPrizes.length;

                          const prizeColor =
                            getWheelPrizeColor(
                              prize,
                              index
                            );

                          const textColor =
                            getContrastTextColor(
                              prizeColor
                            );

                          return (
                            <div
                              key={`popup-prize-${prize?.id || index}`}
                              className="wheel-popup-prize-label"
                              style={{
                                color:
                                  textColor,

                                fontSize:
                                  count >
                                  10
                                    ? "9px"
                                    : count >
                                        8
                                      ? "10px"
                                      : count >
                                          6
                                        ? "11px"
                                        : "12px",

                                ...getWheelLabelStyle(
                                  prize,
                                  index
                                ),
                              }}
                            >
                              {prize?.title ||
                                "جائزة"}
                            </div>
                          );
                        }
                      )}

                      <div className="wheel-popup-center">
                        <strong>
                          SPIN
                        </strong>

                        <span>
                          & WIN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!wheelResult && (
                  <>
                    <button
                      type="button"
                      className="wheel-spin-btn wheel-popup-spin-btn"
                      onClick={spinWheel}
                      disabled={
                        isSpinning ||
                        wheelAttempts >=
                          DAILY_WHEEL_ATTEMPTS
                      }
                    >
                      {isSpinning
                        ? `🎡 جاري الدوران... ${spinCountdown}`
                        : wheelAttempts >=
                            DAILY_WHEEL_ATTEMPTS
                          ? "⏳ انتهت محاولات اليوم"
                          : "🎯 لف العجلة"}
                    </button>

                    <div className="wheel-attempts wheel-popup-attempts">
                      🎯 المحاولات:

                      <strong>
                        {
                          wheelAttempts
                        }
                      </strong>

                      <span>
                        /
                      </span>

                      <strong>
                        {
                          DAILY_WHEEL_ATTEMPTS
                        }
                      </strong>
                    </div>
                  </>
                )}

                {wheelResult && (
                  <div className="wheel-result wheel-popup-result">
                    <div className="wheel-popup-result-icon">
                      🎉
                    </div>

                    <h3>
                      مبروك!
                    </h3>

                    <p>
                      لقد فزت بـ
                    </p>

                    <strong>
                      {wheelResult?.title ||
                        "جائزة"}
                    </strong>

                    {wheelResult?.type ===
                      "discount" && (
                      <small>
                        خصم{" "}
                        {
                          wheelResult?.value ||
                          0
                        }
                        %
                      </small>
                    )}

                    {wheelResult?.type ===
                      "fixed" && (
                      <small>
                        خصم{" "}
                        {
                          wheelResult?.value ||
                          0
                        }{" "}
                        ج.م
                      </small>
                    )}

                    {wheelResult?.type ===
                      "free-shipping" && (
                      <small>
                        شحن مجاني 🚚
                      </small>
                    )}

                    {wheelResult?.type ===
                      "gift" && (
                      <small>
                        هدية 🎁
                      </small>
                    )}

                    {wheelResult?.type ===
                      "nothing" && (
                      <small>
                        حظ أوفر المرة القادمة ❤️
                      </small>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setWheelResult(
                          null
                        )
                      }
                    >
                      تمام
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* =================================================
          WHEEL + FLASH TIMER ANIMATIONS
      ================================================= */}

      <style>
        {`
          /* ===============================================
             WHEEL POPUP
          =============================================== */

          .wheel-popup-overlay {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            z-index: 999999;
            overflow-y: auto;
            isolation: isolate;
          }

          .wheel-popup-container {
            position: relative;
            width: min(520px, 100%);
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            background: #fff;
            border-radius: 20px;
            padding: 25px 15px 30px;
            box-sizing: border-box;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
            animation: wheelPopupIn 0.3s ease;
            direction: rtl;
          }

          .wheel-popup-close {
            position: absolute;
            top: 12px;
            left: 12px;
            width: 38px;
            height: 38px;
            border: none;
            border-radius: 50%;
            background: #313133;
            color: #fff;
            font-size: 28px;
            line-height: 1;
            cursor: pointer;
            z-index: 100;
          }

          .wheel-popup-close:hover {
            transform: scale(1.05);
          }

          .wheel-popup-header {
            text-align: center;
            margin-bottom: 18px;
          }

          .wheel-popup-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #313133;
            color: #fff;
            border-radius: 999px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 8px;
          }

          .wheel-popup-header h2 {
            margin: 4px 0;
            font-size: 28px;
            font-weight: 900;
            color: #313133;
          }

          .wheel-popup-header p {
            margin: 5px 0 0;
            color: #75757A;
            font-size: 15px;
          }

          .wheel-popup-game-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .wheel-popup-wheel-wrap {
            position: relative;
            width: 330px;
            height: 365px;
            max-width: 92vw;
            display: flex;
            justify-content: center;
            padding-top: 10px;
            box-sizing: border-box;
          }

          .wheel-popup-pointer {
            position: absolute;
            top: 4px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 30;
            width: 0;
            height: 0;
            border-left: 17px solid transparent;
            border-right: 17px solid transparent;
            border-top: 34px solid #313133;
            filter: drop-shadow(0 3px 3px rgba(0,0,0,.25));
          }

          .wheel-popup-outer-rim {
            width: 330px;
            height: 330px;
            max-width: 88vw;
            max-height: 88vw;
            border-radius: 50%;
            padding: 12px;
            box-sizing: border-box;
            background: linear-gradient(145deg,#f7c948,#d4af37,#9b7410,#f7d774);
            box-shadow: 0 10px 30px rgba(0,0,0,.25);
            position: relative;
          }

          .wheel-popup-circle {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 0 0 3px rgba(255,255,255,.35), inset 0 0 25px rgba(0,0,0,.35);
          }

          .wheel-popup-separator {
            position: absolute;
            width: 2px;
            height: 50%;
            background: rgba(255,255,255,.82);
            left: 50%;
            top: 0;
            transform-origin: bottom center;
            z-index: 2;
          }

          .wheel-popup-prize-label {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 105px;
            margin-left: -52.5px;
            margin-top: -14px;
            text-align: center;
            font-weight: 900;
            line-height: 1.12;
            white-space: normal;
            word-break: break-word;
            z-index: 5;
            pointer-events: none;
          }

          .wheel-popup-center {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 30%, #555, #171717 60%, #050505);
            border: 5px solid #D4AF37;
            box-shadow: 0 3px 12px rgba(0,0,0,.5), inset 0 0 10px rgba(255,255,255,.08);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #fff;
            z-index: 15;
          }

          .wheel-popup-center strong {
            font-size: 17px;
            line-height: 17px;
          }

          .wheel-popup-center span {
            font-size: 12px;
            font-weight: 900;
            color: #D4AF37;
          }

          .wheel-popup-spin-btn {
            margin-top: 8px;
          }

          .wheel-popup-attempts {
            margin-top: 12px;
          }

          .wheel-popup-result {
            width: min(420px, 92%);
            text-align: center;
            box-sizing: border-box;
          }

          .wheel-popup-result h3 {
            margin: 0 0 6px;
            color: #313133;
            font-size: 24px;
            font-weight: 900;
          }

          .wheel-popup-result p {
            margin: 0 0 5px;
            color: #75757A;
          }

          .wheel-popup-result > strong {
            display: block;
            font-size: 21px;
            color: #D4AF37;
          }

          .wheel-popup-result small {
            display: block;
            margin-top: 5px;
            font-weight: 800;
          }

          .wheel-popup-result button {
            margin-top: 15px;
            border: none;
            border-radius: 7px;
            padding: 10px 35px;
            background: #313133;
            color: #fff;
            font-weight: 800;
            cursor: pointer;
          }

          .wheel-popup-result-icon {
            font-size: 45px;
            margin-bottom: 5px;
          }

          @keyframes wheelPopupIn {
            from {
              opacity: 0;
              transform: scale(0.92);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes wheelResultPop {
            0% {
              opacity: 0;
              transform: scale(.75) translateY(15px);
            }

            70% {
              transform: scale(1.04);
            }

            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .wheel-spin-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 18px rgba(246,139,30,.42) !important;
          }

          .wheel-spin-btn:active:not(:disabled) {
            transform: translateY(0);
          }

          /* ADMIN CONTROLLED HOME THEME */
          .jumia-home,
          .jumia-home * {
            font-family: var(--store-font-family, Cairo, sans-serif);
          }

          .jumia-home {
            background: var(--store-page-background, #F0F4F8);
            color: var(--store-text-primary, #071A36);
            font-size: var(--store-body-font-size, 16px);
          }

          .jumia-home h1,
          .jumia-home h2,
          .jumia-home h3,
          .jumia-home h4,
          .jumia-home h5,
          .jumia-home h6 {
            font-family: var(--store-heading-font-family, Cairo, sans-serif);
            color: var(--store-heading-color, #071A36);
          }

          .jumia-section,
          .quick-shop-section {
            background: var(--store-section-background, #FFFFFF);
          }

          .jumia-section-title h2 {
            font-size: var(--store-heading-font-size, 28px);
            color: var(--store-heading-color, #071A36);
          }

          .store-choice-card {
            background: var(--store-card-background, #FFFFFF);
            color: var(--store-text-primary, #071A36);
            border-color: var(--store-border, #D9DFE8);
          }

          .store-choice-card strong,
          .store-choice-card small {
            color: var(--store-text-primary, #071A36);
          }

          .customer-game-card,
          .game-stage-card,
          .game-result-card {
            font-family: var(--store-font-family, Cairo, sans-serif);
          }

          .customer-game-play,
          .game-result-card button {
            background: var(--store-button-background, #0B1F3A);
            color: var(--store-button-text, #FFFFFF);
          }

          .customer-game-card h3,
          .game-result-card h3 {
            color: var(--store-heading-color, #071A36);
          }

          .customer-game-pill,
          .game-result-prize strong {
            color: var(--store-accent, #D4AF37);
          }

          .home-features-bar {
            width: 100%;
            box-sizing: border-box;
          }

          .home-features-bar-inner {
            width: min(1200px, 100%);
            margin: 0 auto;
            padding: 12px 16px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 10px;
            box-sizing: border-box;
          }

          .home-features-bar-inner button {
            min-height: 54px;
            border: 0;
            border-radius: 12px;
            background: transparent;
            color: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            padding: 8px 10px;
            font: inherit;
            text-align: right;
          }

          .home-features-bar-inner button:not(:disabled) {
            cursor: pointer;
          }

          .home-features-bar-inner button:disabled {
            cursor: default;
          }

          .home-features-bar-inner strong {
            display: block;
            font-weight: 900;
          }

          .home-features-bar-inner small {
            display: block;
            margin-top: 3px;
            opacity: .75;
            font-size: .82em;
          }

          .home-feature-icon {
            font-size: 26px;
            line-height: 1;
            color: var(--store-accent);
          }

          .home-admin-popup-overlay {
            position: fixed;
            inset: 0;
            z-index: 999997;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background: rgba(0, 0, 0, .62);
            direction: rtl;
          }

          .home-admin-popup {
            position: relative;
            width: min(520px, 94vw);
            max-height: 90vh;
            overflow: auto;
            box-sizing: border-box;
            padding: 18px;
            border-radius: 18px;
            background: var(--store-card-background, #fff);
            color: var(--store-text-primary, #071A36);
            box-shadow: 0 25px 70px rgba(0,0,0,.35);
            text-align: center;
          }

          .home-admin-popup > img {
            display: block;
            width: 100%;
            max-height: 62vh;
            object-fit: contain;
            border-radius: 12px;
          }

          .home-admin-popup h2 {
            margin: 16px 0 8px;
            color: var(--store-heading-color, #071A36);
            font-weight: 900;
          }

          .home-admin-popup p {
            margin: 0 0 14px;
            line-height: 1.7;
            color: var(--store-text-secondary, #64748B);
          }

          .home-admin-popup-close {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 5;
            width: 38px;
            height: 38px;
            border: none;
            border-radius: 50%;
            background: var(--store-primary, #071A36);
            color: #fff;
            font-size: 24px;
            cursor: pointer;
          }

          .home-admin-popup-action {
            border: none;
            border-radius: 10px;
            padding: 11px 24px;
            background: var(--store-footer-brand, #D4AF37);
            color: var(--store-primary, #071A36);
            font-weight: 900;
            cursor: pointer;
          }

          @media (max-width: 600px) {
            .home-features-bar-inner {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              padding: 10px;
            }

            .home-features-bar-inner button {
              min-height: 48px;
              padding: 7px;
              font-size: .9em;
            }

            .home-feature-icon {
              font-size: 22px;
            }
          }

          /* ===============================================
             FLASH SALES TIMER
          =============================================== */

          .flash-countdown {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-right: auto;
            margin-left: 15px;
            direction: ltr;
          }

          .flash-countdown-label {
            direction: rtl;
            font-size: 13px;
            font-weight: 800;
            color: #313133;
            white-space: nowrap;
          }

          .flash-countdown-boxes {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .flash-time-box {
            min-width: 48px;
            height: 48px;
            padding: 4px 5px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #313133;
            color: #fff;
            border-radius: 7px;
            box-shadow: 0 3px 8px rgba(0,0,0,.16);
          }

          .flash-time-box strong {
            display: block;
            font-size: 18px;
            line-height: 19px;
            font-weight: 900;
            font-variant-numeric: tabular-nums;
          }

          .flash-time-box small {
            display: block;
            margin-top: 2px;
            font-size: 9px;
            line-height: 10px;
            color: #FFD166;
            font-weight: 800;
          }

          .flash-time-separator {
            font-size: 20px;
            line-height: 1;
            font-weight: 900;
            color: #D4AF37;
          }

          /* ===============================================
             WHEEL BULBS
          =============================================== */

          .wheel-bulb {
            transform-origin: center center;
          }

          /* ===============================================
             WHEEL LABELS
          =============================================== */

          .wheel-circle > div {
            box-sizing: border-box;
          }

          @media (max-width: 900px) {
            .flash-countdown {
              margin-right: 0;
              margin-left: 8px;
            }

            .flash-countdown-label {
              display: none;
            }

            .flash-time-box {
              min-width: 43px;
              height: 43px;
            }

            .flash-time-box strong {
              font-size: 16px;
            }

            .flash-time-separator {
              font-size: 17px;
            }
          }

          @media (max-width: 600px) {
            .wheel-inline-card {
              padding: 22px 10px 25px !important;
              border-radius: 14px !important;
            }

            .wheel-header h2 {
              font-size: 22px !important;
            }

            .wheel-stand-area,
            .wheel-outer-rim {
              width: 270px !important;
              height: 270px !important;
            }

            .wheel-outer-rim {
              max-width: 82vw !important;
              max-height: 82vw !important;
            }

            .wheel-game-area {
              overflow: hidden;
            }

            /* =============================================
               MOBILE BULBS
            ============================================= */

            .wheel-bulb {
              width: 8px !important;
              height: 8px !important;
            }

            /* =============================================
               MOBILE WHEEL LABELS
            ============================================= */

            .wheel-circle > div {
              font-size: 10px;
            }

            /* =============================================
               FLASH TIMER MOBILE
            ============================================= */

            .jumia-flash-header {
              flex-wrap: wrap;
              gap: 10px;
            }

            .flash-countdown {
              order: 3;
              width: 100%;
              margin: 3px 0 0;
              justify-content: center;
            }

            .flash-countdown-label {
              display: inline-block;
              font-size: 11px;
            }

            .flash-time-box {
              min-width: 42px;
              height: 42px;
            }

            .flash-time-box strong {
              font-size: 15px;
            }

            .flash-time-box small {
              font-size: 8px;
            }

            .flash-time-separator {
              font-size: 16px;
            }
          }
          /* =================================================
             CUSTOMER GAMES
          ================================================= */
          .customer-games-section {
            position: relative;
            max-width: 1180px;
            margin: 26px auto;
            padding: 28px 16px 34px;
            direction: rtl;
            border-radius: 28px;
            overflow: hidden;
            background: linear-gradient(145deg, var(--store-primary, #071A36), var(--store-secondary, #0B1F3A));
            box-shadow: 0 22px 55px rgba(7,26,54,.18);
          }
          .customer-games-section::before { content:""; position:absolute; inset:-40% -10%; background:radial-gradient(circle, rgba(212,175,55,.22), transparent 35%); pointer-events:none; }
          .customer-games-heading { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:20px; color:#fff; margin-bottom:22px; }
          .customer-games-kicker { display:inline-flex; padding:6px 12px; border-radius:999px; background:rgba(212,175,55,.16); border:1px solid rgba(212,175,55,.4); color:#F4D06F; font-size:12px; font-weight:900; letter-spacing:.5px; }
          .customer-games-heading h2 { margin:8px 0 4px; font-size:clamp(24px,4vw,34px); font-weight:1000; }
          .customer-games-heading p { margin:0; color:rgba(255,255,255,.72); }
          .customer-games-live { display:flex; align-items:center; gap:8px; color:#fff; font-weight:800; white-space:nowrap; }
          .customer-games-live span { width:9px; height:9px; border-radius:50%; background:#36d675; box-shadow:0 0 0 5px rgba(54,214,117,.13); animation:gameLivePulse 1.5s infinite; }
          .customer-games-grid { position:relative; z-index:2; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; }
          .customer-game-card { position:relative; min-height:335px; padding:18px; border-radius:22px; overflow:hidden; background:linear-gradient(160deg,#fff,#f7f9fc); color:#071A36; border:1px solid rgba(255,255,255,.7); box-shadow:0 16px 35px rgba(0,0,0,.18); transition:.28s ease; text-align:center; }
          .customer-game-card:hover { transform:translateY(-7px); box-shadow:0 24px 45px rgba(0,0,0,.27); }
          .customer-game-glow { position:absolute; width:120px; height:120px; border-radius:50%; top:-50px; left:-40px; background:rgba(212,175,55,.22); filter:blur(5px); }
          .customer-game-top { position:relative; display:flex; align-items:center; justify-content:space-between; gap:8px; }
          .customer-game-icon { font-size:28px; filter:drop-shadow(0 5px 6px rgba(0,0,0,.15)); }
          .customer-game-pill { padding:5px 8px; border-radius:999px; background:#eef2f7; color:#64748b; font-size:10px; font-weight:900; }
          .customer-game-art { height:120px; display:flex; align-items:center; justify-content:center; }
          .customer-game-card h3 { position:relative; margin:3px 0 6px; font-size:18px; font-weight:1000; }
          .customer-game-card p { position:relative; min-height:42px; margin:0 0 13px; color:#64748b; font-size:12px; line-height:1.7; }
          .customer-game-play { position:relative; width:100%; border:0; border-radius:13px; padding:11px 10px; background:linear-gradient(135deg,#D4AF37,#F4D06F); color:#071A36; font-weight:1000; cursor:pointer; box-shadow:0 7px 18px rgba(212,175,55,.25); transition:.2s; }
          .customer-game-play:hover { transform:translateY(-2px); }
          .customer-game-play:disabled { opacity:.6; cursor:not-allowed; }
          .game-cards-art { display:flex; justify-content:center; align-items:center; gap:0; transform:rotate(-5deg); }
          .game-cards-art i { width:57px; height:82px; display:flex; align-items:center; justify-content:center; border-radius:9px; border:4px solid #fff; background:linear-gradient(145deg,#071A36,#163c6d); color:#F4D06F; font-size:28px; font-style:normal; box-shadow:0 9px 18px rgba(7,26,54,.3); margin-left:-16px; }
          .game-cards-art i:nth-child(2){transform:translateY(-9px) rotate(7deg);z-index:2;background:linear-gradient(145deg,#D4AF37,#9c7410);color:#071A36;}
          .game-cards-art i:nth-child(3){transform:translateY(2px) rotate(12deg);}
          .game-scratch-art { position:relative; width:115px; height:86px; border-radius:18px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(145deg,#D4AF37,#f7e19a); box-shadow:inset 0 0 0 5px rgba(255,255,255,.45),0 12px 22px rgba(212,175,55,.25); transform:rotate(-3deg); }
          .game-scratch-art span{font-size:35px}.game-scratch-art b{font-size:12px;color:#071A36}
          .game-boxes-art {display:flex;align-items:flex-end;gap:5px}.game-boxes-art i{font-style:normal;font-size:38px;filter:drop-shadow(0 9px 6px rgba(0,0,0,.18))}.game-boxes-art i:nth-child(2){font-size:52px;transform:translateY(-10px)}
          .game-target-art{position:relative;width:105px;height:105px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:repeating-radial-gradient(circle,#fff 0 10px,#C62828 11px 20px);box-shadow:0 12px 24px rgba(0,0,0,.2)}.game-target-art b{font-size:40px;filter:drop-shadow(0 3px 2px rgba(0,0,0,.3))}.game-target-art span{position:absolute;font-size:32px;color:#fff;font-weight:1000}
          .game-dice-art{font-size:86px;filter:drop-shadow(0 14px 12px rgba(0,0,0,.22));animation:diceFloat 2.4s ease-in-out infinite}

          .game-stage-overlay { position:fixed; inset:0; z-index:1000000; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(2,8,20,.78); backdrop-filter:blur(8px); direction:rtl; }
          .game-stage-card,.game-result-card{position:relative;width:min(600px,96vw);min-height:360px;padding:28px;border-radius:28px;background:linear-gradient(160deg,#fff,#f3f6fb);box-shadow:0 35px 90px rgba(0,0,0,.45);overflow:hidden;text-align:center;animation:gameStageIn .35s ease}
          .game-stage-close{position:absolute;top:12px;left:12px;width:40px;height:40px;border:0;border-radius:50%;background:#071A36;color:#fff;font-size:25px;cursor:pointer;z-index:5}.game-stage-head span{font-size:44px}.game-stage-head h3{margin:4px 0;font-size:26px;color:#071A36;font-weight:1000}.game-stage-head p{margin:0 0 20px;color:#64748b}
          .cards-stage{display:flex;justify-content:center;gap:16px;padding:18px 0 25px}.flip-card{width:130px;height:185px;border:0;border-radius:18px;background:linear-gradient(145deg,#071A36,#163c6d);box-shadow:0 18px 28px rgba(7,26,54,.25);color:#F4D06F;cursor:pointer;transform-style:preserve-3d;transition:.35s}.flip-card:hover{transform:translateY(-9px) rotateY(8deg)}.flip-card span{display:block;font-size:35px}.flip-card b{display:block;font-size:55px}.flip-card.flipping{animation:cardFlip 1s infinite}
          .scratch-stage{position:relative;width:min(360px,90%);height:190px;margin:15px auto 25px;border:0;border-radius:22px;background:linear-gradient(145deg,#D4AF37,#F4D06F);box-shadow:inset 0 0 0 6px rgba(255,255,255,.45),0 18px 35px rgba(0,0,0,.2);cursor:pointer;overflow:hidden}.scratch-cover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(135deg,#8a8d93 0 8px,#b9bdc3 8px 16px);color:#fff;font-size:25px;font-weight:1000;text-shadow:0 2px 4px rgba(0,0,0,.3);transition:.5s}.scratch-prize{font-size:55px;font-weight:1000;color:#071A36}.scratch-stage.scratching .scratch-cover{transform:translateY(-100%);opacity:.15}.scratch-stage:hover .scratch-cover{filter:brightness(1.08)}
          .mystery-stage{display:flex;justify-content:center;gap:15px;padding:25px 0 35px}.mystery-box{width:150px;height:150px;border:0;border-radius:20px;background:linear-gradient(145deg,#071A36,#183f70);color:#F4D06F;box-shadow:0 18px 28px rgba(7,26,54,.25);cursor:pointer;transition:.3s}.mystery-box:hover{transform:translateY(-10px) rotate(-2deg)}.mystery-box span{display:block;font-size:55px}.mystery-box b{display:block;margin-top:8px}.mystery-box.opening{animation:boxOpen .9s ease}
          .pick-stage{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;max-width:460px;margin:30px auto 45px}.target-pick{aspect-ratio:1;border:5px solid #fff;border-radius:50%;background:repeating-radial-gradient(circle,#C62828 0 12%,#fff 13% 25%,#071A36 26% 39%,#fff 40% 53%,#C62828 54%);box-shadow:0 10px 20px rgba(0,0,0,.2);color:#fff;cursor:pointer;transition:.25s}.target-pick:hover{transform:scale(1.08)}.target-pick span{font-size:28px;text-shadow:0 2px 4px #000}
          .dice-stage{display:flex;flex-direction:column;align-items:center;gap:18px;padding:20px 0 35px}.big-dice{border:0;background:transparent;font-size:125px;cursor:pointer;filter:drop-shadow(0 20px 15px rgba(0,0,0,.25))}.dice-stage.rolling .big-dice{animation:diceRoll .75s linear infinite}.dice-stage small{color:#64748b;font-weight:800}
          .game-loading{display:flex;align-items:center;justify-content:center;gap:10px;color:#071A36;font-weight:900}.game-loading span{width:12px;height:12px;border-radius:50%;border:3px solid #D4AF37;border-top-color:transparent;animation:spin .7s linear infinite}
          .game-result-card{width:min(460px,96vw);min-height:auto;padding:34px}.game-result-burst{font-size:65px;animation:resultBounce .9s ease infinite alternate}.game-result-label{display:inline-flex;margin-top:4px;padding:6px 12px;border-radius:999px;background:#fff4cf;color:#9b7110;font-size:12px;font-weight:1000}.game-result-card h3{font-size:24px;color:#071A36;margin:14px 0}.game-result-prize{padding:20px;border-radius:20px;background:linear-gradient(145deg,#071A36,#173c69);color:#fff;box-shadow:0 16px 30px rgba(7,26,54,.2)}.game-result-prize span{display:block;font-size:45px}.game-result-prize strong{display:block;font-size:22px;color:#F4D06F;margin-top:5px}.game-result-prize small{display:block;margin-top:6px;color:#fff}.game-result-card p{color:#64748b;line-height:1.8;font-size:12px}.game-result-card button{border:0;border-radius:13px;padding:12px 28px;background:linear-gradient(135deg,#D4AF37,#F4D06F);color:#071A36;font-weight:1000;cursor:pointer}

          /* =================================================
             FLOATING WHATSAPP CUSTOMER SERVICE
          ================================================= */
          .home-floating-whatsapp{position:fixed;right:18px;bottom:90px;z-index:999990;width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;background:linear-gradient(145deg,#20d66b,#0aa851);box-shadow:0 10px 25px rgba(0,0,0,.28);touch-action:none;cursor:grab;animation:whatsappFloat 2.8s ease-in-out infinite}.home-floating-whatsapp.is-dragging{cursor:grabbing;animation:none}.home-whatsapp-icon{display:flex;align-items:center;justify-content:center;color:#fff;font-weight:1000}.home-whatsapp-icon svg{display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.12))}.home-whatsapp-ring{position:absolute;inset:-5px;border:2px solid rgba(37,211,102,.55);border-radius:50%;animation:whatsappRing 2s ease-out infinite}.home-whatsapp-label{position:absolute;right:66px;white-space:nowrap;padding:6px 9px;border-radius:8px;background:#071A36;color:#fff;font-size:11px;font-weight:900;opacity:0;transform:translateX(8px);transition:.2s;pointer-events:none}.home-floating-whatsapp:hover .home-whatsapp-label{opacity:1;transform:none}

          @keyframes gameLivePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
          @keyframes gameStageIn{from{opacity:0;transform:scale(.9) translateY(18px)}to{opacity:1;transform:none}}
          @keyframes cardFlip{0%{transform:rotateY(0)}50%{transform:rotateY(180deg) scale(1.04)}100%{transform:rotateY(360deg)}}
          @keyframes boxOpen{0%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(-14px) rotate(-4deg) scale(1.04)}70%{transform:translateY(0) rotate(4deg)}}
          @keyframes diceRoll{0%{transform:rotate(0) translateY(0)}50%{transform:rotate(180deg) translateY(-15px)}100%{transform:rotate(360deg) translateY(0)}}
          @keyframes diceFloat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-9px) rotate(5deg)}}
          @keyframes resultBounce{from{transform:scale(1) rotate(-4deg)}to{transform:scale(1.1) rotate(4deg)}}
          @keyframes whatsappFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes whatsappRing{0%{transform:scale(.85);opacity:.8}80%,100%{transform:scale(1.45);opacity:0}}

          @media (max-width: 1000px){
            .customer-games-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
          }
          @media (max-width: 680px){
            .customer-games-section{margin:18px 8px;padding:22px 10px;border-radius:22px}.customer-games-heading{align-items:flex-start;flex-direction:column}.customer-games-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.customer-game-card{min-height:315px;padding:14px}.customer-game-art{height:105px}.cards-stage{gap:7px}.flip-card{width:95px;height:145px}.mystery-stage{gap:7px}.mystery-box{width:100px;height:125px}.mystery-box span{font-size:42px}.pick-stage{gap:8px}.home-floating-whatsapp{width:54px;height:54px;right:12px;bottom:76px}.home-whatsapp-label{display:none}}
          @media (max-width: 430px){.customer-games-grid{grid-template-columns:1fr}.customer-game-card{min-height:300px}.customer-game-art{height:100px}}
        `}

      </style>
    </div>
  );
}

export default Home;
