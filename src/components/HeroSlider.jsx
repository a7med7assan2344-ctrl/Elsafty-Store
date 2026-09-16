import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { collection, doc, onSnapshot } from "firebase/firestore";
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
  navbarBackground: PRIMARY,
  navbarText: "#FFFFFF",
  categoryBarBackground: "#FFFFFF",
  categoryBarText: PRIMARY,
  topStripBackground: PRIMARY,
  topStripText: "#FFFFFF",
  footerBackground: PRIMARY,
  footerText: "#FFFFFF",
  footerBrand: ACCENT,
  headingColor: PRIMARY,
  linkColor: PRIMARY,
  priceColor: PRIMARY,
  saleColor: "#C62828",
  successColor: "#16803C",
  warningColor: "#B7791F",
  errorColor: "#C62828",
  inputBackground: "#FFFFFF",
  sectionBackground: "#FFFFFF",
  fontFamily: "Cairo, sans-serif",
  bodyFontFamily: "Cairo, sans-serif",
  headingFontFamily: "Cairo, sans-serif",
  baseFontSize: 16,
  bodyFontSize: 16,
  headingFontSize: 28,
};

const defaultStoreSettings = {
  storeName: "ســــَــــــــــوا",
  logo: "",
  theme: defaultTheme,
  bannerSettings: {
    heightDesktop: 600,
    heightTablet: 450,
    heightMobile: 675,
    borderRadius: 16,
    overlayOpacity: 0.35,
    autoplay: true,
    autoplayDelay: 5000,
    navigation: true,
    pagination: true,
    loop: true,
    transitionSpeed: 800,
  },
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
    items: [],
  },
  texts: {
    buyNow: "تسوق الآن",
  },
};

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
  },
];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toText = (value, fallback = "") => String(value ?? fallback).trim();

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, toNumber(value, min)));

const getTimestampVersion = (timestamp) => {
  if (!timestamp) return Date.now();
  if (typeof timestamp?.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp?.seconds === "number") return timestamp.seconds * 1000;
  if (typeof timestamp?._seconds === "number") return timestamp._seconds * 1000;
  return Date.now();
};

/*
 * Admin speed is treated as SPEED, not duration.
 * Larger number = faster marquee.
 */
const getMarqueeDuration = (speed) => {
  const s = Math.max(1, toNumber(speed, 40));
  return Math.max(6, Math.min(90, 1600 / s));
};

const getHorizontalPosition = (position) => {
  if (position === "left") return "flex-start";
  if (position === "center") return "center";
  return "flex-end";
};

const getVerticalPosition = (position) => {
  if (position === "top") return "flex-start";
  if (position === "bottom") return "flex-end";
  return "center";
};

const mergeStoreSettings = (data = {}) => ({
  ...defaultStoreSettings,
  ...data,
  theme: { ...defaultTheme, ...(data?.theme || {}) },
  bannerSettings: {
    ...defaultStoreSettings.bannerSettings,
    ...(data?.bannerSettings || {}),
  },
  topStrip: {
    ...defaultStoreSettings.topStrip,
    ...(data?.topStrip || {}),
  },
  featuresBar: {
    ...defaultStoreSettings.featuresBar,
    ...(data?.featuresBar || {}),
  },
  texts: {
    ...defaultStoreSettings.texts,
    ...(data?.texts || {}),
  },
});

const normalizeBanner = (banner, index, theme) => {
  const originalImage = toText(banner?.image);
  const originalDesktopImage = toText(
    banner?.desktopImage || banner?.imageDesktop || banner?.desktop || banner?.desktopImageUrl
  );
  const originalMobileImage = toText(
    banner?.mobileImage || banner?.imageMobile || banner?.mobile || banner?.mobileImageUrl
  );
  const version = getTimestampVersion(banner?.updatedAt);
  const withVersion = (url) =>
    url ? `${url}${url.includes("?") ? "&" : "?"}v=${version}` : "";
  const image = withVersion(originalImage);
  const desktopImage = withVersion(originalDesktopImage || originalImage || originalMobileImage);
  const mobileImage = withVersion(originalMobileImage || originalDesktopImage || originalImage);
  const fallbackFont =
    theme?.bodyFontFamily || theme?.fontFamily || "Cairo, sans-serif";

  return {
    id: toText(banner?.id, `banner-${index}`),
    image,
    desktopImage,
    mobileImage,
    title: toText(banner?.title),
    text: toText(banner?.text || banner?.description),
    tag: toText(banner?.tag || banner?.badge),
    buttonText: toText(banner?.buttonText || banner?.button),
    showButton: banner?.showButton ?? banner?.textSettings?.showButton ?? true,
    link: toText(banner?.link, ""),
    clickableImage: banner?.clickableImage ?? banner?.textSettings?.clickableImage ?? true,
    active: banner?.active !== false,
    order: toNumber(banner?.order, index),
    fontFamily: toText(banner?.fontFamily, fallbackFont),
    textColor: toText(banner?.textColor, "#FFFFFF"),
    titleFontSize: Math.max(
      16,
      toNumber(banner?.titleFontSize, theme?.headingFontSize || 42)
    ),
    descriptionFontSize: Math.max(
      10,
      toNumber(banner?.descriptionFontSize, theme?.bodyFontSize || 20)
    ),
    fontWeight: toText(banner?.fontWeight, "700"),
    textAlign: toText(banner?.textAlign, "right"),
    textPositionX: toText(banner?.textPositionX, "right"),
    textPositionY: toText(banner?.textPositionY, "center"),
    objectPosition: toText(banner?.objectPosition, "center"),
    overlayOpacity:
      banner?.overlayOpacity !== undefined && banner?.overlayOpacity !== null
        ? clamp(banner.overlayOpacity, 0, 1)
        : null,
    tagBackground: toText(banner?.tagBackground),
    tagColor: toText(banner?.tagColor),
    buttonBackground: toText(banner?.buttonBackground),
    buttonTextColor: toText(banner?.buttonTextColor),
    textShadow: banner?.textShadow !== false,
    contentWidth: toText(banner?.contentWidth, "920px"),
    contentPadding: toText(banner?.contentPadding, "30px 6%"),
  };
};

export default function HeroSlider() {
  const navigate = useNavigate();

  const [rawBanners, setRawBanners] = useState([]);
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);
  const [bannerVersion, setBannerVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "banners"),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() || {}) }))
          .filter(
            (banner) =>
              banner?.active !== false &&
              (toText(banner?.image) !== "" ||
                toText(banner?.desktopImage || banner?.imageDesktop || banner?.desktop) !== "" ||
                toText(banner?.mobileImage || banner?.imageMobile || banner?.mobile) !== "")
          )
          .sort(
            (a, b) => toNumber(a?.order, 0) - toNumber(b?.order, 0)
          );
        setRawBanners(data);
        setBannerVersion((v) => v + 1);
      },
      (error) => {
        console.error("❌ Banners realtime error:", error);
        setRawBanners([]);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "store"),
      (snapshot) => {
        if (!snapshot.exists()) {
          setStoreSettings(defaultStoreSettings);
          return;
        }
        setStoreSettings(mergeStoreSettings(snapshot.data() || {}));
      },
      (error) => console.error("❌ Store settings realtime error:", error)
    );
    return unsubscribe;
  }, []);

  const theme = storeSettings?.theme || defaultTheme;
  const bannerSettings =
    storeSettings?.bannerSettings || defaultStoreSettings.bannerSettings;
  const featuresBar =
    storeSettings?.featuresBar || defaultStoreSettings.featuresBar;
  const texts = storeSettings?.texts || defaultStoreSettings.texts;
  const storeName = toText(storeSettings?.storeName, defaultStoreSettings.storeName);

  const slides = useMemo(() => {
    const source = rawBanners.length ? rawBanners : fallbackSlides;
    return source
      .filter((banner) => banner?.active !== false)
      .map((banner, index) => normalizeBanner(banner, index, theme));
  }, [rawBanners, theme]);

  const homeFontFamily =
    theme?.fontFamily || theme?.bodyFontFamily || "Cairo, sans-serif";
  const bodyFontFamily =
    theme?.bodyFontFamily || theme?.fontFamily || "Cairo, sans-serif";
  const headingFontFamily =
    theme?.headingFontFamily || theme?.fontFamily || bodyFontFamily;
  const bodyFontSize = Math.max(
    10,
    toNumber(theme?.bodyFontSize ?? theme?.baseFontSize, 16)
  );
  const headingFontSize = Math.max(
    16,
    toNumber(theme?.headingFontSize, 28)
  );

  const featureItems = useMemo(
    () =>
      (Array.isArray(featuresBar?.items) ? featuresBar.items : [])
        .filter((item) => item && item.active !== false)
        .sort(
          (a, b) => toNumber(a?.order, 0) - toNumber(b?.order, 0)
        ),
    [featuresBar?.items]
  );
  const duplicatedFeatureItems = useMemo(
    () => [...featureItems, ...featureItems],
    [featureItems]
  );

  const featureHeight = Math.max(1, toNumber(featuresBar?.height, 80));
  const featureFontSize = Math.max(
    8,
    toNumber(featuresBar?.fontSize, bodyFontSize)
  );
  const featureSpeed = Math.max(5, toNumber(featuresBar?.speed, 18));
  const featureDirection = featuresBar?.direction || "rtl";
  const featureBackground =
    featuresBar?.background || theme?.cardBackground || "#FFFFFF";
  const featureColor = featuresBar?.color || theme?.textPrimary || PRIMARY;
  const featureAccentColor =
    featuresBar?.accentColor || theme?.accent || ACCENT;

  const sliderMode = bannerSettings?.sliderMode || (bannerSettings?.autoplay === false ? "manual" : "autoplay");
  const autoplayEnabled = sliderMode === "autoplay" && bannerSettings?.autoplay !== false;
  const autoplayDelay = Math.max(
    1500,
    toNumber(bannerSettings?.autoplayDelay, 5000)
  );
  const transitionSpeed = Math.max(
    150,
    toNumber(bannerSettings?.transitionSpeed, 800)
  );
  const navigationEnabled = bannerSettings?.navigation !== false;
  const paginationEnabled = bannerSettings?.pagination !== false;
  const loopEnabled = bannerSettings?.loop !== false;
  const borderRadius = Math.max(
    0,
    toNumber(bannerSettings?.borderRadius, 16)
  );
  const globalOverlayOpacity = clamp(
    bannerSettings?.overlayOpacity,
    0,
    1
  );

  const heroStyle = {
    "--hero-desktop-height": `${Math.max(
      160,
      toNumber(bannerSettings?.heightDesktop, 420)
    )}px`,
    "--hero-tablet-height": `${Math.max(
      150,
      toNumber(bannerSettings?.heightTablet, 350)
    )}px`,
    "--hero-mobile-height": `${Math.max(
      130,
      toNumber(bannerSettings?.heightMobile, 240)
    )}px`,
    "--hero-border-radius": `${borderRadius}px`,
    "--hero-overlay-opacity": globalOverlayOpacity,
    "--hero-primary": theme?.primary || PRIMARY,
    "--hero-secondary": theme?.secondary || SECONDARY,
    "--hero-accent": theme?.accent || ACCENT,
    "--hero-page-background": theme?.pageBackground || PAGE_BG,
    "--hero-card-background": theme?.cardBackground || "#FFFFFF",
    "--hero-text-primary": theme?.textPrimary || PRIMARY,
    "--hero-text-secondary": theme?.textSecondary || "#64748B",
    "--hero-border": theme?.border || "#D9DFE8",
    "--hero-button-background": theme?.buttonBackground || SECONDARY,
    "--hero-button-text": theme?.buttonText || "#FFFFFF",
    "--features-height": `${featureHeight}px`,
    "--features-font-size": `${featureFontSize}px`,
    "--features-duration": `${featureSpeed}s`,
    "--store-font-family": homeFontFamily,
    "--store-body-font-family": bodyFontFamily,
    "--store-heading-font-family": headingFontFamily,
    "--store-body-font-size": `${bodyFontSize}px`,
    "--store-heading-font-size": `${headingFontSize}px`,
  };

  const responsiveBannerCss = `
    .hero-section .hero-slider-wrapper,
    .hero-section .hero-swiper,
    .hero-section .swiper-slide { width: 100%; }
    .hero-section .swiper-slide { height: 31.25vw; }
    .hero-section .hero-slide { height: 100%; min-height: 0; }
    .hero-section .hero-responsive-image { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; user-select: none; -webkit-user-drag: none; }
    .hero-section .hero-swiper { width: 100%; }
    .hero-section .hero-swiper .swiper-button-prev,
    .hero-section .hero-swiper .swiper-button-next {
      width: 44px; height: 44px; border-radius: 999px;
      background: rgba(7,26,54,.58); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,.28);
      box-shadow: 0 10px 28px rgba(0,0,0,.18);
      transition: transform .2s ease, background .2s ease, opacity .2s ease;
    }
    .hero-section .hero-swiper .swiper-button-prev:hover,
    .hero-section .hero-swiper .swiper-button-next:hover { transform: scale(1.06); background: rgba(7,26,54,.82); }
    .hero-section .hero-swiper .swiper-button-prev::after,
    .hero-section .hero-swiper .swiper-button-next::after { font-size: 15px; font-weight: 900; color: #fff; }
    .hero-section .hero-swiper .swiper-pagination-bullet { width: 7px; height: 7px; opacity: .55; background: #fff; transition: all .25s ease; }
    .hero-section .hero-swiper .swiper-pagination-bullet-active { width: 24px; border-radius: 999px; opacity: 1; background: var(--hero-accent, #D4AF37); }
    .hero-section .hero-slide-clickable { cursor: pointer; }
    .hero-section .hero-slide-clickable:focus-visible { outline: 3px solid var(--hero-accent, #D4AF37); outline-offset: -3px; }
    @media (max-width: 1024px) {
      .hero-section .swiper-slide { height: 31.25vw; }
    }
    @media (max-width: 767px) {
      .hero-section .swiper-slide { height: 125vw; }
      .hero-section .hero-desktop-image { display: none !important; }
      .hero-section .hero-mobile-image { display: block !important; }
    }
    @media (min-width: 768px) {
      .hero-section .hero-desktop-image { display: block !important; }
      .hero-section .hero-mobile-image { display: none !important; }
    }
  `;

  const handleLink = (link) => {
    const target = toText(link, "/");
    if (!target || target === "#") {
      navigate("/");
      return;
    }
    if (/^https?:\/\//i.test(target)) {
      window.location.href = target;
      return;
    }
    navigate(target.startsWith("/") ? target : `/${target}`);
  };

  return (
    <section
      className="hero-section"
      dir="rtl"
      style={{
        ...heroStyle,
        background: theme?.pageBackground || PAGE_BG,
        color: theme?.textPrimary || PRIMARY,
        fontFamily: homeFontFamily,
        fontSize: `${bodyFontSize}px`,
      }}
      data-store-name={storeName}
    >
      <style>{responsiveBannerCss}</style>
      <div
        className="hero-slider-wrapper"
        style={{
          borderRadius: `${borderRadius}px`,
          overflow: "hidden",
          background: theme?.cardBackground || "#FFFFFF",
          boxShadow:
            borderRadius > 0 ? "0 10px 35px rgba(7,26,54,.10)" : "none",
        }}
      >
        <Swiper
          key={`hero-swiper-${bannerVersion}`}
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={
            autoplayEnabled
              ? {
                  delay: autoplayDelay,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          pagination={
            paginationEnabled
              ? { clickable: true, dynamicBullets: true }
              : false
          }
          navigation={navigationEnabled && slides.length > 1}
          loop={loopEnabled && slides.length > 1}
          speed={transitionSpeed}
          grabCursor={slides.length > 1}
          simulateTouch={slides.length > 1}
          allowTouchMove={slides.length > 1}
          keyboard={{ enabled: slides.length > 1, onlyInViewport: true }}
          observer
          observeParents
          resizeObserver
          className="hero-swiper"
        >
          {slides.map((slide, index) => {
            const horizontal = getHorizontalPosition(slide?.textPositionX);
            const vertical = getVerticalPosition(slide?.textPositionY);
            const fontFamily = slide?.fontFamily || bodyFontFamily;
            const textColor = slide?.textColor || "#FFFFFF";
            const fontWeight = slide?.fontWeight || "700";
            const textAlign = slide?.textAlign || "right";
            const overlayOpacity =
              slide?.overlayOpacity !== null &&
              slide?.overlayOpacity !== undefined
                ? clamp(slide.overlayOpacity, 0, 1)
                : globalOverlayOpacity;
            const buttonBackground =
              slide?.buttonBackground || theme?.accent || ACCENT;
            const buttonTextColor =
              slide?.buttonTextColor || theme?.buttonText || PRIMARY;
            const tagBackground = slide?.tagBackground || theme?.accent || ACCENT;
            const tagColor = slide?.tagColor || "#FFFFFF";
            const titleFontSize = Math.max(
              16,
              toNumber(slide?.titleFontSize, headingFontSize)
            );
            const descriptionFontSize = Math.max(
              10,
              toNumber(slide?.descriptionFontSize, bodyFontSize)
            );

            return (
              <SwiperSlide key={`${slide.id}-${bannerVersion}-${index}`}>
                <div
                  className={`hero-slide ${slide.clickableImage && slide.link ? "hero-slide-clickable" : ""}`}
                  onClick={() => {
                    if (slide.clickableImage && slide.link) handleLink(slide.link);
                  }}
                  role={slide.clickableImage && slide.link ? "link" : undefined}
                  tabIndex={slide.clickableImage && slide.link ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (slide.clickableImage && slide.link && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      handleLink(slide.link);
                    }
                  }}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: `${borderRadius}px`,
                    background: theme?.cardBackground || "#FFFFFF",
                    cursor: slide.clickableImage && slide.link ? "pointer" : "default",
                  }}
                >
                  {slide.desktopImage && (
                    <img
                      className="hero-responsive-image hero-desktop-image"
                      src={slide.desktopImage}
                      alt={slide.title || storeName}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      draggable="false"
                      style={{ objectPosition: slide.objectPosition || "center" }}
                    />
                  )}
                  {slide.mobileImage && (
                    <img
                      className="hero-responsive-image hero-mobile-image"
                      src={slide.mobileImage}
                      alt={slide.title || storeName}
                      loading={index === 0 ? "eager" : "lazy"}
                      draggable="false"
                      style={{ objectPosition: slide.objectPosition || "center" }}
                    />
                  )}
                  <div
                    className="hero-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 1,
                      background: `linear-gradient(90deg, rgba(0,0,0,${Math.min(
                        1,
                        overlayOpacity + 0.06
                      )}) 0%, rgba(0,0,0,${overlayOpacity}) 48%, rgba(0,0,0,${Math.max(
                        0,
                        overlayOpacity - 0.08
                      )}) 100%)`,
                    }}
                  >
                    <div
                      className="hero-content"
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: vertical,
                        alignItems: horizontal,
                        boxSizing: "border-box",
                        padding: slide.contentPadding || "30px 6%",
                      }}
                    >
                      <div
                        className="hero-text"
                        style={{
                          width: "100%",
                          maxWidth: slide.contentWidth || "920px",
                          fontFamily,
                          color: textColor,
                          textAlign,
                        }}
                      >
                        {slide.tag && (
                          <span
                            className="hero-tag"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily,
                              color: tagColor,
                              background: tagBackground,
                              fontWeight,
                            }}
                          >
                            {slide.tag}
                          </span>
                        )}

                        {slide.title && (
                          <h1
                            className="hero-title"
                            style={{
                              fontFamily: headingFontFamily,
                              color: textColor,
                              textAlign,
                              fontSize: `${titleFontSize}px`,
                              fontWeight,
                              lineHeight: "1.2",
                              margin: "12px 0",
                              textShadow:
                                slide.textShadow === false
                                  ? "none"
                                  : "0 3px 18px rgba(0,0,0,.28)",
                            }}
                          >
                            {slide.title}
                          </h1>
                        )}

                        {slide.text && (
                          <p
                            className="hero-description"
                            style={{
                              fontFamily,
                              color: textColor,
                              textAlign,
                              fontSize: `${descriptionFontSize}px`,
                              fontWeight: 400,
                              lineHeight: "1.75",
                              margin: "8px 0 20px",
                              maxWidth: "760px",
                              textShadow:
                                slide.textShadow === false
                                  ? "none"
                                  : "0 2px 10px rgba(0,0,0,.24)",
                            }}
                          >
                            {slide.text}
                          </p>
                        )}

                        {slide.showButton !== false && (slide.buttonText || texts?.buyNow) && (
                          <button
                            type="button"
                            className="hero-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleLink(slide.link);
                            }}
                            style={{
                              fontFamily,
                              fontWeight,
                              cursor: "pointer",
                              background: buttonBackground,
                              color: buttonTextColor,
                              border: `1px solid ${buttonBackground}`,
                              boxShadow: "0 8px 24px rgba(0,0,0,.18)",
                            }}
                          >
                            {slide.buttonText || texts?.buyNow || "تسوق الآن"} <span aria-hidden="true">←</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="hero-side-badge"
                    style={{
                      color: theme?.footerBrand || theme?.accent || ACCENT,
                      fontFamily: headingFontFamily,
                    }}
                    aria-hidden="true"
                  >
                    {storeSettings?.logo ? (
                      <img
                        src={storeSettings.logo}
                        alt={storeName}
                        loading="lazy"
                        style={{
                          width: "58%",
                          height: "58%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    ) : (
                      <>
                        <span>✦</span>
                        <strong>{storeName}</strong>
                      </>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {featuresBar?.enabled !== false && featureItems.length > 0 && (
        <div
          className="hero-features"
          style={{
            height: `${featureHeight}px`,
            minHeight: `${featureHeight}px`,
            background: featureBackground,
            color: featureColor,
            overflow: "hidden",
            position: "relative",
            direction: featureDirection,
            display: "flex",
            alignItems: "center",
            borderTop: `1px solid ${theme?.border || "#D9DFE8"}`,
            borderBottom: `1px solid ${theme?.border || "#D9DFE8"}`,
            fontFamily: bodyFontFamily,
          }}
        >
          <div
            className="hero-features-track"
            style={{
              direction: "ltr",
              animationDuration: `${featureSpeed}s`,
              display: "flex",
              alignItems: "center",
              gap: "clamp(30px, 5vw, 70px)",
              width: "max-content",
              minWidth: "max-content",
              whiteSpace: "nowrap",
              willChange: "transform",
            }}
          >
            {duplicatedFeatureItems.map((item, index) => (
              <div
                className="hero-feature"
                key={`feature-${bannerVersion}-${index}`}
                style={{
                  color: featureColor,
                  flexShrink: 0,
                  fontFamily:
                    item?.fontFamily || featuresBar?.fontFamily || bodyFontFamily,
                }}
              >
                <span
                  className="hero-feature-icon"
                  style={{
                    color: item?.accentColor || featureAccentColor,
                    fontSize: item?.iconSize
                      ? `${toNumber(item.iconSize, 24)}px`
                      : undefined,
                  }}
                >
                  {item?.icon || "⭐"}
                </span>
                <div>
                  <strong
                    style={{
                      color: item?.titleColor || featureColor,
                      fontSize: item?.fontSize
                        ? `${toNumber(item.fontSize, featureFontSize)}px`
                        : `${featureFontSize}px`,
                      fontWeight: item?.fontWeight || 800,
                      fontFamily:
                        item?.fontFamily ||
                        featuresBar?.fontFamily ||
                        headingFontFamily,
                    }}
                  >
                    {item?.title || ""}
                  </strong>
                  {item?.text && (
                    <small
                      style={{
                        color: item?.textColor || theme?.textSecondary || "#64748B",
                        fontSize: item?.descriptionFontSize
                          ? `${toNumber(item.descriptionFontSize, 12)}px`
                          : undefined,
                        fontFamily:
                          item?.fontFamily ||
                          featuresBar?.fontFamily ||
                          bodyFontFamily,
                      }}
                    >
                      {item.text}
                    </small>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
