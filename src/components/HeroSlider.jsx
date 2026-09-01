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

  featuresBar: {
    enabled: true,

    background: "#FFFFFF",
    color: "#071A36",
    accentColor: "#D4AF37",

    height: 80,
    fontSize: 16,

    direction: "rtl",
    speed: 40,

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
// HELPERS
// ============================================================

const getTimestampVersion = (timestamp) => {
  if (!timestamp) {
    return Date.now();
  }

  if (
    typeof timestamp.toMillis === "function"
  ) {
    return timestamp.toMillis();
  }

  if (
    typeof timestamp.seconds === "number"
  ) {
    return timestamp.seconds * 1000;
  }

  if (
    typeof timestamp._seconds === "number"
  ) {
    return timestamp._seconds * 1000;
  }

  return Date.now();
};


// ============================================================
// HERO SLIDER
// ============================================================

export default function HeroSlider() {
  const navigate = useNavigate();

  const [slides, setSlides] = useState(
    fallbackSlides
  );

  const [storeSettings, setStoreSettings] =
    useState(
      defaultStoreSettings
    );

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // مهم جدًا:
  // كل تغيير في Firestore يغير الرقم
  // وبالتالي Swiper يتم إعادة تركيبه
  // ==========================================================

  const [bannerVersion, setBannerVersion] =
    useState(0);


  // ==========================================================
  // LOAD BANNERS
  // REALTIME FIRESTORE
  // ==========================================================

  useEffect(() => {
    const bannersRef = collection(
      db,
      "banners"
    );

    const unsubscribe = onSnapshot(
      bannersRef,

      (snapshot) => {
        try {
          const rawBanners =
            snapshot.docs.map(
              (snapshotDoc) => ({
                id: snapshotDoc.id,
                ...snapshotDoc.data(),
              })
            );


          // ==================================================
          // ACTIVE BANNERS ONLY
          // ==================================================

          const activeBanners =
            rawBanners
              .filter(
                (banner) =>
                  banner?.active !== false &&
                  String(
                    banner?.image || ""
                  ).trim() !== ""
              )
              .sort(
                (a, b) =>
                  Number(
                    a?.order ?? 0
                  ) -
                  Number(
                    b?.order ?? 0
                  )
              );


          // ==================================================
          // FIREBASE HAS NO ACTIVE BANNERS
          // ==================================================

          if (
            activeBanners.length === 0
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


          // ==================================================
          // NORMALIZE FIREBASE BANNERS
          // ==================================================

          const normalizedBanners =
            activeBanners.map(
              (banner) => {

                const originalImage =
                  String(
                    banner?.image || ""
                  ).trim();


                const timestampVersion =
                  getTimestampVersion(
                    banner?.updatedAt
                  );


                /*
                  مهم:
                  إضافة version للصورة تمنع Cache
                  من إظهار الصورة القديمة بعد التعديل.
                */

                const imageUrl =
                  originalImage
                    ? `${
                        originalImage
                      }${
                        originalImage.includes(
                          "?"
                        )
                          ? "&"
                          : "?"
                      }v=${timestampVersion}`
                    : "";


                return {
                  id:
                    String(
                      banner.id
                    ),

                  image:
                    imageUrl,

                  title:
                    String(
                      banner?.title || ""
                    ),

                  text:
                    String(
                      banner?.text ||
                      banner?.description ||
                      ""
                    ),

                  tag:
                    String(
                      banner?.tag ||
                      banner?.badge ||
                      "🔥 عرض خاص"
                    ),

                  buttonText:
                    String(
                      banner?.buttonText ||
                      banner?.button ||
                      "تسوق الآن"
                    ),

                  link:
                    String(
                      banner?.link ||
                      "/"
                    ),

                  active:
                    banner?.active !== false,

                  order:
                    Number(
                      banner?.order ?? 0
                    ),

                  fontFamily:
                    banner?.fontFamily ||
                    "Cairo",

                  textColor:
                    banner?.textColor ||
                    "#ffffff",

                  titleFontSize:
                    Math.max(
                      16,
                      Number(
                        banner?.titleFontSize ??
                        42
                      )
                    ),

                  descriptionFontSize:
                    Math.max(
                      10,
                      Number(
                        banner?.descriptionFontSize ??
                        20
                      )
                    ),

                  fontWeight:
                    String(
                      banner?.fontWeight ||
                      "700"
                    ),

                  textAlign:
                    banner?.textAlign ||
                    "right",

                  textPositionX:
                    banner?.textPositionX ||
                    "right",

                  textPositionY:
                    banner?.textPositionY ||
                    "center",
                };
              }
            );


          // ==================================================
          // UPDATE SLIDES
          // ==================================================

          setSlides(
            normalizedBanners
          );


          // ==================================================
          // FORCE SWIPER REBUILD
          // ==================================================

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

          setBannerVersion(
            (previous) =>
              previous + 1
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

        setBannerVersion(
          (previous) =>
            previous + 1
        );

        setLoading(false);
      }
    );


    return () => {
      unsubscribe();
    };
  }, []);


  // ==========================================================
  // LOAD STORE SETTINGS
  // ==========================================================

  useEffect(() => {
    const settingsRef = doc(
      db,
      "settings",
      "store"
    );

    const unsubscribe = onSnapshot(
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


          const data =
            snapshot.data() || {};


          // ==================================================
          // FEATURES BAR
          // ==================================================

          const firebaseFeaturesBar =
            data?.featuresBar || {};


          const firebaseFeatureItems =
            Array.isArray(
              firebaseFeaturesBar?.items
            )
              ? firebaseFeaturesBar.items
              : defaultStoreSettings
                  .featuresBar
                  .items;


          setStoreSettings({
            ...defaultStoreSettings,

            ...data,

            theme: {
              ...defaultStoreSettings.theme,
              ...(data?.theme || {}),
            },

            bannerSettings: {
              ...defaultStoreSettings.bannerSettings,
              ...(data?.bannerSettings || {}),
            },

            featuresBar: {
              ...defaultStoreSettings.featuresBar,

              ...firebaseFeaturesBar,

              items:
                firebaseFeatureItems.map(
                  (item) => ({
                    icon:
                      item?.icon ??
                      "⭐",

                    title:
                      item?.title ??
                      "",

                    text:
                      item?.text ??
                      "",

                    active:
                      item?.active !== false,
                  })
                ),
            },
          });

        } catch (error) {
          console.error(
            "❌ Store settings normalize error:",
            error
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
        navigate("/");
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
  // HORIZONTAL POSITION
  // ==========================================================

  const getHorizontalPosition =
    (position) => {

      switch (
        position
      ) {

        case "left":
          return "flex-start";

        case "center":
          return "center";

        case "right":
        default:
          return "flex-end";
      }
    };


  // ==========================================================
  // VERTICAL POSITION
  // ==========================================================

  const getVerticalPosition =
    (position) => {

      switch (
        position
      ) {

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
  // SETTINGS
  // ==========================================================

  const bannerSettings =
    storeSettings?.bannerSettings ||
    defaultStoreSettings.bannerSettings;


  const featuresBar =
    storeSettings?.featuresBar ||
    defaultStoreSettings.featuresBar;


  const theme =
    storeSettings?.theme ||
    defaultStoreSettings.theme;


  // ==========================================================
  // FEATURE ITEMS
  // ==========================================================

  const featureItems =
    Array.isArray(
      featuresBar?.items
    )
      ? featuresBar.items.filter(
          (item) =>
            item &&
            item.active !== false
        )
      : [];


  // ==========================================================
  // FEATURE SPEED
  // ==========================================================

  const featuresSpeed =
    Math.max(
      5,
      Number(
        featuresBar?.speed ?? 40
      )
    );


  // ==========================================================
  // FEATURE DIRECTION
  // ==========================================================

  const featuresDirection =
    featuresBar?.direction ||
    "rtl";


  // ==========================================================
  // DUPLICATE FEATURES
  // ==========================================================

  const duplicatedFeatureItems =
    featureItems.length > 0
      ? [
          ...featureItems,
          ...featureItems,
        ]
      : [];


  // ==========================================================
  // HERO STYLE
  // ==========================================================

  const heroStyle = {
    "--hero-desktop-height":
      `${Number(
        bannerSettings?.heightDesktop ?? 420
      )}px`,

    "--hero-tablet-height":
      `${Number(
        bannerSettings?.heightTablet ?? 350
      )}px`,

    "--hero-mobile-height":
      `${Number(
        bannerSettings?.heightMobile ?? 240
      )}px`,

    "--hero-border-radius":
      `${Number(
        bannerSettings?.borderRadius ?? 0
      )}px`,

    "--hero-overlay-opacity":
      Number(
        bannerSettings?.overlayOpacity ?? 0.35
      ),

    "--features-height":
      `${Number(
        featuresBar?.height ?? 80
      )}px`,

    "--features-font-size":
      `${Number(
        featuresBar?.fontSize ?? 16
      )}px`,

    "--features-duration":
      `${featuresSpeed}s`,
  };


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
  // RENDER
  // ==========================================================

  return (
    <section
      className="hero-section"
      dir="rtl"
      style={{
        ...heroStyle,

        background:
          theme?.pageBackground ||
          "#F0F4F8",

        marginTop: 0,
        paddingTop: 0,
      }}
    >

      {/* ====================================================
          HERO WRAPPER
      ==================================================== */}

      <div
        className="hero-slider-wrapper"
        style={{
          borderRadius:
            `${Number(
              bannerSettings?.borderRadius ?? 0
            )}px`,

          overflow:
            "hidden",

          marginTop:
            0,
        }}
      >

        <Swiper
          key={
            `hero-swiper-${bannerVersion}`
          }

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

          navigation={true}

          loop={
            slides.length > 1
          }

          speed={800}

          observer={true}

          observeParents={true}

          resizeObserver={true}

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
                "#ffffff";


              const fontWeight =
                slide?.fontWeight ||
                "700";


              return (
                <SwiperSlide
                  key={
                    `${slide?.id || "slide"}-${bannerVersion}-${index}`
                  }
                >

                  {/* =================================================
                      SLIDE
                  ================================================= */}

                  <div
                    className="hero-slide"
                    style={{
                      backgroundImage:
                        slide?.image
                          ? `url("${slide.image}")`
                          : "none",

                      borderRadius:
                        `${Number(
                          bannerSettings?.borderRadius ?? 0
                        )}px`,

                      backgroundPosition:
                        "center",

                      backgroundSize:
                        "cover",

                      backgroundRepeat:
                        "no-repeat",
                    }}
                  >

                    {/* ==============================================
                        OVERLAY
                    ============================================== */}

                    <div
                      className="hero-overlay"
                      style={{
                        background:
                          `rgba(0, 0, 0, ${Math.max(
                            0,
                            Math.min(
                              1,
                              Number(
                                bannerSettings?.overlayOpacity ?? 0.35
                              )
                            )
                          )})`,
                      }}
                    >

                      {/* ============================================
                          CONTENT
                      ============================================ */}

                      <div
                        className="hero-content"
                        style={{
                          height:
                            "100%",

                          width:
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
                              "100%",

                            fontFamily,
                            color:
                              textColor,

                            textAlign:
                              slide?.textAlign ||
                              "right",
                          }}
                        >

                          {/* ======================================
                              TAG
                          ====================================== */}

                          {slide?.tag && (
                            <span
                              className="hero-tag"
                              style={{
                                display:
                                  "inline-block",

                                fontFamily,

                                color:
                                  textColor,

                                fontWeight,

                                textAlign:
                                  slide?.textAlign ||
                                  "right",
                              }}
                            >
                              {
                                slide.tag
                              }
                            </span>
                          )}


                          {/* ======================================
                              TITLE
                          ====================================== */}

                          {slide?.title && (
                            <h1
                              className="hero-title"
                              style={{
                                fontFamily,

                                color:
                                  textColor,

                                textAlign:
                                  slide?.textAlign ||
                                  "right",

                                fontSize:
                                  `${Math.max(
                                    16,
                                    Number(
                                      slide?.titleFontSize ??
                                      42
                                    )
                                  )}px`,

                                fontWeight,

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


                          {/* ======================================
                              DESCRIPTION
                          ====================================== */}

                          {slide?.text && (
                            <p
                              className="hero-description"
                              style={{
                                fontFamily,

                                color:
                                  textColor,

                                textAlign:
                                  slide?.textAlign ||
                                  "right",

                                fontSize:
                                  `${Math.max(
                                    10,
                                    Number(
                                      slide?.descriptionFontSize ??
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


                          {/* ======================================
                              BUTTON
                          ====================================== */}

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
                            }}
                          >

                            {
                              slide?.buttonText ||
                              "تسوق الآن"
                            }

                            <span>
                              ←
                            </span>

                          </button>

                        </div>

                      </div>

                    </div>


                    {/* ============================================
                        SIDE BADGE
                    ============================================ */}

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

      {featuresBar?.enabled !== false && (
        <div
          className="hero-features"
          style={{
            height:
              `${Number(
                featuresBar?.height ?? 80
              )}px`,

            background:
              featuresBar?.background ||
              "#FFFFFF",

            color:
              featuresBar?.color ||
              "#071A36",

            fontSize:
              `${Number(
                featuresBar?.fontSize ?? 16
              )}px`,

            overflow:
              "hidden",

            position:
              "relative",

            direction:
              featuresDirection,

            display:
              "flex",

            alignItems:
              "center",

            marginTop:
              0,
          }}
        >

          <div
            className="hero-features-track"
            style={{
              direction:
                "ltr",

              animationDuration:
                `${featuresSpeed}s`,

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "60px",

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
                  key={
                    `feature-${bannerVersion}-${index}`
                  }
                  style={{
                    color:
                      featuresBar?.color ||
                      "#071A36",

                    flexShrink:
                      0,
                  }}
                >

                  <span
                    className="hero-feature-icon"
                    style={{
                      color:
                        featuresBar?.accentColor ||
                        "#D4AF37",
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
                          featuresBar?.color ||
                          "#071A36",

                        fontSize:
                          `${Number(
                            featuresBar?.fontSize ?? 16
                          )}px`,
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
                            featuresBar?.color ||
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
            )}

          </div>

        </div>
      )}

    </section>
  );
}