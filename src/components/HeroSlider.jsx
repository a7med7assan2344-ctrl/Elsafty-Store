import React, {
  useEffect,
  useState,
} from "react";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import {
  Autoplay,
  Pagination,
  Navigation,
} from "swiper/modules";

import {
  useNavigate,
} from "react-router-dom";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import "./HeroSlider.css";


// ============================================================
// DEFAULT STORE SETTINGS
// ============================================================

const defaultStoreSettings = {

  theme: {

    primary: "#071A36",
    secondary: "#0B1F3A",
    accent: "#D4AF37",

    pageBackground: "#F0F4F8",
    cardBackground: "#FFFFFF",

    textPrimary: "#071A36",
    textSecondary: "#64748B",

    border: "#D9DFE8",

    buttonBackground: "#0B1F3A",
    buttonText: "#FFFFFF",

    navbarBackground: "#071A36",
    navbarText: "#FFFFFF",

    categoryBarBackground: "#FFFFFF",
    categoryBarText: "#071A36",

    topStripBackground: "#071A36",
    topStripText: "#FFFFFF",

    footerBackground: "#071A36",
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

    items: [

      {
        icon: "🚚",
        text: "شحن سريع لجميع المحافظات",
        active: true,
      },

      {
        icon: "💰",
        text: "أفضل الأسعار",
        active: true,
      },

      {
        icon: "🔥",
        text: "عروض وخصومات مستمرة",
        active: true,
      },

      {
        icon: "🎟️",
        text: "استخدم أكواد الخصم عند إتمام الطلب",
        active: true,
      },

      {
        icon: "🛍️",
        text: "تسوق الآن من Elsafty Store",
        active: true,
      },

    ],

  },


  featuresBar: {

    enabled: true,

    background: "#FFFFFF",

    color: "#071A36",

    accentColor: "#D4AF37",

    height: 80,

    fontSize: 16,

    items: [

      {
        icon: "🚚",
        title: "شحن سريع",
        text: "لجميع المحافظات",
        active: true,
      },

      {
        icon: "💳",
        title: "طرق دفع متعددة",
        text: "دفع عند الاستلام وإلكتروني",
        active: true,
      },

      {
        icon: "🎟️",
        title: "كوبونات خصم",
        text: "وفر أكثر عند الشراء",
        active: true,
      },

      {
        icon: "⭐",
        title: "منتجات مميزة",
        text: "اختيارات تناسبك",
        active: true,
      },

    ],

  },

};


// ============================================================
// FALLBACK BANNERS
// ============================================================

const fallbackSlides = [

  {
    id: "fallback-1",

    image: "/banners/banner1.jpg",

    title: "خصومات حتى 50%",

    text: "أفضل الأسعار على آلاف المنتجات",

    tag: "🔥 عروض خاصة",

    buttonText: "تسوق الآن",

    link: "/",

    active: true,

    order: 1,

    fontFamily: "Cairo",

    textColor: "#ffffff",

    titleFontSize: 42,

    descriptionFontSize: 20,

    fontWeight: "700",

    textAlign: "right",

    textPositionX: "right",

    textPositionY: "center",

  },


  {
    id: "fallback-2",

    image: "/banners/banner2.jpg",

    title: "وصل حديثًا",

    text: "اكتشف أحدث المنتجات بأفضل الأسعار.",

    tag: "🆕 وصل حديثًا",

    buttonText: "اكتشف الآن",

    link: "/",

    active: true,

    order: 2,

    fontFamily: "Cairo",

    textColor: "#ffffff",

    titleFontSize: 42,

    descriptionFontSize: 20,

    fontWeight: "700",

    textAlign: "right",

    textPositionX: "right",

    textPositionY: "center",

  },


  {
    id: "fallback-3",

    image: "/banners/banner3.jpg",

    title: "شحن سريع",

    text: "توصيل لجميع المحافظات في أسرع وقت.",

    tag: "🚚 شحن سريع",

    buttonText: "تسوق الآن",

    link: "/",

    active: true,

    order: 3,

    fontFamily: "Cairo",

    textColor: "#ffffff",

    titleFontSize: 42,

    descriptionFontSize: 20,

    fontWeight: "700",

    textAlign: "right",

    textPositionX: "right",

    textPositionY: "center",

  },

];


// ============================================================
// HERO SLIDER
// ============================================================

export default function HeroSlider() {

  const navigate =
    useNavigate();


  const [slides, setSlides] =
    useState(
      fallbackSlides
    );


  const [storeSettings, setStoreSettings] =
    useState(
      defaultStoreSettings
    );


  const [loading, setLoading] =
    useState(true);


  // ==========================================================
  // LOAD BANNERS
  // ==========================================================

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

          const firebaseBanners =
            snapshot.docs

              .map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              )

              .filter(
                (banner) =>
                  banner.active !== false &&
                  banner.image
              )

              .sort(
                (a, b) =>
                  Number(
                    a.order || 0
                  ) -
                  Number(
                    b.order || 0
                  )
              );


          if (
            firebaseBanners.length > 0
          ) {

            const formattedBanners =
              firebaseBanners.map(
                (banner) => ({

                  id:
                    banner.id,

                  image:
                    banner.image,

                  title:
                    banner.title ||
                    "",

                  text:
                    banner.text ||
                    banner.description ||
                    "",

                  tag:
                    banner.tag ||
                    banner.badge ||
                    "🔥 عرض خاص",

                  buttonText:
                    banner.buttonText ||
                    banner.button ||
                    "تسوق الآن",

                  link:
                    banner.link ||
                    "/",

                  active:
                    banner.active !== false,

                  order:
                    Number(
                      banner.order || 0
                    ),


                  // FONT SETTINGS
                  fontFamily:
                    banner.fontFamily ||
                    "Cairo",

                  textColor:
                    banner.textColor ||
                    "#ffffff",

                  titleFontSize:
                    Number(
                      banner.titleFontSize ||
                      42
                    ),

                  descriptionFontSize:
                    Number(
                      banner.descriptionFontSize ||
                      20
                    ),

                  fontWeight:
                    String(
                      banner.fontWeight ||
                      "700"
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

                })
              );


            setSlides(
              formattedBanners
            );

          } else {

            setSlides(
              fallbackSlides
            );

          }


          setLoading(
            false
          );

        },

        (error) => {

          console.error(
            "❌ Banners Error:",
            error
          );


          setSlides(
            fallbackSlides
          );


          setLoading(
            false
          );

        }

      );


    return () => {

      unsubscribe();

    };

  }, []);


  // ==========================================================
  // LOAD STORE APPEARANCE SETTINGS
  // ==========================================================

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

          if (
            snapshot.exists()
          ) {

            const data =
              snapshot.data();


            setStoreSettings(
              (previous) => ({

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

              })
            );

          }

        },

        (error) => {

          console.error(
            "❌ Store Settings Error:",
            error
          );

        }

      );


    return () => {

      unsubscribe();

    };

  }, []);


  // ==========================================================
  // BANNER NAVIGATION
  // ==========================================================

  const handleBannerClick =
    (link) => {

      const target =
        String(
          link || "/"
        ).trim();


      if (
        !target ||
        target === "#"
      ) {

        navigate(
          "/"
        );

        return;

      }


      if (
        target.startsWith(
          "http://"
        ) ||
        target.startsWith(
          "https://"
        )
      ) {

        window.location.href =
          target;

        return;

      }


      navigate(
        target
      );

    };


  // ==========================================================
  // POSITION HELPERS
  // ==========================================================

  const getHorizontalPosition =
    (position) => {

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


  const getVerticalPosition =
    (position) => {

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


  // ==========================================================
  // SETTINGS SHORTCUTS
  // ==========================================================

  const bannerSettings =
    storeSettings.bannerSettings ||
    defaultStoreSettings.bannerSettings;


  const topStrip =
    storeSettings.topStrip ||
    defaultStoreSettings.topStrip;


  const featuresBar =
    storeSettings.featuresBar ||
    defaultStoreSettings.featuresBar;


  const theme =
    storeSettings.theme ||
    defaultStoreSettings.theme;


  const topStripItems =
    Array.isArray(
      topStrip.items
    )

      ? topStrip.items.filter(
          (item) =>
            item?.active !== false &&
            item?.text
        )

      : [];


  const featureItems =
    Array.isArray(
      featuresBar.items
    )

      ? featuresBar.items.filter(
          (item) =>
            item?.active !== false
        )

      : [];


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    slides.length === 0
  ) {

    return null;

  }


  // ==========================================================
  // HERO CSS VARIABLES
  // ==========================================================

  const heroStyle = {

    "--hero-desktop-height":
      `${Number(
        bannerSettings.heightDesktop || 420
      )}px`,

    "--hero-tablet-height":
      `${Number(
        bannerSettings.heightTablet || 350
      )}px`,

    "--hero-mobile-height":
      `${Number(
        bannerSettings.heightMobile || 240
      )}px`,

    "--hero-border-radius":
      `${Number(
        bannerSettings.borderRadius || 0
      )}px`,

    "--hero-overlay-opacity":
      Number(
        bannerSettings.overlayOpacity ?? 0.35
      ),

    "--top-strip-height":
      `${Number(
        topStrip.height || 42
      )}px`,

    "--top-strip-font-size":
      `${Number(
        topStrip.fontSize || 15
      )}px`,

    "--top-strip-duration":
      `${Math.max(
        5,
        Number(
          topStrip.speed || 40
        )
      )}s`,

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section
      className="hero-section"
      dir="rtl"
      style={{
        ...heroStyle,
        background:
          theme.pageBackground,
      }}
    >

      {/* ====================================================
          TOP STRIP
      ==================================================== */}

      {topStrip.enabled !== false && (

        <div
          className="hero-offer-strip"
          style={{
            height:
              `${Number(
                topStrip.height || 42
              )}px`,

            background:
              theme.topStripBackground ||
              "#071A36",

            color:
              theme.topStripText ||
              "#FFFFFF",

            overflow:
              "hidden",

            direction:
              topStrip.direction ||
              "rtl",

            display:
              "flex",

            alignItems:
              "center",
          }}
        >

          <div
            className="hero-offer-track"
            style={{
              fontSize:
                `${Number(
                  topStrip.fontSize || 15
                )}px`,

              color:
                theme.topStripText ||
                "#FFFFFF",

              direction:
                topStrip.direction ||
                "rtl",

              animationDuration:
                `${Math.max(
                  5,
                  Number(
                    topStrip.speed || 40
                  )
                )}s`,

              animationDirection:
                topStrip.direction ===
                "ltr"
                  ? "reverse"
                  : "normal",

              whiteSpace:
                "nowrap",

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "40px",

            }}
          >

            {topStripItems.length > 0 ? (

              topStripItems.map(
                (
                  item,
                  index
                ) => (

                  <span
                    key={
                      `${item.text}-${index}`
                    }
                  >

                    {
                      item.icon || ""
                    }

                    {" "}

                    {
                      item.text
                    }

                  </span>

                )
              )

            ) : (

              <>

                <span>
                  🚚 شحن سريع لجميع المحافظات
                </span>

                <span>
                  💰 أفضل الأسعار
                </span>

                <span>
                  🔥 عروض وخصومات مستمرة
                </span>

              </>

            )}

          </div>

        </div>

      )}


      {/* ====================================================
          HERO
      ==================================================== */}

      <div
        className="hero-slider-wrapper"
        style={{
          borderRadius:
            `${Number(
              bannerSettings.borderRadius || 0
            )}px`,

          overflow:
            "hidden",
        }}
      >

        <Swiper

          modules={[
            Autoplay,
            Pagination,
            Navigation,
          ]}

          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}

          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}

          navigation

          loop={
            slides.length > 1
          }

          speed={800}

          className="hero-swiper"
        >

          {slides.map(
            (
              slide,
              index
            ) => {

              const contentPosition = {

                justifyContent:
                  getVerticalPosition(
                    slide.textPositionY
                  ),

                alignItems:
                  getHorizontalPosition(
                    slide.textPositionX
                  ),

              };


              const textStyle = {

                fontFamily:
                  slide.fontFamily ||
                  "Cairo",

                color:
                  slide.textColor ||
                  "#ffffff",

                textAlign:
                  slide.textAlign ||
                  "right",

              };


              return (

                <SwiperSlide
                  key={
                    slide.id ||
                    `slide-${index}`
                  }
                >

                  <div
                    className="hero-slide"
                    style={{
                      backgroundImage:
                        `url("${slide.image}")`,

                      borderRadius:
                        `${Number(
                          bannerSettings.borderRadius || 0
                        )}px`,
                    }}
                  >

                    {/* ========================================
                        OVERLAY
                    ======================================== */}

                    <div
                      className="hero-overlay"
                      style={{
                        background:
                          `rgba(0, 0, 0, ${Number(
                            bannerSettings.overlayOpacity ?? 0.35
                          )})`,
                      }}
                    >

                      <div
                        className="hero-content"
                        style={{
                          ...contentPosition,

                          height:
                            "100%",

                          display:
                            "flex",

                          width:
                            "100%",

                          padding:
                            "30px 6%",
                        }}
                      >

                        <div
                          className="hero-text"
                          style={{
                            ...textStyle,

                            width:
                              "100%",
                          }}
                        >

                          {/* ====================================
                              TAG
                          ==================================== */}

                          <span
                            className="hero-tag"
                            style={{

                              fontFamily:
                                slide.fontFamily ||
                                "Cairo",

                              color:
                                slide.textColor ||
                                "#ffffff",

                              fontWeight:
                                slide.fontWeight ||
                                "700",

                              textAlign:
                                slide.textAlign ||
                                "right",

                            }}
                          >

                            {
                              slide.tag ||
                              "🔥 عرض خاص"
                            }

                          </span>


                          {/* ====================================
                              TITLE
                          ==================================== */}

                          {slide.title && (

                            <h1
                              className="hero-title"
                              style={{

                                ...textStyle,

                                fontSize:
                                  `${Math.max(
                                    16,
                                    Number(
                                      slide.titleFontSize ||
                                      42
                                    )
                                  )}px`,

                                fontWeight:
                                  slide.fontWeight ||
                                  "700",

                                lineHeight:
                                  "1.25",

                                margin:
                                  "10px 0",

                              }}
                            >

                              {
                                slide.title
                              }

                            </h1>

                          )}


                          {/* ====================================
                              DESCRIPTION
                          ==================================== */}

                          {slide.text && (

                            <p
                              className="hero-description"
                              style={{

                                ...textStyle,

                                fontSize:
                                  `${Math.max(
                                    10,
                                    Number(
                                      slide.descriptionFontSize ||
                                      20
                                    )
                                  )}px`,

                                fontWeight:
                                  "400",

                                lineHeight:
                                  "1.8",

                                margin:
                                  "8px 0 18px",

                              }}
                            >

                              {
                                slide.text
                              }

                            </p>

                          )}


                          {/* ====================================
                              BUTTON
                          ==================================== */}

                          <button
                            type="button"
                            className="hero-button"
                            onClick={() =>
                              handleBannerClick(
                                slide.link
                              )
                            }
                            style={{

                              fontFamily:
                                slide.fontFamily ||
                                "Cairo",

                              fontWeight:
                                slide.fontWeight ||
                                "700",

                            }}
                          >

                            {
                              slide.buttonText ||
                              "تسوق الآن"
                            }

                            <span>
                              ←
                            </span>

                          </button>

                        </div>

                      </div>

                    </div>


                    {/* ========================================
                        BRAND BADGE
                    ======================================== */}

                    <div
                      className="hero-side-badge"
                    >

                      <span>
                        ✨
                      </span>

                      <strong>
                        Elsafty
                      </strong>

                      <small>
                        Store
                      </small>

                    </div>

                  </div>

                </SwiperSlide>

              );

            }
          )}

        </Swiper>

      </div>


      {/* ====================================================
          FEATURES BAR
      ==================================================== */}

      {featuresBar.enabled !== false && (

        <div
          className="hero-features"
          style={{

            height:
              `${Number(
                featuresBar.height || 80
              )}px`,

            background:
              featuresBar.background ||
              "#FFFFFF",

            color:
              featuresBar.color ||
              "#071A36",

            fontSize:
              `${Number(
                featuresBar.fontSize || 16
              )}px`,

            display:
              "flex",

            alignItems:
              "center",

          }}
        >

          {featureItems.length > 0 ? (

            featureItems.map(
              (
                item,
                index
              ) => (

                <div
                  className="hero-feature"
                  key={
                    `${item.title || "feature"}-${index}`
                  }
                  style={{
                    color:
                      featuresBar.color ||
                      "#071A36",
                  }}
                >

                  <span
                    className="hero-feature-icon"
                    style={{
                      color:
                        featuresBar.accentColor ||
                        "#D4AF37",
                    }}
                  >

                    {
                      item.icon ||
                      "⭐"
                    }

                  </span>


                  <div>

                    <strong
                      style={{
                        color:
                          featuresBar.color ||
                          "#071A36",

                        fontSize:
                          `${Number(
                            featuresBar.fontSize || 16
                          )}px`,
                      }}
                    >

                      {
                        item.title ||
                        ""
                      }

                    </strong>


                    {item.text && (

                      <small
                        style={{
                          color:
                            featuresBar.color ||
                            "#071A36",
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

            )

          ) : (

            <>

              <div className="hero-feature">

                <span className="hero-feature-icon">
                  🚚
                </span>

                <div>

                  <strong>
                    شحن سريع
                  </strong>

                  <small>
                    لجميع المحافظات
                  </small>

                </div>

              </div>


              <div className="hero-feature">

                <span className="hero-feature-icon">
                  💳
                </span>

                <div>

                  <strong>
                    طرق دفع متعددة
                  </strong>

                  <small>
                    دفع عند الاستلام وإلكتروني
                  </small>

                </div>

              </div>


              <div className="hero-feature">

                <span className="hero-feature-icon">
                  🎟️
                </span>

                <div>

                  <strong>
                    كوبونات خصم
                  </strong>

                  <small>
                    وفر أكثر عند الشراء
                  </small>

                </div>

              </div>


              <div className="hero-feature">

                <span className="hero-feature-icon">
                  ⭐
                </span>

                <div>

                  <strong>
                    منتجات مميزة
                  </strong>

                  <small>
                    اختيارات تناسبك
                  </small>

                </div>

              </div>

            </>

          )}

        </div>

      )}

    </section>

  );

}