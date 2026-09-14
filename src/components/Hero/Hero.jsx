import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./Hero.css";

const safeNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const getImageUrl = (slide) => {
  if (!slide) return "";

  return (
    slide.image ||
    slide.imageUrl ||
    slide.bannerImage ||
    slide.photo ||
    slide.url ||
    ""
  );
};

const getTitle = (slide) => {
  if (!slide) return "";

  return safeString(
    slide.title ??
      slide.name ??
      slide.heading ??
      slide.headline ??
      ""
  ).trim();
};

const getDescription = (slide) => {
  if (!slide) return "";

  return safeString(
    slide.text ??
      slide.description ??
      slide.subtitle ??
      slide.subTitle ??
      ""
  ).trim();
};

const getButtonText = (slide) => {
  if (!slide) return "";

  return safeString(
    slide.buttonText ??
      slide.buttonLabel ??
      slide.ctaText ??
      slide.actionText ??
      ""
  ).trim();
};

const getLink = (slide) => {
  if (!slide) return "";

  return safeString(
    slide.link ??
      slide.href ??
      slide.actionUrl ??
      ""
  ).trim();
};

const getOrder = (slide) =>
  safeNumber(
    slide?.order ??
      slide?.sortOrder ??
      slide?.position ??
      0,
    0
  );

const getId = (slide, index) =>
  slide?.id ||
  slide?.bannerId ||
  slide?.uid ||
  `hero-slide-${index}`;

/*
 * ---------------------------------------------------------
 * Banner text settings
 * ---------------------------------------------------------
 *
 * Admin.jsx can save settings either:
 *
 * slide.textSettings
 * slide.textStyles
 * slide
 *
 * This helper supports all of them so old banners keep working.
 */
const getTextSettings = (slide, globalSettings = {}) => {
  const nested =
    slide?.textSettings ||
    slide?.textStyles ||
    slide?.styles ||
    {};

  const globalTextSettings =
    globalSettings?.textSettings ||
    globalSettings?.textStyles ||
    {};

  return {
    ...globalTextSettings,
    ...slide,
    ...nested,
  };
};

const getBooleanSetting = (
  value,
  fallback = true
) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  return value !== false;
};

const getFontFamily = (
  value,
  fallback = "Cairo, sans-serif"
) => {
  const font = safeString(value).trim();

  return font || fallback;
};

const getTextShadow = (
  value,
  fallback = "0 2px 8px rgba(0,0,0,.35)"
) => {
  const shadow = safeString(value).trim();

  return shadow || fallback;
};

const getColor = (
  value,
  fallback
) => {
  const color = safeString(value).trim();

  return color || fallback;
};

const getResponsiveValue = (
  settings,
  desktopKey,
  tabletKey,
  mobileKey,
  fallback
) => {
  const desktop =
    settings?.[desktopKey];

  const tablet =
    settings?.[tabletKey];

  const mobile =
    settings?.[mobileKey];

  return {
    desktop:
      desktop !== undefined &&
      desktop !== null &&
      desktop !== ""
        ? desktop
        : fallback,

    tablet:
      tablet !== undefined &&
      tablet !== null &&
      tablet !== ""
        ? tablet
        : desktop !== undefined &&
          desktop !== null &&
          desktop !== ""
        ? desktop
        : fallback,

    mobile:
      mobile !== undefined &&
      mobile !== null &&
      mobile !== ""
        ? mobile
        : tablet !== undefined &&
          tablet !== null &&
          tablet !== ""
        ? tablet
        : desktop !== undefined &&
          desktop !== null &&
          desktop !== ""
        ? desktop
        : fallback,
  };
};

function Hero({
  banners = [],
  bannerSettings = {},
  settings = {},
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] =
    useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const transitionTimer = useRef(null);

  const normalizedBanners = useMemo(() => {
    if (!Array.isArray(banners)) {
      return [];
    }

    return banners
      .filter((slide) => {
        if (!slide) {
          return false;
        }

        if (
          slide.active === false ||
          slide.enabled === false ||
          slide.visible === false
        ) {
          return false;
        }

        return Boolean(getImageUrl(slide));
      })
      .sort(
        (a, b) =>
          getOrder(a) - getOrder(b)
      );
  }, [banners]);

  const settingsSource =
    bannerSettings &&
    Object.keys(bannerSettings).length > 0
      ? bannerSettings
      : settings?.bannerSettings || {};

  const enabled =
    settingsSource.enabled !== false &&
    settingsSource.active !== false;

  const autoplay =
    settingsSource.autoplay !== false &&
    settingsSource.autoPlay !== false;

  const interval = Math.max(
    1500,
    safeNumber(
      settingsSource.interval ??
        settingsSource.duration ??
        settingsSource.delay ??
        settingsSource.speed,
      4000
    )
  );

  const overlayOpacity = Math.min(
    1,
    Math.max(
      0,
      safeNumber(
        settingsSource.overlayOpacity,
        0.35
      )
    )
  );

  const borderRadius = Math.max(
    0,
    safeNumber(
      settingsSource.borderRadius,
      20
    )
  );

  const transitionDuration = Math.max(
    0.15,
    safeNumber(
      settingsSource.transitionDuration,
      0.45
    )
  );

  const contentPosition =
    settingsSource.contentPosition ||
    settingsSource.textPosition ||
    "right";

  const textAlign =
    settingsSource.textAlign ||
    "right";

  const showContent =
    settingsSource.showContent !== false &&
    settingsSource.showText !== false;

  const showButton =
    settingsSource.showButton !== false;

  const theme =
    settings?.theme || {};

  const primaryColor =
    theme.primary ||
    settings?.primaryColor ||
    "#071A36";

  const accentColor =
    theme.accent ||
    settings?.accentColor ||
    "#D4AF37";

  const accentLight =
    theme.accentLight ||
    settings?.accentLight ||
    "#F4D06F";

  const currentSlide =
    normalizedBanners[current] ||
    null;

  /*
   * ---------------------------------------------------------
   * Current banner text settings
   * ---------------------------------------------------------
   */
  const currentTextSettings = useMemo(() => {
    return getTextSettings(
      currentSlide,
      settingsSource
    );
  }, [
    currentSlide,
    settingsSource,
  ]);

  /*
   * ---------------------------------------------------------
   * Visibility
   * ---------------------------------------------------------
   */
  const showTitle =
    getBooleanSetting(
      currentTextSettings.showTitle,
      true
    );

  const showDescription =
    getBooleanSetting(
      currentTextSettings.showDescription,
      true
    );

  const bannerShowButton =
    getBooleanSetting(
      currentTextSettings.showButton,
      showButton
    );

  /*
   * ---------------------------------------------------------
   * Fonts
   * ---------------------------------------------------------
   *
   * These match the Admin.jsx fields:
   *
   * titleFontFamily
   * descriptionFontFamily
   * buttonFontFamily
   */
  const titleFontFamily = getFontFamily(
    currentTextSettings.titleFontFamily,
    "Cairo, sans-serif"
  );

  const descriptionFontFamily =
    getFontFamily(
      currentTextSettings.descriptionFontFamily,
      "Cairo, sans-serif"
    );

  const buttonFontFamily = getFontFamily(
    currentTextSettings.buttonFontFamily,
    "Cairo, sans-serif"
  );

  /*
   * ---------------------------------------------------------
   * Responsive font sizes
   * ---------------------------------------------------------
   */
  const titleFontSize =
    getResponsiveValue(
      currentTextSettings,
      "titleFontSizeDesktop",
      "titleFontSizeTablet",
      "titleFontSizeMobile",
      42
    );

  const descriptionFontSize =
    getResponsiveValue(
      currentTextSettings,
      "descriptionFontSizeDesktop",
      "descriptionFontSizeTablet",
      "descriptionFontSizeMobile",
      20
    );

  const buttonFontSize =
    getResponsiveValue(
      currentTextSettings,
      "buttonFontSizeDesktop",
      "buttonFontSizeTablet",
      "buttonFontSizeMobile",
      16
    );

  /*
   * ---------------------------------------------------------
   * Main typography
   * ---------------------------------------------------------
   */
  const titleFontWeight =
    currentTextSettings.titleFontWeight ??
    700;

  const descriptionFontWeight =
    currentTextSettings.descriptionFontWeight ??
    500;

  const buttonFontWeight =
    currentTextSettings.buttonFontWeight ??
    700;

  const titleColor = getColor(
    currentTextSettings.titleColor,
    "#ffffff"
  );

  const descriptionColor =
    getColor(
      currentTextSettings.descriptionColor,
      "#ffffff"
    );

  const buttonTextColor =
    getColor(
      currentTextSettings.buttonTextColor,
      "#ffffff"
    );

  const titleLineHeight =
    currentTextSettings.titleLineHeight ??
    1.2;

  const descriptionLineHeight =
    currentTextSettings.descriptionLineHeight ??
    1.7;

  const titleLetterSpacing =
    currentTextSettings.titleLetterSpacing ??
    0;

  const descriptionLetterSpacing =
    currentTextSettings.descriptionLetterSpacing ??
    0;

  const titleShadow =
    getTextShadow(
      currentTextSettings.titleShadow,
      "0 3px 12px rgba(0,0,0,.4)"
    );

  const descriptionShadow =
    getTextShadow(
      currentTextSettings.descriptionShadow,
      "0 2px 8px rgba(0,0,0,.35)"
    );

  /*
   * ---------------------------------------------------------
   * Margins
   * ---------------------------------------------------------
   */
  const titleMarginBottom =
    safeNumber(
      currentTextSettings.titleMarginBottom,
      12
    );

  const descriptionMarginBottom =
    safeNumber(
      currentTextSettings.descriptionMarginBottom,
      20
    );

  /*
   * ---------------------------------------------------------
   * Content positioning
   * ---------------------------------------------------------
   */
  const contentWidth =
    currentTextSettings.contentWidth ??
    "520px";

  const contentTop =
    currentTextSettings.contentTop ??
    "50%";

  const contentSide =
    currentTextSettings.contentSide ??
    "6%";

  const contentOpacity = Math.min(
    1,
    Math.max(
      0,
      safeNumber(
        currentTextSettings.contentOpacity,
        1
      )
    )
  );

  const resolvedTextDirection =
    currentTextSettings.textDirection ||
    "rtl";

  const resolvedTextAlign =
    currentTextSettings.textAlign ||
    textAlign;

  /*
   * ---------------------------------------------------------
   * Button
   * ---------------------------------------------------------
   */
  const buttonBackground =
    currentTextSettings.buttonBackground ||
    accentColor;

  const buttonHoverBackground =
    currentTextSettings.buttonHoverBackground ||
    accentLight;

  const buttonBorderColor =
    currentTextSettings.buttonBorderColor ||
    "transparent";

  const buttonBorderWidth =
    safeNumber(
      currentTextSettings.buttonBorderWidth,
      0
    );

  const buttonBorderRadius =
    safeNumber(
      currentTextSettings.buttonBorderRadius,
      10
    );

  const buttonPaddingX =
    safeNumber(
      currentTextSettings.buttonPaddingX,
      24
    );

  const buttonPaddingY =
    safeNumber(
      currentTextSettings.buttonPaddingY,
      12
    );

  const buttonShadow =
    currentTextSettings.buttonShadow ||
    "0 8px 20px rgba(0,0,0,.18)";

  /*
   * ---------------------------------------------------------
   * Reset index when banners change
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (
      normalizedBanners.length === 0
    ) {
      setCurrent(0);
      return;
    }

    setCurrent((previous) =>
      previous >=
      normalizedBanners.length
        ? 0
        : previous
    );
  }, [normalizedBanners.length]);

  /*
   * ---------------------------------------------------------
   * Cleanup
   * ---------------------------------------------------------
   */
  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(
          transitionTimer.current
        );
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * Preload image
   * ---------------------------------------------------------
   */
  const preloadImage = useCallback(
    (url) => {
      if (!url) return;

      const image = new Image();

      image.decoding = "async";
      image.src = url;
    },
    []
  );

  /*
   * ---------------------------------------------------------
   * Preload current / next / previous
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (
      normalizedBanners.length === 0
    ) {
      return;
    }

    const length =
      normalizedBanners.length;

    const indexes = [
      current,
      (current + 1) % length,
      (current - 1 + length) % length,
    ];

    indexes.forEach((index) => {
      preloadImage(
        getImageUrl(
          normalizedBanners[index]
        )
      );
    });
  }, [
    current,
    normalizedBanners,
    preloadImage,
  ]);

  /*
   * ---------------------------------------------------------
   * Current image loading
   * ---------------------------------------------------------
   */
  useEffect(() => {
    setImageLoaded(false);

    if (!currentSlide) {
      return undefined;
    }

    const imageUrl =
      getImageUrl(currentSlide);

    if (!imageUrl) {
      return undefined;
    }

    const image = new Image();

    image.decoding = "async";

    image.onload = () => {
      setImageLoaded(true);
    };

    image.onerror = () => {
      setImageLoaded(false);
    };

    image.src = imageUrl;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [currentSlide]);

  /*
   * ---------------------------------------------------------
   * Go to slide
   * ---------------------------------------------------------
   */
  const goToSlide = useCallback(
    (index) => {
      if (
        normalizedBanners.length <= 1
      ) {
        return;
      }

      const length =
        normalizedBanners.length;

      const nextIndex =
        (index + length) % length;

      if (
        nextIndex === current
      ) {
        return;
      }

      setIsTransitioning(true);

      setCurrent(nextIndex);

      if (transitionTimer.current) {
        clearTimeout(
          transitionTimer.current
        );
      }

      transitionTimer.current =
        setTimeout(() => {
          setIsTransitioning(false);
        }, transitionDuration * 1000);
    },
    [
      current,
      normalizedBanners.length,
      transitionDuration,
    ]
  );

  const goNext = useCallback(() => {
    goToSlide(current + 1);
  }, [current, goToSlide]);

  const goPrevious = useCallback(() => {
    goToSlide(current - 1);
  }, [current, goToSlide]);

  /*
   * ---------------------------------------------------------
   * Autoplay
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (
      !enabled ||
      !autoplay ||
      isPaused ||
      normalizedBanners.length <= 1
    ) {
      return undefined;
    }

    const timer = setInterval(
      goNext,
      interval
    );

    return () =>
      clearInterval(timer);
  }, [
    enabled,
    autoplay,
    isPaused,
    normalizedBanners.length,
    interval,
    goNext,
  ]);

  /*
   * ---------------------------------------------------------
   * Keyboard
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (
      !enabled ||
      normalizedBanners.length <= 1
    ) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const target = event.target;

      const tagName =
        target?.tagName?.toLowerCase();

      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTyping) {
        return;
      }

      if (
        event.key === "ArrowLeft"
      ) {
        goNext();
      }

      if (
        event.key === "ArrowRight"
      ) {
        goPrevious();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    enabled,
    normalizedBanners.length,
    goNext,
    goPrevious,
  ]);

  /*
   * ---------------------------------------------------------
   * Touch start
   * ---------------------------------------------------------
   */
  const handleTouchStart = (event) => {
    const touch =
      event.touches?.[0];

    if (!touch) return;

    touchStartX.current =
      touch.clientX;

    touchStartY.current =
      touch.clientY;

    setIsPaused(true);
  };

  /*
   * ---------------------------------------------------------
   * Touch end
   * ---------------------------------------------------------
   */
  const handleTouchEnd = (event) => {
    const touch =
      event.changedTouches?.[0];

    if (
      !touch ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      setIsPaused(false);
      return;
    }

    const deltaX =
      touch.clientX -
      touchStartX.current;

    const deltaY =
      touch.clientY -
      touchStartY.current;

    const isHorizontal =
      Math.abs(deltaX) >
        Math.abs(deltaY) &&
      Math.abs(deltaX) > 45;

    if (isHorizontal) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrevious();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;

    setIsPaused(false);
  };

  /*
   * ---------------------------------------------------------
   * Open banner link
   * ---------------------------------------------------------
   */
  const openSlideLink = () => {
    if (!currentSlide) {
      return;
    }

    const link =
      getLink(currentSlide);

    if (!link) {
      return;
    }

    window.location.href = link;
  };

  /*
   * ---------------------------------------------------------
   * Stop rendering if disabled
   * ---------------------------------------------------------
   */
  if (
    !enabled ||
    normalizedBanners.length === 0
  ) {
    return null;
  }

  const imageUrl =
    getImageUrl(currentSlide);

  const title =
    getTitle(currentSlide);

  const description =
    getDescription(currentSlide);

  const buttonText =
    getButtonText(currentSlide);

  const link =
    getLink(currentSlide);

  const hasContent =
    showContent &&
    Boolean(
      (showTitle && title) ||
        (showDescription &&
          description) ||
        (bannerShowButton &&
          buttonText &&
          link)
    );

  /*
   * ---------------------------------------------------------
   * Image fit
   * ---------------------------------------------------------
   *
   * Admin supports imageFit.
   *
   * contain = show full image
   * cover   = fill container
   *
   * Default remains contain/auto so the original image
   * dimensions control the banner height.
   */
  const imageFit =
    currentSlide?.imageFit ||
    currentTextSettings.imageFit ||
    "contain";

  /*
   * ---------------------------------------------------------
   * Main hero CSS variables
   * ---------------------------------------------------------
   */
  const heroStyle = {
    "--hero-overlay-opacity":
      overlayOpacity,

    "--hero-border-radius":
      `${borderRadius}px`,

    "--hero-transition-duration":
      `${transitionDuration}s`,

    "--hero-primary":
      primaryColor,

    "--hero-accent":
      accentColor,

    "--hero-accent-light":
      accentLight,

    /*
     * Typography variables
     */
    "--hero-title-font-family":
      titleFontFamily,

    "--hero-title-font-size-desktop":
      typeof titleFontSize.desktop ===
        "number"
        ? `${titleFontSize.desktop}px`
        : String(
            titleFontSize.desktop
          ),

    "--hero-title-font-size-tablet":
      typeof titleFontSize.tablet ===
        "number"
        ? `${titleFontSize.tablet}px`
        : String(
            titleFontSize.tablet
          ),

    "--hero-title-font-size-mobile":
      typeof titleFontSize.mobile ===
        "number"
        ? `${titleFontSize.mobile}px`
        : String(
            titleFontSize.mobile
          ),

    "--hero-description-font-family":
      descriptionFontFamily,

    "--hero-description-font-size-desktop":
      typeof descriptionFontSize.desktop ===
        "number"
        ? `${descriptionFontSize.desktop}px`
        : String(
            descriptionFontSize.desktop
          ),

    "--hero-description-font-size-tablet":
      typeof descriptionFontSize.tablet ===
        "number"
        ? `${descriptionFontSize.tablet}px`
        : String(
            descriptionFontSize.tablet
          ),

    "--hero-description-font-size-mobile":
      typeof descriptionFontSize.mobile ===
        "number"
        ? `${descriptionFontSize.mobile}px`
        : String(
            descriptionFontSize.mobile
          ),

    "--hero-button-font-family":
      buttonFontFamily,

    "--hero-button-font-size-desktop":
      typeof buttonFontSize.desktop ===
        "number"
        ? `${buttonFontSize.desktop}px`
        : String(
            buttonFontSize.desktop
          ),

    "--hero-button-font-size-tablet":
      typeof buttonFontSize.tablet ===
        "number"
        ? `${buttonFontSize.tablet}px`
        : String(
            buttonFontSize.tablet
          ),

    "--hero-button-font-size-mobile":
      typeof buttonFontSize.mobile ===
        "number"
        ? `${buttonFontSize.mobile}px`
        : String(
            buttonFontSize.mobile
          ),
  };

  /*
   * ---------------------------------------------------------
   * Image style
   * ---------------------------------------------------------
   *
   * Never force width/height/scale that causes zooming.
   */
  const imageStyle = {
    width:
      imageFit === "cover"
        ? "100%"
        : "auto",

    height:
      imageFit === "cover"
        ? "100%"
        : "auto",

    maxWidth: "100%",

    objectFit:
      imageFit === "cover"
        ? "cover"
        : "contain",

    transform: "none",

    filter: "none",

    aspectRatio: "auto",
  };

  /*
   * ---------------------------------------------------------
   * Content style
   * ---------------------------------------------------------
   */
  const contentStyle = {
    width:
      typeof contentWidth ===
      "number"
        ? `${contentWidth}px`
        : contentWidth,

    maxWidth: "100%",

    top:
      typeof contentTop === "number"
        ? `${contentTop}%`
        : contentTop,

    opacity:
      contentOpacity,

    textAlign:
      resolvedTextAlign,

    direction:
      resolvedTextDirection,

    "--hero-content-side":
      typeof contentSide === "number"
        ? `${contentSide}%`
        : contentSide,
  };

  /*
   * ---------------------------------------------------------
   * Individual typography styles
   * ---------------------------------------------------------
   */
  const titleStyle = {
    fontFamily:
      titleFontFamily,

    fontWeight:
      titleFontWeight,

    color:
      titleColor,

    lineHeight:
      titleLineHeight,

    letterSpacing:
      typeof titleLetterSpacing ===
      "number"
        ? `${titleLetterSpacing}px`
        : titleLetterSpacing,

    textShadow:
      titleShadow,

    marginBottom:
      `${titleMarginBottom}px`,

    direction:
      resolvedTextDirection,

    textAlign:
      resolvedTextAlign,

    /*
     * Keep responsive font values available
     * for Hero.css media queries.
     */
    "--hero-title-size":
      typeof titleFontSize.desktop ===
      "number"
        ? `${titleFontSize.desktop}px`
        : titleFontSize.desktop,
  };

  const descriptionStyle = {
    /*
     * THIS IS THE IMPORTANT PART:
     *
     * descriptionFontFamily comes directly from Admin.jsx.
     */
    fontFamily:
      descriptionFontFamily,

    fontWeight:
      descriptionFontWeight,

    color:
      descriptionColor,

    lineHeight:
      descriptionLineHeight,

    letterSpacing:
      typeof descriptionLetterSpacing ===
      "number"
        ? `${descriptionLetterSpacing}px`
        : descriptionLetterSpacing,

    textShadow:
      descriptionShadow,

    marginBottom:
      `${descriptionMarginBottom}px`,

    direction:
      resolvedTextDirection,

    textAlign:
      resolvedTextAlign,

    "--hero-description-size":
      typeof descriptionFontSize.desktop ===
      "number"
        ? `${descriptionFontSize.desktop}px`
        : descriptionFontSize.desktop,
  };

  const buttonStyle = {
    fontFamily:
      buttonFontFamily,

    fontWeight:
      buttonFontWeight,

    color:
      buttonTextColor,

    background:
      buttonBackground,

    border:
      `${buttonBorderWidth}px solid ${buttonBorderColor}`,

    borderRadius:
      `${buttonBorderRadius}px`,

    padding:
      `${buttonPaddingY}px ${buttonPaddingX}px`,

    boxShadow:
      buttonShadow,

    "--hero-button-size":
      typeof buttonFontSize.desktop ===
      "number"
        ? `${buttonFontSize.desktop}px`
        : buttonFontSize.desktop,

    "--hero-button-hover-background":
      buttonHoverBackground,
  };

  return (
    <section
      className={[
        "hero",
        imageLoaded
          ? "image-ready"
          : "image-loading",
        isTransitioning
          ? "is-transitioning"
          : "",
        `hero-content-${contentPosition}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={heroStyle}
      dir="rtl"
      aria-label={
        title ||
        "البانرات الرئيسية"
      }
      onMouseEnter={() =>
        setIsPaused(true)
      }
      onMouseLeave={() =>
        setIsPaused(false)
      }
      onTouchStart={
        handleTouchStart
      }
      onTouchEnd={
        handleTouchEnd
      }
    >
      {/*
       * -----------------------------------------------------
       * Responsive typography
       * -----------------------------------------------------
       *
       * CSS is included here so the values selected from
       * Admin.jsx work even if Hero.css doesn't already
       * contain the responsive variables.
       */}
      <style>
        {`
          .hero .hero-content h1 {
            font-family: var(--hero-title-font-family, Cairo, sans-serif);
            font-size: var(--hero-title-font-size-desktop, 42px);
          }

          .hero .hero-content p {
            font-family: var(--hero-description-font-family, Cairo, sans-serif);
            font-size: var(--hero-description-font-size-desktop, 20px);
          }

          .hero .hero-content button {
            font-family: var(--hero-button-font-family, Cairo, sans-serif);
            font-size: var(--hero-button-font-size-desktop, 16px);
          }

          .hero .hero-content {
            width: ${
              typeof contentWidth ===
              "number"
                ? `${contentWidth}px`
                : String(
                    contentWidth
                  )
            };
            max-width: calc(100% - 32px);
            top: ${
              typeof contentTop ===
              "number"
                ? `${contentTop}%`
                : String(
                    contentTop
                  )
            };
            ${
              contentPosition ===
              "left"
                ? `left: ${typeof contentSide === "number" ? `${contentSide}%` : String(contentSide)};`
                : contentPosition ===
                  "center"
                ? `left: 50%;`
                : `right: ${typeof contentSide === "number" ? `${contentSide}%` : String(contentSide)};`
            }
          }

          ${
            contentPosition ===
            "center"
              ? `
                .hero .hero-content {
                  transform: translate(-50%, -50%);
                }
              `
              : `
                .hero .hero-content {
                  transform: translateY(-50%);
                }
              `
          }

          .hero .hero-content button:hover {
            background: var(--hero-button-hover-background);
          }

          @media (max-width: 1024px) {
            .hero .hero-content h1 {
              font-size: var(--hero-title-font-size-tablet, var(--hero-title-font-size-desktop, 36px));
            }

            .hero .hero-content p {
              font-size: var(--hero-description-font-size-tablet, var(--hero-description-font-size-desktop, 18px));
            }

            .hero .hero-content button {
              font-size: var(--hero-button-font-size-tablet, var(--hero-button-font-size-desktop, 15px));
            }
          }

          @media (max-width: 768px) {
            .hero .hero-content h1 {
              font-size: var(--hero-title-font-size-mobile, var(--hero-title-font-size-tablet, 30px));
            }

            .hero .hero-content p {
              font-size: var(--hero-description-font-size-mobile, var(--hero-description-font-size-tablet, 16px));
            }

            .hero .hero-content button {
              font-size: var(--hero-button-font-size-mobile, var(--hero-button-font-size-tablet, 14px));
            }
          }

          @media (max-width: 600px) {
            .hero .hero-content {
              max-width: calc(100% - 24px);
              width: min(
                ${
                  typeof contentWidth ===
                  "number"
                    ? `${contentWidth}px`
                    : String(
                        contentWidth
                      )
                },
                calc(100% - 24px)
              );
            }
          }
        `}
      </style>

      {/*
       * -----------------------------------------------------
       * IMAGE
       * -----------------------------------------------------
       *
       * The image itself controls the height when imageFit
       * is contain/auto.
       */}
      <div className="hero-image-wrapper">
        <img
          key={imageUrl}
          className="hero-image"
          src={imageUrl}
          alt={
            title ||
            "بانر المتجر"
          }
          loading={
            current === 0
              ? "eager"
              : "lazy"
          }
          decoding="async"
          draggable="false"
          style={imageStyle}
        />
      </div>

      {/*
       * -----------------------------------------------------
       * OVERLAY
       * -----------------------------------------------------
       */}
      <div
        className="hero-overlay"
        style={{
          "--hero-content-position":
            contentPosition,

          "--hero-text-align":
            resolvedTextAlign,

          "--hero-content-opacity":
            contentOpacity,
        }}
      >
        {hasContent && (
          <div
            className="hero-content"
            key={getId(
              currentSlide,
              current
            )}
            style={contentStyle}
          >
            {/*
             * TITLE
             */}
            {showTitle &&
              title && (
                <h1
                  style={
                    titleStyle
                  }
                >
                  {title}
                </h1>
              )}

            {/*
             * DESCRIPTION
             *
             * Admin.jsx descriptionFontFamily
             * is applied directly here.
             */}
            {showDescription &&
              description && (
                <p
                  style={
                    descriptionStyle
                  }
                >
                  {description}
                </p>
              )}

            {/*
             * BUTTON
             */}
            {bannerShowButton &&
              buttonText &&
              link && (
                <button
                  type="button"
                  onClick={
                    openSlideLink
                  }
                  style={
                    buttonStyle
                  }
                >
                  <span>
                    {buttonText}
                  </span>

                  <span
                    aria-hidden="true"
                  >
                    ←
                  </span>
                </button>
              )}
          </div>
        )}
      </div>

      {/*
       * -----------------------------------------------------
       * ARROWS
       * -----------------------------------------------------
       */}
      {normalizedBanners.length >
        1 && (
        <>
          <button
            type="button"
            className="hero-arrow hero-arrow-prev"
            onClick={goPrevious}
            aria-label="البانر السابق"
          >
            <span aria-hidden="true">
              →
            </span>
          </button>

          <button
            type="button"
            className="hero-arrow hero-arrow-next"
            onClick={goNext}
            aria-label="البانر التالي"
          >
            <span aria-hidden="true">
              ←
            </span>
          </button>
        </>
      )}

      {/*
       * -----------------------------------------------------
       * DOTS
       * -----------------------------------------------------
       */}
      {normalizedBanners.length >
        1 && (
        <div
          className="hero-dots"
          role="tablist"
          aria-label="اختيار البانر"
        >
          {normalizedBanners.map(
            (slide, index) => {
              const active =
                index === current;

              return (
                <button
                  key={getId(
                    slide,
                    index
                  )}
                  type="button"
                  className={[
                    "hero-dot",
                    active
                      ? "active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    goToSlide(index)
                  }
                  aria-label={`البانر ${
                    index + 1
                  }`}
                  aria-selected={
                    active
                  }
                  role="tab"
                />
              );
            }
          )}
        </div>
      )}

      {/*
       * -----------------------------------------------------
       * COUNTER
       * -----------------------------------------------------
       */}
      {settingsSource.showCounter ===
        true &&
        normalizedBanners.length >
          1 && (
          <div className="hero-counter">
            {String(
              current + 1
            ).padStart(2, "0")}

            <span>/</span>

            {String(
              normalizedBanners.length
            ).padStart(2, "0")}
          </div>
        )}

      {/*
       * -----------------------------------------------------
       * Accessibility status
       * -----------------------------------------------------
       */}
      <span
        className="hero-slide-status"
        aria-live="polite"
      >
        البانر {current + 1} من{" "}
        {normalizedBanners.length}
      </span>
    </section>
  );
}

export default Hero;