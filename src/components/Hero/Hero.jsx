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
  if (value === null || value === undefined) return fallback;
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
      slide.url ??
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

function Hero({
  banners = [],
  bannerSettings = {},
  settings = {},
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const transitionTimer = useRef(null);

  const normalizedBanners = useMemo(() => {
    if (!Array.isArray(banners)) return [];

    return banners
      .filter((slide) => {
        if (!slide) return false;

        if (
          slide.active === false ||
          slide.enabled === false ||
          slide.visible === false
        ) {
          return false;
        }

        return Boolean(getImageUrl(slide));
      })
      .sort((a, b) => getOrder(a) - getOrder(b));
  }, [banners]);

  const settingsSource =
    bannerSettings &&
    Object.keys(bannerSettings).length
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

  /*
   * الإعدادات دي محفوظة للتوافق مع إعدادات لوحة الإدارة
   * القديمة، لكن الوضع الأساسي للبنر الآن يعتمد على
   * أبعاد الصورة نفسها.
   */
  const heightDesktop = Math.max(
    180,
    safeNumber(
      settingsSource.height ??
        settingsSource.desktopHeight,
      420
    )
  );

  const heightTablet = Math.max(
    160,
    safeNumber(
      settingsSource.tabletHeight,
      Math.min(heightDesktop, 350)
    )
  );

  const heightMobile = Math.max(
    140,
    safeNumber(
      settingsSource.mobileHeight,
      Math.min(heightDesktop, 240)
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

  const objectPosition =
    settingsSource.objectPosition ||
    settingsSource.imagePosition ||
    "center center";

  const transitionDuration = Math.max(
    0.15,
    safeNumber(
      settingsSource.transitionDuration,
      0.5
    )
  );

  const contentPosition =
    settingsSource.contentPosition ||
    settingsSource.textPosition ||
    "right";

  const textAlign =
    settingsSource.textAlign || "right";

  const showContent =
    settingsSource.showContent !== false &&
    settingsSource.showText !== false;

  const showButton =
    settingsSource.showButton !== false;

  const theme = settings?.theme || {};

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
    theme.secondaryAccent ||
    "#F4D06F";

  const currentSlide =
    normalizedBanners[current] || null;

  /*
   * نعيد ضبط السلايدر لو عدد البانرات اتغير.
   */
  useEffect(() => {
    if (normalizedBanners.length === 0) {
      setCurrent(0);
      return;
    }

    setCurrent((previous) =>
      previous >= normalizedBanners.length
        ? 0
        : previous
    );
  }, [normalizedBanners.length]);

  /*
   * تنظيف المؤقت.
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
   * Preload للبانر الحالي والقادم والسابق.
   */
  const preloadImage = useCallback((url) => {
    if (!url) return;

    const image = new Image();

    image.decoding = "async";
    image.src = url;
  }, []);

  useEffect(() => {
    if (normalizedBanners.length === 0) {
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
   * تحميل الصورة الحالية فقط لمعرفة
   * وقت ظهورها بدون تغيير أبعادها.
   *
   * مهم:
   * نحن لا نستخدم naturalWidth / naturalHeight
   * لتكبير أو تصغير الصورة.
   *
   * الصورة نفسها هي التي تحدد ارتفاع الـ Hero.
   */
  useEffect(() => {
    setImageLoaded(false);

    if (!currentSlide) return undefined;

    const imageUrl =
      getImageUrl(currentSlide);

    if (!imageUrl) return undefined;

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
   * الانتقال إلى بانر معين.
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

      if (nextIndex === current) {
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
        }, Math.max(
          250,
          transitionDuration * 1000
        ));
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
   * Autoplay.
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
      () => {
        goNext();
      },
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
   * Keyboard navigation.
   *
   * لا نتحكم في الأسهم أثناء الكتابة.
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

      const isTypingField =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTypingField) {
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
   * Touch / Swipe.
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

    const horizontalSwipe =
      Math.abs(deltaX) >
        Math.abs(deltaY) &&
      Math.abs(deltaX) > 45;

    if (horizontalSwipe) {
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
   * فتح رابط البانر.
   */
  const openSlideLink = () => {
    if (!currentSlide) return;

    const link =
      getLink(currentSlide);

    if (!link) return;

    window.location.href = link;
  };

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
      title ||
        description ||
        (showButton &&
          buttonText &&
          link)
    );

  /*
   * الستايل هنا لا يفرض أي Height على الصورة.
   *
   * الـ Hero نفسه ارتفاعه بيتحدد تلقائيًا
   * من الصورة الموجودة بداخله.
   */
  const heroStyle = {
    "--hero-height-desktop":
      `${heightDesktop}px`,

    "--hero-height-tablet":
      `${heightTablet}px`,

    "--hero-height-mobile":
      `${heightMobile}px`,

    "--hero-overlay-opacity":
      overlayOpacity,

    "--hero-border-radius":
      `${borderRadius}px`,

    "--hero-transition-duration":
      `${transitionDuration}s`,

    "--hero-object-position":
      objectPosition,

    "--hero-primary":
      primaryColor,

    "--hero-accent":
      accentColor,

    "--hero-accent-light":
      accentLight,
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
      ]
        .filter(Boolean)
        .join(" ")}
      dir="rtl"
      style={heroStyle}
      aria-label={
        title || "البانرات الرئيسية"
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
       * مهم جدًا:
       *
       * الصورة هنا عنصر عادي في الصفحة
       * وليست absolute.
       *
       * وبالتالي:
       *
       * width: 100%
       * height: auto
       *
       * تجعل المتصفح يحافظ على
       * الـ aspect ratio الأصلي للصورة.
       *
       * مفيش object-fit.
       * مفيش scale.
       * مفيش crop.
       */}
      <div
        className="hero-image-wrapper"
        aria-hidden="true"
      >
        <img
          key={imageUrl}
          className="hero-image"
          src={imageUrl}
          alt={
            title || "بانر المتجر"
          }
          loading={
            current === 0
              ? "eager"
              : "lazy"
          }
          decoding="async"
          draggable="false"
        />
      </div>

      <div
        className="hero-overlay"
        style={{
          "--hero-content-position":
            contentPosition,

          "--hero-text-align":
            textAlign,
        }}
      >
        {hasContent && (
          <div
            className="hero-content"
            key={getId(
              currentSlide,
              current
            )}
          >
            {title && (
              <h1>{title}</h1>
            )}

            {description && (
              <p>
                {description}
              </p>
            )}

            {showButton &&
              buttonText &&
              link && (
                <button
                  type="button"
                  onClick={
                    openSlideLink
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

      {normalizedBanners.length >
        1 && (
        <>
          <button
            type="button"
            className="hero-arrow hero-arrow-prev"
            onClick={goPrevious}
            aria-label="البانر السابق"
          >
            <span
              aria-hidden="true"
            >
              →
            </span>
          </button>

          <button
            type="button"
            className="hero-arrow hero-arrow-next"
            onClick={goNext}
            aria-label="البانر التالي"
          >
            <span
              aria-hidden="true"
            >
              ←
            </span>
          </button>
        </>
      )}

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

      {normalizedBanners.length >
        1 &&
        settingsSource.showCounter ===
          true && (
          <div
            className="hero-counter"
            aria-label={`البانر ${
              current + 1
            } من ${
              normalizedBanners.length
            }`}
          >
            {String(
              current + 1
            ).padStart(2, "0")}

            <span>/</span>

            {String(
              normalizedBanners.length
            ).padStart(2, "0")}
          </div>
        )}

      {normalizedBanners.length >
        1 && (
        <span
          className="hero-slide-status"
          aria-live="polite"
        >
          البانر {current + 1} من{" "}
          {normalizedBanners.length}
        </span>
      )}
    </section>
  );
}

export default Hero;