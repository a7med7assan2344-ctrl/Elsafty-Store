import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  Navigation,
} from "swiper/modules";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./HeroSlider.css";

/* ============================================================
   ســــَــــــــــوا | HERO SLIDER
   ------------------------------------------------------------
   مصدر البيانات:
   1) settings/store
   2) banners
   3) announcementBars

   ملاحظة:
   يوجد شريط إعلانات واحد فقط.
   محتوى الشريط يأتي من announcementBars.
   topStrip داخل settings/store يتحكم في شكل الشريط فقط.
============================================================ */

const PRIMARY = "#071A36";
const SECONDARY = "#0B1F3A";
const ACCENT = "#D4AF37";
const PAGE_BG = "#F0F4F8";

/* ============================================================
   DEFAULT THEME
============================================================ */

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

/* ============================================================
   DEFAULT STORE SETTINGS
============================================================ */

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

    navigation: true,
    pagination: true,
    loop: true,

    transitionSpeed: 800,
  },

  /* ==========================================================
     إعدادات شكل شريط الإعلانات فقط
     لا يتم إنشاء شريط منها.
  ========================================================== */

  topStrip: {
    enabled: true,

    direction: "rtl",

    speed: 40,

    height: 42,

    fontSize: 15,

    fontWeight: 700,

    background: PRIMARY,
    backgroundColor: PRIMARY,

    color: "#FFFFFF",
    textColor: "#FFFFFF",
  },

  featuresBar: {
    enabled: true,

    background: "#FFFFFF",

    color: PRIMARY,

    accentColor: ACCENT,

    height: 80,

    fontSize: 16,

    direction: "rtl",

    speed: 18,
  },

  texts: {
    homeTitle:
      "أهلاً بك في ســــَــــــــــوا",

    homeSubtitle:
      "اختيارات مميزة وأسعار تناسبك",

    productsTitle:
      "منتجات مميزة",

    offersTitle:
      "عروض اليوم",

    bestSellersTitle:
      "الأكثر مبيعًا",

    newArrivalsTitle:
      "وصل حديثًا",

    recommendedTitle:
      "قد يعجبك",

    categoriesTitle:
      "تسوق حسب القسم",

    emptyProducts:
      "لا توجد منتجات متاحة حاليًا",

    emptyCategories:
      "لا توجد أقسام متاحة حاليًا",

    cartTitle:
      "سلة المشتريات",

    checkoutTitle:
      "إتمام الطلب",

    addToCart:
      "أضف للسلة",

    buyNow:
      "اشترِ الآن",

    viewAll:
      "عرض الكل",

    footerAbout:
      "متجر ســــَــــــــــوا للتسوق الإلكتروني",

    footerRights:
      "جميع الحقوق محفوظة",
  },
};

/* ============================================================
   FALLBACK SLIDES
============================================================ */

const fallbackSlides = [
  {
    id: "fallback-1",

    image: "/banners/banner1.jpg",

    title: "خصومات حتى 50%",

    text:
      "أفضل الأسعار على آلاف المنتجات",

    tag: "🔥 عروض خاصة",

    buttonText: "تسوق الآن",

    link: "/",

    active: true,

    order: 1,

    fontFamily: "Cairo",

    textColor: "#FFFFFF",

    titleFontSize: 42,

    descriptionFontSize: 20,

    fontWeight: "700",

    textAlign: "right",

    textPositionX: "right",

    textPositionY: "center",

    overlayOpacity: null,

    objectPosition: "center",
  },

  {
    id: "fallback-2",

    image: "/banners/banner2.jpg",

    title: "وصل حديثًا",

    text:
      "اكتشف أحدث المنتجات بأفضل الأسعار.",

    tag: "🆕 وصل حديثًا",

    buttonText: "اكتشف الآن",

    link: "/",

    active: true,

    order: 2,

    fontFamily: "Cairo",

    textColor: "#FFFFFF",

    titleFontSize: 42,

    descriptionFontSize: 20,

    fontWeight: "700",

    textAlign: "right",

    textPositionX: "right",

    textPositionY: "center",

    overlayOpacity: null,

    objectPosition: "center",
  },

  {
    id: "fallback-3",

    image: "/banners/banner3.jpg",

    title: "شحن سريع",

    text:
      "توصيل لجميع المحافظات في أسرع وقت.",

    tag: "🚚 شحن سريع",

    buttonText: "تسوق الآن",

    link: "/",

    active: true,

    order: 3,

    fontFamily: "Cairo",

    textColor: "#FFFFFF",

    titleFontSize: 42,

    descriptionFontSize: 20,

    fontWeight: "700",

    textAlign: "right",

    textPositionX: "right",

    textPositionY: "center",

    overlayOpacity: null,

    objectPosition: "center",
  },
];

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (
  value,
  fallback
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const clamp = (
  value,
  min,
  max
) => {
  return Math.min(
    max,
    Math.max(
      min,
      toNumber(
        value,
        min
      )
    )
  );
};

const toText = (
  value,
  fallback = ""
) => {
  return String(
    value ?? fallback
  ).trim();
};

const getTimestampVersion = (
  timestamp
) => {
  if (!timestamp) {
    return Date.now();
  }

  if (
    typeof timestamp?.toMillis ===
    "function"
  ) {
    return timestamp.toMillis();
  }

  if (
    typeof timestamp?.seconds ===
    "number"
  ) {
    return timestamp.seconds * 1000;
  }

  if (
    typeof timestamp?._seconds ===
    "number"
  ) {
    return timestamp._seconds * 1000;
  }

  return Date.now();
};

const getHorizontalPosition = (
  position
) => {
  switch (position) {
    case "left":
      return "flex-start";

    case "center":
      return "center";

    case "right":
    default:
      return "flex-end";
  }
};

const getVerticalPosition = (
  position
) => {
  switch (position) {
    case "top":
      return "flex-start";

    case "bottom":
      return "flex-end";

    case "center":
    default:
      return "center";
  }
};

/* ============================================================
   STORE SETTINGS NORMALIZER
============================================================ */

const mergeStoreSettings = (
  data = {}
) => {
  return {
    ...defaultStoreSettings,

    ...data,

    theme: {
      ...defaultTheme,
      ...(data?.theme || {}),
    },

    bannerSettings: {
      ...defaultStoreSettings
        .bannerSettings,

      ...(data?.bannerSettings || {}),
    },

    /*
      مهم:
      topStrip هنا إعدادات الشكل فقط.
      لا يوجد items.
    */

    topStrip: {
      ...defaultStoreSettings.topStrip,

      ...(data?.topStrip || {}),
    },

    featuresBar: {
      ...defaultStoreSettings
        .featuresBar,

      ...(data?.featuresBar || {}),
    },

    texts: {
      ...defaultStoreSettings.texts,

      ...(data?.texts || {}),
    },
  };
};

/* ============================================================
   BANNER NORMALIZER
============================================================ */

const normalizeBanner = (
  banner,
  index
) => {
  const originalImage =
    toText(
      banner?.image
    );

  const timestampVersion =
    getTimestampVersion(
      banner?.updatedAt
    );

  const image =
    originalImage
      ? `${originalImage}${
          originalImage.includes("?")
            ? "&"
            : "?"
        }v=${timestampVersion}`
      : "";

  return {
    id:
      toText(
        banner?.id,
        `banner-${index}`
      ),

    image,

    title:
      toText(
        banner?.title
      ),

    text:
      toText(
        banner?.text ||
        banner?.description
      ),

    tag:
      toText(
        banner?.tag ||
        banner?.badge
      ),

    buttonText:
      toText(
        banner?.buttonText ||
        banner?.button
      ),

    link:
      toText(
        banner?.link,
        "/"
      ),

    active:
      banner?.active !== false,

    order:
      toNumber(
        banner?.order,
        index
      ),

    fontFamily:
      toText(
        banner?.fontFamily,
        "Cairo"
      ),

    textColor:
      toText(
        banner?.textColor,
        "#FFFFFF"
      ),

    titleFontSize:
      Math.max(
        16,
        toNumber(
          banner?.titleFontSize,
          42
        )
      ),

    descriptionFontSize:
      Math.max(
        10,
        toNumber(
          banner?.descriptionFontSize,
          20
        )
      ),

    fontWeight:
      toText(
        banner?.fontWeight,
        "700"
      ),

    textAlign:
      toText(
        banner?.textAlign,
        "right"
      ),

    textPositionX:
      toText(
        banner?.textPositionX,
        "right"
      ),

    textPositionY:
      toText(
        banner?.textPositionY,
        "center"
      ),

    objectPosition:
      toText(
        banner?.objectPosition,
        "center"
      ),

    overlayOpacity:
      banner?.overlayOpacity !==
      undefined
        ? clamp(
            banner.overlayOpacity,
            0,
            1
          )
        : null,

    tagBackground:
      toText(
        banner?.tagBackground
      ),

    tagColor:
      toText(
        banner?.tagColor
      ),

    buttonBackground:
      toText(
        banner?.buttonBackground
      ),

    buttonTextColor:
      toText(
        banner?.buttonTextColor
      ),
  };
};

/* ============================================================
   ANNOUNCEMENT NORMALIZER
============================================================ */

const normalizeAnnouncement = (
  item,
  index,
  topStrip
) => {
  const raw =
    typeof item === "string"
      ? {
          text: item,
        }
      : item &&
          typeof item === "object"
        ? item
        : {};

  const text =
    toText(
      raw?.text ||
      raw?.title ||
      raw?.message ||
      raw?.content ||
      raw?.label
    );

  if (!text) {
    return null;
  }

  const enabled =
    raw?.active !== false &&
    raw?.enabled !== false &&
    raw?.visible !== false &&
    raw?.isActive !== false;

  if (!enabled) {
    return null;
  }

  return {
    ...raw,

    id:
      raw?.id ||
      `announcement-${index}`,

    text,

    type:
      toText(
        raw?.type ||
        raw?.animation ||
        "marquee"
      ).toLowerCase(),

    direction:
      raw?.direction ||
      topStrip?.direction ||
      "rtl",

    speed:
      Math.max(
        5,
        toNumber(
          raw?.speed ??
            topStrip?.speed,
          40
        )
      ),

    height:
      Math.max(
        1,
        toNumber(
          raw?.height ??
            topStrip?.height,
          42
        )
      ),

    fontSize:
      Math.max(
        8,
        toNumber(
          raw?.fontSize ??
            topStrip?.fontSize,
          15
        )
      ),

    fontWeight:
      raw?.fontWeight ??
      topStrip?.fontWeight ??
      700,

    backgroundColor:
      raw?.backgroundColor ||
      raw?.background ||
      topStrip?.backgroundColor ||
      topStrip?.background ||
      null,

    textColor:
      raw?.textColor ||
      raw?.color ||
      topStrip?.textColor ||
      topStrip?.color ||
      null,

    accentColor:
      raw?.accentColor ||
      null,

    link:
      raw?.link ||
      raw?.url ||
      "",
  };
};

/* ============================================================
   COMPONENT
============================================================ */

export default function HeroSlider() {
  const navigate =
    useNavigate();

  const [slides, setSlides] =
    useState(fallbackSlides);

  const [
    storeSettings,
    setStoreSettings,
  ] = useState(
    defaultStoreSettings
  );

  /*
    مصدر محتوى شريط الإعلانات الوحيد
  */
  const [
    announcementBars,
    setAnnouncementBars,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    bannerVersion,
    setBannerVersion,
  ] = useState(0);

  /* ==========================================================
     LOAD BANNERS
  ========================================================== */

  useEffect(() => {
    const bannersRef =
      collection(
        db,
        "banners"
      );

    const unsubscribe =
      onSnapshot(
        bannersRef,
        (snapshot) => {
          try {
            const rawBanners =
              snapshot.docs.map(
                (item) => ({
                  id: item.id,
                  ...(item.data() ||
                    {}),
                })
              );

            const activeBanners =
              rawBanners
                .filter(
                  (banner) =>
                    banner?.active !==
                      false &&
                    toText(
                      banner?.image
                    ) !== ""
                )
                .sort(
                  (a, b) =>
                    toNumber(
                      a?.order,
                      0
                    ) -
                    toNumber(
                      b?.order,
                      0
                    )
                );

            if (
              activeBanners.length ===
              0
            ) {
              setSlides(
                fallbackSlides
              );

              setBannerVersion(
                (previous) =>
                  previous + 1
              );

              setLoading(false);

              return;
            }

            setSlides(
              activeBanners.map(
                (
                  banner,
                  index
                ) =>
                  normalizeBanner(
                    banner,
                    index
                  )
              )
            );

            setBannerVersion(
              (previous) =>
                previous + 1
            );

            setLoading(false);
          } catch (error) {
            console.error(
              "❌ Banner normalization error:",
              error
            );

            setSlides(
              fallbackSlides
            );

            setLoading(false);
          }
        },
        (error) => {
          console.error(
            "❌ Banners realtime error:",
            error
          );

          setSlides(
            fallbackSlides
          );

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* ==========================================================
     LOAD STORE SETTINGS
  ========================================================== */

  useEffect(() => {
    const settingsRef =
      doc(
        db,
        "settings",
        "store"
      );

    const unsubscribe =
      onSnapshot(
        settingsRef,
        (snapshot) => {
          try {
            if (
              !snapshot.exists()
            ) {
              setStoreSettings(
                defaultStoreSettings
              );

              return;
            }

            setStoreSettings(
              mergeStoreSettings(
                snapshot.data() || {}
              )
            );
          } catch (error) {
            console.error(
              "❌ Store settings error:",
              error
            );
          }
        },
        (error) => {
          console.error(
            "❌ Store settings realtime error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* ==========================================================
     LOAD ANNOUNCEMENT BARS
     المصدر الوحيد لمحتوى الشريط
  ========================================================== */

  useEffect(() => {
    const announcementsRef =
      collection(
        db,
        "announcementBars"
      );

    const unsubscribe =
      onSnapshot(
        announcementsRef,
        (snapshot) => {
          try {
            const bars =
              snapshot.docs
                .map(
                  (item) => ({
                    id: item.id,
                    ...(item.data() ||
                      {}),
                  })
                )
                .filter(
                  (item) => {
                    const text =
                      toText(
                        item?.text ||
                        item?.title ||
                        item?.message ||
                        item?.content ||
                        item?.label
                      );

                    if (!text) {
                      return false;
                    }

                    return (
                      item?.active !==
                        false &&
                      item?.enabled !==
                        false &&
                      item?.visible !==
                        false &&
                      item?.isActive !==
                        false
                    );
                  }
                )
                .sort(
                  (a, b) =>
                    toNumber(
                      a?.sortOrder ??
                        a?.order,
                      0
                    ) -
                    toNumber(
                      b?.sortOrder ??
                        b?.order,
                      0
                    )
                );

            setAnnouncementBars(
              bars
            );
          } catch (error) {
            console.error(
              "❌ Announcement Bars Error:",
              error
            );

            setAnnouncementBars(
              []
            );
          }
        },
        (error) => {
          console.error(
            "❌ Announcement Bars realtime error:",
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

  /* ==========================================================
     SETTINGS
  ========================================================== */

  const theme =
    storeSettings?.theme ||
    defaultTheme;

  const bannerSettings =
    storeSettings?.bannerSettings ||
    defaultStoreSettings
      .bannerSettings;

  const topStrip =
    storeSettings?.topStrip ||
    defaultStoreSettings
      .topStrip;

  const featuresBar =
    storeSettings?.featuresBar ||
    defaultStoreSettings
      .featuresBar;

  const texts =
    storeSettings?.texts ||
    defaultStoreSettings
      .texts;

  const storeName =
    toText(
      storeSettings?.storeName
    ) ||
    defaultStoreSettings
      .storeName;

  /* ==========================================================
     FEATURES
  ========================================================== */

  const featureItems =
    useMemo(() => {
      const items =
        Array.isArray(
          featuresBar?.items
        )
          ? featuresBar.items
          : [];

      return items
        .filter(
          (item) =>
            item &&
            item.active !== false
        )
        .sort(
          (a, b) =>
            toNumber(
              a?.order,
              0
            ) -
            toNumber(
              b?.order,
              0
            )
        );
    }, [
      featuresBar?.items,
    ]);

  const duplicatedFeatureItems =
    useMemo(
      () =>
        featureItems.length
          ? [
              ...featureItems,
              ...featureItems,
            ]
          : [],
      [featureItems]
    );

  /* ==========================================================
     الشريط الوحيد
     
     مهم جدًا:
     لا نقرأ topStrip.items هنا.
     المحتوى يأتي فقط من announcementBars.
  ========================================================== */

  const visibleAnnouncementBars =
    useMemo(() => {
      return announcementBars
        .map(
          (
            item,
            index
          ) =>
            normalizeAnnouncement(
              item,
              index,
              topStrip
            )
        )
        .filter(Boolean);
    }, [
      announcementBars,
      topStrip,
    ]);

  /* ==========================================================
     TOP STRIP VISUAL SETTINGS
     دي إعدادات شكل الشريط الوحيد
  ========================================================== */

  const topStripEnabled =
    topStrip?.enabled !== false &&
    visibleAnnouncementBars.length >
      0;

  const firstAnnouncement =
    visibleAnnouncementBars?.[0] ||
    {};

  const topStripHeight =
    Math.max(
      24,
      toNumber(
        firstAnnouncement?.height ??
          topStrip?.height,
        42
      )
    );

  const topStripFontSize =
    Math.max(
      8,
      toNumber(
        firstAnnouncement?.fontSize ??
          topStrip?.fontSize,
        15
      )
    );

  const topStripFontWeight =
    firstAnnouncement?.fontWeight ??
    topStrip?.fontWeight ??
    700;

  const topStripDirection =
    firstAnnouncement?.direction ||
    topStrip?.direction ||
    "rtl";

  const topStripSpeed =
    Math.max(
      5,
      toNumber(
        firstAnnouncement?.speed ??
          topStrip?.speed,
        40
      )
    );

  const topStripBackground =
    firstAnnouncement?.backgroundColor ||
    topStrip?.backgroundColor ||
    topStrip?.background ||
    theme?.topStripBackground ||
    PRIMARY;

  const topStripTextColor =
    firstAnnouncement?.textColor ||
    topStrip?.textColor ||
    topStrip?.color ||
    theme?.topStripText ||
    "#FFFFFF";

  /* ==========================================================
     FEATURES SETTINGS
  ========================================================== */

  const featureHeight =
    Math.max(
      1,
      toNumber(
        featuresBar?.height,
        80
      )
    );

  const featureFontSize =
    Math.max(
      8,
      toNumber(
        featuresBar?.fontSize,
        16
      )
    );

  const featureSpeed =
    Math.max(
      5,
      toNumber(
        featuresBar?.speed,
        18
      )
    );

  const featureDirection =
    featuresBar?.direction ||
    "rtl";

  const featureBackground =
    featuresBar?.background ||
    theme?.cardBackground ||
    "#FFFFFF";

  const featureColor =
    featuresBar?.color ||
    theme?.textPrimary ||
    PRIMARY;

  const featureAccentColor =
    featuresBar?.accentColor ||
    theme?.accent ||
    ACCENT;

  /* ==========================================================
     BANNER SETTINGS
  ========================================================== */

  const autoplayEnabled =
    bannerSettings?.autoplay !==
    false;

  const autoplayDelay =
    Math.max(
      1500,
      toNumber(
        bannerSettings?.autoplayDelay,
        5000
      )
    );

  const transitionSpeed =
    Math.max(
      150,
      toNumber(
        bannerSettings?.transitionSpeed,
        800
      )
    );

  const navigationEnabled =
    bannerSettings?.navigation !==
    false;

  const paginationEnabled =
    bannerSettings?.pagination !==
    false;

  const loopEnabled =
    bannerSettings?.loop !==
    false;

  const borderRadius =
    Math.max(
      0,
      toNumber(
        bannerSettings?.borderRadius,
        16
      )
    );

  const globalOverlayOpacity =
    clamp(
      bannerSettings?.overlayOpacity,
      0,
      1
    );

  /* ==========================================================
     CSS VARIABLES
  ========================================================== */

  const heroStyle = {
    "--hero-desktop-height":
      `${Math.max(
        160,
        toNumber(
          bannerSettings?.heightDesktop,
          420
        )
      )}px`,

    "--hero-tablet-height":
      `${Math.max(
        150,
        toNumber(
          bannerSettings?.heightTablet,
          350
        )
      )}px`,

    "--hero-mobile-height":
      `${Math.max(
        130,
        toNumber(
          bannerSettings?.heightMobile,
          240
        )
      )}px`,

    "--hero-border-radius":
      `${borderRadius}px`,

    "--hero-overlay-opacity":
      globalOverlayOpacity,

    "--top-strip-height":
      `${topStripHeight}px`,

    "--top-strip-font-size":
      `${topStripFontSize}px`,

    "--top-strip-duration":
      `${topStripSpeed}s`,

    "--top-strip-bg":
      topStripBackground,

    "--top-strip-text":
      topStripTextColor,

    "--hero-primary":
      theme?.primary ||
      PRIMARY,

    "--hero-secondary":
      theme?.secondary ||
      SECONDARY,

    "--hero-accent":
      theme?.accent ||
      ACCENT,

    "--features-height":
      `${featureHeight}px`,

    "--features-font-size":
      `${featureFontSize}px`,

    "--features-duration":
      `${featureSpeed}s`,
  };

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const handleBannerClick =
    (link) => {
      const target =
        toText(
          link,
          "/"
        );

      if (
        !target ||
        target === "#"
      ) {
        navigate("/");

        return;
      }

      if (
        /^https?:\/\//i.test(
          target
        )
      ) {
        window.location.href =
          target;

        return;
      }

      navigate(
        target.startsWith("/")
          ? target
          : `/${target}`
      );
    };

  const handleAnnouncementClick =
    (link) => {
      const target =
        toText(link);

      if (!target) {
        return;
      }

      if (
        /^https?:\/\//i.test(
          target
        )
      ) {
        window.location.href =
          target;

        return;
      }

      navigate(
        target.startsWith("/")
          ? target
          : `/${target}`
      );
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      className="hero-section"
      dir="rtl"
      style={{
        ...heroStyle,

        background:
          theme?.pageBackground ||
          PAGE_BG,

        color:
          theme?.textPrimary ||
          PRIMARY,
      }}
      data-store-name={
        storeName
      }
    >

      {/* ======================================================
          شريط إعلانات واحد فقط
          
          المحتوى = announcementBars
          الشكل = topStrip settings
      ====================================================== */}

      {topStripEnabled && (
        <div
          className="hero-offer-strip"
          style={{
            height:
              `${topStripHeight}px`,

            background:
              topStripBackground,

            color:
              topStripTextColor,

            direction:
              topStripDirection,

            fontWeight:
              topStripFontWeight,
          }}
        >
          <div
            className="hero-offer-track"
            style={{
              direction:
                topStripDirection,

              animationDuration:
                `${topStripSpeed}s`,

              fontSize:
                `${topStripFontSize}px`,

              fontWeight:
                topStripFontWeight,
            }}
          >
            {[
              ...visibleAnnouncementBars,
              ...visibleAnnouncementBars,
            ].map(
              (
                item,
                index
              ) => (
                <span
                  key={`announcement-${item.id}-${index}`}
                  style={{
                    cursor:
                      item?.link
                        ? "pointer"
                        : "default",

                    color:
                      item?.textColor ||
                      topStripTextColor,

                    fontWeight:
                      item?.fontWeight ||
                      topStripFontWeight,
                  }}
                  onClick={() =>
                    item?.link &&
                    handleAnnouncementClick(
                      item.link
                    )
                  }
                >
                  {item.text}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          HERO SLIDER
      ====================================================== */}

      <div
        className="hero-slider-wrapper"
        style={{
          borderRadius:
            `${borderRadius}px`,

          overflow:
            "hidden",

          background:
            theme?.cardBackground ||
            "#FFFFFF",

          boxShadow:
            borderRadius > 0
              ? "0 10px 35px rgba(7,26,54,.10)"
              : "none",
        }}
      >
        <Swiper
          key={`hero-swiper-${bannerVersion}`}
          modules={[
            Autoplay,
            Pagination,
            Navigation,
          ]}
          autoplay={
            autoplayEnabled
              ? {
                  delay:
                    autoplayDelay,

                  disableOnInteraction:
                    false,

                  pauseOnMouseEnter:
                    true,
                }
              : false
          }
          pagination={
            paginationEnabled
              ? {
                  clickable:
                    true,

                  dynamicBullets:
                    true,
                }
              : false
          }
          navigation={
            navigationEnabled &&
            slides.length > 1
          }
          loop={
            loopEnabled &&
            slides.length > 1
          }
          speed={
            transitionSpeed
          }
          observer
          observeParents
          resizeObserver
          className="hero-swiper"
        >

          {slides.map(
            (
              slide,
              index
            ) => {
              const horizontal =
                getHorizontalPosition(
                  slide?.textPositionX
                );

              const vertical =
                getVerticalPosition(
                  slide?.textPositionY
                );

              const fontFamily =
                slide?.fontFamily ||
                "Cairo";

              const textColor =
                slide?.textColor ||
                "#FFFFFF";

              const fontWeight =
                slide?.fontWeight ||
                "700";

              const textAlign =
                slide?.textAlign ||
                "right";

              const overlayOpacity =
                slide?.overlayOpacity !==
                  null &&
                slide?.overlayOpacity !==
                  undefined
                  ? clamp(
                      slide.overlayOpacity,
                      0,
                      1
                    )
                  : globalOverlayOpacity;

              const buttonBackground =
                slide?.buttonBackground ||
                theme?.accent ||
                theme?.buttonBackground ||
                ACCENT;

              const buttonTextColor =
                slide?.buttonTextColor ||
                theme?.buttonText ||
                PRIMARY;

              const tagBackground =
                slide?.tagBackground ||
                theme?.accent ||
                ACCENT;

              const tagColor =
                slide?.tagColor ||
                "#FFFFFF";

              return (
                <SwiperSlide
                  key={`${slide?.id || "slide"}-${bannerVersion}-${index}`}
                >
                  <div
                    className="hero-slide"
                    style={{
                      backgroundImage:
                        slide?.image
                          ? `url("${slide.image}")`
                          : "none",

                      backgroundPosition:
                        slide?.objectPosition ||
                        "center",

                      backgroundSize:
                        "cover",

                      backgroundRepeat:
                        "no-repeat",

                      borderRadius:
                        `${borderRadius}px`,
                    }}
                  >
                    <div
                      className="hero-overlay"
                      style={{
                        background:
                          `linear-gradient(
                            90deg,
                            rgba(0,0,0,${Math.min(
                              1,
                              overlayOpacity +
                                0.06
                            )}) 0%,
                            rgba(0,0,0,${overlayOpacity}) 48%,
                            rgba(0,0,0,${Math.max(
                              0,
                              overlayOpacity -
                                0.08
                            )}) 100%
                          )`,
                      }}
                    >
                      <div
                        className="hero-content"
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",

                          display:
                            "flex",

                          justifyContent:
                            vertical,

                          alignItems:
                            horizontal,

                          boxSizing:
                            "border-box",

                          padding:
                            "30px 6%",
                        }}
                      >
                        <div
                          className="hero-text"
                          style={{
                            width:
                              "100%",

                            maxWidth:
                              "920px",

                            fontFamily,

                            color:
                              textColor,

                            textAlign,
                          }}
                        >
                          {slide?.tag && (
                            <span
                              className="hero-tag"
                              style={{
                                display:
                                  "inline-flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                fontFamily,

                                color:
                                  tagColor,

                                background:
                                  tagBackground,

                                fontWeight,
                              }}
                            >
                              {
                                slide.tag
                              }
                            </span>
                          )}

                          {slide?.title && (
                            <h1
                              className="hero-title"
                              style={{
                                fontFamily,

                                color:
                                  textColor,

                                textAlign,

                                fontSize:
                                  `${Math.max(
                                    16,
                                    toNumber(
                                      slide?.titleFontSize,
                                      42
                                    )
                                  )}px`,

                                fontWeight,

                                lineHeight:
                                  "1.2",

                                margin:
                                  "12px 0",

                                textShadow:
                                  "0 3px 18px rgba(0,0,0,.28)",
                              }}
                            >
                              {
                                slide.title
                              }
                            </h1>
                          )}

                          {slide?.text && (
                            <p
                              className="hero-description"
                              style={{
                                fontFamily,

                                color:
                                  textColor,

                                textAlign,

                                fontSize:
                                  `${Math.max(
                                    10,
                                    toNumber(
                                      slide?.descriptionFontSize,
                                      20
                                    )
                                  )}px`,

                                fontWeight:
                                  400,

                                lineHeight:
                                  "1.75",

                                margin:
                                  "8px 0 20px",

                                maxWidth:
                                  "760px",

                                textShadow:
                                  "0 2px 10px rgba(0,0,0,.24)",
                              }}
                            >
                              {
                                slide.text
                              }
                            </p>
                          )}

                          {(slide?.buttonText ||
                            texts?.buyNow) && (
                            <button
                              type="button"
                              className="hero-button"
                              onClick={() =>
                                handleBannerClick(
                                  slide?.link
                                )
                              }
                              style={{
                                fontFamily,

                                fontWeight,

                                cursor:
                                  "pointer",

                                background:
                                  buttonBackground,

                                color:
                                  buttonTextColor,

                                border:
                                  `1px solid ${buttonBackground}`,

                                boxShadow:
                                  "0 8px 24px rgba(0,0,0,.18)",
                              }}
                            >
                              {
                                slide?.buttonText ||
                                texts?.buyNow ||
                                "تسوق الآن"
                              }

                              <span
                                aria-hidden="true"
                              >
                                ←
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="hero-side-badge"
                      style={{
                        color:
                          theme?.footerBrand ||
                          theme?.accent ||
                          ACCENT,
                      }}
                      aria-hidden="true"
                    >
                      {storeSettings?.logo ? (
                        <img
                          src={
                            storeSettings.logo
                          }
                          alt={
                            storeName
                          }
                          loading="lazy"
                          style={{
                            width:
                              "58%",

                            height:
                              "58%",

                            objectFit:
                              "contain",

                            display:
                              "block",
                          }}
                        />
                      ) : (
                        <>
                          <span>
                            ✦
                          </span>

                          <strong>
                            {
                              storeName
                            }
                          </strong>
                        </>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              );
            }
          )}
        </Swiper>
      </div>

      {/* ======================================================
          FEATURES BAR
      ====================================================== */}

      {featuresBar?.enabled !==
        false &&
        featureItems.length >
          0 && (
          <div
            className="hero-features"
            style={{
              height:
                `${featureHeight}px`,

              minHeight:
                `${featureHeight}px`,

              background:
                featureBackground,

              color:
                featureColor,

              overflow:
                "hidden",

              position:
                "relative",

              direction:
                featureDirection,

              display:
                "flex",

              alignItems:
                "center",

              borderTop:
                `1px solid ${
                  theme?.border ||
                  "#D9DFE8"
                }`,

              borderBottom:
                `1px solid ${
                  theme?.border ||
                  "#D9DFE8"
                }`,
            }}
          >
            <div
              className="hero-features-track"
              style={{
                direction:
                  "ltr",

                animationDuration:
                  `${featureSpeed}s`,

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "clamp(30px, 5vw, 70px)",

                width:
                  "max-content",

                minWidth:
                  "max-content",

                whiteSpace:
                  "nowrap",

                willChange:
                  "transform",
              }}
            >
              {duplicatedFeatureItems.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="hero-feature"
                    key={`feature-${bannerVersion}-${index}`}
                    style={{
                      color:
                        featureColor,

                      flexShrink:
                        0,

                      fontFamily:
                        item?.fontFamily ||
                        featuresBar?.fontFamily ||
                        "Cairo",
                    }}
                  >
                    <span
                      className="hero-feature-icon"
                      style={{
                        color:
                          item?.accentColor ||
                          featureAccentColor,

                        fontSize:
                          item?.iconSize
                            ? `${toNumber(
                                item.iconSize,
                                24
                              )}px`
                            : undefined,
                      }}
                    >
                      {
                        item?.icon ||
                        "⭐"
                      }
                    </span>

                    <div>
                      <strong
                        style={{
                          color:
                            item?.titleColor ||
                            featureColor,

                          fontSize:
                            item?.fontSize
                              ? `${toNumber(
                                  item.fontSize,
                                  featureFontSize
                                )}px`
                              : `${featureFontSize}px`,

                          fontWeight:
                            item?.fontWeight ||
                            800,
                        }}
                      >
                        {
                          item?.title ||
                          ""
                        }
                      </strong>

                      {item?.text && (
                        <small
                          style={{
                            color:
                              item?.textColor ||
                              theme?.textSecondary ||
                              "#64748B",

                            fontSize:
                              item?.descriptionFontSize
                                ? `${toNumber(
                                    item.descriptionFontSize,
                                    12
                                  )}px`
                                : undefined,
                          }}
                        >
                          {
                            item.text
                          }
                        </small>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </section>
  );
}
