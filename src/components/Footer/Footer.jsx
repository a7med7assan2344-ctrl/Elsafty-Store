import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const DEFAULTS = {
  primary: "#071A36",
  secondary: "#0B1F3A",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,.68)",
  brand: "#D4AF37",
  border: "rgba(212,175,55,.22)",
};

const safeString = (value) =>
  value === null || value === undefined
    ? ""
    : String(value).trim();

const first = (...values) => {
  for (const value of values) {
    const v = safeString(value);
    if (v) return v;
  }
  return "";
};

const bool = (value, fallback = true) => {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(v)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(v)) {
      return false;
    }
  }

  return fallback;
};

const number = (value, fallback) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
};

const isExternal = (value) =>
  /^https?:\/\/ /i.test(safeString(value).replace("https:// ", "https://"))
    ? true
    : /^https?:\/\//i.test(safeString(value));

const internalPath = (
  value,
  fallback = "/"
) => {
  const url = safeString(value);

  if (!url) {
    return fallback;
  }

  if (isExternal(url)) {
    return url;
  }

  return url.startsWith("/")
    ? url
    : `/${url}`;
};

const getIcon = (
  item,
  fallback = ""
) =>
  first(
    item?.icon,
    item?.emoji,
    item?.symbol,
    fallback
  );

function Footer({
  storeSettings = {},
  logo: propLogo = "",
  facebook: propFacebook = "",
  instagram: propInstagram = "",
  telegram: propTelegram = "",
  tiktok: propTiktok = "",
  youtube: propYoutube = "",
  theme: propTheme = {},
  menuItems = [],
  texts = {},
}) {
  const settings = storeSettings || {};

  /*
   * ==============================
   * THEME
   * ==============================
   */

  const theme = {
    ...(settings.theme || {}),
    ...(propTheme || {}),
  };

  /*
   * ==============================
   * FOOTER SETTINGS
   * ==============================
   */

  const footer = {
    ...(settings.footer || {}),
    ...(settings.footerSettings || {}),
    ...(settings.footerConfig || {}),
  };

  /*
   * ==============================
   * COLORS
   * ==============================
   */

  const background = first(
    theme.footerBackground,
    theme.primary,
    DEFAULTS.primary
  );

  const background2 = first(
    theme.footerSecondaryBackground,
    theme.secondary,
    background,
    DEFAULTS.secondary
  );

  const text = first(
    theme.footerText,
    theme.textPrimary,
    DEFAULTS.text
  );

  const muted = first(
    theme.textSecondary,
    theme.footerText,
    DEFAULTS.muted
  );

  const brand = first(
    theme.footerBrand,
    theme.accent,
    DEFAULTS.brand
  );

  const border = first(
    theme.border,
    DEFAULTS.border
  );

  const heading = first(
    theme.headingColor,
    theme.footerBrand,
    theme.accent,
    text
  );

  const linkColor = first(
    theme.linkColor,
    theme.textSecondary,
    theme.textPrimary,
    text
  );

  const hover = first(
    theme.footerButtonHover,
    theme.footerBrand,
    theme.accent,
    brand
  );

  const buttonBg = first(
    theme.footerButtonBackground,
    theme.buttonBackground,
    brand
  );

  const buttonText = first(
    theme.footerButtonText,
    theme.buttonText,
    theme.primary,
    DEFAULTS.primary
  );

  /*
   * ==============================
   * LOGO
   * ==============================
   */

  const logo = first(
    footer.logo,
    settings.logo,
    settings.logoUrl,
    settings.logoURL,
    propLogo
  );

  /*
   * ==============================
   * DESCRIPTION
   * ==============================
   */

  const description = first(
    footer.description,
    footer.footerDescription,
    footer.aboutText,
    settings.footerDescription,
    settings.description,
    texts.footerAbout
  );

  /*
   * ==============================
   * VISIBILITY
   * ==============================
   */

  const showLogo = bool(
    footer.showLogo,
    true
  );

  const showDescription = bool(
    footer.showDescription,
    true
  );

  const showSocial = bool(
    footer.showSocial,
    settings.showSocial !== false
  );

  const showSections = bool(
    footer.showSections,
    true
  );

  const showNewsletter = bool(
    footer.showNewsletter,
    false
  );

  /*
   * ==============================
   * SOCIAL LINKS
   * ==============================
   */

  const socialLinks = [
    {
      key: "facebook",
      label: "Facebook",
      value: first(
        settings.facebook,
        settings.facebookUrl,
        settings.socials?.facebook,
        settings.social?.facebook,
        footer.facebook,
        propFacebook
      ),
      icon: first(
        footer.facebookIcon,
        "f"
      ),
    },

    {
      key: "instagram",
      label: "Instagram",
      value: first(
        settings.instagram,
        settings.instagramUrl,
        settings.socials?.instagram,
        settings.social?.instagram,
        footer.instagram,
        propInstagram
      ),
      icon: first(
        footer.instagramIcon,
        "◎"
      ),
    },

    {
      key: "telegram",
      label: "Telegram",
      value: first(
        settings.telegram,
        settings.telegramUrl,
        settings.socials?.telegram,
        settings.social?.telegram,
        footer.telegram,
        propTelegram
      ),
      icon: first(
        footer.telegramIcon,
        "✈"
      ),
    },

    {
      key: "tiktok",
      label: "TikTok",
      value: first(
        settings.tiktok,
        settings.tiktokUrl,
        settings.socials?.tiktok,
        settings.social?.tiktok,
        footer.tiktok,
        propTiktok
      ),
      icon: first(
        footer.tiktokIcon,
        "♪"
      ),
    },

    {
      key: "youtube",
      label: "YouTube",
      value: first(
        settings.youtube,
        settings.youtubeUrl,
        settings.socials?.youtube,
        settings.social?.youtube,
        footer.youtube,
        propYoutube
      ),
      icon: first(
        footer.youtubeIcon,
        "▶"
      ),
    },
  ].filter(
    (item) => item.value
  );

  /*
   * ==============================
   * LINK NORMALIZER
   * ==============================
   */

  const normalizeLink = (
    item,
    index,
    prefix = "footer"
  ) => {
    if (!item) {
      return null;
    }

    if (typeof item === "string") {
      return {
        id: `${prefix}-${index}`,
        label: item,
        url: "/",
        active: true,
        order: index,
        icon: "",
      };
    }

    return {
      id:
        item.id ||
        item.key ||
        `${prefix}-${index}`,

      label: first(
        item.label,
        item.title,
        item.name,
        item.text
      ),

      url: first(
        item.url,
        item.link,
        item.href,
        item.path,
        "/"
      ),

      active:
        item.active !== false &&
        item.enabled !== false &&
        item.visible !== false,

      order: number(
        item.order ??
          item.sortOrder ??
          item.position,
        index
      ),

      external:
        item.external === true ||
        item.isExternal === true,

      icon: getIcon(item),
      target: item.target || "",
    };
  };

  /*
   * ==============================
   * ADMIN SECTIONS
   * ==============================
   */

  const configuredSections =
    Array.isArray(footer.sections)
      ? footer.sections
      : Array.isArray(
          settings.footerSections
        )
        ? settings.footerSections
        : [];

  const configuredLinks =
    Array.isArray(footer.links)
      ? footer.links
      : Array.isArray(footer.items)
        ? footer.items
        : Array.isArray(
            settings.footerLinks
          )
          ? settings.footerLinks
          : [];

  const normalizedLinks =
    configuredLinks
      .map((item, index) =>
        normalizeLink(
          item,
          index
        )
      )
      .filter(
        (item) =>
          item?.active &&
          item?.label
      )
      .sort(
        (a, b) =>
          a.order - b.order
      );

  const adminSections =
    configuredSections
      .map(
        (
          section,
          sectionIndex
        ) => {
          if (!section) {
            return null;
          }

          const links =
            Array.isArray(
              section.links
            )
              ? section.links
              : Array.isArray(
                  section.items
                )
                ? section.items
                : [];

          return {
            id:
              section.id ||
              section.key ||
              `section-${sectionIndex}`,

            title: first(
              section.title,
              section.name,
              section.label
            ),

            order: number(
              section.order ??
                section.sortOrder ??
                section.position,
              sectionIndex
            ),

            links: links
              .map(
                (
                  item,
                  index
                ) =>
                  normalizeLink(
                    item,
                    index,
                    section.id ||
                      `section-${sectionIndex}`
                  )
              )
              .filter(
                (item) =>
                  item?.active &&
                  item?.label
              )
              .sort(
                (a, b) =>
                  a.order - b.order
              ),
          };
        }
      )
      .filter(
        (section) =>
          section?.title &&
          section.links.length
      )
      .sort(
        (a, b) =>
          a.order - b.order
      );

  /*
   * ==============================
   * FALLBACK SECTIONS
   * ==============================
   */

  const fallbackSections = [
    {
      id: "quick-links",
      title: first(
        footer.linksTitle,
        "روابط مهمة"
      ),

      links: [
        {
          id: "home",
          label: "الرئيسية",
          url: "/",
        },

        {
          id: "offers",
          label: first(
            footer.offersLabel,
            "العروض"
          ),
          url: "/offers",
        },

        {
          id: "best",
          label: first(
            footer.bestSellersLabel,
            "الأكثر مبيعًا"
          ),
          url: "/best-sellers",
        },

        {
          id: "new",
          label: first(
            footer.newArrivalsLabel,
            "أحدث المنتجات"
          ),
          url: "/new-arrivals",
        },
      ],
    },

    {
      id: "customer-service",
      title: first(
        footer.customerServiceTitle,
        "خدمة العملاء"
      ),

      links: [
        {
          id: "cart",
          label: first(
            footer.cartLabel,
            "سلة المشتريات"
          ),
          url: "/cart",
        },

        {
          id: "orders",
          label: first(
            footer.ordersLabel,
            "طلباتي"
          ),
          url: "/orders",
        },

        {
          id: "favorites",
          label: first(
            footer.favoritesLabel,
            "المفضلة"
          ),
          url: "/favorites",
        },
      ],
    },
  ];

  /*
   * ==============================
   * MENU SECTION
   * ==============================
   */

  const menuSection =
    Array.isArray(menuItems) &&
    menuItems.length
      ? [
          {
            id: "store-menu",

            title: first(
              footer.menuTitle,
              "روابط مهمة"
            ),

            links: menuItems
              .map(
                (
                  item,
                  index
                ) =>
                  normalizeLink(
                    item,
                    index,
                    "menu"
                  )
              )
              .filter(
                (item) =>
                  item?.active &&
                  item?.label
              ),
          },
        ]
      : [];

  /*
   * ==============================
   * FINAL SECTIONS
   * ==============================
   */

  const sections =
    adminSections.length
      ? adminSections
      : normalizedLinks.length
        ? [
            {
              id: "admin-links",

              title: first(
                footer.linksTitle,
                "روابط مهمة"
              ),

              links:
                normalizedLinks,
            },
          ]
        : menuSection.length
          ? menuSection
          : fallbackSections;

  /*
   * ==============================
   * LINK RENDER
   * ==============================
   */

  const renderLink = (
    item,
    index
  ) => {
    if (!item?.label) {
      return null;
    }

    const url = internalPath(
      item.url
    );

    const content = (
      <>
        {item.icon ? (
          <span
            className="footer-link-icon"
            aria-hidden="true"
          >
            {item.icon}
          </span>
        ) : null}

        <span>
          {item.label}
        </span>
      </>
    );

    /*
     * مهم:
     * الـ key لازم يتبعت مباشرة للعنصر
     * ومينفعش يكون داخل object بيتعمله spread.
     */

    const itemKey =
      item.id ||
      `${url}-${index}`;

    const common = {
      className: "footer-link",

      style: {
        color: linkColor,
        "--footer-link-hover":
          hover,
      },
    };

    if (
      item.external ||
      isExternal(url)
    ) {
      return (
        <a
          key={itemKey}
          {...common}
          href={url}
          target={
            item.target ||
            "_blank"
          }
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={itemKey}
        {...common}
        to={url}
      >
        {content}
      </Link>
    );
  };

  /*
   * ==============================
   * COPYRIGHT
   * ==============================
   */

  const year =
    new Date().getFullYear();

  const rightsText = first(
    footer.rightsText,
    texts.footerRights,
    "جميع الحقوق محفوظة"
  );

  const copyright =
    safeString(
      footer.copyright
    ) ||
    safeString(
      settings.copyright
    );

  /*
   * ==============================
   * DISABLE FOOTER
   * ==============================
   */

  if (
    footer.enabled === false ||
    settings.footerEnabled === false
  ) {
    return null;
  }

  /*
   * ==============================
   * RENDER
   * ==============================
   */

  return (
    <footer
      className="store-footer"
      dir="rtl"
      style={{
        "--footer-bg":
          background,

        "--footer-bg-2":
          background2,

        "--footer-text":
          text,

        "--footer-muted":
          muted,

        "--footer-brand":
          brand,

        "--footer-border":
          border,

        "--footer-heading":
          heading,

        "--footer-link":
          linkColor,

        "--footer-hover":
          hover,

        "--footer-button":
          buttonBg,

        "--footer-button-text":
          buttonText,

        "--footer-max":
          first(
            footer.maxWidth,
            "1280px"
          ),

        "--footer-font":
          first(
            footer.fontFamily,
            theme.footerFontFamily,
            theme.fontFamily,
            "Cairo, sans-serif"
          ),

        "--footer-heading-font":
          first(
            footer.headingFontFamily,
            theme.footerHeadingFontFamily,
            theme.headingFontFamily,
            theme.fontFamily,
            "Cairo, sans-serif"
          ),
      }}
    >
      <div className="footer-ambient footer-ambient-one" />

      <div className="footer-ambient footer-ambient-two" />

      <div className="store-footer-container">

        {/* =====================
            BRAND
        ====================== */}

        <div className="footer-brand-panel">

          {showLogo &&
          logo ? (
            <Link
              to="/"
              className="footer-logo-link"
              aria-label="الرئيسية"
            >
              <img
                src={logo}
                alt=""
                className="footer-logo"
                loading="lazy"
              />
            </Link>
          ) : null}

          {showDescription &&
          description ? (
            <p className="footer-description">
              {description}
            </p>
          ) : null}

          {showSocial &&
          socialLinks.length > 0 ? (
            <div className="footer-social-block">

              <h4>
                {first(
                  footer.socialTitle,
                  "تابعنا على"
                )}
              </h4>

              <div className="footer-social">

                {socialLinks.map(
                  (social) => (
                    <a
                      key={
                        social.key
                      }
                      href={
                        social.value
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={
                        social.label
                      }
                      className="footer-social-link"
                    >
                      <span>
                        {
                          social.icon
                        }
                      </span>

                      <small>
                        {
                          social.label
                        }
                      </small>
                    </a>
                  )
                )}

              </div>
            </div>
          ) : null}

        </div>

        {/* =====================
            SECTIONS
        ====================== */}

        {showSections &&
          sections.map(
            (section) => (
              <div
                className="footer-column"
                key={
                  section.id
                }
              >

                <div className="footer-column-heading">

                  <span
                    className="footer-column-line"
                    style={{
                      background:
                        brand,
                    }}
                  />

                  <h3>
                    {
                      section.title
                    }
                  </h3>

                </div>

                <div className="footer-links-list">
                  {section.links.map(
                    renderLink
                  )}
                </div>

              </div>
            )
          )}

        {/* =====================
            NEWSLETTER
        ====================== */}

        {showNewsletter ? (
          <div className="footer-column footer-newsletter-column">

            <div className="footer-column-heading">

              <span
                className="footer-column-line"
                style={{
                  background:
                    brand,
                }}
              />

              <h3>
                {first(
                  footer.newsletterTitle,
                  "اشترك معنا"
                )}
              </h3>

            </div>

            <div className="footer-newsletter">

              <strong>
                {first(
                  footer.newsletterStrong,
                  "خليك دايمًا متابع"
                )}
              </strong>

              <span>
                {first(
                  footer.newsletterText,
                  "آخر العروض والتحديثات في مكان واحد"
                )}
              </span>

              <form
                onSubmit={(event) =>
                  event.preventDefault()
                }
                className="footer-newsletter-form"
              >
                <input
                  type="email"
                  placeholder={first(
                    footer.newsletterPlaceholder,
                    "البريد الإلكتروني"
                  )}
                />

                <button type="submit">
                  {first(
                    footer.newsletterButton,
                    "اشتراك"
                  )}
                </button>
              </form>

            </div>

          </div>
        ) : null}

      </div>

      {/* =====================
          PREMIUM RIGHTS
      ====================== */}

      <div className="footer-rights">

        <div className="footer-rights-line" />

        <div className="footer-rights-content">

          {copyright ? (
            <span className="footer-copyright-custom">
              {copyright}
            </span>
          ) : (
            <span className="footer-copyright">

              <b className="footer-copyright-year">
                © {year}
              </b>

              <i className="footer-copyright-dot">
                •
              </i>

              <strong className="footer-copyright-rights">
                {rightsText}
              </strong>

              <i className="footer-copyright-dot">
                •
              </i>

              <strong className="footer-copyright-store">
                ســـــَــــــــوا
              </strong>

            </span>
          )}

        </div>

      </div>

    </footer>
  );
}

export default Footer;
