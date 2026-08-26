import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import {
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

import { CartContext } from "../context/CartContext";

import { getCategories } from "../services/categoryService";

// =====================================================
// DEFAULT STORE SETTINGS
// =====================================================

const defaultStoreSettings = {
  storeName: "Elsafty Store",

  phone: "",
  whatsapp: "",
  email: "",
  address: "",

  facebook: "",
  instagram: "",
  telegram: "",

  announcement: "",

  theme: {
    primary: "#F68B1E",
    secondary: "#E97B10",
    accent: "#F68B1E",

    pageBackground: "#F5F5F5",
    cardBackground: "#FFFFFF",

    textPrimary: "#313133",
    textSecondary: "#75757A",

    border: "#E5E5E5",

    buttonBackground: "#F68B1E",
    buttonText: "#FFFFFF",

    navbarBackground: "#FFFFFF",
    navbarText: "#313133",

    categoryBarBackground: "#FFFFFF",
    categoryBarText: "#313133",

    topStripBackground: "#F68B1E",
    topStripText: "#FFFFFF",

    footerBackground: "#313133",
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
    items: [],
  },

  featuresBar: {
    enabled: true,
    background: "#FFFFFF",
    color: "#313133",
    accentColor: "#F68B1E",
    height: 80,
    fontSize: 16,
    items: [],
  },
};

// =====================================================
// DEFAULT WHEEL SETTINGS
// =====================================================

const defaultWheelSettings = {
  enabled: false,

  title: "🎡 جرب حظك!",

  description: "لف العجلة واكسب عرضك",

  attemptsPerUser: 2,

  prizes: [],
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
  // WHEEL STATES
  // ===================================================

  const [wheelSettings, setWheelSettings] =
    useState(defaultWheelSettings);

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

  const DAILY_WHEEL_ATTEMPTS = 2;

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
            ...previous,
            ...data,

            theme: {
              ...previous.theme,
              ...(data.theme || {}),
            },

            bannerSettings: {
              ...previous.bannerSettings,
              ...(data.bannerSettings || {}),
            },

            topStrip: {
              ...previous.topStrip,
              ...(data.topStrip || {}),
            },

            featuresBar: {
              ...previous.featuresBar,
              ...(data.featuresBar || {}),
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
          if (!snapshot.exists()) {
            setWheelSettings(
              defaultWheelSettings
            );

            return;
          }

          const data =
            snapshot.data() || {};

          setWheelSettings({
            ...defaultWheelSettings,
            ...data,

            attemptsPerUser:
              Number(
                data.attemptsPerUser ||
                  DAILY_WHEEL_ATTEMPTS
              ),

            prizes: Array.isArray(
              data.prizes
            )
              ? data.prizes
              : [],
          });
        },
        (error) => {
          console.error(
            "Wheel Settings Error:",
            error
          );

          setWheelSettings(
            defaultWheelSettings
          );
        }
      );

    return () => unsubscribe();
  }, []);

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
            new Date()
              .toISOString()
              .slice(0, 10);

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
  }, [currentUser]);

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

        // =================================================
        // FLASH SALES TIMER
        // نفس العد التنازلي حتى منتصف الليل
        // =================================================

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
  // THEME
  // ===================================================

  const theme =
    storeSettings?.theme ||
    defaultStoreSettings.theme;

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
  // LOAD CATEGORIES
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadCategories =
      async () => {
        try {
          const data =
            await getCategories();

          if (!mounted) {
            return;
          }

          const activeCategories =
            (data || [])
              .filter(
                (category) =>
                  category?.active ===
                  true
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

          setCategories(
            activeCategories
          );
        } catch (error) {
          console.error(
            "خطأ في تحميل الأقسام:",
            error
          );

          if (mounted) {
            setCategories([]);
          }
        }
      };

    loadCategories();

    return () => {
      mounted = false;
    };
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

      return (products || []).filter(
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

  // ===================================================
  // SPECIAL PRODUCTS
  // ===================================================

  const offers = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.offer === true
      ),
    [products]
  );

  const bestSellers = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.bestSeller === true
      ),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.newArrival === true
      ),
    [products]
  );

  const recommended = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.recommended ===
          true
      ),
    [products]
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

      return [...(products || [])]
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
      products,
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
  // CATEGORY CARD STYLE
  // ===================================================

  const getCategoryCardStyle =
    (category) => {
      const color =
        category?.color ||
        "#F68B1E";

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
    "#F68B1E",
    "#FFD166",
    "#E94F37",
    "#FF9F1C",
    "#F7C948",
    "#D93636",
    "#FFB703",
    "#E85D04",
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
        return "#F68B1E";
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
    ]);

  // ===================================================
  // SPIN WHEEL
  // ===================================================

  const spinWheel =
    async () => {
      if (
        isSpinning ||
        activeWheelPrizes.length ===
          0
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

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const attemptRef =
        doc(
          db,
          "wheelAttempts",
          `${currentUser.uid}_${today}`
        );

      let newAttempts = 0;

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
                    snapshot.data()
                      ?.attempts || 0
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
                attempts:
                  newAttempts,
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

        setWheelAttempts(
          newAttempts
        );
      } catch (error) {
        if (
          error?.message ===
          "DAILY_LIMIT_REACHED"
        ) {
          setWheelAttempts(
            DAILY_WHEEL_ATTEMPTS
          );

          alert(
            "لقد استخدمت اللفتين المسموح بهما اليوم. ارجع بكرة وجرب حظك من جديد ❤️"
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

      // ================================================
      // SELECT PRIZE
      // ================================================

      const randomIndex =
        Math.floor(
          Math.random() *
            activeWheelPrizes.length
        );

      const selectedPrize =
        activeWheelPrizes[
          randomIndex
        ];

      // ================================================
      // CALCULATE ROTATION
      // ================================================

      const segmentAngle =
        360 /
        activeWheelPrizes.length;

      const targetAngle =
        -(
          randomIndex *
            segmentAngle +
          segmentAngle / 2
        );

      const extraRotation =
        360 * 6;

      const finalRotation =
        wheelRotation +
        extraRotation +
        targetAngle;

      // ================================================
      // START
      // ================================================

      setIsSpinning(true);
      setWheelResult(null);
      setSpinCountdown(
        SPIN_DURATION
      );

      setWheelRotation(
        finalRotation
      );

      // ================================================
      // FINISH
      // ================================================

      spinTimerRef.current =
        setTimeout(() => {
          setIsSpinning(false);
          setSpinCountdown(0);
          setWheelResult(
            selectedPrize
          );
        }, SPIN_DURATION * 1000);
    };

  // ===================================================
  // WHEEL LABEL STYLE
  // ===================================================

  const getWheelLabelStyle =
    (index) => {
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

      return {
        transform: `rotate(${angle}deg) translateY(-94px) rotate(${-angle}deg)`,
      };
    };

  // ===================================================
  // DYNAMIC CSS
  // ===================================================

  const homeStyle = {
    "--store-primary":
      theme?.primary ||
      "#F68B1E",

    "--store-secondary":
      theme?.secondary ||
      "#E97B10",

    "--store-accent":
      theme?.accent ||
      "#F68B1E",

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
      "#F68B1E",

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
      "#F68B1E",

    "--store-top-strip-text":
      theme?.topStripText ||
      "#FFFFFF",

    "--store-footer-background":
      theme?.footerBackground ||
      "#313133",

    "--store-footer-text":
      theme?.footerText ||
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
        products={products}
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
          <HeroSlider />
        </section>

        {/* =================================================
            WHEEL OF FORTUNE
        ================================================= */}

        {wheelSettings?.enabled ===
          true &&
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
                    "1px solid #f2c15a",
                  boxShadow:
                    "0 10px 35px rgba(0,0,0,.12)",
                }}
              >

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
                      "linear-gradient(90deg, #F68B1E, #FFD166, #E94F37, #F68B1E)",
                  }}
                />

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
                        "15px solid #F68B1E",
                    }}
                  />

                  {/* WHEEL */}

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
                              (360 /
                                24) *
                              index;

                            return (
                              <span
                                key={
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
                                    "9px",
                                  height:
                                    "9px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    isSpinning
                                      ? "#fff"
                                      : "#FFE7A0",
                                  boxShadow:
                                    "0 0 8px rgba(255,220,100,.95)",
                                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-137px)`,
                                  zIndex:
                                    10,
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
                                      "rgba(255,255,255,.8)",
                                    left:
                                      "50%",
                                    top:
                                      "0",
                                    transformOrigin:
                                      "bottom center",
                                    transform: `translateX(-50%) rotate(${angle}deg)`,
                                    zIndex:
                                      2,
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
                            ) => (
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
                                    "105px",
                                  marginLeft:
                                    "-52.5px",
                                  marginTop:
                                    "-13px",
                                  textAlign:
                                    "center",
                                  color:
                                    "#313133",
                                  fontSize:
                                    activeWheelPrizes.length >
                                    8
                                      ? "10px"
                                      : "12px",
                                  fontWeight:
                                    "900",
                                  lineHeight:
                                    "1.15",
                                  textShadow:
                                    "0 1px 0 rgba(255,255,255,.5)",
                                  zIndex:
                                    5,
                                  pointerEvents:
                                    "none",
                                  ...getWheelLabelStyle(
                                    index
                                  ),
                                }}
                              >
                                {prize?.title ||
                                  "جائزة"}
                              </div>
                            )
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
                                "5px solid #F68B1E",
                              boxShadow:
                                "0 3px 12px rgba(0,0,0,.5)",
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
                                  "#F68B1E",
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

                  {/* =================================================
                      SPIN BUTTON
                  ================================================= */}

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
                              : "#F68B1E",
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
                              "#F68B1E",
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
                                  "#F68B1E",
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

                  {/* =================================================
                      RESULT
                  ================================================= */}

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
                          "2px solid #F68B1E",
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
                            "#F68B1E",
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
            QUICK CATEGORIES
        ================================================= */}

        <section className="jumia-section quick-shop-section">
          <div className="jumia-section-title">
            <h2>
              كل اللي هتحتاجه في مكان واحد
            </h2>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  ".jumia-all-categories"
                )
              }
            >
              عرض الكل
            </button>
          </div>

          <div className="jumia-categories">
            {rootCategories.length >
            0 ? (
              rootCategories
                .slice(0, 8)
                .map((category) => {
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
                              "قسم"
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
                          "قسم"}
                      </strong>

                      <small>
                        {children.length >
                        0
                          ? `${children.length} قسم فرعي`
                          : categoryProducts.length >
                              0
                            ? `${categoryProducts.length} منتج`
                            : "تصفح الآن"}
                      </small>
                    </button>
                  );
                })
            ) : (
              <div className="store-empty-choice">
                <div>📂</div>

                <h3>
                  لا توجد أقسام حاليًا
                </h3>

                <p>
                  أضف الأقسام من لوحة
                  الأدمن
                </p>
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
              title="عروض اليوم"
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
              title="المنتجات الأفضل مبيعاً"
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
            COUPONS
        ================================================= */}

        <section className="jumia-promo-strip">
          <div className="promo-content">
            <span className="promo-icon">
              🏷️
            </span>

            <div>
              <h2>
                ألحق أكواد الخصم!
              </h2>

              <p>
                وفر أكتر مع العروض
                والكوبونات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "#today-offers"
              )
            }
          >
            تسوق الآن
          </button>
        </section>

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
              title="وصل حديثاً"
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
              title="قد يعجبك"
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
            ALL CATEGORIES
        ================================================= */}

        <section className="jumia-section all-categories-section">
          <div className="jumia-section-title">
            <h2>
              تصفح الأقسام
            </h2>

            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                })
              }
            >
              الرئيسية
            </button>
          </div>

          <div className="jumia-all-categories">
            {rootCategories.map(
              (category) => {
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
                    className="jumia-category-tile"
                    style={getCategoryCardStyle(
                      category
                    )}
                    onClick={() =>
                      openCategory(
                        category
                      )
                    }
                  >
                    <div className="jumia-category-image">
                      {category?.image ? (
                        <img
                          src={
                            category.image
                          }
                          alt={
                            category?.name ||
                            "قسم"
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
                        "قسم"}
                    </strong>

                    <small>
                      {categoryProducts.length >
                      0
                        ? `${categoryProducts.length} منتج`
                        : "اكتشف الآن"}
                    </small>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* =================================================
            FLASH SALES
        ================================================= */}

        {offers.length > 0 && (
          <section className="jumia-flash-section">
            <div className="jumia-flash-header">

              <div className="flash-title">
                <span className="flash-icon">
                  ⚡
                </span>

                <div>
                  <h2>
                    Flash Sales
                  </h2>

                  <p>
                    عروض لفترة محدودة
                  </p>
                </div>
              </div>

              {/* ==========================================
                  FLASH SALES COUNTDOWN TIMER
              ========================================== */}

              <div
                className="flash-countdown"
                dir="ltr"
                aria-label="Flash Sales countdown"
              >
                <span className="flash-countdown-label">
                  ينتهي خلال
                </span>

                <div className="flash-countdown-boxes">

                  <div className="flash-time-box">
                    <strong>
                      {
                        flashTimeLeft.hours
                      }
                    </strong>

                    <small>
                      ساعة
                    </small>
                  </div>

                  <span className="flash-time-separator">
                    :
                  </span>

                  <div className="flash-time-box">
                    <strong>
                      {
                        flashTimeLeft.minutes
                      }
                    </strong>

                    <small>
                      دقيقة
                    </small>
                  </div>

                  <span className="flash-time-separator">
                    :
                  </span>

                  <div className="flash-time-box">
                    <strong>
                      {
                        flashTimeLeft.seconds
                      }
                    </strong>

                    <small>
                      ثانية
                    </small>
                  </div>

                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "#today-offers"
                  )
                }
              >
                عرض الكل
              </button>
            </div>

            <ProductsSlider
              title=""
              badge="FLASH"
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
                      اكتشف أفضل المنتجات
                      في هذا القسم
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
          FOOTER
      ================================================= */}

      <footer
        className="store-footer jumia-footer"
        style={{
          background:
            theme?.footerBackground ||
            "#313133",

          color:
            theme?.footerText ||
            "#FFFFFF",
        }}
      >
        <div className="footer-container">
          <div className="footer-column">
            <h2>
              {storeSettings?.storeName ||
                "Elsafty Store"}
            </h2>

            <p>
              كل اللي تحتاجه في مكان
              واحد. تسوق بسهولة واحصل
              على أفضل المنتجات
              والأسعار.
            </p>

            {storeSettings?.address && (
              <p>
                📍{" "}
                {
                  storeSettings.address
                }
              </p>
            )}

            {storeSettings?.phone && (
              <p>
                📞{" "}
                {
                  storeSettings.phone
                }
              </p>
            )}

            {storeSettings?.email && (
              <p>
                ✉️{" "}
                {
                  storeSettings.email
                }
              </p>
            )}
          </div>

          <div className="footer-column">
            <h3>
              تحتاج مساعدة؟
            </h3>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/")
              }
            >
              الرئيسية
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate(
                  "/account"
                )
              }
            >
              حسابي
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate(
                  "/orders"
                )
              }
            >
              طلباتي
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/cart")
              }
            >
              سلة التسوق
            </button>
          </div>

          <div className="footer-column">
            <h3>
              تسوق معنا
            </h3>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  ".jumia-categories"
                )
              }
            >
              الأقسام
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  "#today-offers"
                )
              }
            >
              عروض اليوم
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  "#best-sellers"
                )
              }
            >
              الأكثر مبيعًا
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  "#new-arrivals"
                )
              }
            >
              وصل حديثًا
            </button>
          </div>

          <div className="footer-column">
            <h3>
              خدمة العملاء
            </h3>

            <p>
              🚚 شحن لجميع المحافظات
            </p>

            <p>
              🔒 دفع آمن
            </p>

            <p>
              ⭐ منتجات مختارة
            </p>

            {storeSettings?.whatsapp && (
              <p>
                💬 واتساب:{" "}
                {
                  storeSettings.whatsapp
                }
              </p>
            )}
          </div>

          <div className="footer-column">
            <h3>
              تابعنا
            </h3>

            <div className="footer-social">
              {storeSettings?.facebook && (
                <button
                  type="button"
                  aria-label="Facebook"
                  onClick={() =>
                    window.open(
                      storeSettings.facebook,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  📘
                </button>
              )}

              {storeSettings?.instagram && (
                <button
                  type="button"
                  aria-label="Instagram"
                  onClick={() =>
                    window.open(
                      storeSettings.instagram,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  📷
                </button>
              )}

              {storeSettings?.telegram && (
                <button
                  type="button"
                  aria-label="Telegram"
                  onClick={() =>
                    window.open(
                      storeSettings.telegram,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  ✈️
                </button>
              )}

              {!storeSettings?.facebook &&
                !storeSettings?.instagram &&
                !storeSettings?.telegram && (
                  <span>
                    أضف روابط التواصل
                    من لوحة الأدمن
                  </span>
                )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          ©{" "}
          {new Date().getFullYear()}{" "}
          {storeSettings?.storeName ||
            "Elsafty Store"}
          {" - "}
          جميع الحقوق محفوظة.
        </div>
      </footer>

      {/* =================================================
          WHEEL + FLASH TIMER ANIMATIONS
      ================================================= */}

      <style>
        {`
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
            color: #F68B1E;
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

            /* FLASH TIMER MOBILE */

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
        `}
      </style>
    </div>
  );
}

export default Home;