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
  fontFamily: "Cairo, sans-serif",
  bodyFontFamily: "Cairo, sans-serif",
  headingFontFamily: "Cairo, sans-serif",
  bodyFontSize: 16,
  headingFontSize: 28,
};

const defaultStoreSettings = {
  storeName: "ســــَــــــــــوا",

  theme: defaultTheme,

  bannerSettings: {
    /*
      Hero قريب من شكل Jumia:
      Container محدود + Banner بنسبة عرض/ارتفاع.
    */

    maxWidth: 1280,

    /*
      يتم استخدام النسبة بدل الارتفاع الثابت
      حتى لا يكبر الـHero مع الشاشة.
    */
    desktopAspectRatio: 4,
    tabletAspectRatio: 3.4,
    mobileAspectRatio: 2.15,

    sidePadding: 16,

    borderRadius: 0,

    overlayOpacity: 0,

    autoplay: true,
    autoplayDelay: 5000,

    navigation: true,
    pagination: true,

    loop: true,

    transitionSpeed: 550,

    sliderMode: "autoplay",

    imageFit: "cover",
  },

  texts: {
    buyNow: "تسوق الآن",
  },
};

const fallbackSlides = [
  {
    id: "fallback-1",
    image: "/banners/banner1.jpg",
    desktopImage: "/banners/banner1.jpg",
    mobileImage: "/banners/banner1.jpg",
    title: "",
    text: "",
    tag: "",
    buttonText: "",
    showButton: false,
    link: "/",
    active: true,
    order: 1,
  },

  {
    id: "fallback-2",
    image: "/banners/banner2.jpg",
    desktopImage: "/banners/banner2.jpg",
    mobileImage: "/banners/banner2.jpg",
    title: "",
    text: "",
    tag: "",
    buttonText: "",
    showButton: false,
    link: "/",
    active: true,
    order: 2,
  },

  {
    id: "fallback-3",
    image: "/banners/banner3.jpg",
    desktopImage: "/banners/banner3.jpg",
    mobileImage: "/banners/banner3.jpg",
    title: "",
    text: "",
    tag: "",
    buttonText: "",
    showButton: false,
    link: "/",
    active: true,
    order: 3,
  },
];

const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const toText = (
  value,
  fallback = ""
) => {
  return String(
    value ?? fallback
  ).trim();
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
      toNumber(value, min)
    )
  );
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
    return (
      timestamp.seconds * 1000
    );
  }

  if (
    typeof timestamp?._seconds ===
    "number"
  ) {
    return (
      timestamp._seconds * 1000
    );
  }

  return Date.now();
};

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
      ...defaultStoreSettings.bannerSettings,
      ...(data?.bannerSettings || {}),
    },

    texts: {
      ...defaultStoreSettings.texts,
      ...(data?.texts || {}),
    },
  };
};

const normalizeBanner = (
  banner,
  index,
  theme
) => {
  const originalImage =
    toText(banner?.image);

  const originalDesktopImage =
    toText(
      banner?.desktopImage ||
        banner?.imageDesktop ||
        banner?.desktop ||
        banner?.desktopImageUrl
    );

  const originalMobileImage =
    toText(
      banner?.mobileImage ||
        banner?.imageMobile ||
        banner?.mobile ||
        banner?.mobileImageUrl
    );

  const version =
    getTimestampVersion(
      banner?.updatedAt
    );

  const addVersion = (
    url
  ) => {
    if (!url) return "";

    return `${url}${
      url.includes("?")
        ? "&"
        : "?"
    }v=${version}`;
  };

  const image =
    addVersion(
      originalImage
    );

  const desktopImage =
    addVersion(
      originalDesktopImage ||
        originalImage ||
        originalMobileImage
    );

  const mobileImage =
    addVersion(
      originalMobileImage ||
        originalDesktopImage ||
        originalImage
    );

  return {
    id: toText(
      banner?.id,
      `banner-${index}`
    ),

    image,

    desktopImage,

    mobileImage,

    title: toText(
      banner?.title
    ),

    text: toText(
      banner?.text ||
        banner?.description
    ),

    tag: toText(
      banner?.tag ||
        banner?.badge
    ),

    buttonText: toText(
      banner?.buttonText ||
        banner?.button
    ),

    showButton:
      banner?.showButton ??
      false,

    link: toText(
      banner?.link
    ),

    clickableImage:
      banner?.clickableImage ??
      true,

    active:
      banner?.active !== false,

    order: toNumber(
      banner?.order,
      index
    ),

    objectPosition:
      toText(
        banner?.objectPosition,
        "center"
      ),

    /*
      محفوظة للتوافق مع إعدادات الأدمن القديمة.
    */
    textOverlay:
      banner?.textOverlay === true,

    overlayOpacity:
      banner?.overlayOpacity !==
        undefined &&
      banner?.overlayOpacity !==
        null
        ? clamp(
            banner.overlayOpacity,
            0,
            1
          )
        : 0,

    fontFamily:
      toText(
        banner?.fontFamily,
        theme?.fontFamily ||
          "Cairo, sans-serif"
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

export default function HeroSlider() {
  const navigate =
    useNavigate();

  const [
    rawBanners,
    setRawBanners,
  ] = useState([]);

  const [
    storeSettings,
    setStoreSettings,
  ] = useState(
    defaultStoreSettings
  );

  /*
    ==========================================================
    FIRESTORE BANNERS
    ==========================================================
  */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "banners"
        ),

        (snapshot) => {
          const banners =
            snapshot.docs
              .map((item) => ({
                id: item.id,
                ...(item.data() || {}),
              }))

              .filter((banner) => {
                const image =
                  toText(
                    banner?.image
                  );

                const desktop =
                  toText(
                    banner?.desktopImage ||
                      banner?.imageDesktop ||
                      banner?.desktop
                  );

                const mobile =
                  toText(
                    banner?.mobileImage ||
                      banner?.imageMobile ||
                      banner?.mobile
                  );

                return (
                  banner?.active !==
                    false &&
                  (
                    image ||
                    desktop ||
                    mobile
                  )
                );
              })

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

          setRawBanners(
            banners
          );
        },

        (error) => {
          console.error(
            "Banners realtime error:",
            error
          );

          setRawBanners([]);
        }
      );

    return unsubscribe;
  }, []);

  /*
    ==========================================================
    STORE SETTINGS
    ==========================================================
  */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        doc(
          db,
          "settings",
          "store"
        ),

        (snapshot) => {
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
        },

        (error) => {
          console.error(
            "Store settings realtime error:",
            error
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
    ==========================================================
    THEME
    ==========================================================
  */

  const theme =
    storeSettings?.theme ||
    defaultTheme;

  const bannerSettings =
    storeSettings?.bannerSettings ||
    defaultStoreSettings.bannerSettings;

  /*
    ==========================================================
    SLIDES
    ==========================================================
  */

  const slides = useMemo(() => {
    const source =
      rawBanners.length
        ? rawBanners
        : fallbackSlides;

    return source
      .filter(
        (banner) =>
          banner?.active !==
          false
      )
      .map(
        (
          banner,
          index
        ) =>
          normalizeBanner(
            banner,
            index,
            theme
          )
      );
  }, [
    rawBanners,
    theme,
  ]);

  /*
    ==========================================================
    SLIDER SETTINGS
    ==========================================================
  */

  const sliderMode =
    bannerSettings?.sliderMode ||
    "autoplay";

  const autoplayEnabled =
    sliderMode ===
      "autoplay" &&
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
        550
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

  const maxWidth =
    Math.max(
      900,
      toNumber(
        bannerSettings?.maxWidth,
        1280
      )
    );

  const sidePadding =
    Math.max(
      0,
      toNumber(
        bannerSettings?.sidePadding,
        16
      )
    );

  const desktopRatio =
    Math.max(
      2.5,
      toNumber(
        bannerSettings?.desktopAspectRatio,
        4
      )
    );

  const tabletRatio =
    Math.max(
      2,
      toNumber(
        bannerSettings?.tabletAspectRatio,
        3.4
      )
    );

  const mobileRatio =
    Math.max(
      1.5,
      toNumber(
        bannerSettings?.mobileAspectRatio,
        2.15
      )
    );

  const borderRadius =
    Math.max(
      0,
      toNumber(
        bannerSettings?.borderRadius,
        0
      )
    );

  const imageFit =
    bannerSettings?.imageFit ===
    "contain"
      ? "contain"
      : "cover";

  const fontFamily =
    theme?.fontFamily ||
    theme?.bodyFontFamily ||
    "Cairo, sans-serif";

  /*
    ==========================================================
    CSS VARIABLES
    ==========================================================
  */

  const heroStyle = {
    "--hero-max-width":
      `${maxWidth}px`,

    "--hero-side-padding":
      `${sidePadding}px`,

    "--hero-desktop-ratio":
      desktopRatio,

    "--hero-tablet-ratio":
      tabletRatio,

    "--hero-mobile-ratio":
      mobileRatio,

    "--hero-border-radius":
      `${borderRadius}px`,

    "--hero-image-fit":
      imageFit,

    "--hero-primary":
      theme?.primary ||
      PRIMARY,

    "--hero-secondary":
      theme?.secondary ||
      SECONDARY,

    "--hero-accent":
      theme?.accent ||
      ACCENT,

    "--hero-background":
      theme?.pageBackground ||
      PAGE_BG,

    "--hero-font":
      fontFamily,
  };

  /*
    ==========================================================
    LINK
    ==========================================================
  */

  const handleLink = (
    link
  ) => {
    const target =
      toText(link);

    if (
      !target ||
      target === "#"
    ) {
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

  /*
    ==========================================================
    RENDER
    ==========================================================
  */

  return (
    <section
      className="hero-section"
      dir="rtl"
      style={heroStyle}
    >
      <div className="hero-container">
        <div className="hero-slider-wrapper">
          <Swiper
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
              paginationEnabled &&
              slides.length > 1
                ? {
                    clickable: true,
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
            grabCursor={
              slides.length > 1
            }
            simulateTouch={
              slides.length > 1
            }
            allowTouchMove={
              slides.length > 1
            }
            threshold={5}
            resistanceRatio={0.75}
            keyboard={{
              enabled: true,
              onlyInViewport: true,
            }}
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
                const hasOverlay =
                  slide?.textOverlay ===
                    true &&
                  (
                    slide?.title ||
                    slide?.text ||
                    slide?.tag
                  );

                return (
                  <SwiperSlide
                    key={
                      slide.id
                    }
                  >
                    <div
                      className={`hero-slide ${
                        slide?.clickableImage &&
                        slide?.link
                          ? "hero-slide-clickable"
                          : ""
                      }`}
                      onClick={() => {
                        if (
                          slide?.clickableImage &&
                          slide?.link
                        ) {
                          handleLink(
                            slide.link
                          );
                        }
                      }}
                    >
                      <picture>
                        {slide?.mobileImage && (
                          <source
                            media="(max-width: 767px)"
                            srcSet={
                              slide.mobileImage
                            }
                          />
                        )}

                        <img
                          className="hero-image"
                          src={
                            slide?.desktopImage ||
                            slide?.image ||
                            slide?.mobileImage
                          }
                          alt={
                            slide?.title ||
                            "Banner"
                          }
                          loading={
                            index === 0
                              ? "eager"
                              : "lazy"
                          }
                          fetchPriority={
                            index === 0
                              ? "high"
                              : "auto"
                          }
                          decoding="async"
                          draggable="false"
                          style={{
                            objectPosition:
                              slide?.objectPosition ||
                              "center",
                          }}
                        />
                      </picture>

                      {hasOverlay && (
                        <div
                          className="hero-overlay"
                          style={{
                            opacity:
                              slide?.overlayOpacity ||
                              0,
                          }}
                        >
                          <div className="hero-overlay-content">
                            {slide?.tag && (
                              <span
                                className="hero-tag"
                                style={{
                                  background:
                                    slide?.tagBackground ||
                                    ACCENT,

                                  color:
                                    slide?.tagColor ||
                                    "#FFFFFF",
                                }}
                              >
                                {slide.tag}
                              </span>
                            )}

                            {slide?.title && (
                              <h2>
                                {
                                  slide.title
                                }
                              </h2>
                            )}

                            {slide?.text && (
                              <p>
                                {
                                  slide.text
                                }
                              </p>
                            )}

                            {slide?.showButton &&
                              slide?.buttonText && (
                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    handleLink(
                                      slide.link
                                    );
                                  }}
                                >
                                  {
                                    slide.buttonText
                                  }
                                </button>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                );
              }
            )}
          </Swiper>
        </div>
      </div>
    </section>
  );
}