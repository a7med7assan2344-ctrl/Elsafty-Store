import React, { useEffect, useMemo, useState } from "react";
import "./Hero.css";


// ============================================================
// HELPERS
// ============================================================

const safeNumber = (value, fallback) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};


const getImageUrl = (slide) => {
  if (!slide) {
    return "";
  }

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
  if (!slide) {
    return "";
  }

  return safeString(
    slide.title ??
      slide.name ??
      slide.heading ??
      slide.headline ??
      ""
  ).trim();
};


const getDescription = (slide) => {
  if (!slide) {
    return "";
  }

  return safeString(
    slide.text ??
      slide.description ??
      slide.subtitle ??
      slide.subTitle ??
      ""
  ).trim();
};


const getButtonText = (slide) => {
  if (!slide) {
    return "";
  }

  return safeString(
    slide.buttonText ??
      slide.buttonLabel ??
      slide.ctaText ??
      slide.actionText ??
      ""
  ).trim();
};


const getLink = (slide) => {
  if (!slide) {
    return "";
  }

  return safeString(
    slide.link ??
      slide.url ??
      slide.href ??
      slide.actionUrl ??
      ""
  ).trim();
};


const getOrder = (slide) => {
  return safeNumber(
    slide?.order ??
      slide?.sortOrder ??
      slide?.position ??
      0,
    0
  );
};


// ============================================================
// HERO
// ============================================================

function Hero({
  banners = [],
  bannerSettings = {},
  settings = {},
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ==========================================================
  // PREPARE BANNERS
  // ==========================================================

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


  // ==========================================================
  // RESET CURRENT SLIDE
  // ==========================================================

  useEffect(() => {
    if (normalizedBanners.length === 0) {
      setCurrent(0);
      return;
    }

    setCurrent((previous) => {
      if (
        previous >= normalizedBanners.length
      ) {
        return 0;
      }

      return previous;
    });
  }, [normalizedBanners.length]);


  // ==========================================================
  // CURRENT SLIDE
  // ==========================================================

  const currentSlide =
    normalizedBanners[current] ||
    null;


  // ==========================================================
  // SETTINGS
  // ==========================================================

  const settingsSource =
    bannerSettings ||
    settings?.bannerSettings ||
    {};

  const enabled =
    settingsSource.enabled !== false &&
    settingsSource.active !== false;


  const autoplay =
    settingsSource.autoplay !== false &&
    settingsSource.autoPlay !== false;


  const interval =
    Math.max(
      1500,
      safeNumber(
        settingsSource.interval ??
          settingsSource.duration ??
          settingsSource.delay ??
          settingsSource.speed,
        4000
      )
    );


  const heightDesktop =
    Math.max(
      180,
      safeNumber(
        settingsSource.height ??
          settingsSource.desktopHeight,
        420
      )
    );


  const heightTablet =
    Math.max(
      160,
      safeNumber(
        settingsSource.tabletHeight,
        Math.min(heightDesktop, 350)
      )
    );


  const heightMobile =
    Math.max(
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


  const borderRadius =
    Math.max(
      0,
      safeNumber(
        settingsSource.borderRadius,
        20
      )
    );


  const objectPosition =
    settingsSource.objectPosition ||
    settingsSource.imagePosition ||
    "center";


  const transitionDuration =
    Math.max(
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
    settingsSource.textAlign ||
    "right";


  const showContent =
    settingsSource.showContent !== false &&
    settingsSource.showText !== false;


  const showButton =
    settingsSource.showButton !== false;


  // ==========================================================
  // AUTOPLAY
  // ==========================================================

  useEffect(() => {
    if (
      !enabled ||
      !autoplay ||
      isPaused ||
      normalizedBanners.length <= 1
    ) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrent((previous) =>
        (previous + 1) %
        normalizedBanners.length
      );
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [
    enabled,
    autoplay,
    isPaused,
    interval,
    normalizedBanners.length,
  ]);


  // ==========================================================
  // IMAGE LOADING
  // ==========================================================

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


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goToSlide = (index) => {
    if (!normalizedBanners.length) {
      return;
    }

    const nextIndex =
      (
        index +
        normalizedBanners.length
      ) %
      normalizedBanners.length;

    setCurrent(nextIndex);
  };


  const goNext = () => {
    goToSlide(current + 1);
  };


  const goPrevious = () => {
    goToSlide(current - 1);
  };


  // ==========================================================
  // OPEN LINK
  // ==========================================================

  const openSlideLink = () => {
    if (!currentSlide) {
      return;
    }

    const link =
      getLink(currentSlide);

    if (!link) {
      return;
    }

    if (
      /^https?:\/\//i.test(link)
    ) {
      window.location.href = link;
      return;
    }

    window.location.href = link;
  };


  // ==========================================================
  // NO BANNERS
  // ==========================================================

  if (
    !enabled ||
    normalizedBanners.length === 0
  ) {
    return null;
  }


  // ==========================================================
  // CURRENT DATA
  // ==========================================================

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


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="hero"
      dir="rtl"

      style={{
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
      }}

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

      onTouchStart={() =>
        setIsPaused(true)
      }

      onTouchEnd={() =>
        setIsPaused(false)
      }
    >

      {/* ====================================================
          IMAGE
      ==================================================== */}

      <div
        className={`hero-image-wrapper ${
          imageLoaded
            ? "is-loaded"
            : ""
        }`}
      >

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
        />

      </div>


      {/* ====================================================
          OVERLAY
      ==================================================== */}

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
          <div className="hero-content">

            {title && (
              <h1>
                {title}
              </h1>
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
                  {buttonText}
                </button>
              )}

          </div>
        )}

      </div>


      {/* ====================================================
          PREVIOUS
      ==================================================== */}

      {normalizedBanners.length > 1 && (
        <button
          type="button"
          className="hero-arrow hero-arrow-prev"
          onClick={goPrevious}
          aria-label="البانر السابق"
        >
          ‹
        </button>
      )}


      {/* ====================================================
          NEXT
      ==================================================== */}

      {normalizedBanners.length > 1 && (
        <button
          type="button"
          className="hero-arrow hero-arrow-next"
          onClick={goNext}
          aria-label="البانر التالي"
        >
          ›
        </button>
      )}


      {/* ====================================================
          DOTS
      ==================================================== */}

      {normalizedBanners.length > 1 && (
        <div
          className="hero-dots"
          role="tablist"
          aria-label="اختيار البانر"
        >

          {normalizedBanners.map(
            (slide, index) => (
              <button
                key={
                  slide.id ||
                  slide.bannerId ||
                  `hero-dot-${index}`
                }

                type="button"

                className={`hero-dot ${
                  index === current
                    ? "active"
                    : ""
                }`}

                onClick={() =>
                  goToSlide(index)
                }

                aria-label={`البانر ${
                  index + 1
                }`}

                aria-selected={
                  index === current
                }

                role="tab"
              />
            )
          )}

        </div>
      )}


      {/* ====================================================
          COUNTER
      ==================================================== */}

      {normalizedBanners.length > 1 &&
        settingsSource.showCounter === true && (
          <div className="hero-counter">
            {current + 1}
            <span>/</span>
            {normalizedBanners.length}
          </div>
        )}

    </section>
  );
}


export default Hero;