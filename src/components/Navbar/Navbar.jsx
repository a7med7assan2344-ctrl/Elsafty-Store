/* =====================================================
   ELSAFTY STORE - NAVBAR
   RTL / JUMIA STYLE / RESPONSIVE
   ADMIN CONTROLLED

   FEATURES:
   - Store settings from Admin
   - Announcement bars from Admin ONLY
   - All six games from Admin
   - Categories from Admin
   - Products search from Firestore
   - Wishlist
   - Account
   - Cart
   - Mega menu
   - Wheel popup

   IMPORTANT:
   - HEADER ONLY IS FIXED
   - ANNOUNCEMENT BARS ARE BELOW HEADER
   - ANNOUNCEMENT BARS SCROLL WITH PAGE
   - ANNOUNCEMENT SETTINGS COME FROM FIRESTORE ONLY
===================================================== */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";

import { useNavigate } from "react-router-dom";

import { WishlistContext } from "../../context/WishlistContext";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

import { getCategories } from "../../services/categoryService";

import "./Navbar.css";


/* =====================================================
   DEFAULT STORE SETTINGS
===================================================== */

const DEFAULT_STORE_SETTINGS = {
  storeName: "ســـــَــــــــوا",

  logo: "/logo/logo.png",

  theme: {
    primary: "#071A36",
    secondary: "#0B1F3A",
    accent: "#D4AF37",

    pageBackground: "#f5f6f8",
    cardBackground: "#ffffff",

    textPrimary: "#1f2937",
    textSecondary: "#6b7280",

    border: "#d9dfe8",

    buttonBackground: "#071A36",
    buttonText: "#ffffff",

    navbarBackground: "#071A36",
    navbarText: "#ffffff",

    categoryBarBackground: "#ffffff",
    categoryBarText: "#071A36",

    topStripBackground: "",
    topStripText: "",

    footerBackground: "#071A36",
    footerText: "#ffffff",
  },

  bannerSettings: {},

  topStrip: {
    enabled: false,
    direction: "rtl",
    speed: 40,
    height: 42,
    fontSize: 15,
    items: [],
  },

  featuresBar: {},
};


/* =====================================================
   DEFAULT ANNOUNCEMENT BAR

   IMPORTANT:
   NO FIXED COLORS.
   ALL VALUES COME FROM ADMIN / FIRESTORE.
===================================================== */

const DEFAULT_ANNOUNCEMENT_BAR = {
  id: "",
  content: "",
  type: "marquee",
  order: 0,
  active: true,

  backgroundColor: "",
  textColor: "",

  fontFamily: "",

  fontSize: 15,

  speed: 40,

  direction: "rtl",

  height: 42,

  link: "",
};


/* =====================================================
   DEFAULT WHEEL SETTINGS
===================================================== */

const DEFAULT_WHEEL_SETTINGS = {
  enabled: false,

  displayMode: "store",

  title: "🎡 عجلة الحظ",

  description:
    "لف العجلة واربح جائزتك!",

  attemptsPerUser: 1,

  popupEnabled: false,

  popupDelay: 3,

  showOncePerDay: true,

  allowClose: true,

  prizes: [],
};


/* =====================================================
   DEFAULT GAMES
===================================================== */

const DEFAULT_GAME = {
  enabled: false,

  title: "",

  description: "",

  attemptsPerUser: 1,

  requireLogin: false,

  startDate: "",

  endDate: "",

  maxWinners: 0,

  winMessage:
    "مبروك! كسبت جائزة 🎉",

  prizes: [],
};


const DEFAULT_GAMES_SETTINGS = {
  wheel: {
    ...DEFAULT_GAME,

    title: "🎡 عجلة الحظ",

    description:
      "لف العجلة واربح جائزتك!",
  },

  flipCards: {
    ...DEFAULT_GAME,

    title: "🃏 الكروت المقلوبة",

    description:
      "اختار كارت وشوف هتكسب إيه!",
  },

  scratch: {
    ...DEFAULT_GAME,

    title: "🪙 اكشط واربح",

    description:
      "اكشط الكارت واكتشف جائزتك!",
  },

  mysteryBoxes: {
    ...DEFAULT_GAME,

    title: "🎁 الصناديق الغامضة",

    description:
      "اختار صندوق واكتشف الجائزة!",
  },

  chooseAndWin: {
    ...DEFAULT_GAME,

    title: "🎯 اختار واربح",

    description:
      "اختار هدفك وحاول تكسب!",
  },

  luckyDice: {
    ...DEFAULT_GAME,

    title: "🎲 النرد الرابح",

    description:
      "ارمي النرد وشوف حظك!",
  },
};


/* =====================================================
   GAME KEYS
===================================================== */

const GAME_KEYS = [
  "wheel",
  "flipCards",
  "scratch",
  "mysteryBoxes",
  "chooseAndWin",
  "luckyDice",
];


/* =====================================================
   GAME LABELS
===================================================== */

const GAME_LABELS = {
  wheel: "🎡 عجلة الحظ",

  flipCards: "🃏 الكروت المقلوبة",

  scratch: "🪙 اكشط واربح",

  mysteryBoxes: "🎁 الصناديق الغامضة",

  chooseAndWin: "🎯 اختار واربح",

  luckyDice: "🎲 النرد الرابح",
};


/* =====================================================
   HELPERS
===================================================== */

const toBoolean = (
  value,
  fallback = false
) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "yes" ||
    value === "on"
  ) {
    return true;
  }

  if (
    value === 0 ||
    value === "0" ||
    value === "false" ||
    value === "no" ||
    value === "off"
  ) {
    return false;
  }

  return fallback;
};


const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const normalizePrizes = (
  prizes
) => {
  if (!Array.isArray(prizes)) {
    return [];
  }

  return prizes
    .map((prize, index) => {
      if (typeof prize === "string") {
        return {
          id: `prize-${index}`,

          name: prize,

          title: prize,

          value: prize,

          active: true,
        };
      }

      if (
        !prize ||
        typeof prize !== "object"
      ) {
        return null;
      }

      return {
        ...prize,

        id:
          prize.id ||
          prize.prizeId ||
          `prize-${index}`,

        name:
          prize.name ||
          prize.title ||
          prize.label ||
          "",

        title:
          prize.title ||
          prize.name ||
          prize.label ||
          "",

        active:
          prize.active !== false,
      };
    })
    .filter(Boolean);
};


const normalizeGame = (
  rawGame,
  fallbackGame = DEFAULT_GAME
) => {
  const source =
    rawGame &&
    typeof rawGame === "object"
      ? rawGame
      : {};

  return {
    ...fallbackGame,

    ...source,

    enabled: toBoolean(
      source.enabled,
      fallbackGame.enabled
    ),

    title:
      source.title ||
      source.name ||
      fallbackGame.title,

    description:
      source.description ||
      fallbackGame.description,

    attemptsPerUser:
      Math.max(
        0,
        toNumber(
          source.attemptsPerUser ??
            source.dailyAttempts ??
            source.attempts ??
            fallbackGame.attemptsPerUser,

          fallbackGame.attemptsPerUser
        )
      ),

    requireLogin: toBoolean(
      source.requireLogin ??
        source.loginRequired,

      fallbackGame.requireLogin
    ),

    startDate:
      source.startDate ||
      source.startAt ||
      "",

    endDate:
      source.endDate ||
      source.endAt ||
      "",

    maxWinners:
      Math.max(
        0,
        toNumber(
          source.maxWinners ??
            source.maximumWinners ??
            fallbackGame.maxWinners,

          fallbackGame.maxWinners
        )
      ),

    winMessage:
      source.winMessage ||
      source.successMessage ||
      fallbackGame.winMessage,

    prizes: normalizePrizes(
      source.prizes
    ),
  };
};


const normalizeGamesSettings = (
  rawSettings
) => {
  const source =
    rawSettings &&
    typeof rawSettings === "object"
      ? rawSettings
      : {};

  const result = {};

  GAME_KEYS.forEach(
    (key) => {
      result[key] =
        normalizeGame(
          source[key],
          DEFAULT_GAMES_SETTINGS[key]
        );
    }
  );

  return result;
};


const isGameWithinDateRange = (
  game
) => {
  if (!game) {
    return false;
  }

  const now = Date.now();

  if (game.startDate) {
    const start =
      new Date(
        game.startDate
      ).getTime();

    if (
      Number.isFinite(start) &&
      now < start
    ) {
      return false;
    }
  }

  if (game.endDate) {
    const end =
      new Date(
        game.endDate
      ).getTime();

    if (
      Number.isFinite(end) &&
      now > end
    ) {
      return false;
    }
  }

  return true;
};


/* =====================================================
   NORMALIZE ANNOUNCEMENT BAR

   IMPORTANT:
   NO HARDCODED ADMIN VISUAL VALUES.
===================================================== */

const normalizeAnnouncementBar = (
  rawBar,
  index = 0
) => {
  const source =
    rawBar &&
    typeof rawBar === "object"
      ? rawBar
      : {};

  const rawBackground =
    source.backgroundColor ??
    source.bgColor ??
    source.background ??
    "";

  const rawTextColor =
    source.textColor ??
    source.color ??
    "";

  const rawFont =
    source.fontFamily ??
    source.font ??
    "";

  const rawContent =
    source.content ??
    source.text ??
    source.message ??
    source.title ??
    "";

  return {
    ...DEFAULT_ANNOUNCEMENT_BAR,

    ...source,

    id:
      source.id ||
      source.barId ||
      `announcement-${index}`,

    content:
      String(rawContent || "").trim(),

    type:
      String(
        source.type ||
          "marquee"
      ).toLowerCase(),

    order:
      toNumber(
        source.order,
        index
      ),

    active:
      toBoolean(
        source.active ??
          source.enabled,
        true
      ),

    backgroundColor:
      String(
        rawBackground || ""
      ).trim(),

    textColor:
      String(
        rawTextColor || ""
      ).trim(),

    fontFamily:
      String(
        rawFont || ""
      ).trim(),

    fontSize:
      Math.max(
        10,
        toNumber(
          source.fontSize,
          15
        )
      ),

    speed:
      Math.max(
        1,
        toNumber(
          source.speed,
          40
        )
      ),

    direction:
      source.direction === "ltr"
        ? "ltr"
        : "rtl",

    height:
      Math.max(
        25,
        toNumber(
          source.height,
          42
        )
      ),

    link:
      String(
        source.link ||
        source.url ||
        ""
      ).trim(),
  };
};


/* =====================================================
   COMPONENT
===================================================== */

export default function Navbar() {
  const navigate =
    useNavigate();


  const wishlistContext =
    useContext(
      WishlistContext
    );


  const wishlistItems =
    wishlistContext?.wishlist ||
    wishlistContext?.items ||
    wishlistContext?.favorites ||
    [];


  const wishlistCount =
    Array.isArray(
      wishlistItems
    )
      ? wishlistItems.length
      : 0;


  /* ===================================================
     STORE
  =================================================== */

  const [
    storeSettings,
    setStoreSettings,
  ] = useState(
    DEFAULT_STORE_SETTINGS
  );


  /* ===================================================
     ANNOUNCEMENT BARS
  =================================================== */

  const [
    announcementBars,
    setAnnouncementBars,
  ] = useState([]);


  /* ===================================================
     WHEEL
  =================================================== */

  const [
    wheelSettings,
    setWheelSettings,
  ] = useState(
    DEFAULT_WHEEL_SETTINGS
  );


  /* ===================================================
     GAMES
  =================================================== */

  const [
    gamesSettings,
    setGamesSettings,
  ] = useState(
    DEFAULT_GAMES_SETTINGS
  );


  const [
    gamesSettingsLoaded,
    setGamesSettingsLoaded,
  ] = useState(false);


  /* ===================================================
     CATEGORIES
  =================================================== */

  const [
    categories,
    setCategories,
  ] = useState([]);


  /* ===================================================
     SEARCH
  =================================================== */

  const [
    searchValue,
    setSearchValue,
  ] = useState("");


  const [
    searchResults,
    setSearchResults,
  ] = useState([]);


  const [
    products,
    setProducts,
  ] = useState([]);


  /* ===================================================
     ACCOUNT
  =================================================== */

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  /* ===================================================
     ADMIN VISIBILITY
     يظهر زر الإدارة للمشرفين فقط
  =================================================== */

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);


  const [
    accountName,
    setAccountName,
  ] = useState("");


  const [
    accountOpen,
    setAccountOpen,
  ] = useState(false);


  /* ===================================================
     MENU
  =================================================== */

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  const [
    activeCategory,
    setActiveCategory,
  ] = useState(null);


  const [
    megaCategory,
    setMegaCategory,
  ] = useState(null);


  /* ===================================================
     LOGO MODAL
  =================================================== */

  const [
    logoModalOpen,
    setLogoModalOpen,
  ] = useState(false);


  /* ===================================================
     WHEEL POPUP
  =================================================== */

  const [
    wheelPopupOpen,
    setWheelPopupOpen,
  ] = useState(false);


  /* ===================================================
     CART
  =================================================== */

  const [
    cartCount,
    setCartCount,
  ] = useState(0);


  /* ===================================================
     REFS
  =================================================== */

  const accountRef =
    useRef(null);


  const searchRef =
    useRef(null);


  const categoryBarRef =
    useRef(null);


  const wheelTimerRef =
    useRef(null);


  /* ===================================================
     LOAD STORE SETTINGS
  =================================================== */

  useEffect(() => {
    const storeRef =
      doc(
        db,
        "settings",
        "store"
      );


    const unsubscribe =
      onSnapshot(
        storeRef,

        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setStoreSettings(
              DEFAULT_STORE_SETTINGS
            );

            return;
          }


          const data =
            snapshot.data() ||
            {};


          setStoreSettings({
            ...DEFAULT_STORE_SETTINGS,

            ...data,

            theme: {
              ...DEFAULT_STORE_SETTINGS.theme,

              ...(data.theme || {}),
            },

            topStrip: {
              ...DEFAULT_STORE_SETTINGS.topStrip,

              ...(data.topStrip || {}),
            },

            bannerSettings: {
              ...DEFAULT_STORE_SETTINGS.bannerSettings,

              ...(data.bannerSettings || {}),
            },

            featuresBar: {
              ...DEFAULT_STORE_SETTINGS.featuresBar,

              ...(data.featuresBar || {}),
            },
          });
        },

        (error) => {
          console.error(
            "Failed to load store settings:",
            error
          );
        }
      );


    return () =>
      unsubscribe();
  }, []);


  /* ===================================================
     LOAD ANNOUNCEMENT BARS
     FIRESTORE / ADMIN ONLY

     IMPORTANT:
     - NO offerConfig
     - NO static text
     - NO topStrip.items
     - NO fixed colors
     - NO fixed speed
  =================================================== */

  useEffect(() => {
    const announcementCollection =
      collection(
        db,
        "announcementBars"
      );


    const unsubscribe =
      onSnapshot(
        announcementCollection,

        (snapshot) => {
          const bars =
            snapshot.docs
              .map(
                (
                  item,
                  index
                ) =>
                  normalizeAnnouncementBar(
                    {
                      id:
                        item.id,

                      ...item.data(),
                    },

                    index
                  )
              )

              .filter(
                (bar) =>
                  bar.active === true &&
                  String(
                    bar.content || ""
                  ).trim() !== ""
              )

              .sort(
                (a, b) =>
                  a.order - b.order
              );


          setAnnouncementBars(
            bars
          );
        },

        (error) => {
          console.error(
            "Failed to load announcement bars:",
            error
          );

          setAnnouncementBars(
            []
          );
        }
      );


    return () =>
      unsubscribe();
  }, []);


  /* ===================================================
     LOAD WHEEL SETTINGS
  =================================================== */

  useEffect(() => {
    const wheelRef =
      doc(
        db,
        "settings",
        "wheel"
      );


    const unsubscribe =
      onSnapshot(
        wheelRef,

        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setWheelSettings(
              DEFAULT_WHEEL_SETTINGS
            );

            return;
          }


          const data =
            snapshot.data() ||
            {};


          const normalized = {
            ...DEFAULT_WHEEL_SETTINGS,

            ...data,

            enabled:
              toBoolean(
                data.enabled,
                false
              ),

            attemptsPerUser:
              Math.max(
                0,
                toNumber(
                  data.attemptsPerUser ??
                    data.dailyAttempts ??
                    1,

                  1
                )
              ),

            popupEnabled:
              toBoolean(
                data.popupEnabled,
                false
              ),

            popupDelay:
              Math.max(
                0,
                toNumber(
                  data.popupDelay,
                  3
                )
              ),

            showOncePerDay:
              toBoolean(
                data.showOncePerDay,
                true
              ),

            allowClose:
              toBoolean(
                data.allowClose,
                true
              ),

            prizes:
              normalizePrizes(
                data.prizes
              ),
          };


          setWheelSettings(
            normalized
          );
        },

        (error) => {
          console.error(
            "Failed to load wheel settings:",
            error
          );
        }
      );


    return () =>
      unsubscribe();
  }, []);


  /* ===================================================
     LOAD ALL SIX GAMES
  =================================================== */

  useEffect(() => {
    const gamesRef =
      doc(
        db,
        "settings",
        "games"
      );


    const unsubscribe =
      onSnapshot(
        gamesRef,

        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setGamesSettings(
              DEFAULT_GAMES_SETTINGS
            );

            setGamesSettingsLoaded(
              false
            );


            window.dispatchEvent(
              new CustomEvent(
                "luckGamesSettingsChanged",
                {
                  detail:
                    DEFAULT_GAMES_SETTINGS,
                }
              )
            );

            return;
          }


          const data =
            snapshot.data() ||
            {};


          const normalized =
            normalizeGamesSettings(
              data
            );


          setGamesSettings(
            normalized
          );


          setGamesSettingsLoaded(
            true
          );


          window.dispatchEvent(
            new CustomEvent(
              "luckGamesSettingsChanged",
              {
                detail:
                  normalized,
              }
            )
          );
        },

        (error) => {
          console.error(
            "Failed to load games settings:",
            error
          );

          setGamesSettings(
            DEFAULT_GAMES_SETTINGS
          );
        }
      );


    return () =>
      unsubscribe();
  }, []);


  /* ===================================================
     KEEP WHEEL GAME SYNCHRONIZED
  =================================================== */

  useEffect(() => {
    setGamesSettings(
      (previous) => {
        const currentWheel =
          previous.wheel ||
          DEFAULT_GAMES_SETTINGS.wheel;


        return {
          ...previous,

          wheel: {
            ...currentWheel,

            enabled:
              gamesSettingsLoaded
                ? currentWheel.enabled
                : wheelSettings.enabled,

            title:
              currentWheel.title ||
              wheelSettings.title,

            description:
              currentWheel.description ||
              wheelSettings.description,

            attemptsPerUser:
              currentWheel.attemptsPerUser ||
              wheelSettings.attemptsPerUser,

            prizes:
              currentWheel.prizes?.length
                ? currentWheel.prizes
                : wheelSettings.prizes,
          },
        };
      }
    );
  }, [
    wheelSettings,
    gamesSettingsLoaded,
  ]);


  /* ===================================================
     DISPATCH GAMES WHEN THEY CHANGE
  =================================================== */

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(
        "luckGamesSettingsChanged",
        {
          detail:
            gamesSettings,
        }
      )
    );
  }, [
    gamesSettings,
  ]);


  /* ===================================================
     LOAD AUTH USER
  =================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,

        async (user) => {
          setCurrentUser(
            user
          );

          // الافتراضي: العميل ليس أدمن
          setIsAdmin(false);


          if (!user) {
            setAccountName("");

            return;
          }


          try {
            /*
             * حساب الأدمن الأساسي:
             * admins/{uid}
             */
            const adminRef =
              doc(
                db,
                "admins",
                user.uid
              );

            const adminSnapshot =
              await getDoc(
                adminRef
              );

            let adminAccount =
              false;

            if (
              adminSnapshot.exists()
            ) {
              const adminData =
                adminSnapshot.data() ||
                {};

              /*
               * لو سجل المشرف موجود في admins
               * يعتبر مشرفًا، إلا لو تم تعطيله صراحةً.
               */
              adminAccount =
                adminData.active !== false &&
                adminData.enabled !== false;
            }


            /*
             * احتياطي للحسابات القديمة:
             * users/{uid} مع role=admin/superadmin
             * أو isAdmin=true.
             */
            const userRef =
              doc(
                db,
                "users",
                user.uid
              );

            const snapshot =
              await getDoc(
                userRef
              );

            const data =
              snapshot.exists()
                ? snapshot.data() || {}
                : {};

            const role =
              String(
                data.role || ""
              ).toLowerCase();

            const legacyAdmin =
              data.isAdmin === true ||
              role === "admin" ||
              role === "superadmin";

            setIsAdmin(
              adminAccount ||
                legacyAdmin
            );


            if (
              snapshot.exists()
            ) {
              setAccountName(
                data.name ||
                  data.displayName ||
                  data.fullName ||
                  user.displayName ||
                  user.email ||
                  "حسابي"
              );
            } else {
              setAccountName(
                user.displayName ||
                  user.email ||
                  "حسابي"
              );
            }
          } catch (error) {
            console.error(
              "Failed to load account/admin:",
              error
            );

            // في حالة حدوث خطأ، لا نظهر زر الإدارة للعميل.
            setIsAdmin(false);


            setAccountName(
              user.displayName ||
                user.email ||
                "حسابي"
            );
          }
        }
      );


    return () =>
      unsubscribe();
  }, []);


  /* ===================================================
     LOAD CATEGORIES
  =================================================== */

  useEffect(() => {
    let mounted = true;


    const loadCategories =
      async () => {
        try {
          const result =
            await getCategories();


          if (!mounted) {
            return;
          }


          const normalized =
            Array.isArray(result)
              ? result
              : [];


          setCategories(
            normalized.filter(
              (category) =>
                category?.active !==
                false
            )
          );
        } catch (error) {
          console.error(
            "Failed to load categories:",
            error
          );


          if (mounted) {
            setCategories(
              []
            );
          }
        }
      };


    loadCategories();


    return () => {
      mounted = false;
    };
  }, []);


  /* ===================================================
     LOAD PRODUCTS FOR SEARCH
  =================================================== */

  useEffect(() => {
    const productsRef =
      collection(
        db,
        "products"
      );


    const unsubscribe =
      onSnapshot(
        productsRef,

        (snapshot) => {
          const result =
            snapshot.docs
              .map(
                (item) => ({
                  id: item.id,

                  ...item.data(),
                })
              )

              .filter(
                (product) =>
                  product.active !==
                  false
              );


          setProducts(
            result
          );
        },

        (error) => {
          console.error(
            "Failed to load products:",
            error
          );
        }
      );


    return () =>
      unsubscribe();
  }, []);


  /* ===================================================
     CART COUNT
  =================================================== */

  useEffect(() => {
    const calculateCart =
      () => {
        try {
          const saved =
            localStorage.getItem(
              "cart"
            );


          if (!saved) {
            setCartCount(0);

            return;
          }


          const parsed =
            JSON.parse(
              saved
            );


          if (
            !Array.isArray(
              parsed
            )
          ) {
            setCartCount(0);

            return;
          }


          const count =
            parsed.reduce(
              (
                total,
                item
              ) =>
                total +
                Math.max(
                  1,
                  Number(
                    item.quantity ||
                      1
                  )
                ),

              0
            );


          setCartCount(
            count
          );
        } catch {
          setCartCount(
            0
          );
        }
      };


    calculateCart();


    window.addEventListener(
      "storage",
      calculateCart
    );


    window.addEventListener(
      "cartUpdated",
      calculateCart
    );


    return () => {
      window.removeEventListener(
        "storage",
        calculateCart
      );


      window.removeEventListener(
        "cartUpdated",
        calculateCart
      );
    };
  }, []);


  /* ===================================================
     SEARCH
  =================================================== */

  useEffect(() => {
    const value =
      searchValue
        .trim()
        .toLowerCase();


    if (!value) {
      setSearchResults([]);

      return;
    }


    const results =
      products
        .filter(
          (product) => {
            const searchable = [
              product.name,
              product.title,
              product.description,
              product.categoryName,
              product.sku,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


            return searchable.includes(
              value
            );
          }
        )
        .slice(
          0,
          8
        );


    setSearchResults(
      results
    );
  }, [
    searchValue,
    products,
  ]);


  /* ===================================================
     ACTIVE GAMES
  =================================================== */

  const activeGames =
    useMemo(() => {
      return GAME_KEYS
        .map(
          (key) => ({
            key,

            ...gamesSettings[key],
          })
        )

        .filter(
          (game) =>
            game.enabled === true &&
            isGameWithinDateRange(
              game
            )
        );
    }, [
      gamesSettings,
    ]);


  /* ===================================================
     WHEEL VISIBILITY
  =================================================== */

  const wheelGame =
    gamesSettings.wheel;


  const wheelEnabled =
    wheelGame?.enabled === true &&
    isGameWithinDateRange(
      wheelGame
    ) &&
    wheelSettings.enabled === true;


  const wheelDisplayMode =
    wheelSettings.displayMode ||
    "store";


  const shouldShowWheelInStore =
    wheelEnabled &&
    (
      wheelDisplayMode ===
        "store" ||
      wheelDisplayMode ===
        "both"
    );


  const shouldShowWheelAsPopup =
    wheelEnabled &&
    wheelSettings.popupEnabled ===
      true &&
    (
      wheelDisplayMode ===
        "popup" ||
      wheelDisplayMode ===
        "both"
    );


  /* ===================================================
     OPEN GAME
  =================================================== */

  const openLuckGame =
    (gameKey) => {
      const game =
        gamesSettings[
          gameKey
        ];


      if (!game) {
        return;
      }


      if (!game.enabled) {
        return;
      }


      if (
        !isGameWithinDateRange(
          game
        )
      ) {
        return;
      }


      setMobileMenuOpen(
        false
      );


      setActiveCategory(
        null
      );


      setMegaCategory(
        null
      );


      if (
        gameKey ===
        "wheel"
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "openWheel",
            {
              detail: {
                settings:
                  game,
              },
            }
          )
        );


        window.dispatchEvent(
          new CustomEvent(
            "openWheelPopup",
            {
              detail: {
                settings:
                  game,
              },
            }
          )
        );


        return;
      }


      window.dispatchEvent(
        new CustomEvent(
          "openLuckGame",
          {
            detail: {
              gameKey,

              game,

              settings:
                gamesSettings,
            },
          }
        )
      );


      window.dispatchEvent(
        new CustomEvent(
          `openLuckGame:${gameKey}`,

          {
            detail: {
              gameKey,

              game,

              settings:
                gamesSettings,
            },
          }
        )
      );
    };


  /* ===================================================
     WHEEL POPUP DAILY KEY
  =================================================== */

  const getWheelPopupStorageKey =
    () => {
      const date =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );


      return `elsafty_wheel_popup_${date}`;
    };


  /* ===================================================
     WHEEL POPUP
  =================================================== */

  useEffect(() => {
    if (
      !shouldShowWheelAsPopup
    ) {
      return undefined;
    }


    if (
      wheelSettings.showOncePerDay
    ) {
      const key =
        getWheelPopupStorageKey();


      const alreadyShown =
        localStorage.getItem(
          key
        );


      if (
        alreadyShown ===
        "1"
      ) {
        return undefined;
      }
    }


    const delay =
      Math.max(
        0,
        Number(
          wheelSettings.popupDelay ||
            0
        )
      ) * 1000;


    wheelTimerRef.current =
      window.setTimeout(
        () => {
          setWheelPopupOpen(
            true
          );


          if (
            wheelSettings.showOncePerDay
          ) {
            localStorage.setItem(
              getWheelPopupStorageKey(),
              "1"
            );
          }


          window.dispatchEvent(
            new CustomEvent(
              "openWheelPopup",
              {
                detail: {
                  settings:
                    wheelGame,
                },
              }
            )
          );
        },

        delay
      );


    return () => {
      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
      }
    };
  }, [
    shouldShowWheelAsPopup,

    wheelSettings.popupDelay,

    wheelSettings.showOncePerDay,

    wheelGame,
  ]);


  /* ===================================================
     EXTERNAL WHEEL OPEN EVENT
  =================================================== */

  useEffect(() => {
    const handleOpenWheel =
      () => {
        if (
          !wheelEnabled
        ) {
          return;
        }


        setWheelPopupOpen(
          true
        );
      };


    window.addEventListener(
      "openWheelPopup",
      handleOpenWheel
    );


    return () => {
      window.removeEventListener(
        "openWheelPopup",
        handleOpenWheel
      );
    };
  }, [
    wheelEnabled,
  ]);


  /* ===================================================
     CLOSE DROPDOWNS
  =================================================== */

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          accountRef.current &&
          !accountRef.current.contains(
            event.target
          )
        ) {
          setAccountOpen(
            false
          );
        }
      };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  /* ===================================================
     CATEGORY TREE
  =================================================== */

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
    }, [
      categories,
    ]);


  const rootCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          !category.parentId ||
          !categoryMap[
            category.parentId
          ]
      );
    }, [
      categories,
      categoryMap,
    ]);


  const getChildren =
    (parentId) => {
      return categories.filter(
        (category) =>
          category.parentId ===
          parentId
      );
    };


  /* ===================================================
     NAVIGATION
  =================================================== */

  const goTo =
    (path) => {
      setMobileMenuOpen(
        false
      );

      setAccountOpen(
        false
      );

      setActiveCategory(
        null
      );

      setMegaCategory(
        null
      );

      if (
        !path ||
        typeof path !==
          "string"
      ) {
        return;
      }


      if (
        /^https?:\/\//i.test(
          path
        )
      ) {
        window.location.href =
          path;

        return;
      }


      navigate(path);
    };


  /* ===================================================
     ANNOUNCEMENT CLICK
  =================================================== */

  const handleAnnouncementClick =
    (bar) => {
      if (!bar?.link) {
        return;
      }

      goTo(bar.link);
    };


  /* ===================================================
     SEARCH SUBMIT
  =================================================== */

  const submitSearch =
    (event) => {
      event?.preventDefault();


      const value =
        searchValue.trim();


      if (!value) {
        return;
      }


      setSearchResults([]);


      navigate(
        `/products?search=${encodeURIComponent(
          value
        )}`
      );
    };


  /* ===================================================
     PRODUCT SEARCH
  =================================================== */

  const openProduct =
    (product) => {
      if (!product) {
        return;
      }


      setSearchValue("");


      setSearchResults([]);


      navigate(
        `/product/${product.id}`
      );
    };


  /* ===================================================
     CATEGORY CLICK
  =================================================== */

  const handleCategoryClick =
    (category) => {
      if (!category) {
        return;
      }


      const children =
        getChildren(
          category.id
        );


      if (
        children.length >
        0
      ) {
        setActiveCategory(
          (current) =>
            current ===
            category.id
              ? null
              : category.id
        );


        setMegaCategory(
          (current) =>
            current ===
            category.id
              ? null
              : category
        );


        return;
      }


      goTo(
        `/products?category=${encodeURIComponent(
          category.id
        )}`
      );
    };


  /* ===================================================
     CLOSE MEGA MENU
  =================================================== */

  const closeMegaMenu =
    () => {
      setActiveCategory(
        null
      );

      setMegaCategory(
        null
      );
    };


  /* ===================================================
     LOGOUT
  =================================================== */

  const handleLogout =
    async () => {
      try {
        await signOut(
          auth
        );


        setAccountOpen(
          false
        );


        navigate("/");
      } catch (error) {
        console.error(
          "Logout failed:",
          error
        );
      }
    };


  /* ===================================================
     ACCOUNT
  =================================================== */

  const openAccount =
    () => {
      setAccountOpen(
        (current) =>
          !current
      );
    };


  /* ===================================================
     THEME
  =================================================== */

  const theme =
    storeSettings.theme ||
    DEFAULT_STORE_SETTINGS.theme;


  const navbarStyle =
    {
      "--primary":
        theme.primary,

      "--secondary":
        theme.secondary,

      "--accent":
        theme.accent,

      "--border":
        theme.border,

      "--category-text":
        theme.categoryBarText,

      "--mega-menu-top":
        "var(--navbar-fixed-height, 120px)",

      background:
        theme.navbarBackground ||
        theme.primary,

      color:
        theme.navbarText ||
        "#ffffff",
    };


  const mobileNavbarStyle =
    {
      ...navbarStyle,
    };


  /* ===================================================
     ANNOUNCEMENT CSS
     
     IMPORTANT:
     - NO BACKGROUND COLOR HERE
     - NO TEXT COLOR HERE
     - NO FONT SIZE HERE
     - NO SPEED HERE
     - ALL COME FROM ADMIN
  =================================================== */

  const announcementStyles = `
    .navbar-admin-announcement-wrapper {
      width: 100%;
      position: relative;
      z-index: 20;
      overflow: hidden;
      box-sizing: border-box;
    }

    .navbar-admin-announcement {
      width: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .navbar-admin-announcement-track {
      width: max-content;
      min-width: 100%;
      display: flex;
      align-items: center;
      white-space: nowrap;
      will-change: transform;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      box-sizing: border-box;
    }

    .navbar-admin-announcement:hover
      .navbar-admin-announcement-track {
      animation-play-state: paused;
    }

    .navbar-admin-announcement-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      min-width: max-content;
      border: 0;
      outline: 0;
      background: transparent;
      padding: 0 80px;
      margin: 0;
      line-height: 1;
      text-decoration: none;
      cursor: pointer;
      font-weight: 700;
      box-sizing: border-box;
    }

    span.navbar-admin-announcement-content {
      cursor: default;
    }

    .navbar-admin-announcement[data-type="static"]
      .navbar-admin-announcement-track,
    .navbar-admin-announcement[data-type="normal"]
      .navbar-admin-announcement-track,
    .navbar-admin-announcement[data-type="fixed"]
      .navbar-admin-announcement-track {
      animation: none !important;
      width: 100%;
      justify-content: center;
      transform: none !important;
    }

    .navbar-admin-announcement[data-direction="ltr"]
      .navbar-admin-announcement-track {
      animation-name: navbarAdminAnnouncementLTR;
    }

    .navbar-admin-announcement[data-direction="rtl"]
      .navbar-admin-announcement-track {
      animation-name: navbarAdminAnnouncementRTL;
    }

    @keyframes navbarAdminAnnouncementRTL {
      0% {
        transform: translateX(0);
      }

      100% {
        transform: translateX(-50%);
      }
    }

    @keyframes navbarAdminAnnouncementLTR {
      0% {
        transform: translateX(-50%);
      }

      100% {
        transform: translateX(0);
      }
    }

    @media (max-width: 768px) {
      .navbar-admin-announcement-content {
        padding-left: 50px;
        padding-right: 50px;
      }
    }
  `;


  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div
      className="store-navbar-theme"
      style={
        mobileNavbarStyle
      }
      dir="rtl"
    >

      <style>
        {announcementStyles}
      </style>


      {/* =================================================
          HEADER ONLY
          FIXED
      ================================================= */}

      <div
        className="navbar-sticky-shell"
        style={{
          position:
            "fixed",

          top: 0,

          left: 0,

          right: 0,

          zIndex: 1000,
        }}
      >

        {/* ===============================================
            MAIN HEADER
        =============================================== */}

        <header
          className="store-header"
          style={{
            background:
              theme.navbarBackground ||
              theme.primary,

            color:
              theme.navbarText ||
              "#ffffff",
          }}
        >

          {/* =============================================
              MOBILE MENU
          ============================================= */}

          <button
            type="button"
            className="mobile-menu-button"
            aria-label="فتح القائمة"
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current
              )
            }
          >
            {mobileMenuOpen
              ? "✕"
              : "☰"}
          </button>


          {/* =============================================
              LOGO
          ============================================= */}

          <div
            className="nav-logo"
            title={
              storeSettings.storeName ||
              "ســـــَــــــــوا"
            }
          >

            <img
              src={
                storeSettings.logo ||
                DEFAULT_STORE_SETTINGS.logo
              }
              alt={
                storeSettings.storeName ||
                "ســـــَــــــــوا"
              }
              onClick={() =>
                setLogoModalOpen(
                  true
                )
              }
              onError={(
                event
              ) => {
                if (
                  event.currentTarget.src.endsWith(
                    DEFAULT_STORE_SETTINGS.logo
                  )
                ) {
                  return;
                }


                event.currentTarget.src =
                  DEFAULT_STORE_SETTINGS.logo;
              }}
            />

          </div>


          {/* =============================================
              SEARCH
          ============================================= */}

          <form
            className="search-box"
            ref={searchRef}
            onSubmit={
              submitSearch
            }
          >

            <input
              type="search"
              value={
                searchValue
              }
              placeholder="إبحث عن المنتج اللي عايزه..."
              onChange={(
                event
              ) =>
                setSearchValue(
                  event.target.value
                )
              }
              onFocus={(
                event
              ) => {
                if (
                  event.target.value.trim()
                ) {
                  setSearchResults(
                    products
                      .filter(
                        (
                          product
                        ) => {
                          const searchable =
                            [
                              product.name,
                              product.title,
                              product.description,
                              product.categoryName,
                              product.sku,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " "
                              )
                              .toLowerCase();


                          return searchable.includes(
                            event.target.value
                              .trim()
                              .toLowerCase()
                          );
                        }
                      )
                      .slice(
                        0,
                        8
                      )
                  );
                }
              }}
            />


            <button
              type="submit"
              className="search-button"
              aria-label="بحث"
            >
              🔍
            </button>


            {searchValue.trim() &&
              searchResults.length >
                0 && (
                <div className="search-suggestions">

                  {searchResults.map(
                    (
                      product
                    ) => (
                      <button
                        type="button"
                        className="suggestion-item"
                        key={
                          product.id
                        }
                        onClick={() =>
                          openProduct(
                            product
                          )
                        }
                      >

                        {product.image ||
                        product.images?.[0] ? (
                          <img
                            className="suggestion-image"
                            src={
                              product.image ||
                              product.images?.[0]
                            }
                            alt={
                              product.name ||
                              product.title ||
                              "منتج"
                            }
                          />
                        ) : (
                          <span className="suggestion-image-placeholder">
                            🛍️
                          </span>
                        )}

                        <span>
                          {product.name ||
                            product.title ||
                            "منتج"}
                        </span>

                      </button>
                    )
                  )}

                </div>
              )}


            {searchValue.trim() &&
              searchResults.length ===
                0 &&
              products.length >
                0 && (
                <div className="search-suggestions">

                  <div className="search-no-result">
                    مفيش منتجات مطابقة للبحث
                  </div>

                </div>
              )}

          </form>


          {/* =============================================
              ACTIONS
          ============================================= */}

          <div className="nav-actions">

            {activeGames.length >
              0 && (
              <div className="account-menu">

                <button
                  type="button"
                  className="nav-icon"
                  aria-label="الألعاب"
                  onClick={() =>
                    setAccountOpen(
                      false
                    )
                  }
                >

                  <span>
                    🎮
                  </span>

                  <small>
                    الألعاب
                  </small>

                </button>

              </div>
            )}


            {/* WISHLIST */}

            <button
              type="button"
              className="nav-icon wishlist-icon"
              onClick={() =>
                goTo(
                  "/wishlist"
                )
              }
              aria-label="المفضلة"
            >

              <span>
                ❤️
              </span>

              <small>
                المفضلة
              </small>


              {wishlistCount >
                0 && (
                <span className="wishlist-badge">
                  {
                    wishlistCount
                  }
                </span>
              )}

            </button>


            {/* ACCOUNT */}

            <div
              className="account-menu"
              ref={
                accountRef
              }
            >

              <button
                type="button"
                className="nav-icon"
                onClick={
                  openAccount
                }
                aria-expanded={
                  accountOpen
                }
              >

                <span>
                  👤
                </span>

                <small>
                  {currentUser
                    ? "حسابي"
                    : "دخول"}
                </small>

              </button>


              {accountOpen && (
                <div className="account-dropdown">

                  {currentUser && (
                    <div className="account-user-info">

                      <strong>
                        {accountName ||
                          "أهلاً بيك"}
                      </strong>

                      <span>
                        {
                          currentUser.email ||
                          ""
                        }
                      </span>

                    </div>
                  )}


                  {currentUser ? (
                    <>

                      <button
                        type="button"
                        onClick={() =>
                          goTo(
                            "/account"
                          )
                        }
                      >
                        👤 حسابي
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          goTo(
                            "/orders"
                          )
                        }
                      >
                        📦 طلباتي
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          goTo(
                            "/wishlist"
                          )
                        }
                      >
                        ❤️ المفضلة
                      </button>


                      <button
                        type="button"
                        onClick={
                          handleLogout
                        }
                      >
                        🚪 تسجيل الخروج
                      </button>

                    </>
                  ) : (
                    <>

                      <button
                        type="button"
                        onClick={() =>
                          goTo(
                            "/login"
                          )
                        }
                      >
                        🔐 تسجيل الدخول
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          goTo(
                            "/register"
                          )
                        }
                      >
                        📝 إنشاء حساب
                      </button>

                    </>
                  )}

                </div>
              )}

            </div>


            {/* ADMIN - يظهر للأدمن فقط */}

            {isAdmin && (
              <button
                type="button"
                className="admin-btn"
                onClick={() =>
                  goTo(
                    "/admin"
                  )
                }
              >

                <span>
                  ⚙️
                </span>

                <small>
                  الأدمن
                </small>

              </button>
            )}


            {/* CART */}

            <button
              type="button"
              className="cart-icon"
              onClick={() =>
                goTo(
                  "/cart"
                )
              }
              aria-label="السلة"
            >

              <span className="cart-symbol">
                🛒
              </span>

              <span className="cart-text">
                السلة
              </span>


              {cartCount >
                0 && (
                <span className="cart-badge">
                  {
                    cartCount
                  }
                </span>
              )}

            </button>

          </div>

        </header>


        {/* ===============================================
            GAMES PANEL
        =============================================== */}

        {activeGames.length >
          0 && (
          <div
            className="luck-games-panel"
            style={{
              background:
                theme.navbarBackground ||
                theme.primary,

              color:
                theme.navbarText ||
                "#ffffff",
            }}
          >

            {activeGames.map(
              (game) => (
                <button
                  type="button"
                  key={
                    game.key
                  }
                  onClick={() =>
                    openLuckGame(
                      game.key
                    )
                  }
                  className={
                    game.key ===
                    "wheel"
                      ? "luck-game-button active-game"
                      : "luck-game-button"
                  }
                >
                  {game.title ||
                    GAME_LABELS[
                      game.key
                    ]}
                </button>
              )
            )}

          </div>
        )}


        {/* ===============================================
            CATEGORY BAR
        =============================================== */}

        <div
          className="navbar-bottom-wrapper"
          style={{
            background:
              theme.categoryBarBackground ||
              "#ffffff",

            color:
              theme.categoryBarText ||
              "#071a36",
          }}
        >

          <button
            type="button"
            className="category-arrow"
            onClick={() => {
              categoryBarRef.current?.scrollBy(
                {
                  left:
                    -250,

                  behavior:
                    "smooth",
                }
              );
            }}
            aria-label="السابق"
          >
            ‹
          </button>


          <nav
            className="navbar-bottom"
            ref={
              categoryBarRef
            }
          >

            <div className="nav-category-wrapper">

              <button
                type="button"
                className="nav-category-item"
                onClick={() =>
                  goTo("/")
                }
              >

                🏠

                <strong>
                  الرئيسية
                </strong>

              </button>

            </div>


            <div className="nav-category-wrapper">

              <button
                type="button"
                className={
                  activeCategory ===
                  "all"
                    ? "nav-category-item active-category"
                    : "nav-category-item"
                }
                onClick={() => {
                  if (
                    activeCategory ===
                    "all"
                  ) {
                    closeMegaMenu();

                    return;
                  }


                  setActiveCategory(
                    "all"
                  );


                  setMegaCategory(
                    null
                  );
                }}
              >

                ☰

                <strong>
                  كل الأقسام
                </strong>

                <span className="category-down-arrow">
                  ▾
                </span>

              </button>

            </div>


            {rootCategories.map(
              (
                category
              ) => (
                <div
                  className="nav-category-wrapper"
                  key={
                    category.id
                  }
                >

                  <button
                    type="button"
                    className={
                      activeCategory ===
                      category.id
                        ? "nav-category-item active-category"
                        : "nav-category-item"
                    }
                    onClick={() =>
                      handleCategoryClick(
                        category
                      )
                    }
                  >

                    {category.image ? (
                      <img
                        src={
                          category.image
                        }
                        alt={
                          category.name
                        }
                      />
                    ) : (
                      <span>
                        🛍️
                      </span>
                    )}

                    <strong>
                      {
                        category.name
                      }
                    </strong>


                    {getChildren(
                      category.id
                    ).length >
                      0 && (
                      <span className="category-down-arrow">
                        ▾
                      </span>
                    )}

                  </button>

                </div>
              )
            )}


            <div className="nav-category-wrapper">

              <button
                type="button"
                className="nav-category-item offer-item"
                onClick={() =>
                  goTo(
                    "/offers"
                  )
                }
              >

                🔥

                <strong>
                  العروض
                </strong>

              </button>

            </div>


            <div className="nav-category-wrapper">

              <button
                type="button"
                className="nav-category-item"
                onClick={() =>
                  goTo(
                    "/products?sort=best"
                  )
                }
              >

                ⭐

                <strong>
                  الأكثر مبيعاً
                </strong>

              </button>

            </div>


            <div className="nav-category-wrapper">

              <button
                type="button"
                className="nav-category-item"
                onClick={() =>
                  goTo(
                    "/products?sort=new"
                  )
                }
              >

                ✨

                <strong>
                  وصل حديثاً
                </strong>

              </button>

            </div>


            {shouldShowWheelInStore &&
              activeGames.some(
                (game) =>
                  game.key ===
                  "wheel"
              ) && (
                <div className="nav-category-wrapper">

                  <button
                    type="button"
                    className="nav-category-item offer-item"
                    onClick={() =>
                      openLuckGame(
                        "wheel"
                      )
                    }
                  >

                    🎡

                    <strong>
                      {
                        wheelGame.title ||
                        "عجلة الحظ"
                      }
                    </strong>

                  </button>

                </div>
              )}

          </nav>


          <button
            type="button"
            className="category-arrow"
            onClick={() => {
              categoryBarRef.current?.scrollBy(
                {
                  left:
                    250,

                  behavior:
                    "smooth",
                }
              );
            }}
            aria-label="التالي"
          >
            ›
          </button>

        </div>

      </div>


      {/* =================================================
          ANNOUNCEMENT BARS

          ADMIN / FIRESTORE ONLY

          IMPORTANT:
          - OUTSIDE FIXED HEADER
          - SCROLLS WITH PAGE
          - COLORS FROM ADMIN
          - SPEED FROM ADMIN
          - FONT FROM ADMIN
          - HEIGHT FROM ADMIN
          - DIRECTION FROM ADMIN
          - TYPE FROM ADMIN
      ================================================= */}

      {announcementBars.length >
        0 && (
        <div
          className="navbar-admin-announcement-wrapper"
        >

          {announcementBars.map(
            (bar) => {
              const type =
                String(
                  bar.type ||
                    "marquee"
                ).toLowerCase();

              const speed =
                Math.max(
                  1,
                  Number(
                    bar.speed ||
                      40
                  )
                );

              const direction =
                bar.direction ===
                "ltr"
                  ? "ltr"
                  : "rtl";

              const isStatic =
                type ===
                  "static" ||
                type ===
                  "normal" ||
                type ===
                  "fixed";


              const announcementStyle = {
                height:
                  `${Math.max(
                    25,
                    Number(
                      bar.height ||
                        42
                    )
                  )}px`,
              };


              /*
                مهم:
                مفيش background أو color أو font
                ثابت هنا.
                لو الأدمن حددهم Firestore هيطبقهم.
              */

              if (
                bar.backgroundColor
              ) {
                announcementStyle.backgroundColor =
                  bar.backgroundColor;
              }

              if (
                bar.textColor
              ) {
                announcementStyle.color =
                  bar.textColor;
              }

              if (
                bar.fontFamily
              ) {
                announcementStyle.fontFamily =
                  bar.fontFamily;
              }

              if (
                Number.isFinite(
                  Number(
                    bar.fontSize
                  )
                )
              ) {
                announcementStyle.fontSize =
                  `${Number(
                    bar.fontSize
                  )}px`;
              }


              const contentStyle = {};

              if (
                bar.textColor
              ) {
                contentStyle.color =
                  bar.textColor;
              }

              if (
                bar.fontFamily
              ) {
                contentStyle.fontFamily =
                  bar.fontFamily;
              }

              if (
                Number.isFinite(
                  Number(
                    bar.fontSize
                  )
                )
              ) {
                contentStyle.fontSize =
                  `${Number(
                    bar.fontSize
                  )}px`;
              }


              return (
                <div
                  key={
                    bar.id
                  }
                  className="navbar-admin-announcement"
                  data-type={
                    isStatic
                      ? "static"
                      : "marquee"
                  }
                  data-direction={
                    direction
                  }
                  style={
                    announcementStyle
                  }
                  dir={
                    direction
                  }
                >

                  {isStatic ? (
                    bar.link ? (
                      <button
                        type="button"
                        className="navbar-admin-announcement-content"
                        style={{
                          ...contentStyle,

                          width:
                            "100%",

                          height:
                            "100%",
                        }}
                        onClick={() =>
                          handleAnnouncementClick(
                            bar
                          )
                        }
                      >
                        {
                          bar.content
                        }
                      </button>
                    ) : (
                      <span
                        className="navbar-admin-announcement-content"
                        style={
                          contentStyle
                        }
                      >
                        {
                          bar.content
                        }
                      </span>
                    )
                  ) : (
                    <div
                      className="navbar-admin-announcement-track"
                      style={{
                        animationDuration:
                          `${speed}s`,

                        animationName:
                          direction ===
                          "ltr"
                            ? "navbarAdminAnnouncementLTR"
                            : "navbarAdminAnnouncementRTL",
                      }}
                    >

                      {bar.link ? (
                        <>
                          <button
                            type="button"
                            className="navbar-admin-announcement-content"
                            style={
                              contentStyle
                            }
                            onClick={() =>
                              handleAnnouncementClick(
                                bar
                              )
                            }
                          >
                            {
                              bar.content
                            }
                          </button>

                          <button
                            type="button"
                            className="navbar-admin-announcement-content"
                            style={
                              contentStyle
                            }
                            onClick={() =>
                              handleAnnouncementClick(
                                bar
                              )
                            }
                            aria-hidden="true"
                            tabIndex={
                              -1
                            }
                          >
                            {
                              bar.content
                            }
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className="navbar-admin-announcement-content"
                            style={
                              contentStyle
                            }
                          >
                            {
                              bar.content
                            }
                          </span>

                          <span
                            className="navbar-admin-announcement-content"
                            style={
                              contentStyle
                            }
                            aria-hidden="true"
                          >
                            {
                              bar.content
                            }
                          </span>
                        </>
                      )}

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      )}


      {/* =================================================
          MEGA MENU
      ================================================= */}

      {activeCategory && (
        <div
          className="mega-menu"
          style={{
            "--mega-menu-top":
              "var(--navbar-fixed-height, 120px)",
          }}
        >

          <div className="mega-menu-inner">

            {activeCategory ===
              "all" ? (
              <>

                <div className="mega-menu-title">

                  <div className="mega-menu-title-icon">
                    <span>
                      ☰
                    </span>
                  </div>


                  <div className="mega-menu-title-content">

                    <strong>
                      كل الأقسام
                    </strong>

                    <small>
                      اختار القسم اللي يناسبك
                    </small>

                  </div>

                </div>


                <div className="mega-columns">

                  {rootCategories.map(
                    (
                      category
                    ) => {
                      const children =
                        getChildren(
                          category.id
                        );


                      return (
                        <div
                          className={
                            children.length
                              ? "mega-column"
                              : "mega-column mega-column-open"
                          }
                          key={
                            category.id
                          }
                        >

                          <button
                            type="button"
                            className="mega-column-title"
                            onClick={() => {
                              if (
                                children.length
                              ) {
                                setMegaCategory(
                                  (
                                    current
                                  ) =>
                                    current?.id ===
                                    category.id
                                      ? null
                                      : category
                                );
                              } else {
                                goTo(
                                  `/products?category=${encodeURIComponent(
                                    category.id
                                  )}`
                                );
                              }
                            }}
                          >

                            {category.image ? (
                              <img
                                src={
                                  category.image
                                }
                                alt={
                                  category.name
                                }
                              />
                            ) : (
                              <span>
                                🛍️
                              </span>
                            )}

                            <span>
                              {
                                category.name
                              }
                            </span>


                            {children.length >
                              0 && (
                              <span>
                                ▾
                              </span>
                            )}

                          </button>


                          {children.length >
                            0 &&
                            megaCategory?.id ===
                              category.id && (
                            <div className="mega-column-items">

                              {children.map(
                                (
                                  child
                                ) => (
                                  <button
                                    type="button"
                                    className="mega-link"
                                    key={
                                      child.id
                                    }
                                    onClick={() =>
                                      goTo(
                                        `/products?category=${encodeURIComponent(
                                          child.id
                                        )}`
                                      )
                                    }
                                  >

                                    {child.image ? (
                                      <img
                                        src={
                                          child.image
                                        }
                                        alt={
                                          child.name
                                        }
                                      />
                                    ) : (
                                      <span className="mega-link-icon">
                                        📦
                                      </span>
                                    )}

                                    <span>
                                      {
                                        child.name
                                      }
                                    </span>

                                  </button>
                                )
                              )}

                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </>
            ) : (

              megaCategory && (
                <>

                  <div className="mega-menu-title">

                    <div className="mega-menu-title-icon">

                      {megaCategory.image ? (
                        <img
                          src={
                            megaCategory.image
                          }
                          alt={
                            megaCategory.name
                          }
                        />
                      ) : (
                        <span>
                          🛍️
                        </span>
                      )}

                    </div>


                    <div className="mega-menu-title-content">

                      <strong>
                        {
                          megaCategory.name
                        }
                      </strong>


                      {megaCategory.description && (
                        <small>
                          {
                            megaCategory.description
                          }
                        </small>
                      )}

                    </div>

                  </div>


                  <div className="mega-columns">

                    {getChildren(
                      megaCategory.id
                    ).map(
                      (
                        child
                      ) => (
                        <div
                          className="mega-column"
                          key={
                            child.id
                          }
                        >

                          <button
                            type="button"
                            className="mega-column-title"
                            onClick={() => {
                              const children =
                                getChildren(
                                  child.id
                                );


                              if (
                                children.length
                              ) {
                                setMegaCategory(
                                  child
                                );
                              } else {
                                goTo(
                                  `/products?category=${encodeURIComponent(
                                    child.id
                                  )}`
                                );
                              }
                            }}
                          >

                            {child.image ? (
                              <img
                                src={
                                  child.image
                                }
                                alt={
                                  child.name
                                }
                              />
                            ) : (
                              <span>
                                📦
                              </span>
                            )}

                            <span>
                              {
                                child.name
                              }
                            </span>


                            {getChildren(
                              child.id
                            ).length >
                              0 && (
                              <span>
                                ▾
                              </span>
                            )}

                          </button>


                          <div className="mega-column-items">

                            {getChildren(
                              child.id
                            ).map(
                              (
                                deepChild
                              ) => (
                                <button
                                  type="button"
                                  className="mega-link"
                                  key={
                                    deepChild.id
                                  }
                                  onClick={() =>
                                    goTo(
                                      `/products?category=${encodeURIComponent(
                                        deepChild.id
                                      )}`
                                    )
                                  }
                                >

                                  {deepChild.image ? (
                                    <img
                                      src={
                                        deepChild.image
                                      }
                                      alt={
                                        deepChild.name
                                      }
                                    />
                                  ) : (
                                    <span className="mega-link-icon">
                                      📦
                                    </span>
                                  )}

                                  <span>
                                    {
                                      deepChild.name
                                    }
                                  </span>

                                </button>
                              )
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </>
              )
            )}


            <button
              type="button"
              className="mega-menu-view-all"
              onClick={() =>
                goTo(
                  "/categories"
                )
              }
            >

              عرض كل الأقسام

              <span>
                ←
              </span>

            </button>

          </div>

        </div>
      )}


      {/* =================================================
          LOGO MODAL
      ================================================= */}

      {logoModalOpen && (
        <div
          className="logo-modal"
          onClick={() =>
            setLogoModalOpen(
              false
            )
          }
        >

          <button
            type="button"
            className="close-logo"
            onClick={(
              event
            ) => {
              event.stopPropagation();

              setLogoModalOpen(
                false
              );
            }}
            aria-label="إغلاق"
          >
            ✕
          </button>


          <img
            src={
              storeSettings.logo ||
              DEFAULT_STORE_SETTINGS.logo
            }
            alt={
              storeSettings.storeName ||
              "ســـــَــــــــوا"
            }
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          />

        </div>
      )}


      {/* =================================================
          WHEEL POPUP
      ================================================= */}

      {wheelPopupOpen &&
        shouldShowWheelAsPopup &&
        wheelSettings.allowClose && (
          <div
            className="logo-modal"
            onClick={() =>
              setWheelPopupOpen(
                false
              )
            }
          >

            <button
              type="button"
              className="close-logo"
              onClick={(
                event
              ) => {
                event.stopPropagation();

                setWheelPopupOpen(
                  false
                );
              }}
              aria-label="إغلاق"
            >
              ✕
            </button>


            <div
              style={{
                width:
                  "min(92vw, 520px)",

                background:
                  "#ffffff",

                borderRadius:
                  "18px",

                padding:
                  "28px",

                textAlign:
                  "center",

                color:
                  "#222",

                boxShadow:
                  "0 20px 60px rgba(0,0,0,.3)",
              }}
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div
                style={{
                  fontSize:
                    "54px",

                  marginBottom:
                    "10px",
                }}
              >
                🎡
              </div>


              <h2
                style={{
                  margin:
                    "0 0 8px",

                  color:
                    theme.primary ||
                    "#071A36",
                }}
              >
                {
                  wheelGame.title ||
                  wheelSettings.title ||
                  "عجلة الحظ"
                }
              </h2>


              <p
                style={{
                  margin:
                    "0 0 20px",

                  color:
                    "#666",
                }}
              >
                {
                  wheelGame.description ||
                  wheelSettings.description ||
                  "لف العجلة واربح جائزتك!"
                }
              </p>


              <button
                type="button"
                onClick={() => {
                  setWheelPopupOpen(
                    false
                  );

                  openLuckGame(
                    "wheel"
                  );
                }}
                style={{
                  width:
                    "100%",

                  minHeight:
                    "50px",

                  border:
                    "none",

                  borderRadius:
                    "10px",

                  background:
                    theme.accent ||
                    "#D4AF37",

                  color:
                    "#ffffff",

                  cursor:
                    "pointer",

                  fontFamily:
                    "Cairo, Tahoma, sans-serif",

                  fontSize:
                    "16px",

                  fontWeight:
                    "700",
                }}
              >
                🎡 ابدأ اللعب
              </button>

            </div>

          </div>
        )}

    </div>
  );
}